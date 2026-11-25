---
title: Quick start
description: Start a Session and attach to it, detach, attach again, stop the daemon, see that the Session continues, and end a Session.
---

This page uses the three binaries from the [install page](/docs/guides/install/).
The output on this page is the real output of one run with nomux 0.1.0 on Linux. Your session identifiers and process IDs are different.

In the examples, `$` is the prompt of your shell and `sh-5.3$` is the prompt of the shell in the Session.

## Start a Session and attach to it

```console
$ nomux new --attach -- sh
```

`nomux new` starts the daemon if it does not run, and starts a Session.
The arguments after `--` are the command of the Session, here `sh`. Without them, the command is your shell.
`--attach` makes your terminal the terminal of the Session: the CLI clears the terminal and shows the screen of the Session.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Each key goes to the Session. `Ctrl-C` and `Ctrl-Z` also go to the programs of the Session, not to the CLI.

## Detach

Press `Ctrl-\` and then `d`.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
detached from session einqa7tl
$
```

The CLI ends with the exit code 0. The Session continues, and its programs do not see the detach.
The message has the session identifier. `nomux ls` shows it too:

```console
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
```

`PID` is the process ID of the command of the Session, not of its holder.

## Attach again

```console
$ nomux attach einqa7tl
```

The terminal shows the same screen as before the detach:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

The screen comes from the holder of the Session, which keeps it while no client is attached. A program that drew its screen before, for example an editor, is visible immediately.

More than one terminal can be attached to one Session at the same time. Each terminal shows the same output, and each one can type.
Here a second terminal runs the same `nomux attach einqa7tl`, and you type a command in it. The two terminals then show this screen:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

To detach a terminal that you cannot reach, use `nomux detach` from a different terminal. It detaches each client of the Session:

```console
$ nomux detach einqa7tl
detached 1 client from session einqa7tl
```

The terminal that was attached shows `detached from session einqa7tl`, as after the detach keys.

## Stop the daemon: the Session continues

The daemon owns no terminal. Each Session lives in its own holder process.
Attach to the Session in one terminal, and stop the daemon from a second terminal:

```console
$ nomux daemon status
nomuxd 0.1.0 runs: process ID 1552420, 1 session
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

The attach in the first terminal ends with the exit code 1, because its connection went through the daemon:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
nomux: the connection to the daemon failed: the daemon closed the connection. The session continues: run `nomux attach einqa7tl` to attach again
$
```

No daemon runs now. The next command that needs a daemon starts a new one, and the new daemon finds the Session:

```console
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
$ nomux daemon status
nomuxd 0.1.0 runs: process ID 1552642, 1 session
```

The process ID of the command is the same as before: the command did not stop. Only the daemon has a new process ID.
`nomux attach einqa7tl` shows the same screen again:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

The result is the same when the daemon ends without a clean stop:

```console
$ kill -9 1552642
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
```

[How it works](/docs/concepts/how-it-works/) explains why, and names the cases in which a Session does end.

## Start a Session without an attach

Without `--attach`, `nomux new` prints the session identifier and ends. The command of the Session runs without a client.
To start the command in a different directory, add `--cwd`. The directory must exist:

```console
$ nomux new --cwd project -- sleep 600
habxocyh
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
habxocyh  running  1553082
```

## End a Session

A Session ends when its command ends. If a terminal is attached at that moment, the CLI prints the exit status of the command and ends with the same value as its exit code:

```console
sh-5.3$ exit 3
exit

session einqa7tl ended with exit status 3
$ echo $?
3
```

`nomux kill` ends a Session from outside. It sends `SIGHUP` to the command, as the close of a terminal does, and waits until the command has ended:

```console
$ nomux kill habxocyh
session habxocyh ended
```

A Session that ended leaves the list. A second `kill` of the same Session fails with the exit code 2:

```console
$ nomux kill habxocyh
nomux: no session has the identifier habxocyh
$ nomux ls
no sessions
```

## Use the commands in a script

Each command accepts `--json` and `--quiet`. This is the list of the two Sessions as JSON:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"einqa7tl","state":"running","pid":1552422},{"id":"habxocyh","state":"running","pid":1553082}]}
```

Put `--json` or `--quiet` before `--`. All arguments after `--` belong to the command of the Session.
`attach` and `new --attach` need a terminal on the standard input. In a script without a terminal, they fail with the exit code 1.

The [CLI reference](/docs/reference/cli/) has each command, the keys of an attach, the JSON documents and the exit codes.
