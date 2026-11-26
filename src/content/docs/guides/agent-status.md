---
title: Agent status
description: See what works, what is done and what needs you in each Session, in each Project and in each Group. Learn why a Session needs you and where each status comes from.
---

nomux shows the status of the work in each Session: an agent that works, a command that waits for you, a result that you did not see.
Each status has a source. nomux never shows a guess as a fact.

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the run is shown as `/home/user`. Your session identifiers are different.
The programs in most examples are small shell scripts, because no agent tool ran. The examples with `fix-tests` use the hook data of Claude Code that the repository of the adapter holds: [Claude Code adapter](/docs/guides/claude-code/) says what ran and what did not.

## The five states

| State | Meaning |
|---|---|
| `idle` | Nothing works and nothing waits. |
| `working` | Work runs. |
| `done` | Work is complete and the result waits for you. |
| `needs you` | The work cannot continue without you. It can have a kind: `permission`, `question`, `auth` or `prompt`. |
| `error` | The work stopped with an error. |

An Agent run is the work in one Session. It can have Child work: subagents, teammates and background tasks. Each Child work has its own status.

## See the status of each Session

`nomux status` prints one row for each Session:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j  ./report.sh error the build failed            error                  2s   the build failed
* 6llcmruq  ./report.sh working reading the source files  working                2s   reading the source files
+ egywe7xg  ./report.sh done all tests pass               done                   2s   all tests pass
! g55wwygt  ./osc.sh                                      needs you: permission  3s   may I install the linter?
  kbyhsoqx  /bin/bash                                     idle                   2s
! xaddp4zj  ./report.sh blocked run the tests?            needs you              1s   run the tests?
```

- The first column is a mark: `!` needs you, `x` error, `+` done, `*` working. An `idle` Session has no mark.
- `FOR` is the time in the state. A new message does not restart it.
- The rows are in the order of the session identifiers. A Session that has a name shows its name in place of its identifier.
- A row for an ended Session shows its last result: see [Ended Sessions](#ended-sessions).

The row of a Session shows its most urgent status. A Child work that needs you makes its Session need you.
The order of urgency is: `needs you`, then `error` that you did not see, then `done` that you did not see, then `working`, then the rest. With the same urgency, the status that waits longest comes first.

### Child work, Projects and Groups

`--tree` adds a row for each Child work below its Session, indented by two spaces for each level. It also adds the [Groups and Projects](/docs/guides/projects-and-groups/) of the Host:

```console
$ nomux status --tree
  NAME          COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j      ./report.sh error the build failed            error                  2s   the build failed
+ egywe7xg      ./report.sh done all tests pass               done                   2s   all tests pass
  kbyhsoqx      /bin/bash                                     idle                   2s
! xaddp4zj      ./report.sh blocked run the tests?            needs you              2s   run the tests?
! Client work/                                                needs you: permission  3s   may I install the linter?
!   acme-web                                                  needs you: permission  3s   may I install the linter?
*     6llcmruq  ./report.sh working reading the source files  working                2s   reading the source files
!     g55wwygt  ./osc.sh                                      needs you: permission  3s   may I install the linter?
!       lint                                                  needs you: permission  3s   may I install the linter?
*       tests                                                 working                3s   running 120 tests
```

- The Sessions that no Project holds come first. Then each Group (its name ends with `/`) and each Project, in the sequence of the workspace tree, with the Sessions of a Project below it.
- The Session `g55wwygt` works, and its Child work `lint` waits for a permission. Thus its row shows `needs you: permission`.
- A Project shows the most urgent status of its Sessions. A Group shows the most urgent status of its Projects and of its Groups. The rule is the same as for a Session: `needs you` first, then `error` that you did not see, and so on. The oldest wait wins when two items have the same urgency.
- A Group or a Project without a Session has `-` as its state. A Child work that no source reports has `-` too.
- The status of a Group or a Project is not stored. The client computes it from the Sessions below it.

The Sessions `6llcmruq` and `g55wwygt` are in the Project `acme-web` because their working directory is the directory of the Project. [Projects and Groups](/docs/guides/projects-and-groups/) has the rule that finds the Project of a Session, and the commands that make a Group.

### Results that you saw

A `done` or `error` result stays on the list until you see it. An attach to the Session marks its results as seen, and the row shows `(seen)`:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j  ./report.sh error the build failed            error                  21s  the build failed
* 6llcmruq  ./report.sh working reading the source files  working                21s  reading the source files
+ egywe7xg  ./report.sh done all tests pass               done (seen)            21s  all tests pass
! g55wwygt  ./osc.sh                                      needs you: permission  22s  may I install the linter?
  kbyhsoqx  /bin/bash                                     idle                   22s
! xaddp4zj  ./report.sh blocked run the tests?            needs you              21s  run the tests?
```

Here `nomux attach egywe7xg` ran, and then the detach keys. Only an attach marks a result as seen.

## Why a Session needs you

The kind after `needs you` says why:

| Kind | Meaning |
|---|---|
| `permission` | The agent asks to run a tool. |
| `question` | The agent waits for an answer. |
| `auth` | The agent waits for a login. |
| `prompt` | The agent waits at its input prompt. Nothing that it asked for waits, thus a [hibernation](/docs/guides/hibernation/) of the Session loses nothing. |

The message says what the agent asks. A program that does not give a kind has `needs you` alone, as `xaddp4zj` above.
Only an [adapter](/docs/guides/agent-adapters/) reports `prompt`. A program status record with `kind=prompt` shows `needs you` with no kind. The Claude Code adapter of release 0.1.0 does not report `prompt` yet: [Claude Code adapter](/docs/guides/claude-code/#limits) says what it reports in its place.

`nomux agent explain` says where a status comes from. It prints the status of the Session with its source, and then each source in the order in which they decide:

```console
$ nomux agent explain g55wwygt
session g55wwygt: working for 22s, from program status; message from program status: fixing the failing test
most urgent with its Child work: needs you: permission for 22s, from program status; message from program status: may I install the linter?

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      working: fixing the failing test (3 program status records in the terminal stream)
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

child work:
  lint: needs you: permission for 22s, from program status; message from program status: may I install the linter?
  tests: working for 22s, from program status; message from program status: running 120 tests
```

The first source that reports an item gives its state. A source that reports nothing is in the list too, with the reason.

## Where a status comes from

| Order | Source | What it is |
|---|---|---|
| 1 | adapter | An [adapter extension](/docs/guides/agent-adapters/) reports the status from the events of the agent tool. |
| 2 | program status | A program writes its status in the terminal output with the Program Status Protocol (OSC 7501). Claude Code, Codex and Qwen Code send it. |
| 3 | self-report | A program in the Session runs `nomux status set`. |
| 4 | session restore | The Session lost its process. The status is what the Session had then. |
| 5 | prompt marks | The shell marks the start and the end of a command (OSC 133). A guess. |
| 6 | foreground program | A program that is not the command of the Session has the terminal. A guess. |

The first four are reports of a program or of the Host. The last two are guesses, and the CLI marks them `(guess)`.
[ADR-0007](https://github.com/nomux-sh/docs/blob/main/adr/0007-status-source-order.md) records the order and the reason for it.

Here a person typed `sleep 30` in the shell of the Session `kbyhsoqx`. The shell sent no prompt mark, thus the foreground program is the only source:

```console
$ nomux status | grep kbyhsoqx
* kbyhsoqx  /bin/bash                                     working (guess)        0s
$ nomux agent explain kbyhsoqx
session kbyhsoqx: working (guess) for 0s, from foreground program

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  working (the program sleep is in the foreground of the terminal)
```

The daemon cannot see that the foreground program changes: the operating system does not tell it. It reads the foreground when you ask for the status. A change that only this source sees makes no event.

## Hibernated Sessions

A [hibernated Session](/docs/guides/hibernation/) has no process: the daemon stopped its agent and keeps the Session. Its row shows `hibernated:` and the reason of the hibernation: `request`, `count`, `session-memory`, `total-memory` or `memory-pressure`. This page made only `request`, with `nomux hibernate`. The [Hibernation](/docs/guides/hibernation/) guide says what each reason means.

The Session `fix-tests` got the hook events of a Claude Code run: a prompt, a permission request, and the end of the turn. The adapter reported the resume command of the run. Then `nomux hibernate fix-tests` stopped the shell of the Session:

```console
$ nomux hibernate fix-tests
session mitrhfd6 hibernated: 762.0 KiB given back (pss)
$ nomux status | grep -E 'SESSION|fix-tests'
  SESSION    COMMAND                                       STATE                  FOR  MESSAGE
+ fix-tests  /bin/bash                                     hibernated: request    0s
$ nomux agent explain fix-tests
session mitrhfd6: done for 0s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000006
  resume: claude --resume 00000000-0000-4000-8000-000000000006
```

The status of a hibernated Session follows the rule of a Session without a process: work that ran or waited becomes `done`, and a result stays. `nomux wake fix-tests` and `nomux attach fix-tests` start the resume command. After the wake, the status comes from the sources of the new process:

```console
$ nomux wake fix-tests
session fix-tests (mitrhfd6) woke: claude --resume 00000000-0000-4000-8000-000000000006
$ nomux status | grep -E 'SESSION|fix-tests'
  SESSION    COMMAND                                               STATE                  FOR  MESSAGE
  fix-tests  claude --resume 00000000-0000-4000-8000-000000000006  idle                   1s
```

In this run, the program `claude` was a small script that stands in for Claude Code. It prints the arguments that it got, and it waits. It showed that the daemon starts the resume command that the adapter reported, and nothing else.

## Report a status from your own program

A script or a tool that has no adapter can report its status. The Session must run the program.

```sh
nomux status set working "reading the source files"
nomux status set blocked "run the tests?"
nomux status set done "all tests pass"
```

- The state is `working`, `done`, `blocked`, `error` or `idle`. `blocked` is the state `needs you`. `idle` takes the report back.
- The message is one line of 512 bytes at most.
- The command reads `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`, which the holder gives to each process of a Session ([Environment of a Session](/docs/guides/session-environment/)). Outside a Session, it fails:

  ```console
  $ nomux status set working "x"
  nomux: NOMUX_SESSION_ID is not set: `nomux status set` works only inside a nomux session
  ```

  The exit code is 4.
- A report stays until the next one.

The examples above came from this script, which was the command of a Session:

```sh
#!/bin/sh
sleep 1
nomux status set "$1" "$2"
sleep 3600
```

The source of the Session `xaddp4zj` is the self-report:

```console
$ nomux agent explain xaddp4zj
session xaddp4zj: needs you for 22s, from self-report; message from self-report: run the tests?

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         needs you: run the tests? (a program of the session reported it with `nomux status set`)
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal
```

### A report in the first moments of a Session can fail

A program that calls `nomux status set` as its first step can find that the daemon does not know its Session yet. The command then fails with exit code 2 or 4:

```text
nomux: no session that is not ended has the identifier 7d7td7kv
nomux: the status of session fvnphjvk did not change: the session has no process that the daemon knows
```

This is an open problem of nomux: [issue 83](https://github.com/nomux-sh/nomux/issues/83) found it in 0.4.0. It is still there in 0.5.0. For this page, four runs started 12 Sessions each. The first command of each Session was `nomux status set working "first thing"`. In the four runs, 1, 0, 8 and 9 of the 12 reports worked. The script above has `sleep 1`, and each report of the Sessions that used it worked in this run. That is no guarantee. A program that must report should check the exit code and try again after a moment.

### Report from the terminal output

A program that writes OSC 7501 to its terminal needs no command. It can also report Child work, with an `id` that is a path (`tests` is below the Agent run). The script of the Session `g55wwygt` did this:

```sh
#!/bin/sh
text() { printf %s "$1" | base64 -w0; }
report() { printf '\033]7501;%s\033\\' "$1"; }
report "state=working:msg=$(text 'fixing the failing test')"
report "id=tests:state=working:msg=$(text 'running 120 tests')"
report "id=lint:state=blocked:kind=permission:msg=$(text 'may I install the linter?')"
sleep 3600
```

The [Program Status Protocol](https://control-codes.page/proposals/osc-7501/) has the full format.

## Events

`nomux events --follow` (or `-f`) prints each change when it happens. It ends with Ctrl-C. The option `--follow` is required: it is the only mode now. Two `nomux events --follow` commands collected the list below, one after the other, in the same run of the daemon: the event numbers continue from the first command to the second.

```console
$ nomux events --follow
1 workspace revision 1: added t7vkaxsrnvpz "Client work" at position 0
2 workspace revision 2: added e2lrmktphjab "acme-web" at position 0
3 g55wwygt working fixing the failing test
4 g55wwygt working fixing the failing test
5 g55wwygt needs you: permission may I install the linter?
6 6llcmruq working reading the source files
7 egywe7xg done all tests pass
8 2vjh4l3j error the build failed
9 xaddp4zj needs you run the tests?
10 egywe7xg done (seen) all tests pass
11 xaddp4zj done
12 mitrhfd6 idle
13 mitrhfd6 working
14 mitrhfd6 working
15 mitrhfd6 needs you: permission touch b.txt
16 mitrhfd6 working
17 mitrhfd6 done
18 mitrhfd6 done
19 mitrhfd6 hibernated (request): 762.0 KiB given back
20 mitrhfd6 woke: claude --resume 00000000-0000-4000-8000-000000000006
21 mitrhfd6 idle
```

A line starts with the event number. The rest depends on the type of the event:

| Line | Type | Meaning |
|---|---|---|
| `<session> <state> <message>` | `agent-run-changed` | The status of a Session or of its Child work changed. The line `10` is the attach that marked a result as seen. The line `11` is the status that the Session kept when `nomux kill` ended it. |
| `<session> removed` | `agent-run-removed` | A Session ended with nothing to keep, or the daemon removed it. In another run, `nomux kill` of an idle shell Session gave the line `13 swxvcokt removed`. |
| `extension <id>: <name> (<n> bytes)` | `extension-event` | The daemon part of an extension sent an event: [Extensions](/docs/guides/extensions/#events). |
| `workspace revision <revision>: <change>` | `workspace-changed` | A Group or a Project changed. |
| `<session> hibernated (<reason>): <size> given back` | `session-hibernated` | The daemon hibernated a Session. |
| `<session> woke: <resume command>` | `session-woken` | A wake started the resume command. |

The types `session-wake-failed` and `session-memory-limit-reached` exist too. This page did not make one of these events, thus it shows no line for them.

`--filter <type>` prints only the events of that type. Give the option more than one time for more types. With `--json`, each line is one JSON document. These are the lines `19` and `20` of the list above:

```console
$ nomux --json events --follow --filter session-hibernated --filter session-woken
{"schema_version":1,"event":{"seq":19,"at_ms":1795706152174,"type":"session_hibernated","session":"mitrhfd6","hibernation":{"reason":"request","freed_bytes":780288,"measure":"pss"}}}
{"schema_version":1,"event":{"seq":20,"at_ms":1795706152182,"type":"session_woken","session":"mitrhfd6","hibernation":{"resume_command":"claude --resume 00000000-0000-4000-8000-000000000006"}}}
```

The daemon keeps the last events in memory: the numbers start again when the daemon starts again. A client that is too far behind gets a snapshot of the current state first. The [CLI reference](/docs/reference/cli/) has the fields.

## Ended Sessions

When the command of a Session ends, nomux keeps its last Agent run: the work that ran or waited becomes `done`, and a result stays. After `nomux kill xaddp4zj` of a Session that waited for you:

```console
$ nomux kill xaddp4zj
session xaddp4zj ended
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j  ./report.sh error the build failed            error                  22s  the build failed
* 6llcmruq  ./report.sh working reading the source files  working                22s  reading the source files
+ egywe7xg  ./report.sh done all tests pass               done (seen)            22s  all tests pass
! g55wwygt  ./osc.sh                                      needs you: permission  23s  may I install the linter?
* kbyhsoqx  /bin/bash                                     working (guess)        0s
+ xaddp4zj  ./report.sh blocked run the tests?            done                   0s
$ nomux agent explain xaddp4zj
session xaddp4zj: done for 0s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process
```

A dormant Session gets the same rule. The message of the work stays out, because it described work that ran.
The kept run stays until the daemon removes the Session, at the end of the [retention time](/docs/reference/glossary/). It shows the resume command of the agent tool if an adapter gave it. The daemon keeps 64 such runs at most.

## Limits

- The daemon keeps no status on disk. After a restart of the daemon, a Session that has no process shows `idle` with no source, and the kept runs of ended Sessions are gone.
- A Session that has a process loses the reports that only the daemon held. After `nomux daemon stop`, the Sessions `2vjh4l3j` and `egywe7xg` of this page, which had a self-report, showed `idle`. The Session `g55wwygt` still showed `needs you: permission`, because the holder keeps the OSC 7501 records of the terminal stream:

  ```console
  $ nomux status | grep -E 'SESSION|2vjh4l3j|g55wwygt'
    SESSION    COMMAND                                               STATE                  FOR  MESSAGE
    2vjh4l3j   ./report.sh error the build failed                    idle                   0s
  ! g55wwygt   ./osc.sh                                              needs you: permission  0s   may I install the linter?
  ```

  A program that uses `nomux status set` must report again after a restart of the daemon.
- A program that reports for the first time in the first moments of its command can fail: see [A report in the first moments of a Session can fail](#a-report-in-the-first-moments-of-a-session-can-fail).
- Input to a Session that waits for you does not clear its mark. The status changes when the program reports again.
- Only an attach marks a result as seen. A result of an ended Session stays unseen until the daemon removes the Session.
- A Child work has no self-report. `nomux status set` reports the Agent run of the Session.
- More than one Agent run in one Session is not supported.

Work that no source reports is `idle` with the source `none`. nomux does not read the title of the terminal or its screen for a status.
