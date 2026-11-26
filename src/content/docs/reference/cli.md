---
title: CLI reference
description: Each command of the nomux CLI with its options, its output, its JSON documents and its exit codes.
sidebar:
  label: CLI
---

`nomux` is the CLI. It connects to the daemon, sends its requests and prints the result. Only `attach` uses your terminal.
The [quick start](/docs/guides/quick-start/) shows the commands in use, and [Sessions](/docs/guides/sessions/) shows names and targets in use.

## Rules for all commands

- No command asks a question. A command reads only its arguments and its environment. There are two exceptions. `attach` gives your keyboard and your screen to a Session. `kill --all` asks you on a terminal, because a command that ends many Sessions never runs without a sign of you.
- All commands have the same [exit codes](#exit-codes). `attach` adds the exit status of the command of the Session.
- Each command accepts `--json`, `--quiet` and `--host <name>`. You cannot use `--json` and `--quiet` together.
- Without `--host`, a command uses the daemon of the local Host. With `--host <name>`, it uses the daemon of a remote Host through SSH. Refer to [`--host`](#--host).
- A command that needs the daemon starts it if no daemon answers, and waits for 5 seconds at most. The `daemon` commands, `ext validate`, `hook`, `status set` and `hooks uninstall` start no daemon.
- `status set` and `hook` work only inside a Session. They read `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN` from their environment. [The environment of a Session](/docs/guides/session-environment/) describes the three variables. If the home directory is long, `NOMUX_SOCK` is a path in a short link, and [long home directories](/docs/guides/long-home-paths/) explains why.
- The text output has colour only for the state of a Session or of its status, only when the standard output is a terminal and only when the `NO_COLOR` variable is not set.
- On a terminal, a table of the text output fits the width of the terminal. The command column is shortened first, then the column of the note, the message or the reason, then a column of a path or a name. An ellipsis (`…`) marks the cut, and a shortened column keeps the width of its header. Thus the state and the message stay visible.
- If the shortened columns are not enough, a table leaves out columns in a fixed sequence. [Narrow terminals](#narrow-terminals) has the sequence and shows it.
- When the standard output is not a terminal, and in the JSON output, nothing is shortened or left out.

## Synopsis

```text
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]

Commands:
  new             Start a new session and print its identifier
  ls              List the sessions
  attach          Show a session in this terminal. To detach, press Ctrl-a and then d. A dormant session starts again [alias: a]
  start           Start the command of a dormant session again
  capture         Print the last output lines of a session
  restore-policy  Set when a dormant session starts again
  detach          Detach the clients that are attached to a session. The session continues
  hibernate       Stop the idle agent of a session and keep the session until a wake
  wake            Start the agent of a hibernated session again with its resume command
  pin             Exclude a session from automatic hibernation
  unpin           Take the exclusion of `pin` back
  kill            End a session. A dormant session is removed with its output
  rename          Give a session a different name
  send            Type text or keys into a session, as if the user typed them
  status          Show the status of each session: what works, what is done, what needs you
  agent           Explain the status of the sessions
  events          Print the events of the host when they come, until a signal stops the command
  project         Add, list and remove the Projects of the workspace tree
  group           Make, rename, move, remove and list the Groups of the workspace tree
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

### Bare `nomux`

`nomux` without a command depends on the standard input and the standard output:

- On a terminal, it attaches to the most recent Session, as [`nomux attach`](#nomux-attach) without a target does. If the Host has no Session that is not ended, it starts a Session with your shell and attaches to it.
- Without a terminal, it prints the help text to the standard error and has the exit code 1. The text is the same as the text of `nomux --help`.

```console
$ nomux < /dev/null
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]
...
$ echo $?
1
```

The first lines of the help text are the same as the synopsis above. The page shortens the output after them. On a host without a Session, the command in a pseudoterminal started a Session with `/bin/bash` and attached to it. After the detach keys, the last line was `detached from session klfljrqx`.

### Aliases

`a` is an alias of `attach`: `nomux a api`. The help shows it as `[alias: a]`.

For the habit of tmux, five more names are aliases. The help does not show them: `attach-session`, `new-session`, `list-sessions`, `kill-session` and `rename-session`. They run the nomux commands with the options of nomux, not the options of tmux:

```console
$ nomux new-session -n al -- sleep 100
2jdytkif
$ nomux rename-session al al2
session 2jdytkif is now named al2
$ nomux kill-session al2
session al2 (2jdytkif) ended
```

[Coming from tmux and screen](/docs/guides/coming-from-tmux-and-screen/) compares the commands.

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
nomux --host vps attach api
```

- Each command first makes sure that the Host has the binaries of the version of the CLI. If they are absent, the command installs them, as `host add` does, and writes one line about it to the standard error.
- `new --cwd <dir>` needs an absolute path on the Host. Without `--cwd`, the command starts in your home directory on the Host. `project add <directory>` needs an absolute path on the Host too.
- `--host` cannot be used with a `host` command, with `daemon install-service` and `daemon uninstall-service`, with `status set` and with a `hooks` command. These commands have the exit code 1 with `--host`. `version` prints the version of the CLI. `hook` ignores `--host`.
- An SSH error has the exit code 1. If the Host accepts no key, the exit code is 4.
- The prefix keys of an attach are a setting of the computer that runs the CLI. A remote Host does not change them.

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

## Targets and names

A Session has an identifier, which the daemon gives and which never changes. It can also have a name, which you give and can change. Each command that takes a Session takes a **target**: the identifier, the name, or the start of one of the two. [Sessions](/docs/guides/sessions/) shows the rule in use.

| Step | The target is | Sessions that the step searches |
|---|---|---|
| 1 | The identifier of a Session | Each Session, also an ended Session |
| 2 | The name of a Session | The Sessions that are not ended |
| 3 | The start of the identifier or of the name of exactly one Session | The Sessions that are not ended |

The first step that finds a Session wins. Thus an exact name wins over a longer name with the same start. If step 3 finds more than one Session, the command does nothing, prints the candidates and has the exit code 1. With `--json`, the error document has the field `candidates`. If no step finds a Session, the exit code is 2.

```console
$ nomux new -n api -- sleep 600
wyv5slz3
$ nomux new -n api-v2 -- sh
5g2diwdl
$ nomux capture ap
nomux: ap can be more than one session. Give more of the identifier or of the name of one of them:
  5g2diwdl  api-v2  sh
  wyv5slz3  api     sleep 600
$ nomux capture api
$ nomux detach wyv
detached 0 clients from session api (wyv5slz3)
$ nomux detach nothing
nomux: no session has the identifier or the name nothing, and no session has a name or an identifier that starts with it
```

`nomux capture api` is a complete target (step 2), thus it prints the output of the Session `api`, which has no output. `nomux capture ap` is the start of two names (step 3), thus it fails.

The rules of a name:

- A name has 1 to 64 characters from `A-Z`, `a-z`, `0-9`, `.`, `_` and `-`. The first character is a letter or a digit. Names are case-sensitive.
- A name is unique on the Host among the Sessions that are not ended. A dormant Session keeps its name. An ended Session keeps its name in `ls --all`, and a new Session can take that name at once. An ended Session is a target only by its identifier.
- A name is not the identifier of a different Session.
- `-t <target>` is the same as the argument, for the habit of tmux: `nomux attach -t api`. The help does not show it. `restore-policy` does not have it.
- Each command that takes a Session needs the target, also when its help shows `[TARGET]` in brackets. Only `attach` has a default (the Session that a client attached to last, else the Session that started last). The help of `kill` also shows a default, but `nomux kill` without a target and without `--all` fails with the exit code 1.
- A daemon that is older than the names refuses `new -n` and `rename` with the exit code 1. A target finds the Sessions of such a daemon by their identifiers.

```console
$ nomux new -n api -- sleep 1
nomux: the name api is in use by session wyv5slz3. Run `nomux new -A -n api` to attach to it, or give a different name
$ nomux new -n bad/name -- sleep 1
nomux: the session name "bad/name" is not valid: a name has 1 to 64 characters from A-Z, a-z, 0-9, '.', '_' and '-', and starts with a letter or a digit
$ nomux kill
nomux: kill needs a session, or --all: `nomux kill <target>`
```

The CLI finds the Session of a target with one `Session.List` request before the request of the command, thus each client finds a Session in the same way.

## Session commands

### `nomux new`

Starts a new Session and prints its session identifier. With `--attach`, it attaches to the Session.

```text
Usage: nomux new [OPTIONS] [-- <COMMAND>...]

Arguments:
  [COMMAND]...  The same as --cmd: each argument after -- belongs to the command

Options:
      --json              Print the result as one JSON document
  -n, --name <NAME>       The name of the session: 1 to 64 characters from A-Z, a-z, 0-9, '.', '_' and '-', that start with a letter or a digit. No other session that runs has it
  -c, --cwd <DIR>         The working directory of the command [default: the current directory]
  -q, --quiet             Print only the necessary part of the result
  -a, --attach            Attach to the new session
      --host <NAME>       Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -A, --attach-or-create  Attach to the session that has the name of --name. If no session has it, start the session and attach to it
      --prefix <KEY>      A prefix key of this attach, for example C-a, C-b or C-\. Give the option two times for two keys. none: no key detaches [default: the variable `NOMUX_PREFIX`, then `prefix` in `[attach]` of the configuration file, then C-a and C-\]
      --cmd <COMMAND>...  The command of the session and its arguments [default: the shell of the user]. Each argument after --cmd belongs to the command, also an option of nomux
  -h, --help              Print help
```

| Option | Default | Function |
|---|---|---|
| `-n`, `--name <NAME>` | No name | The name of the Session. Refer to [Targets and names](#targets-and-names). A name that a Session that is not ended has gives the exit code 1, and the message names that Session and `-A`. |
| `-c`, `--cwd <DIR>` | The current directory of the CLI | The working directory of the command. A relative path is relative to the current directory. The directory must exist. |
| `-a`, `--attach` | Off | Attaches the terminal to the new Session, as [`nomux attach`](#nomux-attach) does. The command then prints the result of the attach and not the session identifier. Without a terminal, the command fails and starts no Session. |
| `-A`, `--attach-or-create` | Off | Needs `-n`. If a Session that is not ended has the name, the command attaches to it. Else it starts the Session and attaches to it. |
| `--prefix <KEY>` | Refer to [Prefix keys](#prefix-keys) | The prefix keys of the attach of `-a` or `-A`. |
| `-- <COMMAND>...` | The shell of the user: the `SHELL` variable of the daemon, or `/bin/sh` | The command of the Session and its arguments. |
| `--cmd <COMMAND>...` | The same | A second form of `--`. The two forms cannot be used together. |

`--cwd` and `--attach` are the long names of `-c` and `-a`. The long names of nomux 0.4.0 work as before.

The daemon decides `-A` in one step, thus two `nomux new -A -n work` at the same time start one Session. For a Session that exists, the command and `--cwd` are not used, and one line on the standard error says so. A dormant Session starts again, as `attach` does.

```console
$ nomux new -n api -c src/acme-web -- sleep 600
wsqtewka
$ nomux new --cwd project -- sleep 600
aghldjzc
$ nomux new -A -n web -c project -- sleep 5
nomux: session web exists: the command and --cwd are not used
```

The last command attached to the Session `web`. After the detach keys, it printed `detached from session web (kx7edkz2)`.

**Each argument after `--` or `--cmd` belongs to the command of the Session, also an argument that is an option of `nomux`.** Thus the options of `nomux` come before the command:

```sh
nomux new --json -- sleep 300      # --json is an option of nomux
nomux new -- sleep 300 --json      # --json is an argument of sleep
```

```console
$ nomux new --json -- sleep 300
{"schema_version":1,"session":{"id":"b3xrwvkk","name":null,"state":"running","pid":4041029,"command":["sleep","300"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706330,"epoch":1,"restore_policy":"on-focus"}}
$ nomux new --json -- sleep 300 --json
{"schema_version":1,"session":{"id":"7f2zzrba","name":null,"state":"running","pid":4041032,"command":["sleep","300","--json"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706331,"epoch":1,"restore_policy":"on-focus"}}
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

The command gets the environment of the daemon, with the changes that [the environment of a Session](/docs/guides/session-environment/) describes: `TERM=xterm-256color`, `COLORTERM=truecolor`, a UTF-8 character set if the daemon has no locale, and the variables `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`. Its terminal has 24 rows and 80 columns until a client attaches: an attach gives the Session the window size of the terminal of the client. The Session does not need the CLI or the daemon after that.

If the directory does not exist, the exit code is 1 and no Session starts. If the program of the command does not exist, the result depends on the memory limit of the Host:

```console
$ nomux new -c /nonexistent-directory
nomux: the working directory /nonexistent-directory is not an absolute path of a directory
$ nomux new -- /nonexistent-binary
nomux: the session did not start: nomux-holder: cannot start the command: No such file or directory (os error 2)
```

The second command ran on a Host without a [memory limit](/docs/guides/session-memory/). On a Host with `memory_limit` in its configuration file, the same command printed a session identifier and had the exit code 0. The Session then ended at once with the exit status 1, and `capture` showed `Failed to find executable /nonexistent-binary: No such file or directory`: with a limit, the holder starts the command through `systemd-run`, which reports the failure. This is a difference that [Session memory](/docs/guides/session-memory/) does not describe.

`--attach` needs a terminal. Without one, the exit code is 1 and no Session starts:

```console
$ nomux new --attach -- sh < /dev/null
nomux: attach needs a terminal: the standard input is not a terminal
$ nomux new -A < /dev/null
error: the following required arguments were not provided:
  --name <NAME>

Usage: nomux new --name <NAME> --attach-or-create -- <COMMAND>...

For more information, try '--help'.
```

### `nomux ls`

Lists the Sessions that can run: the Sessions whose command runs, the dormant Sessions, the hibernated Sessions and the damaged Sessions. With `--all`, it also lists the ended Sessions.

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
ID        NAME     STATE       PID      PROJECT                    COMMAND                NOTE
7vyxpmt3  api      running     4056358  Client work/Acme/acme-web  sleep 600
plhommva  -        dormant     -        -                          sleep 300
qghxx5rq  web      running     4056361  Client work/Acme/acme-web  sh
tvomf5br  editor   running     4056367  Client work/Acme/notes     vim -u NONE notes.txt
uistajr3  scratch  running     4056382  -                          sleep 900
wzr5kzyq  agent    hibernated  -        Client work/Acme/acme-web  claude                 request
```

If there is no Session, the command prints `no sessions`.

- `ID` is the session identifier.
- `NAME` is the name of the Session, or `-`. A table has the column only if a Session has a name.
- `PID` is the process ID of the command of the Session. It is `-` if the Session has no process or the daemon does not know it.
- `PROJECT` is the path of the [Project](/docs/guides/projects-and-groups/) of the Session in the workspace tree, or `-`. A table has the column only if a Session has a Project. The Project is the Project whose directory is the working directory of the Session or is above it. If more than one Project matches, the longest directory wins. `new -c src/acme-web/` and `new -c src/acme-web` give the same Project: the daemon resolves the working directory, which removes a trailing slash and the symbolic links.
- `COMMAND` is the program and its arguments, with one space between them.
- `NOTE` is there only if a Session has a note: how the command of an ended Session ended (`exit status <n>` or `signal <n>`), why the description of a Session is damaged, the reason of the hibernation of a hibernated Session (`count`, `session-memory`, `total-memory`, `memory-pressure` or `request`), the reason that its last wake failed, and `pinned` for a Session that [`pin`](#nomux-pin-and-nomux-unpin) excludes from the automatic hibernation.

```console
$ nomux ls --all
ID        NAME  STATE    PID      PROJECT                    COMMAND       NOTE
2eeuodaj  old   ended    -        -                          sleep 600     signal 1
mxn3d5r6  api   running  4128216  Client work/Acme/acme-web  sleep 600     pinned
rqtf4yp4  job   ended    -        -                          sh -c exit 3  exit status 3
```

`old` ended because `nomux kill old` ended it (`signal 1` is the `SIGHUP` that `kill` sends), and `job` ended with the exit status 3 of its command.

| State | Meaning |
|---|---|
| `running` | The command of the Session runs. |
| `unreachable` | The holder of the Session runs, but the daemon has no connection to it. The daemon tries to connect again. |
| `dormant` | The Session has no process: its holder is gone, and its command did not end. `attach` or `start` starts the command again. Refer to [After a restart](/docs/guides/after-a-restart/). |
| `hibernated` | The daemon stopped the agent of the Session, and the Session keeps its output and its resume command. `wake` or `attach` starts the agent again. Refer to [Hibernation](/docs/guides/hibernation/). |
| `ended` | The command of the Session ended. The daemon keeps the Session and its output for the retention time, 24 hours by default. Only `ls --all` shows it. |
| `damaged` | The daemon cannot read the description of the Session. The note has the reason. `kill` removes the Session. |
| `unknown` | The daemon is newer than the CLI and sent a state that the CLI does not know. |

The JSON output has the state `dormant` for a hibernated Session and a `hibernation` object. A client that does not know the object sees a dormant Session, which is correct.

#### Narrow terminals

On a terminal, the table fits the width of the terminal. First the shortened columns shrink. If that is not enough, the table leaves out columns in a fixed sequence, and a column that the table leaves out comes back when the terminal is wide enough. `ls` leaves out `PID` and then `PROJECT`, and it never leaves out `NAME`. This is `nomux ls` on terminals of 60, 50 and 40 columns, for the Sessions above:

```text
ID        NAME   STATE       PID      PROJECT  COMMAND  NOTE
7vyxpmt3  api    running     4056358  Client…  sleep …
plhommva  -      dormant     -        -        sleep …
qghxx5rq  web    running     4056361  Client…  sh
tvomf5br  edit…  running     4056367  Client…  vim -u…
uistajr3  scra…  running     4056382  -        sleep …
wzr5kzyq  agent  hibernated  -        Client…  claude   req…
```

```text
ID        NAME  STATE       PROJECT  COMMAND  NOTE
7vyxpmt3  api   running     Client…  sleep …
plhommva  -     dormant     -        sleep …
qghxx5rq  web   running     Client…  sh
tvomf5br  edi…  running     Client…  vim -u…
uistajr3  scr…  running     -        sleep …
wzr5kzyq  age…  hibernated  Client…  claude   req…
```

```text
ID        NAME  STATE       COMMAND  NOTE
7vyxpmt3  api   running     sleep …
plhommva  -     dormant     sleep …
qghxx5rq  web   running     sh
tvomf5br  edi…  running     vim -u…
uistajr3  scr…  running     sleep …
wzr5kzyq  age…  hibernated  claude   req…
```

The other tables leave out columns in this sequence. The sequence below is the one that the width sweep of this page measured:

| Command | Columns that go first |
|---|---|
| `ls` | `PID`, then `PROJECT` |
| `ls --memory` | `MEASURE`, then `LIMIT`, `FREED`, `PROCESSES` and `HOLDER` |
| `status` | `FOR`, then `COMMAND` |
| `ext ls` | `VERSION`, then `NAME` |

`ext ls` was not run on a narrow terminal for this page. The sequence of `ext ls` is from the product reference.

A table with usual values fits a terminal of 60 columns, with the columns that it leaves out. A line that is not a table, for example the total line of `ls --memory`, breaks at a space. Below 60 columns a table can cut a name to a few characters. `status --tree` on a terminal of 50 columns shows `Cli…` and `A…` in its first column. The commands were run in a pseudoterminal. The colour was off (`NO_COLOR`).

#### `nomux ls --memory`

With `--memory`, the command also shows the memory that the processes of each Session use at the time of the command. The daemon measures the memory for this command only: without `--memory`, `ls` measures nothing.

```console
$ nomux ls --memory
ID        STATE       MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT    FREED      COMMAND
7vyxpmt3  running     147.0 KiB  1          262.0 KiB  pss      4.0 GiB  -          sleep 600
plhommva  dormant     -          -          -          -        -        -          sleep 300
qghxx5rq  running     731.0 KiB  1          270.0 KiB  pss      4.0 GiB  -          sh
tvomf5br  running     4.8 MiB    1          271.0 KiB  pss      4.0 GiB  -          vim -u NONE notes.txt
uistajr3  running     147.0 KiB  1          258.0 KiB  pss      4.0 GiB  -          sleep 900
wzr5kzyq  hibernated  -          -          -          -        -        141.0 KiB  claude
total: 5.8 MiB in 4 processes of 4 sessions, and 1.0 MiB in the holders (pss)
hibernated: 141.0 KiB given back by 1 session
```

The Host of this example has `memory_limit = "4G"` in `[sessions]` of its configuration file.

| Column | Meaning |
|---|---|
| `MEMORY` | The memory of the process tree of the command: the command and each process that descends from it. |
| `PROCESSES` | The number of processes in that tree. |
| `HOLDER` | The memory of the holder of the Session. It is not a part of `MEMORY`. |
| `MEASURE` | `pss`: the proportional set size, which counts a page that more than one process uses one time. `rss`: the resident set size, which counts such a page for each process. Linux gives `pss`, macOS gives `rss`. |
| `LIMIT` | The memory limit that the operating system applies to the processes of the command. `-` if none applies. |
| `FREED` | For a hibernated Session: the memory that its hibernation gave back. The last line has the sum, if a Session is hibernated. |

- A Session without a process has `-` in the five columns of the measured values and is not in the total line. A hibernated Session has the value only in `FREED`.
- The table has no `NAME` column, no `PROJECT` column, no `PID` column and no `NOTE` column. `ls` without `--memory` has them. The JSON document has the name.
- A size has the unit `KiB`, `MiB` or `GiB` (1024 bytes, 1024 KiB, 1024 MiB) and one decimal place. The JSON output has the bytes.
- If the Sessions do not have the same measure, the total line says `pss and rss`: the sum then has values of the two kinds.
- `--memory` works with `--all`. An ended Session has `-` in each column.
- A daemon that is older than this option answers with an error, and the exit code is 1.
- With `--host`, the daemon of the remote Host measures the processes of that Host.
- A session that started before the limit was in the configuration shows `-` in `LIMIT`.

[Session memory](/docs/guides/session-memory/) says how the daemon measures, what the values do not count, and how long the command takes.

### `nomux attach`

Makes your terminal the terminal of a Session, until you detach or the Session ends. A dormant Session starts again, and a hibernated Session wakes. The alias is `a`.

```text
Usage: nomux attach [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them [default: the session that a client attached to last, else the session that started last]

Options:
      --json           Print the result as one JSON document
  -d, --detach-others  Detach the other clients of the session first
  -q, --quiet          Print only the necessary part of the result
      --host <NAME>    Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -r, --read-only      Show the session and send no key and no window size to it. The prefix keys work
      --prefix <KEY>   A prefix key of this attach, for example C-a, C-b or C-\. Give the option two times for two keys. none: no key detaches [default: the variable `NOMUX_PREFIX`, then `prefix` in `[attach]` of the configuration file, then C-a and C-\]
  -h, --help           Print help

Keys during an attach, with the default prefix keys Ctrl-a and Ctrl-\:
  Ctrl-a d         Detach. The session continues. Ctrl-a Ctrl-d also detaches
  Ctrl-a Ctrl-a    Send one Ctrl-a to the session. Ctrl-a a does the same
  Ctrl-a ?         Show the keys in the title of the window until the next key
  Ctrl-\ d         Detach
  Ctrl-\ Ctrl-\    Send one Ctrl-\ to the session

A prefix and a different key go to the session together. --prefix, the
variable NOMUX_PREFIX and `prefix` in [attach] of the configuration file
choose other prefix keys: for example C-b, or none.

Each other key goes to the session. The exit code is the exit status of the
command if the session ends during the attach, and 0 after a detach.
```

Without a target, `attach` takes the Session that a client attached to last, else the Session that started last, of the Sessions that are not ended. The daemon keeps the time of the last attach in its memory: after a restart of the daemon, the Session that started last. If the Host has no such Session, the exit code is 2.

- `-d`, `--detach-others` detaches the other clients of the Session first, as [`detach`](#nomux-detach) does. A different client can attach between the two requests.
- `-r`, `--read-only` shows the Session and sends no key and no window size to it: the Session keeps its size. The detach keys work. The client keeps this rule itself, the daemon does not enforce it.
- `--prefix <key>` sets the prefix keys of this attach. Refer to [Prefix keys](#prefix-keys).

An attach does these steps:

1. The Session gets the window size of your terminal.
2. The terminal shows the current screen of the Session. A program that already drew its screen, for example an editor, is visible immediately.
3. Each key goes to the Session, and the terminal shows each byte that the Session writes. The terminal is in raw mode: `Ctrl-C` and `Ctrl-Z` go to the programs of the Session.
4. When the window gets a different size, the Session gets the new size.

For a dormant Session, the attach first starts the command again in the working directory of the Session, with the window size of your terminal. The terminal shows the end of the old output, then the line `--- nomux: the session started again. The output before this line is from the command that stopped ---`, and then the screen of the new command. The processes of the Session from before do not come back. For a hibernated Session, the attach does a wake, as [`nomux wake`](#nomux-wake) does, and shows the same line between the old screen and the screen of the resumed agent. The old output and the line are in the scrollback of the terminal after that.

The command needs a terminal on its standard input.
More than one terminal can be attached to one Session at the same time. Each one shows the same output, and each one can type.
A Session has one window size: the size of the terminal that attached or changed its size last. A terminal with a different size shows the output as the programs made it for that size.

An attach shows the screen of the Session and not the lines that left the screen. [`nomux capture`](#nomux-capture) prints them.

`<session>` in a message is the name of the Session with its identifier, `api (m4ab5ghi)`, or only the identifier of a Session without a name.

#### Prefix keys

A prefix key comes before each key of nomux. The default prefix keys are `Ctrl-a`, the key of screen, and `Ctrl-\`, the key of nomux 0.4. The two are active at the same time. `Ctrl-\` still works, thus a habit from 0.4 does not break.

| Keys | Function |
|---|---|
| A prefix and then `d` or `Ctrl-d` | Detach. The Session continues. `Ctrl-d` is for a user who still holds `Ctrl`. |
| A prefix two times | Sends one prefix key to the Session. |
| `Ctrl-a` and then `a` | Sends one `Ctrl-a` to the Session, as in screen. For a different prefix of `Ctrl` and a letter, that letter. |
| A prefix and then `?` | Shows the keys in the title of the terminal window until the next key. The screen of the Session does not change. |
| A prefix and then a different key | Sends the two keys to the Session. |

- A prefix delays a key until the next key, and it takes the keys of the table. Thus a lone `Ctrl-a` (start of the line in a shell) has its effect after the next key. `Ctrl-a` and then a different key, for example `Ctrl-a Ctrl-k`, works as without a prefix.
- `Ctrl-a ?` shows this text in the title of the window: `nomux keys: C-a d: detach, C-a C-a or C-a a: send C-a; C-\ d: detach, C-\ C-\: send C-\`.

**The setting.** The first of these that is set gives the prefix keys:

1. The option `--prefix <key>` of `attach` and of `new --attach`. Give it two times for two keys.
2. The variable `NOMUX_PREFIX`: the keys with a comma between them, for example `C-b` or `C-a,C-\`.
3. `prefix` in the `[attach]` table of the configuration file of the computer that runs the CLI, for example `prefix = ["C-b"]`.
4. The default: `Ctrl-a` and `Ctrl-\`.

```console
$ printf '[attach]\nprefix = ["C-b"]\n' > ~/.config/nomux/config.toml
$ nomux attach api
```

After this file, `Ctrl-b d` detaches and `Ctrl-a d` goes to the Session. `NOMUX_PREFIX=C-x` overrides the file, and `--prefix C-a` overrides the variable.

- A key is `C-<x>`: `x` is a letter, `\`, `]`, `^`, `_`, `@` or `Space`.
- `C-c`, `C-d`, `C-z`, `C-s`, `C-q`, `C-h`, `C-i`, `C-j`, `C-m` and `C-[` cannot be a prefix, because programs need them. A list has two different keys at most.
- A setting that is not valid gives the exit code 1, and `new --attach` then starts no Session:

```console
$ nomux attach --prefix C-c api
nomux: --prefix: the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
$ nomux attach --prefix C-a --prefix C-b --prefix C-x api
nomux: --prefix: an attach has 2 prefix keys at most
$ nomux attach --prefix foo api
nomux: --prefix: the prefix key "foo" is not valid: give C-<x>, where x is a letter, \, ], ^, _, @ or Space, or give none
$ NOMUX_PREFIX=C-a,C-a nomux attach api
nomux: NOMUX_PREFIX: the prefix key C-a is two times in the list
$ nomux attach api
nomux: the configuration file /home/user/.config/nomux/config.toml is not valid: the key `attach.prefix` the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
```

The last command ran with `prefix = ["C-c"]` in the configuration file.

- `none` (`--prefix none`, `NOMUX_PREFIX=none`, `prefix = "none"` or `prefix = []`) turns the prefix off. Each key goes to the Session, also `Ctrl-a d`. Then detach with `nomux detach <target>` from a different terminal, or close the terminal.
- **Nested sessions.** If you attach to a Session that runs `nomux attach`, the outer client takes the prefix first. `Ctrl-a a d` sends one `Ctrl-a` to the inner client and then `d`, thus it detaches the inner client. Or start the inner client with a different prefix: `nomux attach --prefix C-b <target>`.
- **Key forms.** A program of the Session can make the terminal send keys in the form of the kitty keyboard protocol (`CSI 97 ; 5 u` for `Ctrl-a`) or of `modifyOtherKeys` (`CSI 27 ; 5 ; 97 ~`). The CLI finds the prefix and the keys after it in these two forms and in the legacy form. This page ran `Ctrl-a d` and `Ctrl-\ d` in the three forms, and a kitty sequence that a read of the terminal divided after `ESC [ 97 ;` and after `ESC [ 97 ; 5`. A divided sequence that ends the first read directly after `ESC` is not found: the CLI takes that `ESC` as the key Escape. A release event of a key that the CLI took does not go to the Session. Each other byte goes to the Session as it came.
- The text of a bracketed paste has no keys of nomux: a pasted `Ctrl-a d` goes to the Session.

#### How an attach ends

The terminal gets its earlier mode back in each case. The CLI does not use the alternate screen of the terminal: after the attach, the terminal shows the last screen of the Session, and the message is on the next line.

| Event | Message | Exit code |
|---|---|---|
| You detach, `nomux detach` detaches the client, or the terminal closes | `detached from session <session>` | 0 |
| The command of the Session ends | `session <session> ended with exit status <n>` | `<n>`: the exit status of the command |
| A signal ends the command of the Session | `session <session> ended by signal <n>` | 128 + `<n>`, as a shell gives it |
| The Session ends and the daemon cannot get the exit status | `session <session> ended; its exit status is not known` | 1 |
| The daemon stops or fails | An error that says that the Session continues and how to attach again | 1 |
| The connection to a remote Host ends | The attach connects again and continues with the output that it does not have. The title of the terminal window says `nomux: connection lost, connecting again` until then, and the keys of that time are discarded. After approximately 48 seconds without a connection, an error that says how to attach again | 1 after the error |
| The CLI gets `SIGTERM`, `SIGHUP`, `SIGINT` or `SIGQUIT` | An error | 1 |
| No Session has the target, or the command of the Session ended before the attach | An error | 2 |
| The Session is dormant and has the restore policy `manual`, or its command cannot start | An error | 1 |

Thus the exit code of `attach` can be a value that the table of the [exit codes](#exit-codes) does not have, and the values 1 to 5 can come from the command of the Session. With `--json`, the document of a Session that ended goes to the standard output, and an error goes to the standard error. With `--quiet`, the message is not printed.

These are three ends of an attach that this page ran in a pseudoterminal: a detach, a command that ends with the exit status 3, and a command that a signal ends. The exit code of the last two is 3 and 137.

```console
$ nomux attach api-v2
detached from session api-v2 (5g2diwdl)
$ nomux new -n quick -a -- sh
session quick (3f3yt5ok) ended with exit status 3
$ nomux new -a -- sh
session t55qu4h6 ended by signal 9
```

The terminal shows the last screen of the Session above each message. In the second command you typed `exit 3`, and in the third command you typed `kill -9 $$`.

If no Session matches, or the Session ended:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier or the name aaaaaaaa, and no session has a name or an identifier that starts with it
$ nomux attach rmmcedtb
nomux: session rmmcedtb ended: its command does not run
```

An `attach` without a terminal fails before it looks for the Session: the exit code is 1 and the message is `nomux: attach needs a terminal: the standard input is not a terminal`.

With `--json`, an attach prints the document of `attach` ([JSON output](#json-output)):

```console
$ nomux --json attach web
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","end":"detached"}}
$ nomux --json new -A -n web
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","created":false,"end":"detached"}}
```

### `nomux start`

Starts the command of a dormant Session again, without an attach.

```text
Usage: nomux start [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The command starts in the working directory of the Session, with the window size that the Session had. It starts also for the restore policy `manual`.

```console
$ nomux start d1
session d1 (hcdtllok) runs
```

- For a Session whose command runs, the command succeeds and changes nothing.
- For an ended Session, the exit code is 2: `nomux: session rmmcedtb ended: its command does not run`.
- If the command cannot start, for example because its working directory is gone, the exit code is 1 and the Session stays dormant.
- `start` of a hibernated Session starts its resume command, as [`wake`](#nomux-wake) does, and has the same output as for a dormant Session. The page ran it once. Use `wake` for a hibernated Session: it fails with a message if the Session is not hibernated.

### `nomux capture`

Prints the last output lines of a Session, without an attach.

```text
Usage: nomux capture [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
      --lines <N>    The number of lines [default: 100]
  -q, --quiet        Print only the necessary part of the result
  -f, --follow       After the lines, print each byte that the command writes, until the session ends or a signal stops the command. Not with --json
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux new -n log -- sh -c 'seq 1 200; exec sleep 600'
bxebg7jh
$ nomux capture log --lines 3
198
199
200
```

- The lines come from the journal of the Session on disk. Thus the command also prints lines that left the screen, lines from before a restore, and the lines of a dormant, a hibernated or an ended Session.
- The output is the bytes as the command wrote them, with its escape sequences. A line ends with a carriage return and a line feed, as a terminal gets it.
- If the Session has fewer lines, the command prints all of its output.
- With `--quiet`, the output is the same. With `--json`, the output is a string: refer to [`capture`](#capture).
- `-f`, `--follow` prints the lines, and then each byte that the command writes, until the Session ends, a signal stops the command (`SIGINT` or `SIGTERM`), or the reader closes the output. The exit code is 0 in each case. The command attaches without a window size and without input, as a read-only client, from the end of the lines: it gets each byte one time and no screen. It has no JSON form.

```console
$ nomux new -n build -- sh -c 'for i in 1 2 3; do echo "step $i"; sleep 1; done'
mwzd7qbl
$ nomux capture -f build
step 1
step 2
step 3
$ echo $?
0
$ nomux --json capture -f api
{"schema_version":1,"error":{"code":1,"kind":"error","message":"capture --follow has no JSON form: its output is the bytes of the command"}}
```

`nomux capture -f build >> build.log` writes the output of a Session to a file, until the Session ends.

### `nomux restore-policy`

Sets when a dormant Session starts again.

```text
Usage: nomux restore-policy [OPTIONS] <TARGET> <POLICY>

Arguments:
  <TARGET>  The session: its identifier, its name, or the start of one of them
  <POLICY>  auto: when the daemon starts. on-focus: at the first attach. manual: only with `nomux start`

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Policy | The command starts again |
|---|---|
| `auto` | When the daemon starts, for example at login. For a development server or a watcher |
| `on-focus` | At the first `attach` or `start`. This is the default |
| `manual` | Only with `start`. `attach` fails with the exit code 1 |

```console
$ nomux restore-policy web manual
session web (kx7edkz2) has the restore policy manual
$ nomux restore-policy web sometimes
error: invalid value 'sometimes' for '<POLICY>': a restore policy is `auto`, `on-focus` or `manual`

For more information, try '--help'.
```

The default policy is `default_policy` in the `[restore]` table of the configuration file of the Host. [After a restart](/docs/guides/after-a-restart/#restore-policies) has the file. `ls --json` shows the policy of each Session. The command of an ended Session does not start again: `start` and `attach` have the exit code 2 for it. `restore-policy` does not take `-t`.

### `nomux detach`

Detaches each client that is attached to a Session, from a different terminal or from a script. The Session continues.

```text
Usage: nomux detach [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Each of these clients ends as after the detach keys. The command succeeds also if no client is attached:

```console
$ nomux detach api
detached 1 client from session api (7uk6xzoz)
$ nomux detach api
detached 0 clients from session api (7uk6xzoz)
```

If no Session matches the target, the exit code is 2. The target is necessary. To detach your own terminal, use the detach keys.

### `nomux hibernate`

Stops the agent of an idle agent Session and keeps the Session hibernated, with its output and its resume command. [Hibernation](/docs/guides/hibernation/) says when the daemon does this by itself and what it needs. This command asks for it now.

```text
Usage: nomux hibernate [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The command hibernates the Session at once and prints the memory that the hibernation gave back:

```console
$ nomux hibernate agent
session y6k4truk hibernated: 189.0 KiB given back (pss)
```

The idle time of the Session and its pin do not apply to this command. Each other condition does. The command fails with the exit code 1 and the reason if the Session cannot hibernate: no adapter reports it as an agent Session, its adapter gave no resume command, its agent works or waits for you, a client shows it, or input came after the last change of its status.

```console
$ nomux hibernate web
nomux: session cmuivewj cannot hibernate: no adapter reports it as an agent session
$ nomux hibernate d1
nomux: session hcdtllok cannot hibernate: its command does not run
```

Both Sessions were plain shells. A run of `hibernate` on a real agent was not possible for this page. The example with `agent` comes from a Session whose command is a small script that sends the recorded hook events of Claude Code to the daemon. The real adapter of Claude Code (`nomux.agent-claude`) turned them into an Agent run with a resume command, and the daemon hibernated the Session. The script stands in for the agent.

### `nomux wake`

Starts the agent of a hibernated Session again with its resume command, in the working directory of the Session, and prints the command. `nomux attach` does the same and shows the old screen first.

```text
Usage: nomux wake [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux wake agent
session agent (ajaeom6u) woke: claude --resume 0b1c0000-0000-4000-8000-000000000001
$ nomux ls
ID        NAME   STATE    PID      PROJECT                    COMMAND
ajaeom6u  agent  running  3964403  Client work/Acme/acme-web  claude --resume 0b1c0000-0000-4000-8000-000000000001
```

The `ls` output above has only the row of the Session. The command of the Session is the resume command now.

A Session that is not hibernated fails with the exit code 1: `start` starts a dormant Session.

```console
$ nomux wake web
nomux: session web is not hibernated: `nomux start web` starts a dormant Session
```

The daemon looks for the program of the resume command in `PATH`. A wake that fails has the exit code 1, the reason and the resume command for you to run by hand. The Session stays hibernated, and `ls` shows the reason in the note:

```console
$ nomux wake agent
nomux: session jv4ncja3 did not wake: the program claude is not in PATH. To continue its agent by hand, run this command in /home/user/src/acme-web: claude --resume 0b1c0000-0000-4000-8000-000000000001
$ nomux ls
ID        NAME   STATE       PID  PROJECT                    COMMAND                 NOTE
jv4ncja3  agent  hibernated  -    Client work/Acme/acme-web  /home/user/stub/claude  request; wake failed: the program claude is not in PATH
```

The wake that fails ran on a daemon whose `PATH` did not have `claude`. The Session of this example started with a script of the same name in a different directory, thus its command is that script.

### `nomux pin` and `nomux unpin`

`pin` excludes a Session from each automatic hibernation. `unpin` takes the exclusion back. `ls` shows the note `pinned`. A pin has no effect on `hibernate`, which you run yourself: the page hibernated a pinned Session with it.

```text
Usage: nomux pin [OPTIONS] [TARGET]
Usage: nomux unpin [OPTIONS] [TARGET]
```

The options are the options of `hibernate`.

```console
$ nomux pin api
session api (wsqtewka) is pinned
$ nomux unpin api
session api (wsqtewka) is not pinned
```

### `nomux kill`

Ends a Session and waits until its command has ended. Removes a dormant Session with its output. With `--all`, ends each Session whose command runs.

```text
Usage: nomux kill [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them [default: the session that a client attached to last, else the session that started last]

Options:
      --json             Print the result as one JSON document
      --all              End each session whose command runs. On a terminal, the command asks first
  -q, --quiet            Print only the necessary part of the result
      --host <NAME>      Use the daemon of a remote host of `nomux host ls` [default: the local host]
      --include-dormant  With --all, also remove the dormant and the damaged sessions with their output
      --dry-run          With --all, print the sessions and end none
      --yes              With --all, do not ask. Without a terminal, --all needs it
  -h, --help             Print help
```

The help shows a default target. The command does not use it: `nomux kill` without a target and without `--all` fails with the exit code 1 and a message that starts with `nomux: kill needs a session, or --all`. This is a difference between the help text and the behaviour of nomux 0.5.0.

The command of the Session gets `SIGHUP`. If it still runs after 2 seconds, it gets `SIGKILL`. The Session is then an ended Session: `ls --all` shows it for the retention time.

```console
$ nomux kill old
session old (2eeuodaj) ended
```

If no Session matches the target, or if the command of the Session ended already, the exit code is 2. An ended Session is a target only by its identifier, thus the second `kill` of the same Session by its name finds no Session, and by its identifier it finds an ended Session:

```console
$ nomux kill old
nomux: no session has the identifier or the name old, and no session has a name or an identifier that starts with it
$ nomux kill 2eeuodaj
nomux: session 2eeuodaj ended: its command does not run
```

Both commands have the exit code 2.

A dormant Session and a damaged Session have no command to end. `kill` removes such a Session and its state directory: its output is gone after that.

#### `nomux kill --all`

`kill --all` ends each Session whose command runs (the states `running` and `unreachable`), one after the other, and prints one line for each. It does not touch a dormant, a hibernated or a damaged Session: after a restart of the Host each Session is dormant, and `kill --all` must not remove their output. `--include-dormant` also removes these Sessions.

- On a terminal, the command first asks `end <n> session? [y/N]` on the standard error. Only `y` or `yes` ends the Sessions. Each other answer ends none, and the exit code is 1.
- `--yes` does not ask. Without a terminal, `--all` needs `--yes`: else the exit code is 1 and no Session ends.
- `--dry-run` prints the Sessions and ends none.
- If no Session runs, the command prints `no session runs`, asks nothing and has the exit code 0.
- If a Session does not end, its error goes to the standard error, the other Sessions still end, and the exit code is the highest code of the failures.
- `kill` has no `-a`: in tmux, `kill-session -a` ends each other Session.

```console
$ nomux kill --all --dry-run
session api (lys4a4lv) would end
session web (potjlxdz) would end
$ nomux kill --all --include-dormant --dry-run
session agent (lkxpxrp4) would end
session api (lys4a4lv) would end
session web (potjlxdz) would end
session tfbjezgs would end
```

The Host of these two commands had two running Sessions, a hibernated Session (`agent`) and a dormant Session (`tfbjezgs`). Without a terminal, the command needs `--yes`. On a terminal, it asks. The next two commands ran on a Host with one running Session. The second command ran in a pseudoterminal, and the answer was `n`:

```console
$ nomux kill --all < /dev/null
nomux: kill --all ends 1 sessions: without a terminal, give --yes
$ nomux kill --all
nomux: end 1 session? [y/N] n
nomux: no session ended
```

The first message says `1 sessions`, and the question says `1 session`: this is the text of nomux 0.5.0. The exit code of both commands is 1. With the answer `y`, the command ends the Session and prints one line for it, for example `session api-v2 (5g2diwdl) ended`. These are `--yes` and the case without a running Session:

```console
$ nomux kill --all --yes
session web (f24elby6) ended
session api (oaldogrr) ended
$ nomux kill --all --yes
no session runs
```

### `nomux rename`

Gives a Session a different name, with the rules of [Targets and names](#targets-and-names).

```text
Usage: nomux rename [OPTIONS] <TARGET NEW-NAME>...

Arguments:
  <TARGET NEW-NAME>...  The session, and then its new name. With -t, only the new name

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux rename scratch sandbox
session z3jqohga is now named sandbox
$ nomux rename scratch api
nomux: the name api is in use by session wsqtewka
$ nomux rename -t sandbox scratch
session z3jqohga is now named scratch
$ nomux rename scratch
nomux: rename needs the session and its new name: `nomux rename <target> <new-name>`
```

The same name as now succeeds and changes nothing. A name that a different Session has gives the exit code 1. An ended Session cannot get a new name: the exit code is 2.

### `nomux send`

Types text or keys into a Session, as if you typed them. A script uses it to give a command to a shell or a prompt to an agent.

```text
Usage: nomux send [OPTIONS] <TARGET TEXT>...

Arguments:
  <TARGET TEXT>...  The session, and then the text: its words with one space between them. With -t, only the text

Options:
      --json         Print the result as one JSON document
      --no-enter     Do not press Enter after the text
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -k, --keys         The words are key names, for example C-c, Enter, Up or F5. No Enter follows
  -h, --help         Print help
```

`send <target> <text>...` writes the words of the text with one space between them to the terminal of the Session, and then Enter (a carriage return). The bytes go in one request, thus they stay together.

```sh
nomux send api 'cargo test'               # types it and presses Enter
nomux send -k api C-c                     # interrupt
nomux send --no-enter api 'draft' && nomux send -k api Enter
```

- `--no-enter` sends the text without Enter.
- `-k`, `--keys`: the words are key names, without Enter after them: `Enter`, `Escape`, `Tab`, `S-Tab`, `Space`, `BSpace`, `Up`, `Down`, `Left`, `Right`, `Home`, `End`, `PgUp`, `PgDn`, `F1` to `F12`, `C-<letter>` and `M-<character>`. These are the names of tmux. A cursor key has the sequence of the normal cursor mode. A name that the command does not know gives the exit code 1 and sends nothing.
- A text with a line break gives the exit code 1 and sends nothing: send one line at a time.
- `send` writes at once: it does not wait until the program is ready. A dormant Session gives the exit code 1 (`send` does not start a Session), an ended Session the exit code 2.
- The output is empty. With `--json`, the document has the number of bytes that the Session got.

```console
$ nomux send shell 'echo hello from api'
$ nomux --json send shell 'echo json'
{"schema_version":1,"sent":{"id":"tznoru4a","bytes":10}}
$ nomux send -k shell Foo
nomux: "Foo" is not a key name: give Enter, Escape, Tab, S-Tab, Space, BSpace, Up, Down, Left, Right, Home, End, PgUp, PgDn, F1 to F12, C-<letter> or M-<character>
$ nomux send shell 'a
b'
nomux: the text has a line break: send one line at a time, or each key with -k
$ nomux send d1 x
nomux: session hcdtllok is dormant: its command does not run. Run `nomux start hcdtllok`
```

`bytes` is 10 for `echo json` with the Enter: 9 characters and one carriage return.

## Workspace commands

These commands change and list the workspace tree of the Host: the Groups and the Projects. A Project is a directory of the Host with a name. A Group holds Projects and other Groups. [Projects and Groups](/docs/guides/projects-and-groups/) shows them in use, and the [glossary](/docs/reference/glossary/) has the terms.

A `<node>` is the identifier of a node, or its path: the names from the top level down to the node, with `/` between them, for example `Client work/Acme/acme-web`. The name alone is also accepted if one node has it. If more than one node has the name or the path, the command fails with the exit code 1 and lists the identifier and the path of each one. A node that does not exist gives the exit code 2.

```console
$ nomux project rm x
nomux: "x" names 2 nodes: give the identifier of one
  volerxuenal5  x
  uqzcby6awmib  x
$ nomux project rm nothing
nomux: no node of the workspace tree has the identifier, the path or the name "nothing"
```

A change prints one line: what changed, the identifier, the path after the change and the revision of the tree. The tree has a revision that each change increases by 1. `--quiet` prints the identifier. A daemon that is older than these commands answers with an error, and the exit code is 1.

### `nomux project`

```text
Usage: nomux project [OPTIONS] <COMMAND>

Commands:
  add  Add a directory of the host as a Project. In a git repository on the local host, the Project is the root of the repository
  rm   Remove a Project from the workspace tree. No file and no session changes
  ls   List the Projects

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```text
Usage: nomux project add [OPTIONS] [DIRECTORY]

Arguments:
  [DIRECTORY]  The directory [default: the current directory; with --host, it is necessary and absolute]

Options:
      --json          Print the result as one JSON document
      --name <NAME>   The name of the Project [default: the last part of the directory]
      --group <NODE>  The Group of the Project [default: the top level]
  -q, --quiet         Print only the necessary part of the result
      --host <NAME>   Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help          Print help
```

`project rm <node>` has one argument, and `project ls` has none. The options are the three common options.

- `project add` without a directory adds the current directory. On the local Host, a directory in a git repository adds the root of the repository. With `--host`, give the directory as an absolute path on the remote Host.
- The daemon resolves the symbolic links of the directory, and it refuses a directory that a Project has already. The default name is the last part of the directory.
- `project rm` removes only the Project from the tree. No file and no Session changes.

```console
$ nomux project add src/acme-web --group "Client work/Acme"
added project 55pjgf4rwq2c: Client work/Acme/acme-web (revision 3)
$ nomux project add src/repo/sub
added project jirgzmcfrf46: repo (revision 19)
$ nomux project add src/acme-web
nomux: the Project 55pjgf4rwq2c has the directory /home/user/src/acme-web already
$ nomux project add /nonexistent
nomux: the directory /nonexistent cannot be used: No such file or directory (os error 2)
$ nomux project ls
ID            PROJECT                    DIRECTORY
2cxs4kkr6ei4  Client work/Acme/notes     /home/user/src/notes
55pjgf4rwq2c  Client work/Acme/acme-web  /home/user/src/acme-web
e5k6uikywno6  Client work/Acme/acme-api  /home/user/src/acme-api
$ nomux project rm "Client work/Acme/acme-api"
removed project e5k6uikywno6: Client work/Acme/acme-api (revision 22)
```

`src/repo/sub` is a directory in a git repository. The Project is the root of the repository, `src/repo`. The outputs come from more than one run of the same Host.

### `nomux group`

```text
Usage: nomux group [OPTIONS] <COMMAND>

Commands:
  new     Make an empty Group
  rename  Give a Group or a Project a new name
  move    Put a Group or a Project in a different Group, at the top level, or at a different position
  rm      Remove a Group. Its content takes its place: no Project and no Group in it goes away
  ls      List the Groups

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```text
Usage: nomux group new [OPTIONS] <NAME>

Arguments:
  <NAME>  The name of the Group

Options:
      --in <NODE>    The Group of the new Group [default: the top level]
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```text
Usage: nomux group move [OPTIONS] <--to <NODE>|--top|--before <NODE>|--after <NODE>> <NODE>

Arguments:
  <NODE>  The Group or the Project: its identifier or its path

Options:
      --json           Print the result as one JSON document
      --to <NODE>      The new Group
  -q, --quiet          Print only the necessary part of the result
      --top            Put the node at the top level
      --before <NODE>  Put the node before this sibling
      --host <NAME>    Use the daemon of a remote host of `nomux host ls` [default: the local host]
      --after <NODE>   Put the node after this sibling
  -h, --help           Print help
```

`group rename <node> <name>` and `group rm <node>` have the arguments that their names say, and `group ls` has the option `--tree`: `Show the full tree: each Group with its Groups and Projects`.

- `group rename` and `group move` take a Group or a Project.
- `group move` needs `--to`, `--top`, `--before` or `--after`. `--before <node>` and `--after <node>` put the node next to a sibling. Without `--to` and `--top`, the node goes to the Group of that sibling. A move of a Group into itself or into a Group below it fails with the exit code 1.
- `group rm` removes only the Group: its Groups and Projects take its place in its parent. A Project is not a Group: `group rm` of a Project fails with the exit code 1.
- `group ls` prints the identifier and the path of each Group. With `--tree`, it prints each node below its Group, indented two spaces for each level, with its kind, its identifier and the directory of a Project. `--quiet` prints the identifiers.

```console
$ nomux group new "Client work"
made group hehffp4j3m7w: Client work (revision 1)
$ nomux group new Acme --in "Client work"
made group teeb7aeyjpg3: Client work/Acme (revision 2)
$ nomux project add src/notes
added project 2cxs4kkr6ei4: notes (revision 5)
$ nomux group move notes --to Acme --before acme-web
moved 2cxs4kkr6ei4: Client work/Acme/notes (revision 6)
$ nomux group move Acme --to Acme
nomux: a Group cannot move into itself or into a Group below it
$ nomux group rename acme-api acme-backend
renamed e5k6uikywno6: Client work/Acme/acme-backend (revision 7)
$ nomux group rm acme-web
nomux: 55pjgf4rwq2c is a Project, not a Group
$ nomux group ls
ID            GROUP
hehffp4j3m7w  Client work
teeb7aeyjpg3  Client work/Acme
$ nomux group ls --tree
NAME          KIND     ID            DIRECTORY
Client work   group    hehffp4j3m7w  -
  Acme        group    teeb7aeyjpg3  -
    notes     project  2cxs4kkr6ei4  /home/user/src/notes
    acme-web  project  55pjgf4rwq2c  /home/user/src/acme-web
    acme-api  project  e5k6uikywno6  /home/user/src/acme-api
```

`nomux status --tree` shows the same tree with the status of its Sessions: refer to [`nomux status`](#nomux-status). `nomux events --follow --filter workspace-changed` prints each change of the tree.

## Daemon commands

### `nomux daemon status`

Shows if the daemon runs, if the operating system applies a memory limit to a Session, and the path of the configuration file. The exit code is 0 if a daemon runs and 2 if no daemon runs. The command starts no daemon.

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
nomuxd 0.5.0 runs: process ID 4128206, 1 session
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
configuration file: /home/user/.config/nomux/config.toml
```

- The `memory limit:` line says how the operating system of the Host applies `sessions.memory_limit`, or that it applies none. The Host of this example is Linux with a systemd user manager. [Session memory](/docs/guides/session-memory/) has the cases.
- The `configuration file:` line has the path of the global configuration file that the daemon reads at its start. The line is there also if no daemon runs, and only on the local Host: with `--host`, the command does not show the path. The CLI computes the path from its own environment. A daemon that started with a different `HOME` or `XDG_CONFIG_HOME`, for example from a service file, can read a different file.
- `--quiet` prints nothing. The exit code is the result.

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
$ nomux daemon install-service --dry-run
# /home/user/.config/systemd/user/nomuxd.service
[Unit]
Description=nomux daemon
Documentation=https://nomux-sh.github.io/docs/

[Service]
ExecStart="/home/user/.local/bin/nomuxd" --replace
KillMode=process
Restart=on-failure

[Install]
WantedBy=default.target
$ nomux daemon install-service
wrote /home/user/.config/systemd/user/nomuxd.service
To start the daemon at each login, run: systemctl --user daemon-reload && systemctl --user enable --now nomuxd.service
```

The page replaced the directory of the `nomuxd` binary of the run by `/home/user/.local/bin`.

- The command writes only in the configuration directories of the user: `$XDG_CONFIG_HOME/systemd/user` or `~/.config/systemd/user` on Linux, `~/Library/LaunchAgents` on macOS. It needs no `sudo`.
- It starts no program. Its output has the command that gives the file to the service manager.
- `nomuxd` must be in the directory of `nomux`: the file has its path.

[After a restart](/docs/guides/after-a-restart/#start-the-daemon-at-login) explains the lines of the file.

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
would remove /home/user/.config/systemd/user/nomuxd.service
$ nomux daemon uninstall-service
removed /home/user/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
$ nomux daemon uninstall-service
no service file: /home/user/.config/systemd/user/nomuxd.service does not exist
```

The exit code is 0 also when the file does not exist. The daemon that runs continues.

## Host commands

These commands manage the remote Hosts of the configuration file on your computer. [Remote hosts](/docs/guides/remote-hosts/) describes the connection, the trust rules and what nomux writes on a Host.
The commands that connect to a Host (`host add`, and `host doctor` with a Host) were not run for this page. No remote Host was available, and SSH to this computer refuses the key of the run. Their description comes from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) of nomux 0.5.0.

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
no hosts
```

With a Host, the output is a table with the columns `NAME` and `SSH`.

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
nomux: no host has the name vps
```

If the file does not have the name, the exit code is 2. With the name of a Host, the command prints `host vps removed`.

### `nomux host doctor`

Checks the connection, the platform, the binaries, the permissions and the daemon of a Host, and shows if its operating system applies a memory limit. The command changes nothing on a Host.

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

The checks are `connection`, `platform`, `binaries`, `permissions`, `daemon` and `versions`. [Check a Host](/docs/guides/remote-hosts/#check-a-host) says when each one passes. `host doctor` has one more check, `memory-limit`: it shows, as `daemon status` does, how the operating system of the Host applies `sessions.memory_limit`. The binary of the CLI has the name of this check. The check was not run for this page, and the product reference does not list it in its table of the checks. The exit code is 0 if each check of each Host passed, and 1 if a check failed.

```console
$ nomux host doctor
no hosts
$ nomux host doctor vps
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
```

The second command has the exit code 2.

## Extension commands

These commands use the extension host of the daemon. [Extensions](/docs/guides/extensions/) shows them in use. The examples use the two official extensions of nomux 0.5.0, in the packages of their releases: `nomux.agent-claude` (the adapter of Claude Code) and `nomux.git`.

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
ID                  NAME                 VERSION  STATE    PERMISSIONS                             REASON
nomux.agent-claude  Claude Code adapter  0.1.0    running  scope=hooks:read,scope=agent:report
nomux.git           Git                  0.1.0    stopped  fs=/home/user/src/acme-web,process=git
```

Without an extension, the command prints `no extensions`. The `running` state of `nomux.agent-claude` is there because a Session sent hook events to it a moment before: the process stops after 60 seconds without a call.

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
$ nomux ext install ./nomux-git
nomux: the extension nomux.git 0.1.0 asks for these permissions:
  fs=${worktree}
  process=git
Nothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>
$ nomux ext install ./nomux-git --grant-all --grant fs=/home/user/src/acme-web
extension nomux.git 0.1.0 installed with the permissions: fs=/home/user/src/acme-web process=git
$ nomux ext install ./nomux-git --grant-all
nomux: the extension `nomux.git` is already installed
```

The first command has the exit code 4, and the third has the exit code 1. The exit code is 1 for a `--grant` that the manifest does not ask for, a manifest that is not valid and an extension that is already installed. Nothing is installed then.
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
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext rm nomux.git
nomux: no extension has the identifier nomux.git
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
$ nomux ext disable nomux.git
extension nomux.git disabled
$ nomux ext enable nomux.git
extension nomux.git enabled
$ nomux ext enable nomux.none
nomux: no extension has the identifier nomux.none
```

`enable`, `disable` and `rm` have the exit code 2 if no extension has the identifier.

### `nomux ext call`

Calls a method of an extension and writes the payload of its result to the standard output, with no other byte. If the process of the extension does not run, the daemon starts it. The command is for scripts and tests.

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

The payload of the call and the payload of the result are bytes. The method of the extension specifies their encoding: nomux does not change them. `--payload <text>` sends the bytes of the text. `--payload @<file>` sends the content of a file. Without the option, the payload is empty. A text that starts with `@` must be in a file.

```sh
nomux ext call nomux.echo echo --payload @request.bin > response.bin
```

The line above shows the form of a call. It was not run: no extension of the run has a method that answers with a payload. This command was run:

```console
$ nomux ext call nomux.git nothing
nomux: the extension answered with an error: the extension has no method `nothing`
```

| Result | Exit code |
|---|---|
| The method gave a result | 0 |
| No extension has the identifier, or the extension answered that it does not have the method or the item | 2 |
| The extension did not answer in 30 seconds, or it answered with its timeout error | 3 |
| The extension answered that it does not have the permission, for example for a host service whose scope the user did not approve | 4 |
| The extension is disabled, its process cannot start or failed, or it answered with a different error | 1 |

The command above has the exit code 2. The other codes of the table were not run.

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
$ nomux ext validate ./bad
extension.toml is not valid:
  `extension.id` must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`
$ nomux ext validate ./nothing
nomux: the file ./nothing/extension.toml does not exist
```

The exit code is 0 for a valid manifest, 1 for a manifest that is not valid and 2 for a directory without the file. The output for a manifest that is not valid has one line for each field, with the path of the field, and goes to the standard output. `./bad` is the manifest of `nomux.git` with the identifier `git`. The command does not check the other files of the package: `ext install` also makes sure that the package has the program of its daemon part.

## Status commands

These commands show what the work in each Session does, waits for or completed. [Agent status](/docs/guides/agent-status/) describes the model, the sources of a status and the rules that merge them. The glossary has the terms: [agent status](/docs/reference/glossary/#agent-status).

The examples of this section come from one daemon with these Sessions:

| Name | Command of the Session | Where its status comes from |
|---|---|---|
| `build` | `sh -c 'nomux status set working "build the docs"; exec sleep 600'` | A self-report of the script. |
| `deploy` | `sh -c 'nomux status set blocked "deploy to production?"; exec sleep 600'` | A self-report of the script, with the state `blocked`. |
| `agent` | `claude`, in the directory of the Project `acme-api` | The adapter. The command is a small script that sends the recorded hook events `SessionStart` and `Stop` of Claude Code with `nomux hook claude <event>`. The adapter is the released `nomux.agent-claude`. |
| `shell` | `sh` | A shell that reports nothing. |

`build` and `deploy` are in the Project `acme-web`, and `agent` is in `acme-api`. `shell` has no Project.

### `nomux status`

Shows the status of each Session: what works, what is done and what needs you.

```text
Usage: nomux status [OPTIONS]
       nomux status <COMMAND>

Commands:
  set  Report the status of the session of this process. The command works only inside a nomux session

Options:
      --json         Print the result as one JSON document
      --tree         Also show the Child work of each session, and the sessions below their Groups and Projects
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Option | Function |
|---|---|
| `--tree` | Shows each Child work as a row below its Session, indented by two spaces for each level. A Child work that no source reports has `-` as its state. It also shows the workspace tree: refer to the list below. |

```console
$ nomux status
  SESSION  COMMAND                                                                 STATE      FOR  MESSAGE
+ agent    claude                                                                  done       2s
! deploy   sh -c nomux status set blocked "deploy to production?"; exec sleep 600  needs you  2s   deploy to production?
  shell    sh                                                                      idle       2s
* build    sh -c nomux status set working "build the docs"; exec sleep 600         working    2s   build the docs
$ nomux status --tree
  NAME          COMMAND                                                                 STATE      FOR  MESSAGE
  shell         sh                                                                      idle       2s
! Client work/                                                                          needs you  2s   deploy to production?
!   Acme/                                                                               needs you  2s   deploy to production?
      notes                                                                             -          -
!     acme-web                                                                          needs you  2s   deploy to production?
!       deploy  sh -c nomux status set blocked "deploy to production?"; exec sleep 600  needs you  2s   deploy to production?
*       build   sh -c nomux status set working "build the docs"; exec sleep 600         working    2s   build the docs
+     acme-api                                                                          done       2s
+       agent   claude                                                                  done       2s
$ nomux --quiet status
pkle3gpq
```

Each row has the mark of the state, the session identifier or name, the command, the state, the time in the state (`FOR`) and the message.

- The rows are in the sequence of the session identifiers. The command prints one row for each Session that is not ended, and for each ended Session that keeps its last Agent run (see below). If there is no Session, it prints `no sessions`.
- A Session that has a name shows its name in place of its identifier. The identifier `pkle3gpq` that `--quiet` printed is the identifier of `deploy`.
- The state of a row is the most urgent status of the Session and of its Child work. `needs you` has the kind of the wait if a source says it: `needs you: permission`, `needs you: question` or `needs you: auth`. A self-report has no kind.
- A hibernated Session has `hibernated: <reason>` as its state, for example `hibernated: request`. The reason is one of the reasons of the note of `ls`.
- The mark: `!` needs you, `x` error, `+` done, `*` working, and no mark for idle.
- A status that the daemon guessed has `(guess)`: for example `working (guess)` for a shell that runs `sleep 600` in the foreground. A guess comes from the prompt marks of the shell or from the foreground program of the terminal, never from a report of a program.
- A result that you saw has `(seen)`, for example `done (seen)`. An attach to a Session marks its results as seen.
- With `--quiet`, the command prints the identifier of each Session that needs you, one on each line. The exit code is 0 in each case.
- With `--json`, the document has the same Sessions. [`status` in the JSON section](#status) has its fields.
- With `--tree`, the Sessions without a Project come first. Then each Group (its name ends with `/`) and each Project of the workspace tree is a row, in the sequence of the tree and indented for each level, with the most urgent status of the Sessions below it. The Sessions of a Project are the rows below it. A Group or a Project without a Session has `-` as its state. The first column has the header `NAME`. A Session that has a Project is in the tree at its Project, and not at the top.
- This page ran `status` and `status --tree` on terminals of 40 to 60 columns: refer to [narrow terminals](#narrow-terminals).

An ended Session keeps its last Agent run: the kept run. `nomux kill` of the Session `agent` of the example above ends it, but its row stays until the daemon removes the Session:

```console
$ nomux kill agent
session agent (c7lsrd6u) ended
$ nomux status
  SESSION  COMMAND                                                                 STATE      FOR  MESSAGE
+ agent    claude                                                                  done       2s
! deploy   sh -c nomux status set blocked "deploy to production?"; exec sleep 600  needs you  2s   deploy to production?
  shell    sh                                                                      idle       2s
* build    sh -c nomux status set working "build the docs"; exec sleep 600         working    2s   build the docs
```

The name of an ended Session is not a target. To see its kept run, give its identifier: `nomux agent explain c7lsrd6u`.

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

- The command reads `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`, which the holder gives to each process of a Session. It connects to the socket of `NOMUX_SOCK`. It starts no daemon, and it does not accept `--host`.
- A report stays until the next one.
- The message is one line of 512 bytes at most, without a control character. A message that is too long, or that has a line feed, gives the exit code 1.
- The exit code 4 means that the command cannot prove its Session: a variable is not set (the command does not run in a Session), the token is wrong, the Session has no process, or its holder is too old to make a token.

This is the output of the five states, run in a Session. The commands ran in a script of the Session, thus the lines are the output of `nomux capture` of that Session:

```console
$ nomux status set working "tests run"
session jys673ho: working
$ nomux status set blocked "run the tests?"
session jys673ho: needs you
$ nomux status set error "2 tests failed"
session jys673ho: error
$ nomux status set idle
session jys673ho: the report is taken back
$ nomux --json status set done "docs built"
{"schema_version":1,"status_set":{"session":"jys673ho","state":"done"}}
```

These are the messages of a message that is not valid, and of the exit code 4:

```console
$ nomux status set done "$(printf 'a\nb')"
nomux: the message must be one line of text without a control character
$ nomux status set done "$(head -c 600 /dev/zero | tr '\0' a)"
nomux: the message has 600 bytes: 512 at most
$ nomux status set working
nomux: NOMUX_SESSION_ID is not set: `nomux status set` works only inside a nomux session
$ NOMUX_TOKEN=0000 nomux status set done
nomux: the status of session jys673ho did not change: the token of the request is not the token of the session
```

The third command ran outside a Session. The other three ran inside a Session. With `--quiet`, the command prints nothing.

### `nomux agent explain`

Shows what each source says about the status of a Session. Use it when a status is not what you expect.

```text
Usage: nomux agent explain [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

The first line is the status of the Session with its source. The list below it has each source in the sequence in which they decide, with what it says and why: the note of the source. A source that reports nothing is in the list too.

```console
$ nomux agent explain build
session w6cnfhab: working for 2s, from self-report; message from self-report: build the docs

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         working: build the docs (a program of the session reported it with `nomux status set`)
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal
```

If the Session has Child work, the output lists it. If an adapter gave details, the output ends with them: the session identifier of the tool and its resume command.

For an ended Session, the command prints its kept run with the resume command of the tool, until the daemon removes the Session. The state comes from the source `session restore`. The identifier is necessary here:

```console
$ nomux agent explain c7lsrd6u
session c7lsrd6u: done for 2s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process

from the adapter:
  tool session: 0b1c0000-0000-4000-8000-000000000001
  resume: claude --resume 0b1c0000-0000-4000-8000-000000000001
```

If no Session matches, or if an ended Session has no kept run, the exit code is 2. With `--quiet`, the command prints nothing. With `--json`, the document is [`agent explain`](#agent-explain).

### `nomux events`

Prints the events of the Host when they come, until a signal stops the command. The only mode is `--follow`, and `-f` is its short name.

```text
Usage: nomux events [OPTIONS] --follow

Options:
  -f, --follow
          Wait for the events. This is the only mode now

      --json
          Print the result as one JSON document

      --filter <TYPE>
          Print only the events of this type. Give the option more than one time for more types

          Possible values:
          - agent-run-changed:            The status of a session or of its Child work changed
          - agent-run-removed:            A session ended or was removed
          - extension-event:              The daemon part of an extension sent an event
          - workspace-changed:            The workspace tree of the Groups and the Projects changed
          - session-hibernated:           The daemon hibernated a session
          - session-woken:                A wake started the resume command of a session
          - session-wake-failed:          A wake of a session failed
          - session-memory-limit-reached: The operating system ended a session at its memory limit

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
| `-f`, `--follow` | Subscribes to the events and prints each one when it comes. |
| `--filter <type>` | Prints only the events of one type. The eight types are in the help text above. Give the option more than one time for more types. A snapshot is always printed. |

This is the text output while a Session ran a script that reports `working`, `blocked` and `done` with `nomux status set`, and while a group was added:

```console
$ nomux events -f
6 workspace revision 27: added 3o24pfzsm2wm "Reviews" at position 1
7 himtzv3l working build the docs
8 himtzv3l needs you deploy to production?
9 himtzv3l done docs built
10 himtzv3l done docs built
```

These are the lines of a hibernation, a wake that failed, a wake, and a Session that ended without a status:

```console
$ nomux events -f
9 c2m2rip4 done
10 c2m2rip4 hibernated (request): 143.0 KiB given back
11 c2m2rip4 did not wake: the session did not start: nomux-holder: cannot start the command: Permission denied (os error 13); resume command: claude --resume 0b1c0000-0000-4000-8000-000000000001
12 c2m2rip4 woke: claude --resume 0b1c0000-0000-4000-8000-000000000001
13 c2m2rip4 idle
14 c2m2rip4 done
15 workspace revision 12: added 56tn4m4hd2fh "Temp" at position 1
16 ugoxmnxj removed
```

The wake failed in this example because the program of the resume command had no execute permission. A Session that reached its memory limit gives this line:

```console
$ nomux events -f --filter session-memory-limit-reached
2 twobx2hm ended at its memory limit of 64.0 MiB
```

- The command prints the events after its start. A snapshot comes when the daemon does not have the events that the command needs.
- A line is `<seq> <session> <state> <message>` for a change, `<seq> <session> removed` for a Session that ended or was removed, `<seq> extension <id>: <name> (<n> bytes)` for an event of an extension, `<seq> workspace revision <revision>: <change>` for a change of the workspace tree, and `<seq> snapshot: ...` for a snapshot. The four Session events have these texts: `hibernated (<reason>): <memory> given back`, `woke: <resume command>`, `did not wake: <reason>; resume command: <command>` and `ended at its memory limit of <limit>`.
- The text has no source: the second `done` line comes when the command of the Session ended and the source changed from `self-report` to `session restore`. The JSON document of the event has the source.
- `<seq>` is the position of the event in the event log of the daemon. It starts again when the daemon starts again.
- With `--quiet`, the output is the same lines.
- The exit code is 0 when `SIGINT` (Ctrl-C) or `SIGTERM` stops the command, when the daemon closes the connection (for example after `nomux daemon stop`), and when the reader of the standard output closes it.

With `--json`, each line is one JSON document (NDJSON). With a filter, the command prints only the events of the types that the filter names. These are `nomux events -f --json` lines of the hibernation example above, and a filtered command:

```console
$ nomux events -f --json
{"schema_version":1,"event":{"seq":10,"at_ms":1795705965272,"type":"session_hibernated","session":"c2m2rip4","hibernation":{"reason":"request","freed_bytes":146432,"measure":"pss"}}}
{"schema_version":1,"event":{"seq":11,"at_ms":1795705965578,"type":"session_wake_failed","session":"c2m2rip4","hibernation":{"resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001","error":"the session did not start: nomux-holder: cannot start the command: Permission denied (os error 13)"}}}
{"schema_version":1,"event":{"seq":12,"at_ms":1795705965884,"type":"session_woken","session":"c2m2rip4","hibernation":{"resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001"}}}
$ nomux events -f --json --filter workspace-changed
{"schema_version":1,"event":{"seq":15,"at_ms":1795705968429,"type":"workspace_changed","workspace":{"revision":12,"change":"added","node":{"id":"56tn4m4hd2fh","parent_id":null,"name":"Temp","kind":"group"},"index":1}}}
$ nomux events -f --json --filter session-memory-limit-reached
{"schema_version":1,"event":{"seq":2,"at_ms":1795705996506,"type":"session_memory_limit_reached","session":"twobx2hm","hibernation":{"limit_bytes":67108864}}}
```

The first command shows three of the lines that it printed. The commands of this section that were not run for this page: the line of an `extension-event` and of a `snapshot`, and the `session-hibernated` events of the other triggers (`count`, `session-memory`, `total-memory` and `memory-pressure`). The adapter of Claude Code sends no event of an extension, and the daemon sends a snapshot only to a client that is too far behind.

## Hook commands

An agent tool, for example Claude Code, runs a command at each event of its work. For nomux this command is `nomux hook <tool> <event>`. An adapter extension of the tool turns the events into a status. [Agent adapters](/docs/guides/agent-adapters/) describes the path of an event, and [Claude Code](/docs/guides/claude-code/) shows the hooks of Claude Code in use.

The examples of this section use the adapter of Claude Code of nomux 0.5.0 (`nomux.agent-claude` 0.1.0, installed with `nomux ext install ./claude-adapter --grant-all`). The settings file is `~/.claude/settings.json` of the home directory of the run. The file had one hook of its own before the first example:

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

`hooks install` writes the call into the settings file of the tool. You do not type this command yourself. Inside a Session, this is the call for one event with the data of the event on the standard input:

```console
$ echo '{}' | nomux hook claude Stop
$ echo $?
0
```

The command prints nothing: in this version the answer for the tool is empty.

- The command reads the data of the event from the standard input: 256 KiB at most, until its end or for 40 ms at most. A larger input goes without its data. A terminal is no input.
- It reads `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`, connects to the socket of `NOMUX_SOCK` and sends one request. It starts no daemon, no shell and no other process. `--host` has no effect.
- A hook must not block or break its tool: **the exit code is always 0**. Outside a Session, without a daemon, and when the daemon does not answer in 80 ms after the start of the command, the command ends with no output. The daemon answers the hook before the adapter gets the event.
- If the daemon refuses the event, for example for a wrong token, the command writes one line to the standard error. The exit code stays 0. This line is the output of a Session that ran `echo '{}' | NOMUX_TOKEN=wrong nomux hook claude Stop`:

```console
$ nomux capture hooktest
nomux hook: the hook event of session pfcf3iui was refused: the token of the request is not the token of the session
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

The command asks the adapter for its install plan, computes the new content of the settings file and prints it as a unified diff. The diff of the Claude Code adapter has one hook for each event of Claude Code. The output has 263 lines. The first command below shows its first 24 lines with `| head -24`, and the second one shows the last line of the output:

```console
$ nomux hooks install claude | head -24
--- /home/user/.claude/settings.json
+++ /home/user/.claude/settings.json
@@ -10,6 +10,259 @@
             "args": ["done"]
           }
         ]
+      },
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "nomux",
+            "args": [
+              "hook",
+              "claude",
+              "Stop"
+            ]
+          }
+        ]
+      }
+    ],
+    "SessionStart": [
+      {
+        "hooks": [
$ nomux hooks install claude | tail -1
dry run: nothing is written. Add --apply to write the change
```

The command changes only the text that it adds, at the positions of the values in the file. Each other byte stays: the order of the keys, the indent, the spacing and the end of the file. The line `"args": ["done"]` of the hook of the user is the same line in the diff, and the new hook for `Stop` comes after it. A new entry gets the indent of the file (tabs or spaces), and it stays on one line in an object or a list that is on one line. This page ran the command on the file above (two spaces), on a file in one line (`{"model":"sonnet","hooks":{"Stop":[]}}`) and on a file with tabs. The result has the same form as the file in each case.

With `--apply`, the command prints the same diff and writes the file. The last line says it:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /home/user/.claude/settings.json
$ nomux hooks install claude --apply
the hooks of claude are installed in /home/user/.claude/settings.json: nothing to change
```

- `--dry-run` is the default and says it again. `--dry-run` and `--apply` cannot be used together: the exit code is 1.
- A temporary file in the same directory replaces the settings file, and a symbolic link stays a link. A value that the file has already is not added again: the second command above changes nothing and has the exit code 0.
- A file that does not exist is made: the diff then starts with `--- /dev/null`.
- `--apply` also writes a record to `hooks/<tool>/` in the data directory of nomux (`~/.local/share/nomux` on Linux, `~/Library/Application Support/nomux` on macOS): the bytes of the file before the install, the checksum of the written file and the entries.
- Without an adapter for the tool, the exit code is 2: `nomux: no extension is the adapter of the tool nosuchtool`. A settings file that is not JSON gives the exit code 1 and `nomux: the settings file /home/user/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed`. Nothing is written in these cases.

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
- If the file changed, only the entries of nomux go away, with each list and object that the install made and that has no other value then. A list or an object that the file had before the install stays. The other changes of the file stay too.

```console
$ nomux hooks uninstall claude | tail -1
dry run: nothing is written. Add --apply to write the change
$ nomux hooks uninstall claude --apply | tail -1
/home/user/.claude/settings.json has its content from before the install again
$ nomux hooks uninstall claude --apply
nomux: nomux did not install the hooks of claude
```

The exit code of the last command is 2: nomux did not install the hooks of the tool, thus it has no record.

If you changed the file after the install, the message of the second command is different. This run added the line `"theme": "dark"` to the file after the install:

```console
$ nomux hooks uninstall claude --apply | tail -1
/home/user/.claude/settings.json changed after the install: only the entries of nomux are removed
```

The file then had the line `"theme": "dark"` and the hook of the user, and no hook of nomux.

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
claude  nomux.agent-claude  missing in /home/user/.claude/settings.json
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /home/user/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /home/user/.claude/settings.json
```

| State | Meaning |
|---|---|
| `installed` | The settings file has each entry of the install plan. |
| `missing` | The settings file has none of the entries, or does not exist. |
| `different` | The settings file has some of the entries of the install plan, and the install would add the others. |
| `not known` | nomux cannot read the settings file. The text says why, for example for a file that is not JSON. |

This page did not run the state `different`. A settings file with the text `{ bad` gave this row:

```console
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  not known: the settings file /home/user/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed
```

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
nomux 0.5.0
$ nomux version --quiet
0.5.0
```

## Quiet output

With `--quiet`, a command prints only what a script needs.

| Command | Standard output |
|---|---|
| `new` | The session identifier |
| `ls` | One session identifier on each line |
| `capture` | The output lines, as without `--quiet` |
| `capture -f` | The output, as without `--quiet` |
| `host ls` | One Host name on each line |
| `ext ls` | One extension identifier on each line |
| `status` | One session identifier on each line of a Session that needs you |
| `events --follow` | The lines of the text output |
| `ext call` | The payload of the result, as without `--quiet` |
| `version` | The version number |
| `project add`, `project rm`, `group new`, `group rename`, `group move` and `group rm` | The identifier of the node |
| `project ls`, `group ls` and `group ls --tree` | One identifier of a node on each line |
| `new --attach`, `attach`, `start`, `restore-policy`, `detach`, `hibernate`, `wake`, `pin`, `unpin`, `kill`, `rename`, `send`, `daemon status`, `daemon stop`, `daemon install-service`, `daemon uninstall-service`, `host add`, `host rm`, `host doctor`, `ext install`, `ext rm`, `ext enable`, `ext disable`, `ext validate`, `status set`, `agent explain` | Nothing. The exit code is the result |

```console
$ nomux ls --quiet
7vyxpmt3
plhommva
qghxx5rq
tvomf5br
uistajr3
wzr5kzyq
$ nomux --quiet group ls --tree
hehffp4j3m7w
teeb7aeyjpg3
2cxs4kkr6ei4
55pjgf4rwq2c
e5k6uikywno6
```

## Errors

An error goes to the standard error as `nomux: <message>`, and the standard output stays empty.
The text of a message is not stable. A script must use the exit code.

A wrong command line prints the usage message of the argument parser and has the exit code 1:

```console
$ nomux --json --quiet ls
error: the argument '--json' cannot be used with '--quiet'

Usage: nomux --json
...
```

The page shortens the output after the first line of the usage message.

## Exit codes

| Code | Name in JSON | Meaning |
|---:|---|---|
| 0 | | Success |
| 1 | `error` | An error that has no other code, also a wrong command line, a target that can be more than one Session, a session name that is not valid or in use, a command that needs a target and got neither a target nor `--all` (`kill` without a target), a Session that cannot hibernate, a wake that failed, a Session that is not hibernated, a text or a key name that `send` refuses, an answer other than `y` to the question of `kill --all` (or no `--yes` without a terminal), a prefix key that is not valid, a node that more than one node of the workspace tree names, an SSH connection that cannot be made, a host key that is not trusted, a check of `host doctor` that failed, a dormant Session that cannot start, a manifest that is not valid, an extension that failed, a message of `status set` that is not valid, and a settings file that `hooks install` cannot change |
| 2 | `not_found` | The item does not exist: no Session matches the target, the command of the Session ended (an ended Session cannot get `start`, `send`, `rename`, `kill` or `detach`), an ended Session has no kept run (`agent explain`), no node of the workspace tree matches, no Host has the name, no extension has the identifier, nomux did not install the hooks of a tool (`hooks uninstall`), no extension is the adapter of a tool (`hooks install`), or no daemon runs (`daemon status`) |
| 3 | `timeout` | An operation did not complete in the permitted time: the daemon did not answer after its start, a Session was not ready, a command did not end, or an extension did not answer |
| 4 | `no_permission` | The user does not have permission, for example for the socket of the daemon, or a remote Host accepted no key. Also `ext install` without an approval of the permissions, an extension that does not have a permission, and a `status set` that cannot prove its Session |
| 5 | `version_mismatch` | The CLI and the daemon have no common protocol version. Update the older of the two |

The exit code of `hook` is 0 for each event, also when it cannot send the event: a hook must not break its tool. Only a wrong command line has the exit code 1. `attach`, `new --attach` and bare `nomux` on a terminal have one more source of the exit code: if the Session ends during the attach, the exit code is the exit status of its command. Refer to [how an attach ends](#how-an-attach-ends). Bare `nomux` without a terminal has the exit code 1.

## JSON output

With `--json`, a command prints one JSON document on one line.

- On success, the document goes to the standard output.
- On an error, the standard output stays empty and the document goes to the standard error. It has the field `error`.
- Each document has the field `schema_version`. The current value is `1`.

**Schema version rule.** The value increases when a field is removed, gets a different name or gets a different meaning.
A new field does not increase the value. Thus a reader must ignore the fields that it does not know.

### `new`, `start`, `hibernate` and `wake`

```json
{"schema_version":1,"session":{"id":"lkxpxrp4","name":"agent","state":"dormant","pid":null,"command":["claude"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","hibernation":{"hibernated_at":1795706411,"reason":"request","freed_bytes":147456,"measure":"pss","resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001","woken_at":null,"wake_error":null}}}
```

This document is the output of `nomux --json hibernate agent`. `nomux --json new -n api -- sleep 600` has the same fields without `hibernation`.

| Field | Type | Meaning |
|---|---|---|
| `session.id` | string | The session identifier |
| `session.name` | string or `null` | The session name. `null` if the Session has no name, and from an older daemon |
| `session.state` | string | `running`, `unreachable`, `dormant`, `ended`, `damaged` or `unknown` |
| `session.pid` | number or `null` | The process ID of the command. `null` if the Session has no process or the daemon does not know it |
| `session.command` | array of strings | The program of the command and its arguments. Empty if the daemon does not know them. A byte sequence that is not UTF-8 has U+FFFD in its place |
| `session.cwd` | string or `null` | The working directory of the command |
| `session.rows`, `session.columns` | number or `null` | The window size of the Session |
| `session.started_at` | number or `null` | When the command started in the current epoch: seconds after the Unix epoch |
| `session.epoch` | number or `null` | The epoch of the Session: 1 for a new Session, and 1 more after each restore |
| `session.restore_policy` | string or `null` | `auto`, `on-focus` or `manual`. `null` for a policy that the CLI does not know |
| `session.exit` | object | Only if `state` is `ended`: `ended_at` (seconds after the Unix epoch), and `exit_code` or `signal`. The object has neither of the two if the daemon does not know how the command ended |
| `session.damage` | string | Only if the description of the Session is damaged: the reason, in English for a person. The text is not stable |
| `session.hibernation` | object | Only if the Session hibernated: `hibernated_at` (seconds after the Unix epoch), `reason` (`count`, `session-memory`, `total-memory`, `memory-pressure`, `request` or `unknown`), `freed_bytes` and `measure` (`null` if the daemon did not measure), `resume_command`, `woken_at` (`null` while the Session is hibernated, else the time of the wake of the current run) and `wake_error` (`null`, or why the last wake failed). A hibernated Session has the `state` `dormant` |
| `session.pinned` | boolean | Only if it is `true`: the Session is excluded from automatic hibernation |

A field is `null`, or `command` is empty, when the daemon does not know the value: for a damaged Session, and for a Session of a holder that is too old to write the description. The document never has the environment of the command. A pinned Session has the field `"pinned":true`. This page did not run the state `damaged`.

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"5zlqlabj","name":"api","state":"running","pid":4058606,"command":["sleep","600"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","project":{"id":"55pjgf4rwq2c","path":"Client work/Acme/acme-web"}},{"id":"tfbjezgs","name":null,"state":"dormant","pid":null,"command":["sleep","300"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","project":null}]}
```

`sessions` is an array of the object that `new` gives, in the sequence of the identifiers, with one more field: `project`, the Project of the Session (`id` and `path`), or `null` if the Session has no Project. It is empty if there is no Session. An ended Session is in the array only with `--all`: it has the field `exit`. The example is a part of a longer document: the page left out the hibernated Session `agent` (its entry has the `hibernation` object above).

### `ls --memory`

```json
{"schema_version":1,"sessions":[{"id":"5zlqlabj","name":"api","state":"running","pid":4058606,"command":["sleep","600"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","memory":{"command_bytes":147456,"command_processes":1,"holder_bytes":285696,"measure":"pss","limit_bytes":4294967296}},{"id":"lkxpxrp4","name":"agent","state":"dormant","pid":null,"command":["claude"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","hibernation":{"hibernated_at":1795706411,"reason":"request","freed_bytes":147456,"measure":"pss","resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001","woken_at":null,"wake_error":null},"memory":null},{"id":"tfbjezgs","name":null,"state":"dormant","pid":null,"command":["sleep","300"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","memory":null}],"memory_total":{"command_bytes":147456,"command_processes":1,"holder_bytes":285696,"sessions":1,"measure":"pss","freed_bytes":147456,"hibernated_sessions":1}}
```

The document is the document of `ls` with one more field in each Session and one more field at the top. Without `--memory`, the document has neither of the two. The Sessions of this document have no `project` field, although the document of `ls` has it: this is a difference between `ls --memory --json` and the product reference, which says that the document of `ls --memory` is the document of `ls` with the fields above.

| Field | Type | Meaning |
|---|---|---|
| `sessions[].memory` | object or `null` | The memory of the processes of the Session. `null` if the Session has no process |
| `sessions[].memory.command_bytes` | number | The memory of the process tree of the command in bytes, without the holder |
| `sessions[].memory.command_processes` | number | The number of processes in that tree |
| `sessions[].memory.holder_bytes` | number | The memory of the holder of the Session in bytes |
| `sessions[].memory.measure` | string | `pss`, `rss`, or `unknown` for a measure that the CLI does not know |
| `sessions[].memory.limit_bytes` | number or `null` | The memory limit that the operating system applies to the command. `null` if none applies |
| `memory_total.command_bytes`, `memory_total.command_processes`, `memory_total.holder_bytes` | number | The sums of the three values of the Sessions that have a process |
| `memory_total.sessions` | number | The number of Sessions in the sums |
| `memory_total.measure` | string or `null` | The measure of the sums. `null` if the Sessions do not have the same measure, or if no Session has a process |
| `memory_total.freed_bytes`, `memory_total.hibernated_sessions` | number | The memory that the hibernated Sessions gave back, and their number |

### `capture`

```json
{"schema_version":1,"capture":{"id":"tznoru4a","output":"\u001b[?2004l\rq\r\n\u001b[?2004hsh-5.3$ "}}
```

| Field | Type | Meaning |
|---|---|---|
| `capture.id` | string | The session identifier |
| `capture.output` | string | The output lines, with their escape sequences. A byte sequence that is not UTF-8 has U+FFFD in its place. The text output has the bytes without a change |

`capture --follow` has no JSON form: its error has the exit code 1.

### `restore-policy`

```json
{"schema_version":1,"restore_policy":{"id":"kx7edkz2","policy":"on-focus"}}
```

### `attach`, `new --attach` and `new -A`

```json
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","end":"detached"}}
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","created":false,"end":"detached"}}
{"schema_version":1,"attach":{"id":"3axs7avk","name":null,"end":"exited","exit_code":3}}
```

The command prints the document after the attach ended. The document of a Session that ended goes to the standard output, and the exit code is the one of the table in [how an attach ends](#how-an-attach-ends).

| Field | Type | Meaning |
|---|---|---|
| `attach.id` | string | The session identifier |
| `attach.name` | string or `null` | The session name |
| `attach.created` | boolean | Only for `new -A`: `false` if the Session existed |
| `attach.end` | string | `detached`: the client detached and the Session continues. `exited`: the command ended with an exit code. `signaled`: a signal ended the command. `lost`: the Session ended and its exit status is not known. `unknown`: the daemon is newer than the CLI and sent a reason that the CLI does not know |
| `attach.exit_code` | number | The exit code of the command. Only if `end` is `exited` |
| `attach.signal` | number | The signal number. Only if `end` is `signaled` |

### `detach`

```json
{"schema_version":1,"detached":{"id":"wyv5slz3","clients":0}}
```

| Field | Type | Meaning |
|---|---|---|
| `detached.id` | string | The session identifier |
| `detached.clients` | number | The number of clients that were attached to the Session |

### `rename`

```json
{"schema_version":1,"renamed":{"id":"z3jqohga","name":"scratch","previous_name":"sandbox"}}
```

`renamed.name` is the new name. `renamed.previous_name` is the name before the command, or `null`.

### `pin` and `unpin`

```json
{"schema_version":1,"pinned":{"id":"wsqtewka","pinned":true}}
{"schema_version":1,"pinned":{"id":"wsqtewka","pinned":false}}
```

`pinned.pinned` is `true` after `pin` and `false` after `unpin`.

### `kill`

```json
{"schema_version":1,"killed":"5zlqlabj"}
{"schema_version":1,"killed_sessions":["lys4a4lv","potjlxdz"]}
{"schema_version":1,"would_kill":["lys4a4lv","potjlxdz"]}
```

`killed` is the identifier of the Session that ended. `kill --all` gives `killed_sessions`: the identifiers of the Sessions that ended. With `--dry-run`, it gives `would_kill`: the identifiers of the Sessions that would end. Each array is empty if no Session runs.

### `send`

```json
{"schema_version":1,"sent":{"id":"tznoru4a","bytes":10}}
```

`sent.bytes` is the number of bytes that the Session got, with the Enter.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.5.0","pid":4128206,"sessions":1,"configuration":"/home/user/.config/nomux/config.toml","memory_limit":{"applied":true,"detail":"the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax"}}}
{"schema_version":1,"daemon":{"running":false,"configuration":"/home/user/.config/nomux/config.toml"}}
```

| Field | Type | Meaning |
|---|---|---|
| `daemon.running` | boolean | `true` if a daemon runs. If it is `false`, `daemon` has only `configuration` and the exit code is 2 |
| `daemon.version` | string | The product version of the daemon |
| `daemon.pid` | number | The process ID of the daemon |
| `daemon.sessions` | number | The number of Sessions. An ended Session is not counted |
| `daemon.memory_limit` | object | `applied` (`true` if the operating system ends the processes of a Session at its limit) and `detail` (how, or why not, in English for a person). Not in the document of an older daemon |
| `daemon.configuration` | string | The path of the global configuration file of the local Host, also if no daemon runs. Not in the document with `--host`, in the `daemon` object of `host add`, or if `HOME` is not set |

### `daemon stop`

```json
{"schema_version":1,"stopped":false}
```

`stopped` is `true` if a daemon ran and the command stopped it. It is `false` if no daemon ran.

### `daemon install-service` and `daemon uninstall-service`

```json
{"schema_version":1,"service":{"action":"installed","path":"/home/user/.config/systemd/user/nomuxd.service","content":"[Unit]\nDescription=nomux daemon\nDocumentation=https://nomux-sh.github.io/docs/\n\n[Service]\nExecStart=\"/home/user/.local/bin/nomuxd\" --replace\nKillMode=process\nRestart=on-failure\n\n[Install]\nWantedBy=default.target\n"}}
{"schema_version":1,"service":{"action":"would_remove","path":"/home/user/.config/systemd/user/nomuxd.service"}}
{"schema_version":1,"service":{"action":"not_installed","path":"/home/user/.config/systemd/user/nomuxd.service"}}
```

| Field | Type | Meaning |
|---|---|---|
| `service.action` | string | `installed`, `would_install` (a dry run), `removed`, `would_remove` (a dry run) or `not_installed`: the file does not exist, thus nothing was removed |
| `service.path` | string | The path of the service file |
| `service.content` | string | The content of the file. Only for `installed` and `would_install` |

### `host add`

This document comes from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) of nomux 0.5.0. The command was not run for this page.

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
{"schema_version":1,"hosts":[]}
```

`hosts` is in the sequence of the names. It is empty if the configuration file has no Host. A Host is `{"name":"vps","ssh":"deploy@vps.example.com"}`.

### `host rm`

```json
{"schema_version":1,"removed":"vps"}
```

### `host doctor`

This document with a Host comes from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) of nomux 0.5.0. The command was not run with a Host for this page. Without a Host, the document is `{"schema_version":1,"doctor":[]}`.

```json
{"schema_version":1,"doctor":[{"host":"vps","ok":false,"checks":[{"name":"connection","ok":true,"detail":"deploy@vps.example.com port 22, host key ssh-ed25519 SHA256:..."},{"name":"permissions","ok":false,"detail":"~/.nomux/run has the mode drwxr-xr-x: other users can use it. Run `chmod go-rwx ~/.nomux/run` on the host"}]}]}
```

| Field | Type | Meaning |
|---|---|---|
| `doctor` | array | One object for each Host that the command checked |
| `doctor[].host` | string | The name of the Host |
| `doctor[].ok` | boolean | `true` if each check of the Host passed |
| `doctor[].checks[].name` | string | `connection`, `platform`, `binaries`, `permissions`, `daemon`, `versions` or `memory-limit` |
| `doctor[].checks[].ok` | boolean | `true` if the Host passed the check |
| `doctor[].checks[].detail` | string | A text in English for a person: what the check found, or the reason and what to do. The text is not stable |

The document goes to the standard output also when a check failed. The exit code is 1 then.

### `ext ls`

```json
{"schema_version":1,"extensions":[{"id":"nomux.agent-claude","name":"Claude Code adapter","version":"0.1.0","state":"running","reason":null,"permissions":{"fs":[],"process":[],"network":false,"scopes":["hooks:read","agent:report"]}},{"id":"nomux.git","name":"Git","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":["/home/user/src/acme-web"],"process":["git"],"network":false,"scopes":[]}}]}
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
{"schema_version":1,"extension":{"id":"nomux.git","name":"Git","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":["/home/user/src/acme-web"],"process":["git"],"network":false,"scopes":[]}}}
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

This document comes from the product reference and was not run for this page: no extension of the run answered a method with a payload.

| Field | Type | Meaning |
|---|---|---|
| `call.extension` | string | The identifier of the extension |
| `call.method` | string | The name of the method |
| `call.payload_base64` | string | The payload of the result in Base64 (RFC 4648, with padding). The payload is bytes in the encoding of the method |

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

### `project` and `group`

A change:

```json
{"schema_version":1,"change":{"type":"renamed","revision":8,"node":{"id":"e5k6uikywno6","parent_id":"teeb7aeyjpg3","name":"acme-api","kind":"project","path":"Client work/Acme/acme-api","directory":"/home/user/src/acme-api"}}}
```

A listing (`project ls`, `group ls`, `group ls --tree`):

```json
{"schema_version":1,"workspace":{"revision":6,"nodes":[{"id":"hehffp4j3m7w","parent_id":null,"name":"Client work","kind":"group","path":"Client work"},{"id":"teeb7aeyjpg3","parent_id":"hehffp4j3m7w","name":"Acme","kind":"group","path":"Client work/Acme"},{"id":"2cxs4kkr6ei4","parent_id":"teeb7aeyjpg3","name":"notes","kind":"project","path":"Client work/Acme/notes","directory":"/home/user/src/notes"}]}}
```

The listing is the output of `nomux --json group ls --tree`, shortened to three of its five nodes.

| Field | Type | Meaning |
|---|---|---|
| `change.type` | string | `project_added`, `project_removed`, `group_created`, `group_removed`, `renamed` or `moved` |
| `change.revision`, `workspace.revision` | number | The revision of the tree after the change, or of the listed tree |
| `change.node` | node | The node after the change. A removed node has its last name and path |
| `workspace.nodes[]` | list of nodes | The Projects (`project ls`), the Groups (`group ls`) or each node (`group ls --tree`), in the sequence of a depth-first walk |

A node has these fields:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | The identifier |
| `parent_id` | string or `null` | The Group of the node. `null` at the top level |
| `name` | string | The name |
| `kind` | string | `group` or `project` |
| `path` | string | The names from the top level down to the node, with `/` between them. Not in an event |
| `directory` | string | Only for a Project: its directory on the Host |

This page ran the value `renamed` of `change.type`. The values `project_added`, `project_removed`, `group_created`, `group_removed` and `moved` come from the product reference.

### `status`

```json
{"schema_version":1,"status":{"attention":{"session":"lkxpxrp4","status":{"state":"done","kind":null,"source":"session_restore","guess":false,"since_ms":1795706408725,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},"sessions":[{"id":"5zlqlabj","name":"api","command":["sleep","600"],"status":{"state":"idle","kind":null,"source":"none","guess":false,"since_ms":1795706408708,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"idle","kind":null,"source":"none","guess":false,"since_ms":1795706408708,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},{"id":"lkxpxrp4","name":"agent","command":["claude"],"status":{"state":"done","kind":null,"source":"session_restore","guess":false,"since_ms":1795706408725,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"done","kind":null,"source":"session_restore","guess":false,"since_ms":1795706408725,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"details":{"model":null,"provider_session_id":"0b1c0000-0000-4000-8000-000000000001","resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001"},"hibernated":"request"}]}}
```

The example is a part of a longer document: the page left out the third Session. With `--tree`, each entry of `status.sessions` has the field `children` before `details`, and the document has the field `status.workspace`.

| Field | Type | Meaning |
|---|---|---|
| `status.attention` | object or `null` | The Session with the most urgent status, and that status. `null` if the Host has no Session |
| `status.sessions[]` | list | One Agent run for each Session that is not ended and for each ended Session that keeps its last Agent run, in the sequence of the identifiers |
| `.id`, `.name`, `.command` | string, string or `null`, list of strings | The Session, its name and its command |
| `.status` | status | The status of the Agent run |
| `.aggregate` | status | The most urgent status of the Agent run and of its Child work |
| `.children[]` | list | Only with `--tree`. Each Child work: `name`, `status` (a status, or `null` if no source reports it), `aggregate` and `children` |
| `.details` | object | Only if an adapter gave them: `model`, `provider_session_id` and `resume_command`, each a string or `null` |
| `.hibernated` | string | Only for a hibernated Session: the reason of the hibernation |
| `status.workspace[]` | list | Only with `--tree`. Each node of the workspace tree, with the fields of a node of `project ls`, and `aggregate`: the most urgent status of the Sessions below it, or `null`; and `sessions`: the identifiers of the Sessions of a Project, empty for a Group |

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
{"schema_version":1,"status_set":{"session":"jys673ho","state":"done"}}
```

### `agent explain`

```json
{"schema_version":1,"explain":{"session":"w6cnfhab","run":{"id":"w6cnfhab","status":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795706743545,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795706743545,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"children":[]},"sources":[{"source":"adapter","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"no adapter extension reported a status"},"..."]}}
```

The page shortens the list `sources` after its first entry. `explain.run` has the fields of an entry of `status.sessions` with its Child work, without `name` and `command`. `explain.sources` has each source in the sequence in which they decide. `reported` is `false` for a source that says nothing: then `state`, `kind` and `message` are `null`, and `note` says why. The text of a note is not stable.

### `events --follow`

Each line is one document:

```json
{"schema_version":1,"event":{"seq":16,"at_ms":1795705968438,"type":"agent_run_removed","session":"ugoxmnxj"}}
{"schema_version":1,"event":{"seq":10,"at_ms":1795705965272,"type":"session_hibernated","session":"c2m2rip4","hibernation":{"reason":"request","freed_bytes":146432,"measure":"pss"}}}
{"schema_version":1,"event":{"seq":15,"at_ms":1795705968429,"type":"workspace_changed","workspace":{"revision":12,"change":"added","node":{"id":"56tn4m4hd2fh","parent_id":null,"name":"Temp","kind":"group"},"index":1}}}
{"schema_version":1,"event":{"seq":13,"at_ms":1795670005000,"type":"snapshot"}}
```

The first three lines are real events. The `snapshot` line is the form from the product reference: this page did not run it.

| Field | Type | Meaning |
|---|---|---|
| `event.seq` | number | The position of the event in the event log of the daemon. The numbers start again when the daemon starts again |
| `event.at_ms` | number | When the event occurred: milliseconds after the Unix epoch |
| `event.type` | string | `agent_run_changed`, `agent_run_removed`, `extension_event`, `workspace_changed`, `session_hibernated`, `session_woken`, `session_wake_failed`, `session_memory_limit_reached`, `snapshot`, or `unknown` for an event that the CLI does not know |
| `event.session` | string | The Session. Only in `agent_run_changed`, `agent_run_removed` and the four Session events (`session_hibernated`, `session_woken`, `session_wake_failed` and `session_memory_limit_reached`) |
| `event.run` | object | Only in `agent_run_changed`: the Agent run after the change, with the fields of `explain.run` |
| `event.extension` | object | Only in `extension_event`: `id` (the extension), `name` (the name of the event) and `payload_base64` (the payload in Base64: the extension selects its encoding) |
| `event.workspace` | object | Only in `workspace_changed`: `revision`, and `change`: `added` with `node` (a node without `path`) and `index`, `renamed` with `id` and `name`, `moved` with `id`, `parent_id` and `index`, `removed` with `id`, or `unknown` |
| `event.hibernation` | object | Only in the four Session events: `reason`, `freed_bytes` and `measure` for `session_hibernated`, with the numbers of the trigger (`live_agents` and `max_live_agents`, `memory_bytes` and `memory_limit_bytes`, or `pressure_stall_ms` and `pressure_window_ms`) for the triggers other than `request`; `resume_command` for `session_woken`; `resume_command` and `error` for `session_wake_failed`; `limit_bytes` for `session_memory_limit_reached` |

After a `snapshot`, one `agent_run_changed` event for each Session gives the state of the Host now. A reader discards the state that it had.

### `hook`

The command prints the answer for the tool, not a JSON document, also with `--json`. In this version the answer is empty, thus the output is empty.

### `hooks install` and `hooks uninstall`

The page shortens the value of `diff` after its first line `@@`. The real value has the whole diff.

```json
{"schema_version":1,"hooks_change":{"action":"install","tool":"claude","path":"/home/user/.claude/settings.json","diff":"--- /home/user/.claude/settings.json\n+++ /home/user/.claude/settings.json\n@@ ...","changed":true,"applied":false,"restores_original":false}}
{"schema_version":1,"hooks_change":{"action":"uninstall","tool":"claude","path":"/home/user/.claude/settings.json","diff":"--- /home/user/.claude/settings.json\n+++ /home/user/.claude/settings.json\n@@ ...","changed":true,"applied":true,"restores_original":true}}
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

If the hooks are installed already, `nomux hooks install claude --json` has `"changed":false` and `"applied":false`.

### `hooks status`

```json
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":"installed","path":"/home/user/.claude/settings.json","recorded":true,"problem":null}]}
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":null,"path":null,"recorded":false,"problem":"the settings file /home/user/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed"}]}
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
{"schema_version":1,"version":"0.5.0"}
```

### Error

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier or the name nothing, and no session has a name or an identifier that starts with it"}}
{"schema_version":1,"error":{"code":1,"kind":"error","message":"ap can be more than one session. Give more of the identifier or of the name of one of them:\n  5g2diwdl  api-v2  sh\n  wyv5slz3  api     sleep 600","candidates":[{"id":"5g2diwdl","name":"api-v2","state":"running"},{"id":"wyv5slz3","name":"api","state":"running"}]}}
{"schema_version":1,"error":{"code":4,"kind":"no_permission","message":"the extension nomux.git 0.1.0 asks for these permissions:\n  fs=${worktree}\n  process=git\nNothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>"}}
```

| Field | Type | Meaning |
|---|---|---|
| `error.code` | number | The exit code of the command |
| `error.kind` | string | The name of the exit code from the table in [exit codes](#exit-codes) |
| `error.message` | string | A message in English for a person. The text is not stable |
| `error.candidates` | list | Only for a target that can be more than one Session: each candidate as `id`, `name` (a string or `null`) and `state` |

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

`nomux-holder` prints its usage text in the same way and has the exit code 2. Its options are for the daemon.

## Version of this page

This page describes nomux 0.5.0: the tag [`v0.5.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.5.0) of `nomux-sh/nomux`, commit [`fcdc83c`](https://github.com/nomux-sh/nomux/commit/fcdc83c7d992f5fa7a4810722b391acdf0243f43).
The help texts and the examples are the real output of the binaries of that release on Linux x86_64, in a temporary home directory that the page shows as `/home/user`. The session identifiers and the process IDs come from more than one run. The page replaced the path of the temporary home directory and the directory of the binaries by `/home/user`.
Five things in the examples are not a plain run of the released product:

- The Sessions `agent` and `claude` in the examples of hibernation, status and hooks run a small script, not Claude Code. The script sends the recorded hook events `SessionStart` and `Stop` to the daemon, and then it waits. The adapter extension of Claude Code (`nomux.agent-claude` 0.1.0) is the released package. Thus `hibernate`, `wake` and the `hibernated` rows are real output of the daemon, but the agent is a stand-in. The wake that succeeded started a second script with the name `claude`, and the wake that failed ran on a daemon without a `claude` in its `PATH`.
- The packages of the extension examples are the released `nomux-git` 0.1.0 and `nomux-agent-claude` 0.1.0.
- `nomux hooks install` wrote the settings file of the home directory of the run. It is not the settings file of a real Claude Code.
- The terminal examples (`attach`, the prefix keys, `kill --all` with its question, and the tables on narrow terminals) ran in a pseudoterminal that a script drove.
- The memory examples ran on a Host with `memory_limit = "4G"`, or `"64M"` for the limit that a Session reached, in `[sessions]` of the configuration file.

These parts were not run for this page and come from [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) of the same tag: each command that connects to a remote Host (`host add`, `host doctor` with a Host and its check `memory-limit`, a command with `--host` for a Host that exists), the exit code 3, the exit code 4 for SSH, the exit code 5, the states `unreachable`, `damaged` and `unknown`, the values `lost` and `unknown` of `attach.end`, the end of an attach by a signal for the CLI, the change of the window size during an attach, the reconnect of an attach to a remote Host, the `rss` measure and the total line `pss and rss` of `ls --memory`, the error of `ls --memory`, `new -n` and `rename` for an older daemon, the hibernation triggers `count`, `session-memory`, `total-memory` and `memory-pressure`, the lines of an `extension-event` and of a `snapshot` of `events --follow`, the state `different` of `hooks status`, the write of a settings file through a symbolic link, the paths on macOS, the display width of a wide character in a table, the order of the columns that `ext ls` leaves out, the marks `(guess)` and `(seen)` and the kinds of `needs you` in `status`, the reasons of `hibernate` other than the two refusals shown, and a `kill --all` in which a Session does not end.
