---
title: Quick start
description: Start a Session, list the Sessions, stop the daemon, see that the Sessions continue, and end a Session.
---

This page uses the three binaries from the [install page](/docs/guides/install/).
The output on this page is the real output of one run with a build from `main`. Your session identifiers and process IDs are different.

:::note
A client cannot attach to the terminal of a Session yet. You can start, list and end Sessions, and the command of a Session runs without a client.
The [roadmap](/docs/project/roadmap/) shows the state of the work.
:::

## Start a Session

```console
$ nomux new --cmd sh
2uc2d5iq
```

`nomux new` starts the daemon if it does not run, starts a Session and prints the session identifier.
`--cmd` gives the command of the Session, here `sh`. Without `--cmd`, the command is your shell.

The Session does not need the CLI after that. The CLI ends, and the command continues.

To start a command in a different directory, add `--cwd`. The directory must exist:

```console
$ nomux new --cwd project --cmd sleep 600
bzxw7xjk
```

## List the Sessions

```console
$ nomux ls
ID        STATE    PID
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
```

`PID` is the process ID of the command of the Session, not of its holder.

## Stop the daemon: the Sessions continue

The daemon owns no terminal. Each Session lives in its own holder process.

```console
$ nomux daemon status
nomuxd 0.0.0 runs: process ID 1057038, 2 sessions
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

No daemon runs now. The next command that needs a daemon starts a new one, and the new daemon finds the two Sessions:

```console
$ nomux ls
ID        STATE    PID
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
$ nomux daemon status
nomuxd 0.0.0 runs: process ID 1057056, 2 sessions
```

The process IDs of the two commands are the same as before: the commands did not stop. Only the daemon has a new process ID.

The result is the same when the daemon ends without a clean stop:

```console
$ kill -9 1057056
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
```

[How it works](/docs/concepts/how-it-works/) explains why, and names the cases in which a Session does end.

## End a Session

```console
$ nomux kill 2uc2d5iq
session 2uc2d5iq ended
```

`nomux kill` sends `SIGHUP` to the command, as the close of a terminal does, and waits until the command has ended.
A second `kill` of the same Session fails with the exit code 2:

```console
$ nomux kill 2uc2d5iq
nomux: no session has the identifier 2uc2d5iq
```

A Session also ends when its command ends. It leaves the list then.

```console
$ nomux kill bzxw7xjk
session bzxw7xjk ended
$ nomux ls
no sessions
```

## Use the commands in a script

Each command accepts `--json` and `--quiet`. This is the list of the two Sessions as JSON:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"2uc2d5iq","state":"running","pid":1057040},{"id":"bzxw7xjk","state":"running","pid":1057045}]}
```

Put `--json` or `--quiet` before `--cmd`. All arguments after `--cmd` belong to the command of the Session.

The [CLI reference](/docs/reference/cli/) has each command, the JSON documents and the exit codes.
