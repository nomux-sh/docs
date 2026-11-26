---
title: Hibernation and the memory limit
description: When the daemon stops an idle agent and keeps its Session, how nomux wake and nomux attach start the agent again, the settings, and how the memory limit works on Linux and on macOS.
---

An idle agent uses memory for nothing. **Hibernation** gives that memory back: the daemon stops the agent of an idle agent Session and keeps the Session, with its output and the **resume command** of the agent. When you open the Session, the daemon starts the resume command, and the agent continues its conversation. This is a **wake**.

The **memory limit** is a different tool for the same problem. It limits the memory of a Session. Where the operating system can apply the limit, it ends the processes of a Session that reaches it. Where it cannot, the limit is a threshold for hibernation.

[Memory of Sessions](/docs/guides/session-memory/) shows how nomux measures memory.

## What was run for this page

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the runs is shown as `/home/user`. Your identifiers and process IDs are different. A block that shows one Session comes from one run.

**The agent is a stand-in.** The runs did not use the real Claude Code, because it needs an account and costs money. The Session ran a small Python script named `claude` (it is at the end of this page). The script:

- holds 150 MiB of memory, as an agent does;
- sends hook events with `nomux hook claude <event>`, with JSON that has the fields that the adapter reads. The data of the real Claude Code has more fields;
- reads one word per line from the terminal (`work`, `stop`, `idle` or `ask`) and sends the event of that word, so that the runs did not need a model;
- prints `resumed session <id>` when it starts with `--resume <id>`.

The adapter is the real one: the extension `nomux.agent-claude` 0.1.0 from the release of the `extensions` repository, installed with `nomux ext install <directory> --grant-all`. The hooks, the status, the resume command, the triggers, the stop and the wake are the real code of nomux. What the runs did not show: a real Claude Code, and its real start time and conversation. The stand-in is on the `PATH` of the daemon, as `claude` is for a real run.

## What hibernation does

```console
$ nomux new -n agent --cwd ~/project -- claude
57anosge
$ nomux send agent work
$ nomux send agent stop
$ nomux status
  SESSION  COMMAND  STATE  FOR  MESSAGE
+ agent    claude   done   1s
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
57anosge  running  159.5 MiB  1          432.0 KiB  pss      -      -      claude
total: 159.5 MiB in 1 process of 1 session, and 432.0 KiB in the holders (pss)
$ nomux hibernate agent
session 57anosge hibernated: 159.5 MiB given back (pss)
$ nomux ls
ID        NAME   STATE       PID  COMMAND  NOTE
57anosge  agent  hibernated  -    claude   request
$ nomux status
  SESSION  COMMAND  STATE                FOR  MESSAGE
+ agent    claude   hibernated: request  1s
$ nomux ls --memory
ID        STATE       MEMORY  PROCESSES  HOLDER  MEASURE  LIMIT  FREED      COMMAND
57anosge  hibernated  -       -          -       -        -      159.5 MiB  claude
total: no session has a process
hibernated: 159.5 MiB given back by 1 session
```

- `nomux hibernate <target>` hibernates a Session now and prints the memory that it gave back. The memory is the one of the process tree of the command, measured just before the stop.
- `nomux ls` shows the state `hibernated`. The note has the reason: `count`, `session-memory`, `total-memory`, `memory-pressure` or `request`.
- `nomux status` shows `hibernated: <reason>` in place of the state.
- `nomux ls --memory` has two more columns: `LIMIT` and `FREED`. `FREED` is the memory that the hibernation gave back. The last line has the sum.
- The Session keeps its output, so `nomux capture` still works. The daemon keeps the details of the hibernation in the file `hibernation` of the state directory of the Session, and `--json` shows them (this line is from another run):

```json
"hibernation":{"hibernated_at":1795705812,"reason":"request","freed_bytes":165303296,"measure":"pss","resume_command":"claude --resume 00000000-0000-4000-8000-000000000001","woken_at":null,"wake_error":null}
```

In the JSON of the control protocol, a hibernated Session has the state `dormant` and this extra field. A client that does not know the field sees a dormant Session, which is correct: the Session has no process.

The documents of nomux describe the stop in four steps. The daemon measures the memory. It writes the file `hibernation`. It asks the holder for a checkpoint of the screen. Then it sends the signals of `agents.stop_signals` to the command, one after another, and waits `agents.stop_wait` after each one. The first is `SIGHUP`: an agent takes it as the end of its terminal and writes its conversation. If the stop does not complete, the daemon removes the file and the Session continues as before.

## Start the agent again

Three commands start the resume command of a hibernated Session:

- `nomux wake <target>` starts the resume command in the working directory of the Session and prints it.
- `nomux attach <target>` does the same and attaches. It shows the old screen first, then a line from nomux, then the resumed run.
- `nomux start <target>` starts the resume command too, as it starts a dormant Session. In a run, it printed `session agent (4bpf7tuo) runs`, and `ls` then showed `claude --resume 00000000-0000-4000-8000-000000000001` as the command. It gives no message about the wake. `nomux wake` on a Session that is not hibernated fails, and so does `nomux hibernate` on a Session that cannot hibernate.

```console
$ nomux wake agent
session agent (57anosge) woke: claude --resume 00000000-0000-4000-8000-000000000001
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
57anosge  running  159.3 MiB  1          470.0 KiB  pss      -      -      claude --resume 00000000-0000-4000-8000-000000000001
total: 159.3 MiB in 1 process of 1 session, and 470.0 KiB in the holders (pss)
$ nomux capture agent --lines 3
stop
done
stand-in claude: resumed session 00000000-0000-4000-8000-000000000001
```

An attach of a hibernated Session shows this in the terminal (the real output also has escape sequences and empty lines between the parts):

```text
stand-in claude: new session 00000000-0000-4000-8000-000000000001
--- nomux: the session started again. The output before this line is from the command that stopped ---
stand-in claude: resumed session 00000000-0000-4000-8000-000000000001
```

The command of the resumed Session is the resume command. If it ends, the Session ends. A shell that ran in the first run does not come back.

If the wake fails, the Session stays hibernated. The command has the exit code 1, and the message has the command to run by hand. Here the daemon started without `claude` on its `PATH`:

```console
$ nomux wake agent
nomux: session 57anosge did not wake: the program claude is not in PATH. To continue its agent by hand, run this command in /home/user/project: claude --resume 00000000-0000-4000-8000-000000000001
$ nomux ls
ID        NAME   STATE       PID  COMMAND                                               NOTE
57anosge  agent  hibernated  -    claude --resume 00000000-0000-4000-8000-000000000001  request; wake failed: the program claude is not in PATH
```

## Which Sessions hibernate

A Session hibernates automatically only if **each** of these is true. `nomux hibernate` checks the same list, except the two rows marked with a star.

| Condition | Why |
|---|---|
| Its adapter reported the Session as an agent Session, with a resume command | Without a resume command, a stop loses the conversation. |
| The state is `idle`, `done` (seen or not), or `needs you` of the kind `prompt` | Nothing runs and nothing that the agent asked for waits. |
| The state is not `working` | Work that runs would be lost. |
| The state is not `needs you` of the kind `permission`, `question` or `auth` | A resume loses what the agent waits for. |
| The state is not `error` | You must see the failure in its process. |
| No client shows the Session | You look at it. |
| No input came after the last change of the state | The input line can have text that the agent did not get. |
| You did not pin it (`nomux pin`) * | You excluded it. |
| It is idle for `agents.hibernate_after`: since the last change of the state and since the last detach * | You can come back soon. |

`nomux hibernate` says which condition fails. These are the messages of the runs, with the identifier of the Session in place of `<id>`:

| The Session | Message |
|---|---|
| A plain shell | `nomux: session <id> cannot hibernate: no adapter reports it as an agent session` |
| An agent that works | `nomux: session <id> cannot hibernate: its agent works` |
| An agent that waits for a permission | `nomux: session <id> cannot hibernate: its agent waits for a permission answer` |
| An agent that waits for an answer | `nomux: session <id> cannot hibernate: its agent waits for an answer of the user` |

A `done` result stays a result: the hibernated Session keeps it, and its seen mark.

### Pin a Session

`nomux pin <target>` excludes a Session from each **automatic** hibernation. `nomux unpin <target>` takes it back. `nomux ls` shows the note `pinned`:

```console
$ nomux new -n shell --cwd ~/project
d7jc3ygl
$ nomux hibernate shell
nomux: session d7jc3ygl cannot hibernate: no adapter reports it as an agent session
$ nomux pin shell
session shell (d7jc3ygl) is pinned
$ nomux ls
ID        NAME   STATE    PID      COMMAND    NOTE
d7jc3ygl  shell  running  3938505  /bin/bash  pinned
$ nomux unpin shell
session shell (d7jc3ygl) is not pinned
$ nomux wake shell
nomux: session shell is not hibernated: `nomux start shell` starts a dormant session
```

A pin has no effect on `nomux hibernate`: you can hibernate a pinned Session by hand. This comes from the documents of nomux, and it was not run for this page: the runs that tried it had a Session that was not an agent Session (see [Known limits](#known-limits)).

## What makes a Session hibernate

The daemon applies five triggers. One task of the daemon applies them. It does not poll: it wakes for an event of the event log, a detach, a report of the kernel about memory pressure, and one timer for the time at which a Session becomes idle long enough.

| Trigger | When | Which Sessions | Reason |
|---|---|---|---|
| Count | More live agent Sessions than `agents.max_live` | The Session that is idle for the longest time first, until the number is the limit | `count` |
| Memory of one Session | `sessions.memory_limit` is set, the operating system does not apply it, and a Session uses more | That Session | `session-memory` |
| Memory of all Sessions | `sessions.total_memory_limit` is set and the Sessions use more | The one that is idle for the longest time first, until the total is below the limit | `total-memory` |
| Memory pressure | `agents.hibernate_on_pressure` is true, and the kernel reports that processes waited for memory 200 ms in a window of 2 s (Linux only) | The Session that is idle for the longest time | `memory-pressure` |
| Request | `nomux hibernate <target>` | That Session | `request` |

Each hibernation and each wake makes an event. `nomux events --follow --filter session-hibernated --filter session-woken --filter session-wake-failed` prints them. A short `hibernate_after` makes the runs below fast.

**Count.** The configuration had `max_live = 1` and `hibernate_after = "5s"`. Two agent Sessions were `done`. The Session that was idle for the longest time hibernated. Later, an attach woke it:

```toml
[agents]
max_live = 1
hibernate_after = "5s"
```

```console
$ nomux events -f --filter session-hibernated --filter session-woken
5 gi5k2hn2 hibernated (count, 2 live agents, limit 1): 157.5 MiB given back
7 gi5k2hn2 woke: claude --resume 00000000-0000-4000-8000-000000000001
```

**Memory of all Sessions.** The configuration had `total_memory_limit = "200M"` and `hibernate_after = "5s"`. Two agent Sessions used 312.7 MiB together:

```console
$ nomux events -f --filter session-hibernated
2 ttmaxdni hibernated (total-memory, 312.7 MiB used, limit 200.0 MiB): 156.4 MiB given back
4 tface77n hibernated (memory-pressure, 200 ms waited for memory in 2000 ms): 156.6 MiB given back
```

The second line was not planned. The computer of the run was busy with other programs, the kernel reported memory pressure, and the daemon hibernated the second Session too. It shows the trigger of the memory pressure, which the run did not make on purpose: 200 ms of waiting for memory in a window of 2000 ms.

**Memory of one Session** is in the next section, because it depends on the platform. **Request** is the `nomux hibernate` of the first block of this page: its event is `5 57anosge hibernated (request): 157.0 MiB given back`. A failed wake makes the event `2 57anosge did not wake: the program claude is not in PATH; resume command: claude --resume 00000000-0000-4000-8000-000000000001`.

## The settings

The configuration file has the settings. On Linux it is `~/.config/nomux/config.toml`. On macOS it is `~/Library/Application Support/nomux/config.toml`. If `XDG_CONFIG_HOME` is an absolute path, it is `$XDG_CONFIG_HOME/nomux/config.toml` on both. `nomux daemon status` prints the path that the daemon reads. The daemon reads the file one time, at its start, so a change applies after the next start of the daemon.

```toml
[sessions]
memory_limit = "4G"            # one Session: K, M or G; no key: no limit
total_memory_limit = "16G"     # all Sessions together; no key: no limit

[agents]
max_live = 12                  # live agent Sessions; 0 turns the count trigger off
hibernate_after = "60s"        # the idle time before a Session can hibernate
hibernate_on_pressure = true   # the memory pressure of the Host is a trigger
stop_signals = ["HUP", "TERM", "KILL"]
stop_wait = "5s"               # the time after each signal
```

| Key | Default | Meaning |
|---|---|---|
| `sessions.memory_limit` | none | The limit of one Session. |
| `sessions.total_memory_limit` | none | The limit of all Sessions together. It is always a threshold for hibernation, never a limit of the operating system. |
| `agents.max_live` | `12` | The number of live agent Sessions that the daemon keeps. |
| `agents.hibernate_after` | `60s` | How long an agent must be idle before it can hibernate. |
| `agents.hibernate_on_pressure` | `true` | Memory pressure is a trigger (Linux only). |
| `agents.stop_signals` | `HUP`, `TERM`, `KILL` | The signals of the stop, in this sequence. The list must end with `KILL`, so that a stop always ends. |
| `agents.stop_wait` | `5s` | The time after each signal. An agent needs it to write its conversation to the disk. |

A value that is not valid gives an error with the key in the log of the daemon, and the daemon uses each default. The defaults are the product defaults. The runs on this page changed `hibernate_after`, `max_live` and the limits only to get an answer in seconds.

## The memory limit

`sessions.memory_limit` is the most memory that the processes of one Session can use. The daemon examines the Host one time, at its start. `nomux daemon status` shows the result in a line that starts with `memory limit:`.

| Host | What `sessions.memory_limit` does |
|---|---|
| Linux with a systemd user manager, control groups of version 2 and the memory controller | **The kernel applies the limit.** The holder starts the command in a systemd user scope with `MemoryMax`. When the processes of the Session reach the limit, the kernel ends each of them with `SIGKILL`. Other Sessions, the holder and the daemon continue. |
| Linux without them | **No limit of the operating system.** The limit is a threshold: an idle agent Session above it hibernates. |
| macOS | **No limit of the operating system.** macOS has no public interface for a limit of the memory of a process tree without privileges. The limit is a threshold. |

### Linux with a systemd user manager

This is the Host of the runs. The status line says that the kernel applies the limit:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4106719, 1 session
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

With `memory_limit = "100M"`, `ls --memory` shows the limit of a Session in the column `LIMIT`. The row of a hibernated Session has `-`:

```console
$ nomux ls --memory
ID        STATE       MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT      FREED      COMMAND
5upfkwg5  hibernated  -          -          -          -        -          159.5 MiB  claude --resume 00000000-0000-4000-8000-000000000001
mjpaf37b  running     751.0 KiB  1          948.0 KiB  pss      100.0 MiB  -          /bin/bash
total: 751.0 KiB in 1 process of 1 session, and 948.0 KiB in the holders (pss)
hibernated: 159.5 MiB given back by 1 session
```

The stand-in holds 150 MiB. A new Session with the stand-in and the same limit did not survive:

```console
$ nomux events -f --filter session-memory-limit-reached
2 avvp5doe ended at its memory limit of 100.0 MiB
$ nomux ls --all | grep -E 'ID|big'
ID        NAME    STATE    PID      COMMAND                                               NOTE
avvp5doe  big     ended    -        claude                                                signal 9
```

The log of the daemon has one warning: `the kernel ended the session at its memory limit`, with the identifier and the limit in bytes. The daemon does not hibernate such a Session: a Session at its limit can be at work, and the kernel has already ended it.

- The limit counts memory that `ls --memory` does not count: the memory of the kernel for the processes and the page cache of the files that they read. A Session can reach its limit while `ls --memory` shows less. The kernel frees page cache before it ends a process.
- The limit does not apply to a holder that already runs. A new value applies to the Sessions that start after the next start of the daemon, and to a dormant Session when it restores.
- With `memory_limit`, the [holder pool](/docs/guides/holder-pool/) is off, because a pooled shell starts before its Session and so without the limit. In a run with `memory_limit = "100M"` and with `"2G"`, `~/.nomux/run` had no `.pool` directory.
- A Session with a limit costs about 4.6 ms more to start. This number is the measurement of the design in the documents of nomux. A Session without a limit does not have this cost.

### Linux without a systemd user manager

When the daemon cannot reach the user manager, the limit is only a threshold. A run with `XDG_RUNTIME_DIR` and `DBUS_SESSION_BUS_ADDRESS` removed from the environment of the daemon gave this line:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4009414, 0 sessions
memory limit: the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
configuration file: /home/user/.config/nomux/config.toml
```

The log has one warning with the same reason at the start of the daemon. The stand-in then used 157.6 MiB, above a limit of 100M, and the daemon hibernated it when it was idle (`memory_limit = "100M"` and `hibernate_after = "5s"`):

```console
$ nomux events -f --filter session-hibernated
2 6ybmawen hibernated (session-memory, 157.6 MiB used, limit 100.0 MiB): 157.6 MiB given back
$ nomux status | tail -1
  agent    claude   hibernated: session-memory  15s
```

The conditions of [Which Sessions hibernate](#which-sessions-hibernate) apply: only an agent Session that can hibernate is a candidate.

### macOS

The documents of nomux say: macOS has no limit of the operating system, so `memory_limit` and `total_memory_limit` are thresholds. The memory measure is `rss`. The trigger of the memory pressure does not exist on macOS: [issue #100](https://github.com/nomux-sh/nomux/issues/100) is open for it. The count and the thresholds work. **This was not run for this page**, because it needs a Mac.

### `daemon status` and `host doctor`

`nomux daemon status` shows the line `memory limit:` for the local Host. `nomux host doctor` has the check `memory-limit` for a remote Host, from the documents of nomux. The check was **not run** for this page: the command works only for a Host from `nomux host add`, which needs an SSH server, and `nomux host doctor` on the computer of the runs said `no hosts`. [Remote hosts](/docs/guides/remote-hosts/) has the checks.

## After a restart

A hibernated Session has no process, so a restart of the Host does not change it. The daemon never starts a hibernated Session at its own start, **also with the restore policy `auto`**: the Session gave its memory back for you. In this run, the Session had the policy `auto`, and then each nomux process ended with `kill -9`, as a restart ends them:

```console
$ nomux restore-policy agent auto
session agent (57anosge) has the restore policy auto
$ nomux ls
ID        NAME   STATE       PID  COMMAND  NOTE
57anosge  agent  hibernated  -    claude   request
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4106719, 1 session
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

`ls` ran after the new daemon started: the Session is still hibernated, and nothing started its agent. Then `nomux wake agent` started it: that is the `wake` command of the block under [Start the agent again](#start-the-agent-again). [After a restart](/docs/guides/after-a-restart/) has the other Sessions.

## What nomux never does

- It never ends a Session for its memory. Only the kernel does it, at a limit that you set.
- It never hibernates a Session for a trigger without the conditions above.
- It never gives a resume command to a shell. The command is text from an extension. The daemon divides it into words with the quoting of a POSIX shell (single quotes, double quotes and backslash) and starts the first word as the program. A command with an operator, an expansion, a glob character, a comment, `~`, a line break or a quote without an end does not start: the wake fails with the reason. This comes from the documents of nomux, and it was not run for this page.
- It never changes a resume command and never adds a word to it. The adapter of Claude Code drops a permission mode that skips the checks.
- It never starts a hibernated Session at the start of the daemon.

## Known limits

- **A Claude Code Session at rest does not hibernate with adapter 0.1.0.** Claude Code sends the notification `idle_prompt` after about 60 seconds without input. The released adapter reports it as `needs you: question`. A `question` is a wait for an answer, so the Session is not a candidate. In a run:

  ```console
  $ nomux status | tail -1
  ! agent2   claude                                                needs you: question  0s   Claude is waiting for your input
  $ nomux hibernate agent2
  nomux: session ku4v2yaq cannot hibernate: its agent waits for an answer of the user
  ```

  The `main` branch of the `extensions` repository has a change that reports `needs you: prompt` for this notification, and its README describes the new behaviour. **The change is not in a release.** The README of the repository is ahead of the release 0.1.0. A Claude Code Session hibernates today only before that notification comes (during the first minute after the end of a turn). [Agent adapters](/docs/guides/agent-adapters/#the-kind-prompt) and [Claude Code](/docs/guides/claude-code/#limits) say more.
- **A woken Session can fail to hibernate again for a short time.** In several runs, a Session woke less than a minute after its last hook event. The resumed run reported `working` and `done`, but `nomux agent explain` had no `from the adapter` lines, and `nomux hibernate` said `no adapter reports it as an agent session`. A run with a pause of 70 seconds between the last event and the wake showed the lines and hibernated again. The cause is not isolated. The adapter keeps in its memory the details that it sent, and the host stops the adapter after 60 seconds without an event, which fits what the runs showed. The documents of nomux also list a related open point: a hook that a program sends before the daemon has the token of its Session is refused, so a resumed agent that reports at once can have no details until its next hook. The stand-in waits 4 seconds before its first event for this reason, and that did not remove the effect.
- **`host doctor` and macOS were not run.** See above.
- **A pinned agent Session and `nomux hibernate` were not run together.** The pin rule comes from the documents of nomux.
- **The stop signals were not run with a real agent.** The stand-in does not write a conversation. Whether a real agent finishes its conversation within `stop_wait` is not tested here.
- **Memory pressure on macOS.** [Issue #100](https://github.com/nomux-sh/nomux/issues/100).
- **A limit is a measure of the kernel.** `ls --memory` can show less than the limit counts.

## The stand-in

The Session of the runs ran this script as `claude`. It is not Claude Code, and it does not talk to any model:

```python
#!/usr/bin/env python3
import json, os, subprocess, sys, time

SESSION = "00000000-0000-4000-8000-000000000001"
if len(sys.argv) > 2 and sys.argv[1] == "--resume":
    SESSION = sys.argv[2]
    print("stand-in claude: resumed session " + SESSION, flush=True)
else:
    print("stand-in claude: new session " + SESSION, flush=True)

held = bytearray(150 * 1024 * 1024)
for i in range(0, len(held), 4096):
    held[i] = 1

def hook(event, **extra):
    data = {"session_id": SESSION, "cwd": os.getcwd(), "hook_event_name": event}
    data.update(extra)
    subprocess.run(["nomux", "hook", "claude", event], input=json.dumps(data).encode(), check=False)

time.sleep(4)
hook("SessionStart", source="resume" if len(sys.argv) > 2 else "startup")
for line in sys.stdin:
    word = line.strip()
    if word == "work":
        hook("UserPromptSubmit", prompt="x", permission_mode="default")
        print("working", flush=True)
    elif word == "stop":
        hook("Stop")
        print("done", flush=True)
    elif word == "idle":
        hook("Notification", notification_type="idle_prompt", message="Claude is waiting for your input")
        print("at the prompt", flush=True)
    elif word == "ask":
        hook("Notification", notification_type="permission_prompt", message="Claude needs your permission")
        print("waiting for permission", flush=True)
```

The runs sent the words with `nomux send agent stop` and similar commands. [Claude Code](/docs/guides/claude-code/) shows the real hook data from the `extensions` repository, and [Agent adapters](/docs/guides/agent-adapters/) describes the path of a hook event.

The product documents [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/memory.md) and [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md) have the rules and the decision. The terms come from the [Glossary](/docs/reference/glossary/).
