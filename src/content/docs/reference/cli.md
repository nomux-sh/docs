---
title: CLI reference
description: Each command of the nomux CLI with its options, its output, its JSON documents and its exit codes.
sidebar:
  label: CLI
---

`nomux` is the CLI. It connects to the daemon, sends its requests and prints the result. Only `attach` uses your terminal.
The [quick start](/docs/guides/quick-start/) shows the commands in use.

## Rules for all commands

- No command asks a question. A command reads only its arguments and its environment. The exception is `attach`, which gives your keyboard and your screen to a Session.
- All commands have the same [exit codes](#exit-codes). `attach` adds the exit status of the command of the Session.
- Each command accepts `--json` and `--quiet`. You cannot use the two options together.
- A command that needs the daemon starts it if no daemon answers, and waits for 5 seconds at most. `daemon status` and `daemon stop` start no daemon.
- The text output has colour only for the state of a Session, only when the standard output is a terminal and only when the `NO_COLOR` variable is not set.

## Synopsis

```text
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]

Commands:
  new      Start a new session and print its identifier
  ls       List the sessions
  attach   Show a session in this terminal. To detach, press Ctrl-\ and then d
  detach   Detach the clients that are attached to a session. The session continues
  kill     End a session
  daemon   Show or stop the daemon
  version  Print the version

Options:
      --json     Print the result as one JSON document
  -q, --quiet    Print only the necessary part of the result
  -V, --version  Print the version
  -h, --help     Print help
```

A command is necessary. `nomux` without a command prints an error and has the exit code 1:

```console
$ nomux
error: a command is necessary

Usage: nomux [OPTIONS] [COMMAND]

For more information, try '--help'.
```

| Option | Function |
|---|---|
| `--json` | Prints the result as one JSON document on one line. Refer to [JSON output](#json-output). |
| `-q`, `--quiet` | Prints only what a script needs. Refer to [quiet output](#quiet-output). |
| `-V`, `--version` | Prints the version, as the `version` command does. |
| `-h`, `--help` | Prints the help text of the CLI or of one command. |

## Commands

### `nomux new`

Starts a new Session and prints its session identifier. With `--attach`, it attaches to the Session.

```text
Usage: nomux new [OPTIONS] [-- <COMMAND>...]

Arguments:
  [COMMAND]...  The same as --cmd: each argument after -- belongs to the command

Options:
      --cwd <DIR>         The working directory of the command [default: the current directory]
      --json              Print the result as one JSON document
      --attach            Attach to the new session
  -q, --quiet             Print only the necessary part of the result
      --cmd <COMMAND>...  The command of the session and its arguments [default: the shell of the user]. Each argument after --cmd belongs to the command, also an option of nomux
  -h, --help              Print help
```

| Option | Default | Function |
|---|---|---|
| `--cwd <DIR>` | The current directory of the CLI | The working directory of the command. A relative path is relative to the current directory. The directory must exist. |
| `--attach` | Off | Attaches the terminal to the new Session, as [`nomux attach`](#nomux-attach) does. The command then prints the result of the attach and not the session identifier. |
| `-- <COMMAND>...` | The shell of the user: the `SHELL` variable of the daemon, or `/bin/sh` | The command of the Session and its arguments. |
| `--cmd <COMMAND>...` | The same | A second form of `--`. |

**Each argument after `--` or `--cmd` belongs to the command of the Session, also an argument that is an option of `nomux`.** Thus the options of `nomux` come before the command:

```sh
nomux new --json -- sleep 300      # --json is an option of nomux
nomux new -- sleep 300 --json      # --json is an argument of sleep
```

```console
$ nomux new -- sh
v4nmov3a
$ nomux new --cwd project -- sleep 600
iyzzzkaz
```

The command gets the environment of the daemon. Its terminal has 24 rows and 80 columns until a client attaches: an attach gives the Session the window size of the terminal of the client.

If the command cannot start or the directory does not exist, the exit code is 1 and no Session starts:

```console
$ nomux new -- /nonexistent-binary
nomux: the session did not start: nomux-holder: cannot start the command: No such file or directory (os error 2)
$ nomux new --cwd /nonexistent-directory
nomux: the working directory /nonexistent-directory is not an absolute path of a directory
```

`--attach` needs a terminal. Without one, the exit code is 1 and no Session starts:

```console
$ nomux new --attach -- sh < /dev/null
nomux: attach needs a terminal: the standard input is not a terminal
```

### `nomux ls`

Lists the Sessions.

```text
Usage: nomux ls [OPTIONS]

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

```console
$ nomux ls
ID        STATE    PID
iyzzzkaz  running  1551539
qsscrcw4  running  1551536
v4nmov3a  running  1551533
```

If there is no Session, the command prints `no sessions`.

`PID` is the process ID of the command of the Session. It is `-` if the daemon does not know it.

| State | Meaning |
|---|---|
| `running` | The command of the Session runs. |
| `unreachable` | The holder of the Session runs, but the daemon has no connection to it. The daemon tries to connect again. |
| `unknown` | The daemon is newer than the CLI and sent a state that the CLI does not know. |

### `nomux attach`

Makes your terminal the terminal of a Session, until you detach or the Session ends.

```text
Usage: nomux attach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help

Keys during an attach:
  Ctrl-\ d       Detach. The session continues
  Ctrl-\ Ctrl-\  Send one Ctrl-\ to the session

Each other key goes to the session. The exit code is the exit status of the
command if the session ends during the attach, and 0 after a detach.
```

An attach does these steps:

1. The Session gets the window size of your terminal.
2. The CLI clears the terminal and shows the current screen of the Session. A program that already drew its screen, for example an editor, is visible immediately.
3. Each key goes to the Session, and the terminal shows each byte that the Session writes. The terminal is in raw mode: `Ctrl-C` and `Ctrl-Z` go to the programs of the Session.
4. When the window gets a different size, the Session gets the new size.

The command needs a terminal on its standard input.
More than one terminal can be attached to one Session at the same time. Each one shows the same output, and each one can type.
A Session has one window size: the size of the terminal that attached or changed its size last. A terminal with a different size shows the output as the programs made it for that size.

An attach shows the screen of the Session and not the lines that left the screen. There is no scrollback in this version.

#### Keys

`Ctrl-\` is the prefix key. A terminal that is not in raw mode sends `SIGQUIT` for this key, thus almost no program gives it a function.

| Keys | Function |
|---|---|
| `Ctrl-\` and then `d` | Detach. The Session continues |
| `Ctrl-\` two times | Send one `Ctrl-\` to the Session |
| `Ctrl-\` and then a different key | Send the two keys to the Session |

You cannot change the keys in this version.

#### How an attach ends

The terminal gets its earlier mode back in each case. The CLI does not use the alternate screen of the terminal: after the attach, the terminal shows the last screen of the Session, and the message is below it.

| Event | Message | Exit code |
|---|---|---|
| You detach, `nomux detach` detaches the client, or the terminal closes | `detached from session <id>` | 0 |
| The command of the Session ends | `session <id> ended with exit status <n>` | `<n>`: the exit status of the command |
| A signal ends the command of the Session | `session <id> ended by signal <n>` | 128 + `<n>`, as a shell gives it |
| The Session ends and the daemon cannot get the exit status | `session <id> ended; its exit status is not known` | 1 |
| The daemon stops or fails | An error that says that the Session continues and how to attach again | 1 |
| The CLI gets `SIGTERM`, `SIGHUP`, `SIGINT` or `SIGQUIT` | An error | 1 |
| No Session has the identifier | An error | 2 |

Thus the exit code of `attach` can be a value that the table of the [exit codes](#exit-codes) does not have, and the values 1 to 5 can come from the command of the Session.

These are four ends of an attach: a detach, a command that ends with the exit status 3, a command that a signal ends, and a daemon that stops.

```console
detached from session einqa7tl
```

```console
sh-5.3$ exit 3
exit

session einqa7tl ended with exit status 3
$ echo $?
3
```

```console
sh-5.3$ kill -9 $$

session bjzm6rkj ended by signal 9
$ echo $?
137
```

```console
nomux: the connection to the daemon failed: the daemon closed the connection. The session continues: run `nomux attach einqa7tl` to attach again
```

If no Session has the identifier:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier aaaaaaaa
```

### `nomux detach`

Detaches each client that is attached to a Session, from a different terminal or from a script. The Session continues.

```text
Usage: nomux detach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

Each of these clients ends as after the detach keys. The command succeeds also if no client is attached:

```console
$ nomux detach einqa7tl
detached 1 client from session einqa7tl
$ nomux detach einqa7tl
detached 0 clients from session einqa7tl
```

If no Session has the identifier, the exit code is 2.
The identifier is necessary. To detach your own terminal, use the detach keys.

### `nomux kill`

Ends a Session and waits until its command has ended.

```text
Usage: nomux kill [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

The command of the Session gets `SIGHUP`. If it still runs after 2 seconds, it gets `SIGKILL`.

```console
$ nomux kill habxocyh
session habxocyh ended
```

If no Session has the identifier, the exit code is 2. Thus the second `kill` of the same Session has the exit code 2:

```console
$ nomux kill habxocyh
nomux: no session has the identifier habxocyh
```

### `nomux daemon status`

Shows if the daemon runs. The exit code is 0 if a daemon runs and 2 if no daemon runs. The command starts no daemon.

```text
Usage: nomux daemon status [OPTIONS]

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

```console
$ nomux daemon status
nomuxd 0.1.0 runs: process ID 1552420, 1 session
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

### `nomux daemon stop`

Stops the daemon. The Sessions continue. The command starts no daemon.
A client that is attached to a Session at that moment ends with an error and the exit code 1. Refer to [how an attach ends](#how-an-attach-ends).

```text
Usage: nomux daemon stop [OPTIONS]

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

The exit code is 0 also when no daemon runs, because the result is the same. The command prints `nomuxd does not run` then.

### `nomux version`

Prints the version. `nomux --version` and `nomux -V` do the same.

```text
Usage: nomux version [OPTIONS]

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

```console
$ nomux version
nomux 0.1.0
```

## Quiet output

With `--quiet`, a command prints only what a script needs.

| Command | Standard output |
|---|---|
| `new` | The session identifier |
| `ls` | One session identifier on each line |
| `version` | The version number |
| `new --attach`, `attach`, `detach`, `kill`, `daemon status`, `daemon stop` | Nothing. The exit code is the result |

## Errors

An error goes to the standard error as `nomux: <message>`, and the standard output stays empty.
The text of a message is not stable. A script must use the exit code.

A wrong command line prints the usage message of the argument parser and has the exit code 1:

```console
$ nomux --json --quiet ls
error: the argument '--json' cannot be used with '--quiet'

Usage: nomux --json

For more information, try '--help'.
```

## Exit codes

| Code | Name in JSON | Meaning |
|---:|---|---|
| 0 | | Success |
| 1 | `error` | An error that has no other code, also a wrong command line |
| 2 | `not_found` | The item does not exist: no Session has the identifier, or no daemon runs (`daemon status`) |
| 3 | `timeout` | An operation did not complete in the permitted time: the daemon did not answer after its start, a Session was not ready, or a command did not end |
| 4 | `no_permission` | The user does not have permission, for example for the socket of the daemon |
| 5 | `version_mismatch` | The CLI and the daemon have no common protocol version. Update the older of the two |

`attach` and `new --attach` have one more source of the exit code: if the Session ends during the attach, the exit code is the exit status of its command. Refer to [how an attach ends](#how-an-attach-ends).

## JSON output

With `--json`, a command prints one JSON document on one line.

- On success, the document goes to the standard output.
- On an error, the standard output stays empty and the document goes to the standard error. It has the field `error`.
- Each document has the field `schema_version`. The current value is `1`.

**Schema version rule.** The value increases when a field is removed, gets a different name or gets a different meaning.
A new field does not increase the value. Thus a reader must ignore the fields that it does not know.

### `new`

```json
{"schema_version":1,"session":{"id":"qsscrcw4","state":"running","pid":1551536}}
```

| Field | Type | Meaning |
|---|---|---|
| `session.id` | string | The session identifier |
| `session.state` | string | `running`, `unreachable` or `unknown` |
| `session.pid` | number or `null` | The process ID of the command. `null` if the daemon does not know it |

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"iyzzzkaz","state":"running","pid":1551539},{"id":"qsscrcw4","state":"running","pid":1551536},{"id":"v4nmov3a","state":"running","pid":1551533}]}
```

`sessions` is an array of the object that `new` gives, in the sequence of the identifiers. It is empty if there is no Session:

```json
{"schema_version":1,"sessions":[]}
```

### `attach` and `new --attach`

```json
{"schema_version":1,"attach":{"id":"v4nmov3a","end":"detached"}}
{"schema_version":1,"attach":{"id":"v4nmov3a","end":"exited","exit_code":0}}
{"schema_version":1,"attach":{"id":"vkgzyie7","end":"signaled","signal":9}}
```

The command prints the document after the attach ended. The document of a Session that ended goes to the standard output, and the exit code is the one of the table in [how an attach ends](#how-an-attach-ends).

| Field | Type | Meaning |
|---|---|---|
| `attach.id` | string | The session identifier |
| `attach.end` | string | `detached`: the client detached and the Session continues. `exited`: the command ended with an exit code. `signaled`: a signal ended the command. `lost`: the Session ended and its exit status is not known. `unknown`: the daemon is newer than the CLI and sent a reason that the CLI does not know |
| `attach.exit_code` | number | The exit code of the command. Only if `end` is `exited` |
| `attach.signal` | number | The signal number. Only if `end` is `signaled` |

### `detach`

```json
{"schema_version":1,"detached":{"id":"v4nmov3a","clients":1}}
```

| Field | Type | Meaning |
|---|---|---|
| `detached.id` | string | The session identifier |
| `detached.clients` | number | The number of clients that were attached to the Session |

### `kill`

```json
{"schema_version":1,"killed":"gqz3a4vb"}
```

`killed` is the identifier of the Session that ended.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.1.0","pid":1551531,"sessions":3}}
{"schema_version":1,"daemon":{"running":false}}
```

| Field | Type | Meaning |
|---|---|---|
| `daemon.running` | boolean | `true` if a daemon runs. If it is `false`, the document has no other field of `daemon` and the exit code is 2 |
| `daemon.version` | string | The product version of the daemon |
| `daemon.pid` | number | The process ID of the daemon |
| `daemon.sessions` | number | The number of Sessions |

### `daemon stop`

```json
{"schema_version":1,"stopped":true}
```

`stopped` is `true` if a daemon ran and the command stopped it. It is `false` if no daemon ran.

### `version`

```json
{"schema_version":1,"version":"0.1.0"}
```

### Error

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier aaaaaaaa"}}
```

| Field | Type | Meaning |
|---|---|---|
| `error.code` | number | The exit code of the command |
| `error.kind` | string | The name of the exit code from the table in [exit codes](#exit-codes) |
| `error.message` | string | A message in English for a person. The text is not stable |

A wrong command line is not a JSON document. The argument parser writes its usage message as text.

## The other two binaries

You do not usually run `nomuxd` and `nomux-holder` yourself. The CLI starts the daemon, and the daemon starts a holder for each Session.

```text
Usage: nomuxd [--detach]
       nomuxd --version

Without an option, nomuxd runs in the foreground and writes its log to the
standard error.

Options:
  --detach  Start the daemon as a separate process and end. The log of that
            daemon goes to nomuxd.log in the runtime directory (~/.nomux/run).

Environment:
  NOMUX_LOG  The log level: error, warn (default), info, debug or trace
```

## Version of this page

This page describes nomux 0.1.0: the tag [`v0.1.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.1.0) of `nomux-sh/nomux`, commit [`f155516`](https://github.com/nomux-sh/nomux/commit/f15551674735407109d33cbd9924c1710b81eb2f).
The help texts and the examples are the real output of the binaries of that release on Linux x86_64. The session identifiers and the process IDs come from more than one run.
These parts were not run for this page and come from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.1.0/docs/cli.md) of the same tag: the exit codes 3, 4 and 5, the states `unreachable` and `unknown`, the values `lost` and `unknown` of `attach.end`, the end of an attach by a signal for the CLI, and the change of the window size during an attach.
