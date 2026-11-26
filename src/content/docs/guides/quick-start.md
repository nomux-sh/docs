---
title: Quick start
description: Start a Session and attach to it, detach, attach again, give a Session a name, stop the daemon, see that the Session continues, read its output, see its status and memory, and end it.
---

This page uses the three binaries from the [install page](/docs/guides/install/).
The output on this page is the real output of one run with nomux 0.5.0 on Linux. Your session identifiers and process IDs are different.

In the examples, `$` is the prompt of your shell and `sh-5.3$` is the prompt of the shell in the Session.

## Start a Session and attach to it

```console
$ nomux new --attach -- sh
```

`nomux new` starts the daemon if it does not run, and starts a Session.
The arguments after `--` are the command of the Session, here `sh`. Without them, the command is your shell: [Start a shell](#start-a-shell) shows it.
`--attach` (`-a`) makes your terminal the terminal of the Session: the CLI clears the terminal and shows the screen of the Session.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Each key goes to the Session. `Ctrl-C` and `Ctrl-Z` also go to the programs of the Session, not to the CLI.

`--cmd <command> [argument...]` is a second form of the same. Do not use the two forms in one command line. `nomux` cannot know if a `--` after `--cmd` belongs to the command, thus it refuses the line with the exit code 1 and starts no Session:

```console
$ nomux new --cmd sh -- -c true
error: the argument '--cmd <COMMAND>...' cannot be used with '--': nomux cannot know where the command of the session starts. Give the command in one form: `nomux new --cmd <command> [argument...]` or `nomux new -- <command> [argument...]`. For a command that has `--` as an argument, use the second form

Usage: nomux new [OPTIONS] [-- <COMMAND>...]

For more information, try '--help'.
```

A command that has `--` as an argument needs the form with `--`: `nomux new -- git log -- notes.txt`.

## Detach

Press `Ctrl-a` and then `d`. `Ctrl-\` and then `d` works too.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
detached from session cmyd3fud
$
```

The CLI ends with the exit code 0. The Session continues, and its programs do not see the detach.
The message has the session identifier. `nomux ls` shows it too:

```console
$ nomux ls
ID        STATE    PID      COMMAND
cmyd3fud  running  4107953  sh
```

`PID` is the process ID of the command of the Session, not of its holder.
[Sessions](/docs/guides/sessions/#prefix-keys) shows the other keys of an attach and how to change the prefix keys.

## Attach again

```console
$ nomux attach cmyd3fud
```

The terminal shows the same screen as before the detach:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

The screen comes from the holder of the Session, which keeps it while no client is attached. A program that drew its screen before, for example an editor, is visible immediately.

More than one terminal can be attached to one Session at the same time. Each terminal shows the same output, and each one can type.
Here a second terminal runs the same `nomux attach cmyd3fud`, and you type a command in it. The two terminals then show this screen:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

To detach a terminal that you cannot reach, use `nomux detach` from a different terminal. It detaches each client of the Session:

```console
$ nomux detach cmyd3fud
detached 1 client from session cmyd3fud
```

The terminal that was attached shows `detached from session cmyd3fud`, as after the detach keys.

## Give a Session a name

A name is shorter to type than an identifier. `nomux rename` gives a name to a Session, and `nomux new -n` gives it at the start:

```console
$ nomux rename cmyd3fud shell
session cmyd3fud is now named shell
$ nomux new -n api -- sleep 600
ordcoebj
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
ordcoebj  api    running  4109980  sleep 600
```

A command that takes a Session takes the identifier, the name, or the start of one of them: `nomux attach shell` and `nomux attach sh` both attach to the first Session. A start that fits more than one Session gives an error with the list of candidates.

These short ways work too:

- `nomux new -n work -a` starts the Session `work` and attaches to it.
- `nomux new -A -n shell` attaches to the Session `shell`, or starts it if it does not exist.
- `nomux attach`, without a target, attaches to the Session that a client attached to last. `nomux a` is the same command.
- `nomux`, on a terminal, does the same as `nomux attach`. If the Host has no Session, it starts one with your shell.

```console
$ nomux new -A -n shell
detached from session shell (cmyd3fud)
```

[Sessions](/docs/guides/sessions/) has the rules of names and targets, and what each option does.

## Stop the daemon: the Session continues

The daemon owns no terminal. Each Session lives in its own holder process.
Attach to the Session in one terminal, and stop the daemon from a second terminal:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4107950, 2 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
configuration file: /home/user/.config/nomux/config.toml
```

`daemon status` also says if the operating system applies a memory limit to a Session, and where the configuration file is. When no daemon runs, its exit code is 2.

The attach in the first terminal ends with the exit code 1, because its connection went through the daemon:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$ echo second terminal
second terminal
sh-5.3$
nomux: the daemon stopped. The session continues: run `nomux attach shell` to attach again
$
```

No daemon runs now. The next command that needs a daemon starts a new one, and the new daemon finds the Sessions:

```console
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
ordcoebj  api    running  4109980  sleep 600
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4112638, 2 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

The process IDs of the commands are the same as before: the commands did not stop. Only the daemon has a new process ID.

The result is the same when the daemon ends without a clean stop:

```console
$ kill -9 4112638
$ nomux daemon status
nomuxd does not run
configuration file: /home/user/.config/nomux/config.toml
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
ordcoebj  api    running  4109980  sleep 600
```

The `daemon status` in this run came one second after the `kill`. If you run it in the same instant, nomux 0.5.0 can answer `nomux: the connection to the daemon failed: Connection reset by peer (os error 104)` with the exit code 1. Run it again.

[How it works](/docs/concepts/how-it-works/) explains why. A restart of the Host is a different case: it stops the command, and the Session becomes dormant. [After a restart](/docs/guides/after-a-restart/) shows it.

## Start a Session without an attach

Without `--attach`, `nomux new` prints the session identifier and ends. The command of the Session runs without a client.
To start the command in a different directory, add `--cwd`. The directory must exist:

```console
$ nomux new --cwd project -- sleep 600
suzsh5xl
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
suzsh5xl  -      running  4114787  sleep 600
```

## Start a shell

Without a command, a Session runs your shell. The daemon keeps a few holders ready, each with a shell that already runs: the [holder pool](/docs/guides/holder-pool/). A new Session with your shell takes one, thus the shell has its prompt at once. The pool starts at the first request that the daemon gets, not when the daemon starts.

A pooled `bash`, `zsh` or `fish` changes to the directory of the Session before its first prompt. If `--cwd` names a directory, the screen shows no typed line, and the shell is already there:

```console
$ nomux new --cwd project
ws3qfqzs
$ nomux attach ws3qfqzs
bash-5.3$ pwd
/home/user/demo/project
bash-5.3$
```

A Session with a command, as in the examples above, always gets a new holder.

## Read the output of a Session

`nomux capture` prints the last lines that the command of a Session wrote, without an attach. The default is 100 lines, and `--lines` sets the number.
This Session runs a command that prints the numbers 1 to 200 and then waits:

```console
$ nomux new -n count -- sh -c 'seq 1 200; exec sleep 600'
3iljg56n
$ nomux capture count --lines 3
198
199
200
```

The lines come from the journal of the Session on disk, not from its screen. Thus `capture` also prints lines that left the screen, and it prints the output of a Session whose command stopped.
The holder writes the output to the journal 1 second after it read it, at the latest. A `capture` right after `new` can print less than the command wrote.
The output is the bytes as the command wrote them, with their escape sequences. The output of a shell has the escape sequences of its prompt.

An attach shows the current screen and the output from that moment. It does not show the lines that left the screen: use `capture` for them. `nomux capture -f` also follows the new output: [Scripting Sessions](/docs/guides/scripting-sessions/) shows it.

## See the status and the memory

`nomux status` has one row for each Session: its name or identifier, its command, its state, the time in the state and a message. A Session in which no program reports anything is `idle`:

```console
$ nomux status
  SESSION   COMMAND                          STATE  FOR  MESSAGE
  count     sh -c seq 1 200; exec sleep 600  idle   1s
  shell     sh                               idle   8s
  suzsh5xl  sleep 600                        idle   3s
  ws3qfqzs  /bin/bash                        idle   3s
```

An agent tool, or a program that reports with `nomux status set`, gives the other states, for example `working` and `needs you`. [Agent status](/docs/guides/agent-status/) shows them.

`nomux ls --memory` adds the memory that the processes of each Session use at the time of the command:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
3iljg56n  running  161.0 KiB  1          275.0 KiB  pss      -      -      sh -c seq 1 200; exec sleep 600
cmyd3fud  running  734.0 KiB  1          271.0 KiB  pss      -      -      sh
suzsh5xl  running  145.0 KiB  1          260.0 KiB  pss      -      -      sleep 600
ws3qfqzs  running  737.0 KiB  1          271.0 KiB  pss      -      -      /bin/bash
total: 1.7 MiB in 4 processes of 4 sessions, and 1.0 MiB in the holders (pss)
```

`MEMORY` is the memory of the command and of each process that descends from it, and `PROCESSES` is their number. `HOLDER` is the memory of the holder, which is not a part of `MEMORY`. `MEASURE` is `pss` on Linux and `rss` on macOS. `LIMIT` has a value where the operating system applies a memory limit to the Session, and `FREED` has one for a Session that [hibernated](/docs/guides/hibernation/). [Session memory](/docs/guides/session-memory/) says what the numbers count.

## End a Session

A Session ends when its command ends. If a terminal is attached at that moment, the CLI prints the exit status of the command and ends with the same value as its exit code:

```console
sh-5.3$ exit 3
exit

session shell (cmyd3fud) ended with exit status 3
$ echo $?
3
```

`nomux kill` ends a Session from outside. It sends `SIGHUP` to the command, as the close of a terminal does, and waits until the command has ended:

```console
$ nomux kill suzsh5xl
session suzsh5xl ended
```

`nomux kill --all` ends each Session that runs, and asks first on a terminal: [Scripting Sessions](/docs/guides/scripting-sessions/#end-many-sessions-kill---all) has it.

A Session that ended leaves the list of `nomux ls`. The daemon keeps it and its output for 24 hours, and `nomux ls --all` shows it with a note that says how its command ended:

```console
$ nomux ls
ID        NAME   STATE    PID      COMMAND
3iljg56n  count  running  4114800  sh -c seq 1 200; exec sleep 600
ws3qfqzs  -      running  4113272  /bin/bash
$ nomux ls --all
ID        NAME     STATE    PID      COMMAND                          NOTE
3iljg56n  count    running  4114800  sh -c seq 1 200; exec sleep 600
54kiobxv  scratch  ended    -        sh                               signal 1
cmyd3fud  shell    ended    -        sh                               exit status 3
ordcoebj  api      ended    -        sleep 600                        signal 1
suzsh5xl  -        ended    -        sleep 600                        signal 1
ws3qfqzs  -        running  4113272  /bin/bash
```

`nomux capture` still prints the output of an ended Session. Each other command for it fails with the exit code 2. A name finds only Sessions that are not ended, thus use the identifier:

```console
$ nomux kill suzsh5xl
nomux: session suzsh5xl ended: its command does not run
```

## Use the commands in a script

Each command accepts `--json` and `--quiet`. This is the list of the two Sessions that run, as JSON:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"3iljg56n","name":"count","state":"running","pid":4114800,"command":["sh","-c","seq 1 200; exec sleep 600"],"cwd":"/home/user/demo","rows":24,"columns":80,"started_at":1795706787,"epoch":1,"restore_policy":"on-focus","project":null},{"id":"ws3qfqzs","name":null,"state":"running","pid":4113272,"command":["/bin/bash"],"cwd":"/home/user/demo/project","rows":24,"columns":80,"started_at":1795706785,"epoch":1,"restore_policy":"on-focus","project":null}]}
```

Put `--json` or `--quiet` before `--`. All arguments after `--` belong to the command of the Session.
`attach` and `new --attach` need a terminal on the standard input. In a script without a terminal, they fail with the exit code 1.

On a terminal, the tables of `ls` and `status` fit the width of the terminal: the command column is shortened first, and an ellipsis (`…`) marks the cut. The output of a script, and the JSON output, are never shortened.

[Scripting Sessions](/docs/guides/scripting-sessions/) shows how to type into a Session, follow its output and end many Sessions. The [CLI reference](/docs/reference/cli/) has each command, the keys of an attach, the JSON documents and the exit codes.

## Next steps

- [Sessions](/docs/guides/sessions/): names, targets, `-A`, and the prefix keys of an attach.
- [Scripting Sessions](/docs/guides/scripting-sessions/): `send`, `capture -f` and `kill --all`.
- [Coming from tmux and screen](/docs/guides/coming-from-tmux-and-screen/): the commands that you know.
- [After a restart](/docs/guides/after-a-restart/): dormant Sessions, restore policies and the daemon at login.
- [Remote hosts](/docs/guides/remote-hosts/): the same commands on a server, through SSH.
- [Extensions](/docs/guides/extensions/): install an extension, approve its permissions and call it.
