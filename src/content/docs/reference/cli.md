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
- Each command accepts `--json`, `--quiet` and `--host <name>`. You cannot use `--json` and `--quiet` together.
- Without `--host`, a command uses the daemon of the local Host. With `--host <name>`, it uses the daemon of a remote Host through SSH. Refer to [`--host`](#--host).
- A command that needs the daemon starts it if no daemon answers, and waits for 5 seconds at most. The `daemon` commands start no daemon.
- The text output has colour only for the state of a Session, only when the standard output is a terminal and only when the `NO_COLOR` variable is not set.

## Synopsis

```text
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]

Commands:
  new             Start a new session and print its identifier
  ls              List the sessions
  attach          Show a session in this terminal. To detach, press Ctrl-\ and then d. A dormant session starts again
  start           Start the command of a dormant session again
  capture         Print the last output lines of a session
  restore-policy  Set when a dormant session starts again
  detach          Detach the clients that are attached to a session. The session continues
  kill            End a session. A dormant session is removed with its output
  daemon          Show or stop the daemon, and start it at login
  host            Add, list, remove and check the remote hosts
  ext             Install, list, remove and call the extensions of a host
  version         Print the version

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -V, --version      Print the version
  -h, --help         Print help
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
| `--host <NAME>` | Uses the daemon of a remote Host. Refer to [`--host`](#--host). |
| `-V`, `--version` | Prints the version, as the `version` command does. |
| `-h`, `--help` | Prints the help text of the CLI or of one command. |

Each command accepts the three options `--json`, `--quiet` and `--host`. The help texts below show them, and the tables below the help texts do not repeat them.

### `--host`

`--host <name>` makes a command use the daemon of a remote Host. `<name>` is a Host of the configuration file, which [`nomux host add`](#nomux-host-add) writes. [Remote hosts](/docs/guides/remote-hosts/) describes the connection.

```sh
nomux --host vps new --attach
nomux --host vps ls --json
```

- Each command first makes sure that the Host has the binaries of the version of the CLI. If they are absent, the command installs them, as `host add` does, and writes one line about it to the standard error.
- `new --cwd <dir>` needs an absolute path on the Host. Without `--cwd`, the command starts in your home directory on the Host.
- `--host` cannot be used with a `host` command and with `daemon install-service` and `daemon uninstall-service`. These commands have the exit code 1 with `--host`. `version` prints the version of the CLI.
- An SSH error has the exit code 1. If the Host accepts no key, the exit code is 4.

A name that the configuration file does not have gives the exit code 2:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
```

The commands that connect to a remote Host were not run for this page.

## Session commands

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
      --host <NAME>       Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help              Print help
```

| Option | Default | Function |
|---|---|---|
| `--cwd <DIR>` | The current directory of the CLI | The working directory of the command. A relative path is relative to the current directory. The directory must exist. |
| `--attach` | Off | Attaches the terminal to the new Session, as [`nomux attach`](#nomux-attach) does. The command then prints the result of the attach and not the session identifier. |
| `-- <COMMAND>...` | The shell of the user: the `SHELL` variable of the daemon, or `/bin/sh` | The command of the Session and its arguments. |
| `--cmd <COMMAND>...` | The same | A second form of `--`. Use one of the two forms. |

**Each argument after `--` or `--cmd` belongs to the command of the Session, also an argument that is an option of `nomux`.** Thus the options of `nomux` come before the command:

```sh
nomux new --json -- sleep 300      # --json is an option of nomux
nomux new -- sleep 300 --json      # --json is an argument of sleep
```

```console
$ nomux new --cwd project -- sleep 600
sl2ugpe7
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

Lists the Sessions that can run: the Sessions whose command runs, the dormant Sessions and the damaged Sessions. With `--all`, it also lists the ended Sessions.

```text
Usage: nomux ls [OPTIONS]

Options:
  -a, --all          Also list the sessions whose command ended
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ls
ID        STATE    PID      COMMAND
sl2ugpe7  running  2616794  sleep 600
z3yjk54g  running  2616707  sh
$ nomux ls --all
ID        STATE    PID      COMMAND    NOTE
hqarpjgu  running  2616798  sleep 300
sl2ugpe7  running  2616794  sleep 600
z3yjk54g  ended    -        sh         exit status 3
```

If there is no Session, the command prints `no sessions`.

- `PID` is the process ID of the command of the Session. It is `-` if the Session has no process or the daemon does not know it.
- `COMMAND` is the program and its arguments, with one space between them.
- The column `NOTE` is there only if a Session has a note: how the command of an ended Session ended (`exit status <n>` or `signal <n>`), or why the description of a Session is damaged.

| State | Meaning |
|---|---|
| `running` | The command of the Session runs. |
| `unreachable` | The holder of the Session runs, but the daemon has no connection to it. The daemon tries to connect again. |
| `dormant` | The Session has no process: its holder is gone, and its command did not end. `attach` or `start` starts the command again. Refer to [After a restart](/docs/guides/after-a-restart/). |
| `ended` | The command of the Session ended. The daemon keeps the Session and its output for the retention time, 24 hours by default. Only `ls --all` shows it. |
| `damaged` | The daemon cannot read the description of the Session. The note has the reason. `kill` removes the Session. |
| `unknown` | The daemon is newer than the CLI and sent a state that the CLI does not know. |

### `nomux attach`

Makes your terminal the terminal of a Session, until you detach or the Session ends. A dormant Session starts again.

```text
Usage: nomux attach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help

Keys during an attach:
  Ctrl-\ d       Detach. The session continues
  Ctrl-\ Ctrl-\  Send one Ctrl-\ to the session

Each other key goes to the session. The exit code is the exit status of the
command if the session ends during the attach, and 0 after a detach.
```

An attach does these steps:

1. The Session gets the window size of your terminal.
2. The terminal shows the current screen of the Session. A program that already drew its screen, for example an editor, is visible immediately.
3. Each key goes to the Session, and the terminal shows each byte that the Session writes. The terminal is in raw mode: `Ctrl-C` and `Ctrl-Z` go to the programs of the Session.
4. When the window gets a different size, the Session gets the new size.

For a dormant Session, the attach first starts the command again in the working directory of the Session, with the window size of your terminal. The terminal shows the end of the old output, then the line `--- nomux: the session started again. The output before this line is from the command that stopped ---`, and then the screen of the new command. The processes of the Session from before do not come back.

The command needs a terminal on its standard input.
More than one terminal can be attached to one Session at the same time. Each one shows the same output, and each one can type.
A Session has one window size: the size of the terminal that attached or changed its size last. A terminal with a different size shows the output as the programs made it for that size.

An attach shows the screen of the Session and not the lines that left the screen. [`nomux capture`](#nomux-capture) prints them.

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
| The connection to a remote Host ends | The attach connects again. After approximately 48 seconds without a connection, an error that says how to attach again | 1 after the error |
| The CLI gets `SIGTERM`, `SIGHUP`, `SIGINT` or `SIGQUIT` | An error | 1 |
| No Session has the identifier, or the command of the Session ended before the attach | An error | 2 |
| The Session is dormant and has the restore policy `manual`, or its command cannot start | An error | 1 |

Thus the exit code of `attach` can be a value that the table of the [exit codes](#exit-codes) does not have, and the values 1 to 5 can come from the command of the Session.

These are four ends of an attach: a detach, a command that ends with the exit status 3, a command that a signal ends, and a daemon that stops.

```console
detached from session z3yjk54g
```

```console
sh-5.3$ exit 3
exit

session z3yjk54g ended with exit status 3
```

```console
sh-5.3$ kill -9 $$

session 3lptmq6f ended by signal 9
```

The exit code of the last two is 3 and 137.

```console
nomux: the daemon stopped. The session continues: run `nomux attach z3yjk54g` to attach again
```

If no Session has the identifier, or the Session ended:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier aaaaaaaa
$ nomux attach z3yjk54g
nomux: session z3yjk54g ended: its command does not run
```

### `nomux start`

Starts the command of a dormant Session again, without an attach.

```text
Usage: nomux start [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The command starts in the working directory of the Session, with the window size that the Session had. It starts also for the restore policy `manual`.

```console
$ nomux start ds3kchg4
session ds3kchg4 runs
```

- For a Session whose command runs, the command succeeds and changes nothing.
- For an ended Session, the exit code is 2: `nomux: session z3yjk54g ended: its command does not run`.
- If the command cannot start, for example because its working directory is gone, the exit code is 1 and the Session stays dormant.

### `nomux capture`

Prints the last output lines of a Session, without an attach.

```text
Usage: nomux capture [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
      --lines <N>    The number of lines [default: 100]
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux new -- sh -c 'seq 1 200; exec sleep 600'
ebxd36mw
$ nomux capture ebxd36mw --lines 3
198
199
200
```

- The lines come from the journal of the Session on disk. Thus the command also prints lines that left the screen, lines from before a restore, and the lines of a dormant or an ended Session.
- The output is the bytes as the command wrote them, with its escape sequences. A line ends with a carriage return and a line feed, as a terminal gets it.
- If the Session has fewer lines, the command prints all of its output.
- With `--quiet`, the output is the same.

### `nomux restore-policy`

Sets when a dormant Session starts again.

```text
Usage: nomux restore-policy [OPTIONS] <ID> <POLICY>

Arguments:
  <ID>      The session identifier
  <POLICY>  auto: when the daemon starts. on-focus: at the first attach. manual: only with `nomux start`

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Policy | The command starts again |
|---|---|
| `auto` | When the daemon starts, for example at login |
| `on-focus` | At the first `attach` or `start`. This is the default |
| `manual` | Only with `start`. `attach` fails with the exit code 1 |

```console
$ nomux restore-policy zapitg2m auto
session zapitg2m has the restore policy auto
$ nomux restore-policy ds3kchg4 sometimes
error: invalid value 'sometimes' for '<POLICY>': a restore policy is `auto`, `on-focus` or `manual`

For more information, try '--help'.
```

The default policy is `default_policy` in the `[restore]` table of the configuration file of the Host. [After a restart](/docs/guides/after-a-restart/#restore-policies) has the file.

### `nomux detach`

Detaches each client that is attached to a Session, from a different terminal or from a script. The Session continues.

```text
Usage: nomux detach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Each of these clients ends as after the detach keys. The command succeeds also if no client is attached:

```console
$ nomux detach z3yjk54g
detached 1 client from session z3yjk54g
$ nomux detach z3yjk54g
detached 0 clients from session z3yjk54g
```

If no Session has the identifier, the exit code is 2.
The identifier is necessary. To detach your own terminal, use the detach keys.

### `nomux kill`

Ends a Session and waits until its command has ended. Removes a dormant Session with its output.

```text
Usage: nomux kill [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The command of the Session gets `SIGHUP`. If it still runs after 2 seconds, it gets `SIGKILL`. The Session is then an ended Session: `ls --all` shows it for the retention time.

```console
$ nomux kill sl2ugpe7
session sl2ugpe7 ended
```

If no Session has the identifier, or if its command ended already, the exit code is 2. Thus the second `kill` of the same Session has the exit code 2:

```console
$ nomux kill sl2ugpe7
nomux: session sl2ugpe7 ended: its command does not run
```

A dormant Session and a damaged Session have no command to end. `kill` removes such a Session and its state directory: its output is gone after that.

## Daemon commands

### `nomux daemon status`

Shows if the daemon runs. The exit code is 0 if a daemon runs and 2 if no daemon runs. The command starts no daemon.

```text
Usage: nomux daemon status [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux daemon status
nomuxd 0.3.0 runs: process ID 2616705, 1 session
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
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The exit code is 0 also when no daemon runs, because the result is the same. The command prints `nomuxd does not run` then.

### `nomux daemon install-service`

Writes the service file that starts the daemon at login: a systemd user unit on Linux, a launchd agent on macOS.

```text
Usage: nomux daemon install-service [OPTIONS]

Options:
      --dry-run      Print the path and the content of the file, and write nothing
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux daemon install-service
wrote /tmp/nomux-demo/.config/systemd/user/nomuxd.service
To start the daemon at each login, run: systemctl --user daemon-reload && systemctl --user enable --now nomuxd.service
```

- The command writes only in the configuration directories of the user: `$XDG_CONFIG_HOME/systemd/user` or `~/.config/systemd/user` on Linux, `~/Library/LaunchAgents` on macOS. It needs no `sudo`.
- It starts no program. Its output has the command that gives the file to the service manager.
- `nomuxd` must be in the directory of `nomux`: the file has its path.

[After a restart](/docs/guides/after-a-restart/#start-the-daemon-at-login) shows the content of the file and explains its lines.

### `nomux daemon uninstall-service`

Removes the service file.

```text
Usage: nomux daemon uninstall-service [OPTIONS]

Options:
      --dry-run      Print the path of the file, and remove nothing
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux daemon uninstall-service
removed /tmp/nomux-demo/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
$ nomux daemon uninstall-service
no service file: /tmp/nomux-demo/.config/systemd/user/nomuxd.service does not exist
```

The exit code is 0 also when the file does not exist. The daemon that runs continues.

## Host commands

These commands manage the remote Hosts of the configuration file on your computer. [Remote hosts](/docs/guides/remote-hosts/) describes the connection, the trust rules and what nomux writes on a Host.
The commands that connect to a Host (`host add`, and `host doctor` with a Host) were not run for this page. Their description comes from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/cli.md) of nomux 0.3.0.

### `nomux host add`

Connects to a Host through SSH, installs nomux there and saves the Host.

```text
Usage: nomux host add [OPTIONS] <SSH-TARGET>

Arguments:
  <SSH-TARGET>  The SSH destination: [user@]host, ssh://[user@]host[:port] or a Host name of ~/.ssh/config

Options:
      --json         Print the result as one JSON document
      --name <NAME>  The name of the host for --host [default: the host part of the destination]
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The command connects, finds the system and the processor of the Host, installs the three binaries of the version of the CLI in `~/.nomux/bin/<version>` if the Host does not have them, starts the daemon if no daemon runs, and writes `[hosts.<name>]` to the configuration file. It saves the Host only if all of these steps succeed.

- A name has only `a` to `z`, `A` to `Z`, `0` to `9`, `.`, `_` and `-`.
- You can run the command again for the same name and the same target. For a name that exists with a different target, the command fails.
- A host key that is not known is an error with the fingerprint and the `ssh` command that adds the key.

### `nomux host ls`

Lists the Hosts of the configuration file. The command does not connect to a Host.

```text
Usage: nomux host ls [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux host ls
NAME  SSH
vps   deploy@vps.example.com
```

Without a Host, the command prints `no hosts`.

### `nomux host rm`

Removes a Host from the configuration file. Nothing changes on the Host.

```text
Usage: nomux host rm [OPTIONS] <NAME>

Arguments:
  <NAME>  The name of the host

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux host rm vps
host vps removed
$ nomux host rm vps
nomux: no host has the name vps
```

If the file does not have the name, the exit code is 2.

### `nomux host doctor`

Checks the connection, the platform, the binaries, the permissions and the daemon of a Host. The command changes nothing on a Host.

```text
Usage: nomux host doctor [OPTIONS] [NAME]

Arguments:
  [NAME]  The name of the host [default: each host of the configuration file]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The checks are `connection`, `platform`, `binaries`, `permissions`, `daemon` and `versions`. [Check a Host](/docs/guides/remote-hosts/#check-a-host) says when each one passes. The exit code is 0 if each check of each Host passed, and 1 if a check failed.

```console
$ nomux host doctor
no hosts
```

## Extension commands

These commands use the extension host of the daemon. [Extensions](/docs/guides/extensions/) shows them in use.

### `nomux ext ls`

Lists the installed extensions.

```text
Usage: nomux ext ls [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    stopped  fs=/tmp/nomux-demo/project,process=git
```

Without an extension, the command prints `no extensions`.

| State | Meaning |
|---|---|
| `stopped` | The extension is enabled, and its process does not run. The next call starts it |
| `starting` | The process started and is not ready |
| `running` | The process runs. It stops after 60 seconds without a call |
| `failed` | The process failed. After a pause, the next call starts it again. `REASON` has the failure |
| `disabled` | The daemon does not start the extension. `REASON` says why: the user disabled it, or it failed 5 times in sequence |
| `unknown` | The daemon is newer than the CLI and sent a state that the CLI does not know |

### `nomux ext install`

Installs an extension from a directory on the Host, with the permissions that the options approve.

```text
Usage: nomux ext install [OPTIONS] <DIRECTORY>

Arguments:
  <DIRECTORY>  The directory of the package, which has the file extension.toml

Options:
      --grant <PERMISSION>  Approve one permission that the extension asks for: fs=<directory>, process=<program>, network or scope=<scope>
      --json                Print the result as one JSON document
      --grant-all           Approve each permission that the extension asks for, but not a directory that starts with ${worktree}
  -q, --quiet               Print only the necessary part of the result
      --host <NAME>         Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help                Print help
```

| Command line | Result |
|---|---|
| No `--grant` and no `--grant-all`, and the manifest asks for a permission | The command prints the permissions, installs nothing and has the exit code 4 |
| `--grant <permission>`, one time or more | The extension gets these permissions and not the others |
| `--grant-all` | The extension gets each permission that it asks for, but not a directory that starts with `${worktree}`: give one with `--grant fs=<directory>` |
| The manifest asks for no permission | The command installs the extension |

| Form | Permission of the manifest |
|---|---|
| `fs=<directory>` | An item of `fs`. For an item that starts with `${worktree}`, an absolute path that ends with the rest of the item |
| `process=<program>` | An item of `process` |
| `network` | `network = true` |
| `scope=<scope>` | An item of `scopes`, for example `scope=sessions:read` |

```console
$ nomux ext install ./nomux-git --grant-all --grant fs=/tmp/nomux-demo/project
extension nomux.git 0.1.0 installed with the permissions: fs=/tmp/nomux-demo/project process=git
```

The exit code is 1 for a `--grant` that the manifest does not ask for, a manifest that is not valid and an extension that is already installed. Nothing is installed then.
With `--host`, `<DIRECTORY>` is an absolute path on the remote Host. The command starts no process of the extension.

### `nomux ext rm`

Stops an extension and removes its package, its state and its data.

```text
Usage: nomux ext rm [OPTIONS] <ID>

Arguments:
  <ID>  The identifier of the extension

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ext rm nomux.echo
extension nomux.echo removed
$ nomux ext rm nomux.echo
nomux: no extension has the identifier nomux.echo
```

### `nomux ext enable` and `nomux ext disable`

`enable` enables an extension, also after the daemon disabled it because of failures. `disable` disables an extension and stops its process.

```text
Usage: nomux ext enable [OPTIONS] <ID>

Arguments:
  <ID>  The identifier of the extension
```

```text
Usage: nomux ext disable [OPTIONS] <ID>

Arguments:
  <ID>  The identifier of the extension
```

The options are the same as for `ext rm`.

```console
$ nomux ext disable nomux.echo
extension nomux.echo disabled
$ nomux ext enable nomux.echo
extension nomux.echo enabled
$ nomux ext enable nomux.none
nomux: no extension has the identifier nomux.none
```

`enable`, `disable` and `rm` have the exit code 2 if no extension has the identifier.

### `nomux ext call`

Calls a method of an extension and writes the payload of its result to the standard output, with no other byte. If the process of the extension does not run, the daemon starts it.

```text
Usage: nomux ext call [OPTIONS] <ID> <METHOD>

Arguments:
  <ID>      The identifier of the extension
  <METHOD>  The name of the method

Options:
      --json                  Print the result as one JSON document
      --payload <TEXT|@FILE>  The payload of the call, in the encoding of the method: a text, or @<file> for the content of a file [default: an empty payload]
  -q, --quiet                 Print only the necessary part of the result
      --host <NAME>           Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help                  Print help
```

```console
$ nomux ext call nomux.echo echo --payload @request.bin > response.bin
$ nomux ext call nomux.echo nothing
nomux: the extension answered with an error: the extension has no method `nothing`
```

| Result | Exit code |
|---|---|
| The method gave a result | 0 |
| No extension has the identifier, or the extension answered that it does not have the method or the item | 2 |
| The extension did not answer in 30 seconds, or it answered with its timeout error | 3 |
| The extension answered that it does not have the permission | 4 |
| The extension is disabled, its process cannot start or failed, or it answered with a different error | 1 |

A text that starts with `@` must be in a file.

### `nomux ext validate`

Checks the `extension.toml` of a directory on this computer. The command needs no daemon and ignores `--host`.

```text
Usage: nomux ext validate [OPTIONS] <DIRECTORY>

Arguments:
  <DIRECTORY>  The directory of the package, which has the file extension.toml

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ext validate ./nomux-git
extension.toml is valid: nomux.git 0.1.0 (Git) asks for the permissions: fs=${worktree} process=git
$ nomux ext validate ./nothing
nomux: the file ./nothing/extension.toml does not exist
```

The exit code is 0 for a valid manifest, 1 for a manifest that is not valid and 2 for a directory without the file. The command does not check the other files of the package.

## Other commands

### `nomux version`

Prints the version. `nomux --version` and `nomux -V` do the same.

```text
Usage: nomux version [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux version
nomux 0.3.0
$ nomux version --quiet
0.3.0
```

## Quiet output

With `--quiet`, a command prints only what a script needs.

| Command | Standard output |
|---|---|
| `new` | The session identifier |
| `ls` | One session identifier on each line |
| `capture` | The output lines, as without `--quiet` |
| `host ls` | One Host name on each line |
| `ext ls` | One extension identifier on each line |
| `ext call` | The payload of the result, as without `--quiet` |
| `version` | The version number |
| Each other command | Nothing. The exit code is the result |

```console
$ nomux ls --quiet
hqarpjgu
sl2ugpe7
z3yjk54g
```

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
| 1 | `error` | An error that has no other code, also a wrong command line, an SSH connection that cannot be made, a host key that is not trusted, a check of `host doctor` that failed, a dormant Session that cannot start, a manifest that is not valid, and an extension that failed |
| 2 | `not_found` | The item does not exist: no Session has the identifier, the command of the Session ended, no Host has the name, no extension has the identifier, or no daemon runs (`daemon status`) |
| 3 | `timeout` | An operation did not complete in the permitted time: the daemon did not answer after its start, a Session was not ready, a command did not end, or an extension did not answer |
| 4 | `no_permission` | The user does not have permission, for example for the socket of the daemon, or a remote Host accepted no key. Also `ext install` without an approval of the permissions, and an extension that does not have a permission |
| 5 | `version_mismatch` | The CLI and the daemon have no common protocol version. Update the older of the two |

`attach` and `new --attach` have one more source of the exit code: if the Session ends during the attach, the exit code is the exit status of its command. Refer to [how an attach ends](#how-an-attach-ends).

## JSON output

With `--json`, a command prints one JSON document on one line.

- On success, the document goes to the standard output.
- On an error, the standard output stays empty and the document goes to the standard error. It has the field `error`.
- Each document has the field `schema_version`. The current value is `1`.

**Schema version rule.** The value increases when a field is removed, gets a different name or gets a different meaning.
A new field does not increase the value. Thus a reader must ignore the fields that it does not know.

### `new` and `start`

```json
{"schema_version":1,"session":{"id":"hqarpjgu","state":"running","pid":2616798,"command":["sleep","300"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655156,"epoch":1,"restore_policy":"on-focus"}}
```

| Field | Type | Meaning |
|---|---|---|
| `session.id` | string | The session identifier |
| `session.state` | string | `running`, `unreachable`, `dormant`, `ended`, `damaged` or `unknown` |
| `session.pid` | number or `null` | The process ID of the command. `null` if the Session has no process or the daemon does not know it |
| `session.command` | array of strings | The program of the command and its arguments. Empty if the daemon does not know them |
| `session.cwd` | string or `null` | The working directory of the command |
| `session.rows`, `session.columns` | number or `null` | The window size of the Session |
| `session.started_at` | number or `null` | When the command started in the current epoch: seconds after the Unix epoch |
| `session.epoch` | number or `null` | The epoch of the Session: 1 for a new Session, and 1 more after each restore |
| `session.restore_policy` | string or `null` | `auto`, `on-focus` or `manual`. `null` for a policy that the CLI does not know |
| `session.exit` | object | Only if `state` is `ended`: `ended_at` (seconds after the Unix epoch), and `exit_code` or `signal` |
| `session.damage` | string | Only if the description of the Session is damaged: the reason, in English for a person. The text is not stable |

The document never has the environment of the command.

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"47eqwqyr","state":"dormant","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795655221,"epoch":1,"restore_policy":"on-focus"},{"id":"zapitg2m","state":"running","pid":2618368,"command":["sh","-c","echo server started; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655226,"epoch":2,"restore_policy":"auto"}]}
```

`sessions` is an array of the object that `new` gives, in the sequence of the identifiers. It is empty if there is no Session. An ended Session is in the array only with `--all`:

```json
{"schema_version":1,"sessions":[{"id":"z3yjk54g","state":"ended","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655146,"epoch":1,"restore_policy":"on-focus","exit":{"ended_at":1795655216,"exit_code":3}}]}
```

The two examples are parts of longer documents of the same run.

### `capture`

```json
{"schema_version":1,"capture":{"id":"ebxd36mw","output":"198\r\n199\r\n200\r\n"}}
```

| Field | Type | Meaning |
|---|---|---|
| `capture.id` | string | The session identifier |
| `capture.output` | string | The output lines, with their escape sequences. A byte sequence that is not UTF-8 has U+FFFD in its place. The text output has the bytes without a change |

### `restore-policy`

```json
{"schema_version":1,"restore_policy":{"id":"ds3kchg4","policy":"manual"}}
```

### `attach` and `new --attach`

```json
{"schema_version":1,"attach":{"id":"z3yjk54g","end":"detached"}}
{"schema_version":1,"attach":{"id":"5k3dkgvd","end":"exited","exit_code":0}}
{"schema_version":1,"attach":{"id":"sshjdp4m","end":"signaled","signal":9}}
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
{"schema_version":1,"detached":{"id":"z3yjk54g","clients":0}}
```

| Field | Type | Meaning |
|---|---|---|
| `detached.id` | string | The session identifier |
| `detached.clients` | number | The number of clients that were attached to the Session |

### `kill`

```json
{"schema_version":1,"killed":"hqarpjgu"}
```

`killed` is the identifier of the Session that ended.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.3.0","pid":2616705,"sessions":1}}
{"schema_version":1,"daemon":{"running":false}}
```

| Field | Type | Meaning |
|---|---|---|
| `daemon.running` | boolean | `true` if a daemon runs. If it is `false`, the document has no other field of `daemon` and the exit code is 2 |
| `daemon.version` | string | The product version of the daemon |
| `daemon.pid` | number | The process ID of the daemon |
| `daemon.sessions` | number | The number of Sessions. An ended Session is not counted |

### `daemon stop`

```json
{"schema_version":1,"stopped":true}
{"schema_version":1,"stopped":false}
```

`stopped` is `true` if a daemon ran and the command stopped it. It is `false` if no daemon ran.

### `daemon install-service` and `daemon uninstall-service`

```json
{"schema_version":1,"service":{"action":"installed","path":"/tmp/nomux-demo/.config/systemd/user/nomuxd.service","content":"[Unit]\nDescription=nomux daemon\nDocumentation=https://nomux.sh\n\n[Service]\nExecStart=\"/tmp/nomux-demo/.local/bin/nomuxd\" --replace\nKillMode=process\nRestart=on-failure\n\n[Install]\nWantedBy=default.target\n"}}
{"schema_version":1,"service":{"action":"would_remove","path":"/tmp/nomux-demo/.config/systemd/user/nomuxd.service"}}
{"schema_version":1,"service":{"action":"not_installed","path":"/tmp/nomux-demo/.config/systemd/user/nomuxd.service"}}
```

| Field | Type | Meaning |
|---|---|---|
| `service.action` | string | `installed`, `would_install` (a dry run), `removed`, `would_remove` (a dry run) or `not_installed`: the file does not exist, thus nothing was removed |
| `service.path` | string | The path of the service file |
| `service.content` | string | The content of the file. Only for `installed` and `would_install` |

### `host add`

This document comes from `docs/cli.md`. The command was not run for this page.

```json
{"schema_version":1,"host":{"name":"vps","ssh":"deploy@vps.example.com","system":"Linux","machine":"x86_64","target":"x86_64-unknown-linux-musl","directory":"~/.nomux/bin/0.1.0","installed":true,"daemon":{"running":true,"version":"0.1.0","pid":2210,"sessions":0}}}
```

| Field | Type | Meaning |
|---|---|---|
| `host.name` | string | The name of the Host for `--host` |
| `host.ssh` | string | The SSH destination |
| `host.system`, `host.machine` | string | The system and the processor of the Host, as `uname -s` and `uname -m` give them |
| `host.target` | string | The release target of the binaries of the Host |
| `host.directory` | string | The directory of the binaries on the Host |
| `host.installed` | boolean | `true` if the command installed the binaries. `false` if the Host had them |
| `host.daemon` | object | The daemon of the Host: the object of `daemon status` |

### `host ls`

```json
{"schema_version":1,"hosts":[{"name":"vps","ssh":"deploy@vps.example.com"}]}
```

`hosts` is in the sequence of the names. It is empty if the configuration file has no Host.

### `host rm`

```json
{"schema_version":1,"removed":"vps"}
```

### `host doctor`

This document with a Host comes from `docs/cli.md`. The command was not run with a Host for this page. Without a Host, the document is `{"schema_version":1,"doctor":[]}`.

```json
{"schema_version":1,"doctor":[{"host":"vps","ok":false,"checks":[{"name":"connection","ok":true,"detail":"deploy@vps.example.com port 22, host key ssh-ed25519 SHA256:..."},{"name":"permissions","ok":false,"detail":"~/.nomux/run has the mode drwxr-xr-x: other users can use it. Run `chmod go-rwx ~/.nomux/run` on the host"}]}]}
```

| Field | Type | Meaning |
|---|---|---|
| `doctor` | array | One object for each Host that the command checked |
| `doctor[].host` | string | The name of the Host |
| `doctor[].ok` | boolean | `true` if each check of the Host passed |
| `doctor[].checks[].name` | string | `connection`, `platform`, `binaries`, `permissions`, `daemon` or `versions` |
| `doctor[].checks[].ok` | boolean | `true` if the Host passed the check |
| `doctor[].checks[].detail` | string | A text in English for a person: what the check found, or the reason and what to do. The text is not stable |

The document goes to the standard output also when a check failed. The exit code is 1 then.

### `ext ls`

```json
{"schema_version":1,"extensions":[{"id":"nomux.echo","name":"Echo","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":[],"process":[],"network":false,"scopes":[]}},{"id":"nomux.git","name":"Git","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":["/tmp/nomux-demo/project"],"process":["git"],"network":false,"scopes":[]}}]}
```

`extensions` is in the sequence of the identifiers. It is empty if no extension is installed.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | The identifier of the extension |
| `name` | string | The name of the extension for a person |
| `version` | string | The version of the extension |
| `state` | string | `stopped`, `starting`, `running`, `failed`, `disabled` or `unknown` |
| `reason` | string or `null` | For `disabled`: why the extension is disabled. For `failed`: the failure. `null` in the other states. The text is not stable |
| `permissions.fs` | array of strings | The directories that the user approved |
| `permissions.process` | array of strings | The programs that the user approved |
| `permissions.network` | boolean | `true` if the user approved network connections |
| `permissions.scopes` | array of strings | The scopes of host services that the user approved |

### `ext install`, `ext enable` and `ext disable`

```json
{"schema_version":1,"extension":{"id":"nomux.echo","name":"Echo","version":"0.1.0","state":"disabled","reason":"the user disabled the extension","permissions":{"fs":[],"process":[],"network":false,"scopes":[]}}}
```

`extension` is the object of `ext ls`, after the command. An `ext install` without an approval is an error: the standard error has the error document, with the permissions in its message.

### `ext rm`

```json
{"schema_version":1,"removed_extension":"nomux.git"}
```

### `ext call`

```json
{"schema_version":1,"call":{"extension":"nomux.echo","method":"echo","payload_base64":"CgJoaQ=="}}
```

| Field | Type | Meaning |
|---|---|---|
| `call.extension` | string | The identifier of the extension |
| `call.method` | string | The name of the method |
| `call.payload_base64` | string | The payload of the result in Base64 (RFC 4648, with padding) |

If the extension answered with an error, the standard error has the error document.

### `ext validate`

```json
{"schema_version":1,"manifest":{"valid":true,"id":"nomux.git","name":"Git","version":"0.1.0","permissions":{"fs":["${worktree}"],"process":["git"],"network":false,"scopes":[]}}}
{"schema_version":1,"manifest":{"valid":false,"problems":[{"path":"extension.id","problem":"must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`"}]}}
```

| Field | Type | Meaning |
|---|---|---|
| `manifest.valid` | boolean | `true` if the manifest is valid. If it is `false`, the exit code is 1 |
| `manifest.id`, `manifest.name`, `manifest.version` | string | The identity in the manifest. Only if `valid` is `true` |
| `manifest.permissions` | object | The permissions that the manifest asks for, with the fields of `permissions` of `ext ls`. Only if `valid` is `true` |
| `manifest.problems[].path` | string or `null` | The path of a field that is not valid. `null` if the file is not TOML |
| `manifest.problems[].problem` | string | The rule that the field does not obey, in English for a person. The text is not stable |

The document goes to the standard output also when the manifest is not valid.

### `version`

```json
{"schema_version":1,"version":"0.3.0"}
```

### Error

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier aaaaaaaa"}}
{"schema_version":1,"error":{"code":4,"kind":"no_permission","message":"the extension nomux.git 0.1.0 asks for these permissions:\n  fs=${worktree}\n  process=git\nNothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>"}}
```

| Field | Type | Meaning |
|---|---|---|
| `error.code` | number | The exit code of the command |
| `error.kind` | string | The name of the exit code from the table in [exit codes](#exit-codes) |
| `error.message` | string | A message in English for a person. The text is not stable |

A wrong command line is not a JSON document. The argument parser writes its usage message as text.

## The other two binaries

You do not usually run `nomuxd` and `nomux-holder` yourself. The CLI starts the daemon, and the daemon starts a holder for each Session.
The two binaries have no `--help` option. An option that they do not know, also `--help`, prints the usage text to the standard error and has the exit code 2. This is the text of `nomuxd`, after its first line `nomuxd: unknown option --help`:

```text
Usage: nomuxd [--detach] [--replace]
       nomuxd --version

Without an option, nomuxd runs in the foreground and writes its log to the
standard error.

Options:
  --detach   Start the daemon as a separate process and end. The log of that
             daemon goes to nomuxd.log in the runtime directory (~/.nomux/run).
  --replace  If a daemon already runs, stop it and take its place. No session
             ends.

Environment:
  NOMUX_LOG  The log level: error, warn (default), info, debug or trace
  NOMUX_EXTENSION_IDLE_SECONDS
             The time without a call after which the daemon stops the process
             of an extension (default: 60)
```

`nomux-holder` prints its usage text in the same way. Its options are for the daemon.

## Version of this page

This page describes nomux 0.3.0: the tag [`v0.3.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.3.0) of `nomux-sh/nomux`, commit [`03ad9a8`](https://github.com/nomux-sh/nomux/commit/03ad9a82ea79e1cf5d37d78e30945cb1f8c22f23).
The help texts and the examples are the real output of the binaries of that release on Linux x86_64, in a temporary home directory `/tmp/nomux-demo`. The session identifiers and the process IDs come from more than one run.
These parts were not run for this page and come from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/cli.md) of the same tag: each command that connects to a remote Host (`host add`, `host doctor` with a Host, a command with `--host` for a Host that exists), the exit codes 3, 4 for SSH and 5, the states `unreachable`, `damaged` and `unknown`, the values `lost` and `unknown` of `attach.end`, the end of an attach by a signal for the CLI, and the change of the window size during an attach.
