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
- A command that needs the daemon starts it if no daemon answers, and waits for 5 seconds at most. The `daemon` commands, `ext validate`, `hook`, `status set` and `hooks uninstall` start no daemon.
- `status set` and `hook` work only inside a Session. They read `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN` from their environment. [The environment of a Session](/docs/guides/session-environment/) describes the three variables. If the home directory is long, `NOMUX_SOCK` is a path in a short link, and [long home directories](/docs/guides/long-home-paths/) explains why.
- The text output has colour only for the state of a Session or of its status, only when the standard output is a terminal and only when the `NO_COLOR` variable is not set.
- On a terminal, a table of the text output fits the width of the terminal. The command column is shortened first, then the column of the note, the message or the reason. An ellipsis (`…`) marks the cut, and a shortened column keeps the width of its header. Thus the state and the message stay visible. When the standard output is not a terminal, and in the JSON output, nothing is shortened.

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
  status          Show the status of each session: what works, what is done, what needs you
  agent           Explain the status of the sessions
  events          Print the events of the host when they come, until a signal stops the command
  daemon          Show or stop the daemon, and start it at login
  host            Add, list, remove and check the remote hosts
  ext             Install, list, remove and call the extensions of a host
  hook            Send one event of an agent tool to the daemon of the session. A tool calls this command from its hooks: it reads the data of the event from the standard input
  hooks           Install, remove and show the hooks of an agent tool in its settings file
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
- `--host` cannot be used with a `host` command, with `daemon install-service` and `daemon uninstall-service`, with `status set` and with a `hooks` command. These commands have the exit code 1 with `--host`. `version` prints the version of the CLI. `hook` ignores `--host`.
- An SSH error has the exit code 1. If the Host accepts no key, the exit code is 4.

A name that the configuration file does not have gives the exit code 2:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
$ nomux --host vps hooks status
nomux: the --host option cannot be used with a `hooks` command: the settings file of a tool is on its own computer, thus run the command there
$ nomux --host vps status set working
nomux: the --host option cannot be used with `status set`: the session is on the host of this process
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
| `--cmd <COMMAND>...` | The same | A second form of `--`. The two forms cannot be used together. |

**Each argument after `--` or `--cmd` belongs to the command of the Session, also an argument that is an option of `nomux`.** Thus the options of `nomux` come before the command:

```sh
nomux new --json -- sleep 300      # --json is an option of nomux
nomux new -- sleep 300 --json      # --json is an argument of sleep
```

```console
$ nomux new --cwd project -- sleep 600
gurnvh37
```

**The two forms cannot be used together.** A command line that has `--cmd` and then `--` is a usage error with the exit code 1, and no Session starts: `nomux` cannot know if the `--` is an argument of the command or the start of the second form.

```console
$ nomux new --cmd sh -- -c true
error: the argument '--cmd <COMMAND>...' cannot be used with '--': nomux cannot know where the command of the session starts. Give the command in one form: `nomux new --cmd <command> [argument...]` or `nomux new -- <command> [argument...]`. For a command that has `--` as an argument, use the second form

Usage: nomux new [OPTIONS] [-- <COMMAND>...]

For more information, try '--help'.
```

Thus a command that has `--` as one of its arguments needs the second form. After the first `--`, each `--` belongs to the command:

```sh
nomux new -- git log -- notes.txt        # the second -- is an argument of git
```

The command gets the environment of the daemon, with the changes that [the environment of a Session](/docs/guides/session-environment/) describes: `TERM=xterm-256color`, `COLORTERM=truecolor`, a UTF-8 character set if the daemon has no locale, and the variables `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`. Its terminal has 24 rows and 80 columns until a client attaches: an attach gives the Session the window size of the terminal of the client.

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
      --memory       Show the memory that the processes of each session use now
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ls
ID        STATE    PID     COMMAND
gurnvh37  running  959485  sleep 600
ijzhc3lz  running  959490  sh
$ nomux ls --all
ID        STATE    PID     COMMAND    NOTE
gurnvh37  running  959485  sleep 600
ijzhc3lz  ended    -       sh         exit status 3
vn3n3l6r  running  959494  sleep 300
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

On a terminal, the table fits the width of the terminal. The command column is shortened first, and an ellipsis (`…`) marks the cut. This is the output of `nomux ls` and of `nomux ls --all` on a terminal of 50 columns:

```text
ID        STATE    PID     COMMAND
4irabyqw  running  951676  sh
a7l2lbgk  running  951365  sh -c sleep 600 & sl…
kitzeuit  running  948557  sleep 600
r67mfnfw  running  951666  sh -c echo server st…
xrysxwhn  running  948560  sh -c seq 1 200; exe…
```

```text
ID        STATE    PID     COMMAND   NOTE
4irabyqw  running  951676  sh
6sxcisjq  ended    -       sleep 6…  signal 1
a7l2lbgk  running  951365  sh -c s…
fiktbeos  ended    -       sh        exit status 3
iizairlj  ended    -       sh        signal 9
kitzeuit  running  948557  sleep 6…
r67mfnfw  running  951666  sh -c e…
xrysxwhn  running  948560  sh -c s…
```

A column that is shortened keeps the width of its header, thus `COMMAND` has 7 columns in the second table. A table that is not on a terminal, for example in a pipe, is never shortened.

#### `nomux ls --memory`

With `--memory`, the command also shows the memory that the processes of each Session use at the time of the command. The daemon measures the memory for this command only: without `--memory`, `ls` measures nothing.

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
3ohij454  dormant  -          -          -          -        sh
bxebg7jh  running  147.0 KiB  1          274.0 KiB  pss      sh -c seq 1 200; exec sleep 600
gurnvh37  running  148.0 KiB  1          262.0 KiB  pss      sleep 600
v6srainn  running  150.0 KiB  1          273.0 KiB  pss      sh -c echo server started; exec sleep 600
vn3n3l6r  running  150.0 KiB  1          265.0 KiB  pss      sleep 300
total: 595.0 KiB in 4 processes of 4 sessions, and 1.0 MiB in the holders (pss)
```

| Column | Meaning |
|---|---|
| `MEMORY` | The memory of the process tree of the command: the command and each process that descends from it. |
| `PROCESSES` | The number of processes in that tree. |
| `HOLDER` | The memory of the holder of the Session. It is not a part of `MEMORY`. |
| `MEASURE` | `pss`: the proportional set size, which counts a page that more than one process uses one time. `rss`: the resident set size, which counts such a page for each process. Linux gives `pss`, macOS gives `rss`. |

- A Session without a process has `-` in the four columns and is not in the total line.
- The table has no `PID` column and no `NOTE` column. `ls` without `--memory` has them.
- A size has the unit `KiB`, `MiB` or `GiB` (1024 bytes, 1024 KiB, 1024 MiB) and one decimal place. The JSON output has the bytes.
- If the Sessions do not have the same measure, the total line says `pss and rss`: the sum then has values of the two kinds.
- `--memory` works with `--all`.
- A daemon that is older than this option answers with an error, and the exit code is 1.
- With `--host`, the daemon of the remote Host measures the processes of that Host.

[Session memory](/docs/guides/session-memory/) says how the daemon measures, what the values do not count, and how long the command takes.

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
detached from session 3ohij454
```

```console
sh-5.3$ exit 3
exit

session 6u5wjcn4 ended with exit status 3
```

```console
sh-5.3$ kill -9 $$

session 5hi3yzhd ended by signal 9
```

The exit code of the last two is 3 and 137.

```console
nomux: the daemon stopped. The session continues: run `nomux attach l7blp5b2` to attach again
```

If no Session has the identifier, or the Session ended:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier aaaaaaaa
$ nomux attach ijzhc3lz
nomux: session ijzhc3lz ended: its command does not run
```

An `attach` without a terminal fails before it looks for the Session: the exit code is 1 and the message is `nomux: attach needs a terminal: the standard input is not a terminal`.

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
$ nomux start 3ohij454
session 3ohij454 runs
```

- For a Session whose command runs, the command succeeds and changes nothing.
- For an ended Session, the exit code is 2: `nomux: session ijzhc3lz ended: its command does not run`.
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
bxebg7jh
$ nomux capture bxebg7jh --lines 3
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
$ nomux restore-policy v6srainn auto
session v6srainn has the restore policy auto
$ nomux restore-policy 3ohij454 sometimes
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
$ nomux detach 7uk6xzoz
detached 1 client from session 7uk6xzoz
$ nomux detach 7uk6xzoz
detached 0 clients from session 7uk6xzoz
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
$ nomux kill vn3n3l6r
session vn3n3l6r ended
```

If no Session has the identifier, or if its command ended already, the exit code is 2. Thus the second `kill` of the same Session has the exit code 2:

```console
$ nomux kill vn3n3l6r
nomux: session vn3n3l6r ended: its command does not run
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
nomuxd 0.4.0 runs: process ID 942506, 6 sessions
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
$ nomux daemon uninstall-service --dry-run
would remove /tmp/nomux-demo/.config/systemd/user/nomuxd.service
$ nomux daemon uninstall-service
removed /tmp/nomux-demo/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
$ nomux daemon uninstall-service
no service file: /tmp/nomux-demo/.config/systemd/user/nomuxd.service does not exist
```

The exit code is 0 also when the file does not exist. The daemon that runs continues.

## Host commands

These commands manage the remote Hosts of the configuration file on your computer. [Remote hosts](/docs/guides/remote-hosts/) describes the connection, the trust rules and what nomux writes on a Host.
The commands that connect to a Host (`host add`, and `host doctor` with a Host) were not run for this page. Their description comes from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/cli.md) of nomux 0.4.0, which describes these commands as the 0.3.0 document did.

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

## Status commands

These commands show what the work in each Session does, waits for or completed. [Agent status](/docs/guides/agent-status/) describes the model, the sources of a status and the rules that merge them. The glossary has the terms: [agent status](/docs/reference/glossary/#agent-status).

The examples of this section come from five Sessions of one daemon:

| Command of the Session | Where its status comes from |
|---|---|
| `sh build.sh` | A script that runs `nomux status set working "build the docs"`: a self-report. |
| `sh ask.sh` | A script that writes an OSC 7501 report with the state `blocked`: the program status. |
| `sh replay.sh permission-request 4` | A script that sends 4 recorded hook events of Claude Code with `nomux hook claude <event>`: the adapter. |
| `sh replay.sh background-subagent 6` | The same, with 6 recorded events of a run that starts a subagent: the adapter, with Child work. |
| `sh` | A shell that reports nothing. |

The adapter of Claude Code was not released with nomux 0.4.0. The examples use a build of it, installed with `nomux ext install ./claude-adapter --grant-all`. Each script waits one second before its first report.

### `nomux status`

Shows the status of each Session: what works, what is done and what needs you.

```text
Usage: nomux status [OPTIONS]
       nomux status <COMMAND>

Commands:
  set  Report the status of the session of this process. The command works only inside a nomux session

Options:
      --json         Print the result as one JSON document
      --tree         Also show the Child work of each session
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Option | Function |
|---|---|
| `--tree` | Shows each Child work as a row below its Session, indented by two spaces for each level. A Child work that no source reports has `-` as its state. |

```console
$ nomux status
  SESSION   COMMAND                             STATE                  FOR  MESSAGE
* 3i7kj4zx  sh replay.sh background-subagent 6  working                2s
* 43ks3umx  sh build.sh                         working                3s   build the docs
! ab56frrn  sh ask.sh                           needs you: question    3s   which branch?
  hsleq2qd  sh                                  idle                   4s
! n4taafjh  sh replay.sh permission-request 4   needs you: permission  2s   touch b.txt
$ nomux status --tree
  SESSION              COMMAND                             STATE                  FOR  MESSAGE
* 3i7kj4zx             sh replay.sh background-subagent 6  working                2s
*   a45f24c823c444cb5                                      working                2s
* 43ks3umx             sh build.sh                         working                3s   build the docs
! ab56frrn             sh ask.sh                           needs you: question    3s   which branch?
  hsleq2qd             sh                                  idle                   4s
! n4taafjh             sh replay.sh permission-request 4   needs you: permission  2s   touch b.txt
$ nomux status --quiet
ab56frrn
n4taafjh
```

Each row has the mark of the state, the session identifier, the command, the state, the time in the state (`FOR`) and the message.

- The rows are in the sequence of the session identifiers. The command prints one row for each Session that is not ended, and for each ended Session that keeps its last Agent run (see below). If there is no Session, it prints `no sessions`.
- The state of a row is the most urgent status of the Session and of its Child work. `needs you` has the kind of the wait if a source says it: `needs you: permission`, `needs you: question` or `needs you: auth`.
- The mark: `!` needs you, `x` error, `+` done, `*` working, and no mark for idle.
- A status that the daemon guessed has `(guess)`: for example `working (guess)` for a shell that runs `sleep 600` in the foreground. A guess comes from the prompt marks of the shell or from the foreground program of the terminal, never from a report of a program.
- A result that you saw has `(seen)`, for example `done (seen)`. An attach to a Session marks its results as seen.
- With `--quiet`, the command prints the identifier of each Session that needs you, one on each line. The exit code is 0 in each case.
- With `--json`, the document has the same Sessions. [`status` in the JSON section](#status) has its fields.

An ended Session keeps its last Agent run: the kept run. `nomux kill` of the Session `n4taafjh` of the example above changes its row. The work that waited is `done` now, and the row stays until the daemon removes the Session:

```console
$ nomux kill n4taafjh
session n4taafjh ended
$ nomux status
  SESSION   COMMAND                             STATE                FOR  MESSAGE
* 3i7kj4zx  sh replay.sh background-subagent 6  working              8s
* 43ks3umx  sh build.sh                         working              8s   build the docs
! ab56frrn  sh ask.sh                           needs you: question  8s   which branch?
  hsleq2qd  sh                                  idle                 9s
+ n4taafjh  sh replay.sh permission-request 4   done                 0s
```

### `nomux status set`

Reports the status of the Session that the command runs in. A script or a tool that does not write OSC 7501 uses it: the status is a self-report.

```text
Usage: nomux status set [OPTIONS] <STATE> [MESSAGE]

Arguments:
  <STATE>    The state of the work in the session. idle takes the report back [possible values: working, done, blocked, error, idle]
  [MESSAGE]  What the work does, waits for or completed: one line

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| State | Status |
|---|---|
| `working` | `working` |
| `done` | `done` |
| `blocked` | `needs you` |
| `error` | `error` |
| `idle` | The command takes its report back. |

```console
$ nomux status set working "tests run"
session ab5azvpo: working
$ nomux status set blocked "run the tests?"
session ab5azvpo: needs you
$ nomux status set error "2 tests failed"
session ab5azvpo: error
$ nomux status set idle
session ab5azvpo: the report is taken back
```

- The command reads `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`, which the holder gives to each process of a Session. It connects to the socket of `NOMUX_SOCK`. It starts no daemon, and it does not accept `--host`.
- A report stays until the next one.
- The message is one line of 512 bytes at most, without a control character. A message that is too long, or that has a line feed, gives the exit code 1:

```console
$ nomux status set done "$(printf 'a\nb')"
nomux: the message must be one line of text without a control character
$ nomux status set done "$(head -c 600 /dev/zero | tr '\0' a)"
nomux: the message has 600 bytes: 512 at most
```

- The exit code 4 means that the command cannot prove its Session: a variable is not set (the command does not run in a Session), the token is wrong, the Session has no process, or its holder is too old to make a token.

```console
$ nomux status set working
nomux: NOMUX_SESSION_ID is not set: `nomux status set` works only inside a nomux session
$ NOMUX_TOKEN=0000 nomux status set done
nomux: the status of session ab5azvpo did not change: the token of the request is not the token of the session
```

With `--quiet`, the command prints nothing.

### `nomux agent explain`

Shows what each source says about the status of a Session. Use it when a status is not what you expect.

```text
Usage: nomux agent explain [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The first line is the status of the Session with its source. The list below it has each source in the sequence in which they decide, with what it says and why: the note of the source. A source that reports nothing is in the list too.

```console
$ nomux agent explain 43ks3umx
session 43ks3umx: working for 3s, from self-report; message from self-report: build the docs

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         working: build the docs (a program of the session reported it with `nomux status set`)
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal
```

If the Session has Child work, the output lists it. If an adapter gave details, the output ends with them: the session identifier of the tool and its resume command.

```console
$ nomux agent explain 3i7kj4zx
session 3i7kj4zx: working for 2s, from adapter

sources, in the sequence in which they decide:
  adapter             working (an adapter extension reported it from the events of the agent tool)
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

child work:
  a45f24c823c444cb5: working for 2s, from adapter

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000003
  resume: claude --resume 00000000-0000-4000-8000-000000000003
```

For an ended Session, the command prints its kept run with the resume command of the tool, until the daemon removes the Session. The state comes from the source `session restore`:

```console
$ nomux agent explain n4taafjh
session n4taafjh: done for 0s, from session restore

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

If no Session has the identifier, or if an ended Session has no kept run, the exit code is 2:

```console
$ nomux agent explain aaaaaaaa
nomux: no session that is not ended has the identifier aaaaaaaa
```

With `--quiet`, the command prints nothing. With `--json`, the document is [`agent explain`](#agent-explain).

### `nomux events`

Prints the events of the Host when they come, until a signal stops the command. The only mode of this version is `--follow`.

```text
Usage: nomux events [OPTIONS] --follow

Options:
      --follow
          Wait for the events. This is the only mode now

      --json
          Print the result as one JSON document

      --filter <TYPE>
          Print only the events of this type. Give the option more than one time for more types

          Possible values:
          - agent-run-changed: The status of a session or of its Child work changed
          - agent-run-removed: A session ended or was removed
          - extension-event:   The daemon part of an extension sent an event

  -q, --quiet
          Print only the necessary part of the result

      --host <NAME>
          Use the daemon of a remote host of `nomux host ls` [default: the local host]

  -h, --help
          Print help (see a summary with '-h')
```

`nomux events` without `--follow` has the exit code 1 and prints the usage message of the argument parser.

| Option | Function |
|---|---|
| `--follow` | Subscribes to the events and prints each one when it comes. |
| `--filter <type>` | Prints only the events of one type: `agent-run-changed`, `agent-run-removed` or `extension-event`. Give the option more than one time for more types. A snapshot is always printed. |

This is the text output while a Session runs `sh report.sh`, a script that reports `working`, `blocked` and `done` with `nomux status set`, and while `nomux kill` ends a Session that has no status:

```console
$ nomux events --follow
12 52bhqxil working build the docs
13 52bhqxil needs you deploy to production?
14 52bhqxil done docs built
15 52bhqxil done docs built
16 rado2qro removed
```

- The command prints the events after its start. A snapshot comes when the daemon does not have the events that the command needs.
- A line is `<seq> <session> <state> <message>` for a change, `<seq> <session> removed` for a Session that ended or was removed, `<seq> extension <id>: <name> (<n> bytes)` for an event of an extension, and `<seq> snapshot: ...` for a snapshot. The text has no source: line 15 comes when the command of the Session ended and the source changed from `self-report` to `session restore`. The JSON document of the event has the source.
- `<seq>` is the position of the event in the event log of the daemon. It starts again when the daemon starts again.
- With `--quiet`, the output is the same lines.
- The exit code is 0 when `SIGINT` (Ctrl-C) or `SIGTERM` stops the command, when the daemon closes the connection (for example after `nomux daemon stop`), and when the reader of the standard output closes it.

With `--json`, each line is one JSON document (NDJSON). With a filter, the command prints only the events of the types that the filter names. This is `nomux events --follow --json --filter agent-run-removed` during the same kill:

```console
$ nomux events --follow --json --filter agent-run-removed
{"schema_version":1,"event":{"seq":16,"at_ms":1795691221747,"type":"agent_run_removed","session":"rado2qro"}}
```

The commands of this section that were not run for this page: the line of an `extension-event` and of a `snapshot`. The adapter of Claude Code sends no event of an extension, and the daemon sends a snapshot only to a client that is too far behind.

## Hook commands

An agent tool, for example Claude Code, runs a command at each event of its work. For nomux this command is `nomux hook <tool> <event>`. An adapter extension of the tool turns the events into a status. [Agent adapters](/docs/guides/agent-adapters/) describes the path of an event, and [Claude Code](/docs/guides/claude-code/) shows the hooks of Claude Code in use.

The examples of this section use the adapter of Claude Code, which was not released with nomux 0.4.0. The package is a build of it. `nomux ext install ./claude-adapter --grant-all` installed it in the home directory of the run, and the settings file is `~/.claude/settings.json` of that home directory. The file had one hook of its own before the first example:

```json
{
  "model": "sonnet",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send",
            "args": ["done"]
          }
        ]
      }
    ]
  }
}
```

### `nomux hook`

Sends one event of an agent tool to the daemon of the Session. A tool calls this command from its hooks: it reads the data of the event from the standard input.

```text
Usage: nomux hook [OPTIONS] <TOOL> <EVENT>

Arguments:
  <TOOL>   The name of the tool, as its adapter extension names it
  <EVENT>  The name of the event

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

`hooks install` writes the call into the settings file of the tool. You do not type this command yourself. This is the call for one event, with a data file that has the data of the event as Claude Code gives it:

```console
$ nomux hook claude PermissionRequest < replay/permission-request/04-PermissionRequest.json
$ echo $?
0
```

The command prints nothing: in this version the answer for the tool is empty.

- The command reads the data of the event from the standard input: 256 KiB at most, until its end or for 40 ms at most. A larger input goes without its data. A terminal is no input.
- It reads `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`, connects to the socket of `NOMUX_SOCK` and sends one request. It starts no daemon, no shell and no other process. `--host` has no effect.
- A hook must not block or break its tool: **the exit code is always 0**. Outside a Session, without a daemon, and when the daemon does not answer in 80 ms after the start of the command, the command ends with no output. The daemon answers the hook before the adapter gets the event.
- If the daemon refuses the event, for example for a wrong token, the command writes one line to the standard error. The exit code stays 0:

```console
$ echo '{}' | NOMUX_TOKEN=wrong nomux hook claude Stop
nomux hook: the hook event of session jyekle7t was refused: the token of the request is not the token of the session
```

- A tool without an adapter gives no output, and no status changes.
- With `--json` and with `--quiet`, the command prints the answer for the tool as without them: nothing.

### `nomux hooks`

The `hooks` commands change and show the hooks of an agent tool in the settings file of the tool on this computer. The adapter extension of the tool describes the entries that its hooks need. `--host` is not permitted: the settings file of a tool is on the computer of the tool.

```text
Usage: nomux hooks [OPTIONS] <COMMAND>

Commands:
  install    Show the change that the hooks of a tool need in its settings file. Write it only with --apply
  uninstall  Show how the removal of the hooks of a tool changes its settings file. Write it only with --apply
  status     Show each tool: its adapter, and if its hooks are installed, missing or different

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

nomux never writes a settings file without `--apply`, never wraps or replaces the command of a tool, and never adds an option that skips the permission checks of a tool.

### `nomux hooks install`

Shows the change that the hooks of a tool need in its settings file, and writes it only with `--apply`.

```text
Usage: nomux hooks install [OPTIONS] <TOOL>

Arguments:
  <TOOL>  The name of the tool, as its adapter extension names it

Options:
      --dry-run      Print the change and write nothing. This is the default
      --json         Print the result as one JSON document
      --apply        Write the change to the settings file of the tool
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The command asks the adapter for its install plan, computes the new content of the settings file and prints it as a unified diff. The diff of the Claude Code adapter has 266 lines: one hook for each event of Claude Code. The first command below shows its first 20 lines with `| head -20`, and the second one shows the last line of the output:

```console
$ nomux hooks install claude | head -20
--- /tmp/nomux-demo/.claude/settings.json
+++ /tmp/nomux-demo/.claude/settings.json
@@ -7,7 +7,262 @@
           {
             "type": "command",
             "command": "notify-send",
-            "args": ["done"]
+            "args": [
+              "done"
+            ]
+          }
+        ]
+      },
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "nomux",
+            "args": [
+              "hook",
$ nomux hooks install claude | tail -1
dry run: nothing is written. Add --apply to write the change
```

The file keeps the hook of the user: the new hook for `Stop` comes after it. The command writes the file as JSON with two-space indentation, thus a value that you wrote on one line can get more lines, as the `"args": ["done"]` line does.

With `--apply`, the command prints the same diff and writes the file. The last line says it:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks install claude --apply
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json: nothing to change
```

- `--dry-run` is the default and says it again. `--dry-run` and `--apply` cannot be used together: the exit code is 1.
- A temporary file in the same directory replaces the settings file, and a symbolic link stays a link. The keys of the file keep their order. A value that the file has already is not added again: the second command above changes nothing and has the exit code 0.
- A file that does not exist is made: the diff then starts with `--- /dev/null`.
- `--apply` also writes a record to `hooks/<tool>/` in the data directory of nomux (`~/.local/share/nomux` on Linux, `~/Library/Application Support/nomux` on macOS): the bytes of the file before the install, the checksum of the written file and the entries.
- Without an adapter for the tool, the exit code is 2: `nomux: no extension is the adapter of the tool claude`. A settings file that is not JSON gives the exit code 1 and `nomux: the settings file /tmp/nomux-demo/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed`. Nothing is written in these cases.

### `nomux hooks uninstall`

Shows how the removal of the hooks of a tool changes its settings file, and writes it only with `--apply`.

```text
Usage: nomux hooks uninstall [OPTIONS] <TOOL>

Arguments:
  <TOOL>  The name of the tool

Options:
      --dry-run      Print the change and write nothing. This is the default
      --json         Print the result as one JSON document
      --apply        Write the change to the settings file of the tool
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The command needs only the record that `hooks install --apply` wrote, not the daemon.

- If the settings file did not change after the install, the file gets its bytes from before the install again. If the file did not exist, it is removed.
- If the file changed, only the entries of nomux go away.

```console
$ nomux hooks uninstall claude | tail -1
dry run: nothing is written. Add --apply to write the change
$ nomux hooks uninstall claude --apply | tail -1
/tmp/nomux-demo/.claude/settings.json has its content from before the install again
$ nomux hooks uninstall claude --apply
nomux: nomux did not install the hooks of claude
```

The exit code of the last command is 2: nomux did not install the hooks of the tool, thus it has no record.

### `nomux hooks status`

Shows each tool that has an adapter or a record: the adapter, the state of its hooks in the settings file, and the path of the file.

```text
Usage: nomux hooks status [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  missing in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /tmp/nomux-demo/.claude/settings.json
```

| State | Meaning |
|---|---|
| `installed` | The settings file has each entry of the install plan. |
| `missing` | The settings file has none of the entries, or does not exist. |
| `different` | The settings file has some of the entries of the install plan, and the install would add the others. |
| `not known` | nomux cannot read the settings file. The text says why, for example for a file that is not JSON. |

If no tool has an adapter or a record, the command prints `no tool has an adapter or installed hooks`. The exit code is 0 in each case. With `--quiet`, the command prints nothing.

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
nomux 0.4.0
$ nomux version --quiet
0.4.0
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
| `status` | One session identifier on each line of a Session that needs you |
| `events --follow` | The lines of the text output |
| `ext call` | The payload of the result, as without `--quiet` |
| `version` | The version number |
| Each other command | Nothing. The exit code is the result |

```console
$ nomux ls --quiet
4irabyqw
6sxcisjq
kitzeuit
r67mfnfw
xrysxwhn
$ nomux ls --all --quiet
4irabyqw
6sxcisjq
fiktbeos
iizairlj
kitzeuit
r67mfnfw
xrysxwhn
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
| 1 | `error` | An error that has no other code, also a wrong command line, an SSH connection that cannot be made, a host key that is not trusted, a check of `host doctor` that failed, a dormant Session that cannot start, a manifest that is not valid, an extension that failed, a message of `status set` that is not valid, and a settings file that `hooks install` cannot change |
| 2 | `not_found` | The item does not exist: no Session has the identifier, the command of the Session ended, an ended Session has no kept run (`agent explain`), no Host has the name, no extension has the identifier, nomux did not install the hooks of a tool (`hooks uninstall`), no extension is the adapter of a tool (`hooks install`), or no daemon runs (`daemon status`) |
| 3 | `timeout` | An operation did not complete in the permitted time: the daemon did not answer after its start, a Session was not ready, a command did not end, or an extension did not answer |
| 4 | `no_permission` | The user does not have permission, for example for the socket of the daemon, or a remote Host accepted no key. Also `ext install` without an approval of the permissions, an extension that does not have a permission, and a `status set` that cannot prove its Session |
| 5 | `version_mismatch` | The CLI and the daemon have no common protocol version. Update the older of the two |

The exit code of `hook` is 0 for each event, also when it cannot send the event: a hook must not break its tool. Only a wrong command line has the exit code 1. `attach` and `new --attach` have one more source of the exit code: if the Session ends during the attach, the exit code is the exit status of its command. Refer to [how an attach ends](#how-an-attach-ends).

## JSON output

With `--json`, a command prints one JSON document on one line.

- On success, the document goes to the standard output.
- On an error, the standard output stays empty and the document goes to the standard error. It has the field `error`.
- Each document has the field `schema_version`. The current value is `1`.

**Schema version rule.** The value increases when a field is removed, gets a different name or gets a different meaning.
A new field does not increase the value. Thus a reader must ignore the fields that it does not know.

### `new` and `start`

```json
{"schema_version":1,"session":{"id":"c7d77b72","state":"running","pid":967789,"command":["sleep","300"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795691400,"epoch":1,"restore_policy":"on-focus"}}
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
{"schema_version":1,"sessions":[{"id":"7foof65g","state":"dormant","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690771,"epoch":1,"restore_policy":"on-focus"},{"id":"atgrw65j","state":"running","pid":869838,"command":["sh","-c","echo server started; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690775,"epoch":2,"restore_policy":"auto"},{"id":"qqdrvzzv","state":"running","pid":861740,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690729,"epoch":1,"restore_policy":"on-focus"}]}
```

`sessions` is an array of the object that `new` gives, in the sequence of the identifiers. It is empty if there is no Session. An ended Session is in the array only with `--all`:

```json
{"schema_version":1,"sessions":[{"id":"fiktbeos","state":"ended","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795691292,"epoch":1,"restore_policy":"on-focus","exit":{"ended_at":1795691295,"exit_code":3}}]}
```

The second example is a part of a longer document.

### `ls --memory`

```json
{"schema_version":1,"sessions":[{"id":"7foof65g","state":"dormant","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690771,"epoch":1,"restore_policy":"on-focus","memory":null},{"id":"atgrw65j","state":"running","pid":869838,"command":["sh","-c","echo server started; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690775,"epoch":2,"restore_policy":"auto","memory":{"command_bytes":152576,"command_processes":1,"holder_bytes":291840,"measure":"pss"}},{"id":"qqdrvzzv","state":"running","pid":861740,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690729,"epoch":1,"restore_policy":"on-focus","memory":{"command_bytes":146432,"command_processes":1,"holder_bytes":270336,"measure":"pss"}}],"memory_total":{"command_bytes":299008,"command_processes":2,"holder_bytes":562176,"sessions":2,"measure":"pss"}}
```

The document is the document of `ls` with one more field in each Session and one more field at the top. Without `--memory`, the document has neither of the two.

| Field | Type | Meaning |
|---|---|---|
| `sessions[].memory` | object or `null` | The memory of the processes of the Session. `null` if the Session has no process |
| `sessions[].memory.command_bytes` | number | The memory of the process tree of the command in bytes, without the holder |
| `sessions[].memory.command_processes` | number | The number of processes in that tree |
| `sessions[].memory.holder_bytes` | number | The memory of the holder of the Session in bytes |
| `sessions[].memory.measure` | string | `pss`, `rss`, or `unknown` for a measure that the CLI does not know |
| `memory_total.command_bytes`, `memory_total.command_processes`, `memory_total.holder_bytes` | number | The sums of the three values of the Sessions that have a process |
| `memory_total.sessions` | number | The number of Sessions in the sums |
| `memory_total.measure` | string or `null` | The measure of the sums. `null` if the Sessions do not have the same measure, or if no Session has a process |

### `capture`

```json
{"schema_version":1,"capture":{"id":"wg6h27bl","output":"198\r\n199\r\n200\r\n"}}
```

| Field | Type | Meaning |
|---|---|---|
| `capture.id` | string | The session identifier |
| `capture.output` | string | The output lines, with their escape sequences. A byte sequence that is not UTF-8 has U+FFFD in its place. The text output has the bytes without a change |

### `restore-policy`

```json
{"schema_version":1,"restore_policy":{"id":"4irabyqw","policy":"manual"}}
```

### `attach` and `new --attach`

```json
{"schema_version":1,"attach":{"id":"a4xd7tz6","end":"detached"}}
{"schema_version":1,"attach":{"id":"a4xd7tz6","end":"exited","exit_code":0}}
{"schema_version":1,"attach":{"id":"x3jerlzh","end":"signaled","signal":9}}
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
{"schema_version":1,"detached":{"id":"7uk6xzoz","clients":0}}
```

| Field | Type | Meaning |
|---|---|---|
| `detached.id` | string | The session identifier |
| `detached.clients` | number | The number of clients that were attached to the Session |

### `kill`

```json
{"schema_version":1,"killed":"v6srainn"}
```

`killed` is the identifier of the Session that ended.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.4.0","pid":1017163,"sessions":1}}
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

### `status`

```json
{"schema_version":1,"status":{"attention":{"session":"duif5fve","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},"sessions":[{"id":"duif5fve","command":["sh","replay.sh","background-subagent","6"],"status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"details":{"model":null,"provider_session_id":"00000000-0000-4000-8000-000000000003","resume_command":"claude --resume 00000000-0000-4000-8000-000000000003"}}]}}
```

With `--tree`, each entry of `status.sessions` has the field `children` before `details`. This is the same Session with `--tree`:

```json
{"schema_version":1,"status":{"attention":{"session":"duif5fve","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},"sessions":[{"id":"duif5fve","command":["sh","replay.sh","background-subagent","6"],"status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"children":[{"name":"a45f24c823c444cb5","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"children":[]}],"details":{"model":null,"provider_session_id":"00000000-0000-4000-8000-000000000003","resume_command":"claude --resume 00000000-0000-4000-8000-000000000003"}}]}}
```

| Field | Type | Meaning |
|---|---|---|
| `status.attention` | object or `null` | The Session with the most urgent status, and that status. `null` if the Host has no Session |
| `status.sessions[]` | list | One Agent run for each Session that is not ended and for each ended Session that keeps its last Agent run, in the sequence of the identifiers |
| `.id`, `.command` | string, list of strings | The Session and its command |
| `.status` | status | The status of the Agent run |
| `.aggregate` | status | The most urgent status of the Agent run and of its Child work |
| `.children[]` | list | Only with `--tree`. Each Child work: `name`, `status` (a status, or `null` if no source reports it), `aggregate` and `children` |
| `.details` | object | Only if an adapter gave them: `model`, `provider_session_id` and `resume_command`, each a string or `null` |

If the Host has no Session, the document is `{"schema_version":1,"status":{"attention":null,"sessions":[]}}`.

A status has these fields:

| Field | Type | Meaning |
|---|---|---|
| `state` | string | `idle`, `working`, `done`, `needs_you`, `error`, or `unknown` for a state that the CLI does not know |
| `kind` | string or `null` | For `needs_you`: `permission`, `question` or `auth`, or `null` if no source says it |
| `source` | string | `adapter`, `program_status`, `self_report`, `session_restore`, `prompt_marks`, `foreground_program`, `none` (no source reports the work) or `unknown` |
| `guess` | boolean | `true` if the daemon guessed the state: the source is `prompt_marks` or `foreground_program` |
| `since_ms` | number | When the daemon saw the state for the first time: milliseconds after the Unix epoch |
| `seen` | boolean | For `done` and `error`: `true` if the user saw the result |
| `message`, `title`, `tool` | object or `null` | `{"text": ..., "source": ...}`: the text and its own source |
| `progress` | object or `null` | `{"percent": ..., "source": ...}` |

### `status set`

```json
{"schema_version":1,"status_set":{"session":"ab5azvpo","state":"done"}}
```

### `agent explain`

```json
{"schema_version":1,"explain":{"session":"duif5fve","run":{"id":"duif5fve","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"children":[{"name":"a45f24c823c444cb5","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"children":[]}],"details":{"model":null,"provider_session_id":"00000000-0000-4000-8000-000000000003","resume_command":"claude --resume 00000000-0000-4000-8000-000000000003"}},"sources":[{"source":"adapter","guess":false,"reported":true,"state":"working","kind":null,"message":null,"note":"an adapter extension reported it from the events of the agent tool"},{"source":"program_status","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"no program of the session reported a status"},{"source":"self_report","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"no program of the session reported a status with `nomux status set`"},{"source":"session_restore","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"the session did not lose a process with work that ran or waited"},{"source":"prompt_marks","guess":true,"reported":false,"state":null,"kind":null,"message":null,"note":"the shell of the session sent no prompt mark"},{"source":"foreground_program","guess":true,"reported":false,"state":null,"kind":null,"message":null,"note":"the command of the session is in the foreground of its terminal"}]}}
```

`explain.run` has the fields of an entry of `status.sessions` with its Child work, without `command`. `explain.sources` has each source in the sequence in which they decide. `reported` is `false` for a source that says nothing: then `state`, `kind` and `message` are `null`, and `note` says why. The text of a note is not stable.

### `events --follow`

Each line is one document. These are an `agent_run_changed` event and an `agent_run_removed` event of real runs:

```json
{"schema_version":1,"event":{"seq":1,"at_ms":1795691201577,"type":"agent_run_changed","session":"ebqcnmoo","run":{"id":"ebqcnmoo","status":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795691201577,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795691201577,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"children":[]}}}
{"schema_version":1,"event":{"seq":16,"at_ms":1795691221747,"type":"agent_run_removed","session":"rado2qro"}}
```

This is the form of a `snapshot` event. The command was not run with a snapshot for this page, and the document comes from `docs/cli.md` of the tag `v0.4.0`:

```json
{"schema_version":1,"event":{"seq":13,"at_ms":1795670005000,"type":"snapshot"}}
```

| Field | Type | Meaning |
|---|---|---|
| `event.seq` | number | The position of the event in the event log of the daemon. The numbers start again when the daemon starts again |
| `event.at_ms` | number | When the event occurred: milliseconds after the Unix epoch |
| `event.type` | string | `agent_run_changed`, `agent_run_removed`, `extension_event`, `snapshot`, or `unknown` for an event that the CLI does not know |
| `event.session` | string | The Session. Only in `agent_run_changed` and `agent_run_removed` |
| `event.run` | object | Only in `agent_run_changed`: the Agent run after the change, with the fields of `explain.run` |
| `event.extension` | object | Only in `extension_event`: `id` (the extension), `name` (the name of the event) and `payload_base64` (the payload in Base64: the extension selects its encoding) |

After a `snapshot`, one `agent_run_changed` event for each Session gives the state of the Host now. A reader discards the state that it had.

### `hook`

The command prints the answer for the tool, not a JSON document, also with `--json`. In this version the answer is empty, thus the output is empty.

### `hooks install` and `hooks uninstall`

The page shortens the value of `diff` after its first line `@@`. The real value has the whole diff.

```json
{"schema_version":1,"hooks_change":{"action":"install","tool":"claude","path":"/tmp/nomux-demo/.claude/settings.json","diff":"--- /tmp/nomux-demo/.claude/settings.json\n+++ /tmp/nomux-demo/.claude/settings.json\n@@ ...","changed":true,"applied":false,"restores_original":false}}
{"schema_version":1,"hooks_change":{"action":"uninstall","tool":"claude","path":"/tmp/nomux-demo/.claude/settings.json","diff":"--- /tmp/nomux-demo/.claude/settings.json\n+++ /tmp/nomux-demo/.claude/settings.json\n@@ ...","changed":true,"applied":true,"restores_original":true}}
```

| Field | Type | Meaning |
|---|---|---|
| `hooks_change.action` | string | `install` or `uninstall` |
| `hooks_change.tool` | string | The tool |
| `hooks_change.path` | string | The settings file |
| `hooks_change.diff` | string | The change as a unified diff. Empty if nothing changes |
| `hooks_change.changed` | boolean | `true` if the diff is not empty |
| `hooks_change.applied` | boolean | `true` with `--apply`: the command wrote the change |
| `hooks_change.restores_original` | boolean | For `uninstall`: `true` if the file gets its bytes from before the install, `false` if only the entries of nomux go away |

If the hooks are installed already, `nomux hooks install claude --json` has `"diff":""`, `"changed":false` and `"applied":false`.

### `hooks status`

```json
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":"installed","path":"/tmp/nomux-demo/.claude/settings.json","recorded":true,"problem":null}]}
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":null,"path":null,"recorded":false,"problem":"the settings file /tmp/nomux-demo/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed"}]}
```

| Field | Type | Meaning |
|---|---|---|
| `hooks[].tool`, `.adapter` | string, string or `null` | The tool and its adapter extension. `null`: the tool has no adapter, only a record of an install |
| `.state` | string or `null` | `installed`, `missing` or `different`. `null` if the state is not known: `problem` says why |
| `.path` | string or `null` | The settings file |
| `.recorded` | boolean | `true` if nomux has a record of an install: `hooks uninstall` can remove the hooks |
| `.problem` | string or `null` | Why the state is not known, in English for a person. The text is not stable. `null` if the state is known |

If no tool has an adapter or a record, the document is `{"schema_version":1,"hooks":[]}`.

### `version`

```json
{"schema_version":1,"version":"0.4.0"}
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

This page describes nomux 0.4.0: the tag [`v0.4.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.4.0) of `nomux-sh/nomux`, commit [`0a30b68`](https://github.com/nomux-sh/nomux/commit/0a30b68f5948e48f395f5ee2e6c6832acb123cb7).
The help texts and the examples are the real output of the binaries of that release on Linux x86_64, in a temporary home directory `/tmp/nomux-demo`. The session identifiers and the process IDs come from more than one run.
Four things in the examples are not a plain run of the released product:

- The adapter extension of Claude Code (`nomux.agent-claude`) was not released with 0.4.0. The examples of the status commands and of the hook commands use a build of it. The hook events that the `replay.sh` scripts send are recorded events of Claude Code.
- The packages of the examples of the extension commands are the Echo extension (a build of the example of the extension API) and a Git extension whose daemon program is a stand-in script: `ext install` and `ext ls` read only the manifest and start no process of the extension.
- `nomux hooks install` wrote the settings file of the home directory of the run. It is not the settings file of a real Claude Code.
- The terminal examples (`attach`, and the tables of `ls` on a terminal of 50 columns) ran in a pseudoterminal.

These parts were not run for this page and come from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/cli.md) of the same tag: each command that connects to a remote Host (`host add`, `host doctor` with a Host, a command with `--host` for a Host that exists), the exit codes 3, 4 for SSH and 5, the states `unreachable`, `damaged` and `unknown`, the values `lost` and `unknown` of `attach.end`, the end of an attach by a signal for the CLI, the change of the window size during an attach, the `rss` measure and the total line `pss and rss` of `ls --memory`, the error of `ls --memory` for an older daemon, the rows of `status --tree` with `-` as the state, the lines of an `extension-event` and of a `snapshot` of `events --follow`, the write of a settings file through a symbolic link, and the removal of a settings file that `hooks install` made.
