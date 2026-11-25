---
title: CLI reference
description: Each command of the nomux CLI with its options, its output, its JSON documents and its exit codes.
sidebar:
  label: CLI
---

`nomux` is the CLI. It sends one request to the daemon and prints the result.
The [quick start](/docs/guides/quick-start/) shows the commands in use.

## Rules for all commands

- No command asks a question. A command reads only its arguments and its environment.
- All commands have the same [exit codes](#exit-codes).
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
  kill     End a session
  daemon   Show or stop the daemon
  version  Print the version

Options:
      --json     Print the result as one JSON document
  -q, --quiet    Print only the necessary part of the result
  -V, --version  Print the version
  -h, --help     Print help
```

A command is necessary. `nomux` without a command prints an error and has the exit code 1.

| Option | Function |
|---|---|
| `--json` | Prints the result as one JSON document on one line. Refer to [JSON output](#json-output). |
| `-q`, `--quiet` | Prints only what a script needs. Refer to [quiet output](#quiet-output). |
| `-V`, `--version` | Prints the version, as the `version` command does. |
| `-h`, `--help` | Prints the help text of the CLI or of one command. |

## Commands

### `nomux new`

Starts a new Session and prints its session identifier.

```text
Usage: nomux new [OPTIONS]

Options:
      --cwd <DIR>         The working directory of the command [default: the current directory]
      --json              Print the result as one JSON document
      --cmd <COMMAND>...  The command of the session and its arguments [default: the shell of the user]. All the arguments after --cmd belong to the command
  -q, --quiet             Print only the necessary part of the result
  -h, --help              Print help
```

| Option | Default | Function |
|---|---|---|
| `--cwd <DIR>` | The current directory of the CLI | The working directory of the command. A relative path is relative to the current directory. The directory must exist. |
| `--cmd <COMMAND>...` | The shell of the user: the `SHELL` variable of the daemon, or `/bin/sh` | The command of the Session and its arguments. |

`--cmd` is the last option. All arguments after it belong to the command, also `--json` and `--quiet`.
For example, `nomux new --cmd sh --json` starts the command `sh --json`.

```console
$ nomux new --cmd sh
2uc2d5iq
$ nomux new --cwd project --cmd sleep 600
bzxw7xjk
```

The command gets the environment of the daemon. Its terminal has 24 rows and 80 columns.

If the command cannot start, the exit code is 1:

```console
$ nomux new --cmd /nonexistent-binary
nomux: the session did not start: nomux-holder: cannot start the command: No such file or directory (os error 2)
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
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
```

If there is no Session, the command prints `no sessions`.

`PID` is the process ID of the command of the Session. It is `-` if the daemon does not know it.

| State | Meaning |
|---|---|
| `running` | The command of the Session runs. |
| `unreachable` | The holder of the Session runs, but the daemon has no connection to it. The daemon tries to connect again. |
| `unknown` | The daemon is newer than the CLI and sent a state that the CLI does not know. |

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
$ nomux kill 2uc2d5iq
session 2uc2d5iq ended
```

If no Session has the identifier, the exit code is 2. Thus the second `kill` of the same Session has the exit code 2:

```console
$ nomux kill 2uc2d5iq
nomux: no session has the identifier 2uc2d5iq
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
nomuxd 0.0.0 runs: process ID 1057038, 2 sessions
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

### `nomux daemon stop`

Stops the daemon. The Sessions continue. The command starts no daemon.

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
nomux 0.0.0
```

## Quiet output

With `--quiet`, a command prints only what a script needs.

| Command | Standard output |
|---|---|
| `new` | The session identifier |
| `ls` | One session identifier on each line |
| `version` | The version number |
| `kill`, `daemon status`, `daemon stop` | Nothing. The exit code is the result |

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

## JSON output

With `--json`, a command prints one JSON document on one line.

- On success, the document goes to the standard output.
- On an error, the standard output stays empty and the document goes to the standard error. It has the field `error`.
- Each document has the field `schema_version`. The current value is `1`.

**Schema version rule.** The value increases when a field is removed, gets a different name or gets a different meaning.
A new field does not increase the value. Thus a reader must ignore the fields that it does not know.

### `new`

```json
{"schema_version":1,"session":{"id":"qvjpfeam","state":"running","pid":1046423}}
```

| Field | Type | Meaning |
|---|---|---|
| `session.id` | string | The session identifier |
| `session.state` | string | `running`, `unreachable` or `unknown` |
| `session.pid` | number or `null` | The process ID of the command. `null` if the daemon does not know it |

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"qvjpfeam","state":"running","pid":1046423}]}
```

`sessions` is an array of the object that `new` gives, in the sequence of the identifiers. It is empty if there is no Session:

```json
{"schema_version":1,"sessions":[]}
```

### `kill`

```json
{"schema_version":1,"killed":"qvjpfeam"}
```

`killed` is the identifier of the Session that ended.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.0.0","pid":1045471,"sessions":1}}
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
{"schema_version":1,"version":"0.0.0"}
```

### Error

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier qvjpfeam"}}
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

This page describes commit [`cb36104`](https://github.com/nomux-sh/nomux/commit/cb36104c465fd970497f5f505ac895dcd64fba16) of the `main` branch of `nomux-sh/nomux`. That build prints the version `0.0.0`. No version has a tag yet.
The help texts and the examples are the real output of that build. The exit codes 3, 4 and 5 and the states `unreachable` and `unknown` come from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/main/docs/cli.md) of the same commit.
The commands `attach` and `detach` are not in that commit, thus they are not on this page.
