---
title: Agent status
description: See what works, what is done and what needs you in each Session, why a Session needs you, and where each status comes from.
---

nomux shows the status of the work in each Session: an agent that works, a command that waits for you, a result that you did not see.
Each status has a source. nomux never shows a guess as a fact.

The output on this page is the real output of nomux 0.4.0 on Linux. The home directory of the run is the temporary directory `/tmp/nomux-demo`.
Your session identifiers are different. The programs in the examples are small shell scripts, because no agent tool ran. [Claude Code adapter](/docs/guides/claude-code/) shows an adapter with hook data of a real agent tool.

## The five states

| State | Meaning |
|---|---|
| `idle` | Nothing works and nothing waits. |
| `working` | Work runs. |
| `done` | Work is complete and the result waits for you. |
| `needs you` | The work cannot continue without you. It can have a kind: `permission`, `question` or `auth`. |
| `error` | The work stopped with an error. |

An Agent run is the work in one Session. It can have Child work: subagents, teammates and background tasks. Each Child work has its own status.

## See the status of each Session

`nomux status` prints one row for each Session:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  1s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  2s   may I install the linter?
* hg2oywnn  ./report.sh working reading the source files  working                1s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done                   1s   all tests pass
  oisyjabu  /bin/bash                                     idle                   2s
! scgqcjko  ./report.sh blocked run the tests?            needs you              1s   run the tests?
```

- The first column is a mark: `!` needs you, `x` error, `+` done, `*` working. An `idle` Session has no mark.
- `FOR` is the time in the state. A new message does not restart it.
- The rows are in the order of the session identifiers.
- A row for an ended Session shows its last result: see [Ended Sessions](#ended-sessions).

The row of a Session shows its most urgent status. A Child work that needs you makes its Session need you.
The order of urgency is: `needs you`, then `error` that you did not see, then `done` that you did not see, then `working`, then the rest. With the same urgency, the status that waits longest comes first.

### Child work

`--tree` adds a row for each Child work below its Session, indented by two spaces for each level:

```console
$ nomux status --tree
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  1s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  2s   may I install the linter?
!   lint                                                  needs you: permission  2s   may I install the linter?
*   tests                                                 working                2s   running 120 tests
* hg2oywnn  ./report.sh working reading the source files  working                1s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done                   1s   all tests pass
  oisyjabu  /bin/bash                                     idle                   2s
! scgqcjko  ./report.sh blocked run the tests?            needs you              1s   run the tests?
```

The Session `c65xaxvc` works, and its Child work `lint` waits for a permission. Thus the row of the Session shows `needs you: permission`.

### Results that you saw

A `done` or `error` result stays on the list until you see it. An attach to the Session marks its results as seen, and the row shows `(seen)`:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  7s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  8s   may I install the linter?
* hg2oywnn  ./report.sh working reading the source files  working                7s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done (seen)            7s   all tests pass
  oisyjabu  /bin/bash                                     idle                   8s
! scgqcjko  ./report.sh blocked run the tests?            needs you              7s   run the tests?
```

Here `nomux attach khkuqjw2` ran, and then the detach keys. Only an attach marks a result as seen.

## Why a Session needs you

The kind after `needs you` says why: `permission` (the agent asks to run a tool), `question` (it waits for an answer) or `auth` (it waits for a login). The message says what it asks. A program that does not give a kind has `needs you` alone, as `scgqcjko` above.

`nomux agent explain` says where a status comes from. It prints the status of the Session with its source, and then each source in the order in which they decide:

```console
$ nomux agent explain c65xaxvc
session c65xaxvc: working for 7s, from program status; message from program status: fixing the failing test
most urgent with its Child work: needs you: permission for 7s, from program status; message from program status: may I install the linter?

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      working: fixing the failing test (3 program status records in the terminal stream)
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

child work:
  lint: needs you: permission for 7s, from program status; message from program status: may I install the linter?
  tests: working for 7s, from program status; message from program status: running 120 tests
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

Here a person typed `sleep 30` in the shell of the Session `oisyjabu` and detached. The shell sent no prompt mark, thus the foreground program is the only source:

```console
$ nomux status | grep oisyjabu
* oisyjabu  /bin/bash                                     working (guess)        0s
$ nomux agent explain oisyjabu
session oisyjabu: working (guess) for 0s, from foreground program

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  working (the program sleep is in the foreground of the terminal)
```

The daemon cannot see that the foreground program changes: the operating system does not tell it. It reads the foreground when you ask for the status. A change that only this source sees makes no event.

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

The `sleep 1` is on purpose. A program that reports in the first moments of its command can find that the daemon does not know the Session yet: then `nomux status set` fails with exit code 2 or 4. Report again after a moment.

A program that writes OSC 7501 to its terminal needs no command. It can also report Child work, with an `id` that is a path (`tests` is below the Agent run). The script of the Session `c65xaxvc` did this:

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

`nomux events --follow` prints each change of a status when it happens. It ends with Ctrl-C.

```console
$ nomux events --follow
1 c65xaxvc working fixing the failing test
2 c65xaxvc working fixing the failing test
3 c65xaxvc needs you: permission may I install the linter?
4 hg2oywnn working reading the source files
5 scgqcjko needs you run the tests?
6 4rwbgxxt error the build failed
7 khkuqjw2 done all tests pass
8 khkuqjw2 done (seen) all tests pass
9 scgqcjko done
```

A line is the event number, the Session, the state and the message. The event `8` is the attach that marked the result as seen. The daemon keeps the last events in memory: the numbers start again when the daemon starts again. A client that is too far behind gets a snapshot of the current state first.

`--filter agent-run-changed`, `--filter agent-run-removed` and `--filter extension-event` print only events of that type. With `--json`, each line is one JSON document. The [CLI reference](/docs/reference/cli/) has the fields.

## Ended Sessions

When the command of a Session ends, nomux keeps its last Agent run: the work that ran or waited becomes `done`, and a result stays. After `nomux kill scgqcjko` of a Session that waited for you:

```console
$ nomux kill scgqcjko
session scgqcjko ended
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 4rwbgxxt  ./report.sh error the build failed            error                  7s   the build failed
! c65xaxvc  ./osc.sh                                      needs you: permission  8s   may I install the linter?
* hg2oywnn  ./report.sh working reading the source files  working                7s   reading the source files
+ khkuqjw2  ./report.sh done all tests pass               done (seen)            7s   all tests pass
  oisyjabu  /bin/bash                                     idle                   8s
+ scgqcjko  ./report.sh blocked run the tests?            done                   0s
$ nomux agent explain scgqcjko
session scgqcjko: done for 0s, from session restore

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

- The daemon keeps no status on disk. After a restart of the daemon, a Session that has no process shows `idle` with no source, and the kept runs of ended Sessions are gone. A Session that has a process reports again.
- A program that reports for the first time in the first moments of its command can fail: see [Report a status from your own program](#report-a-status-from-your-own-program).
- Input to a Session that waits for you does not clear its mark. The status changes when the program reports again.
- Only an attach marks a result as seen. A result of an ended Session stays unseen until the daemon removes the Session.
- A Child work has no self-report. `nomux status set` reports the Agent run of the Session.
- More than one Agent run in one Session is not supported.

Work that no source reports is `idle` with the source `none`. nomux does not read the title of the terminal or its screen for a status.
