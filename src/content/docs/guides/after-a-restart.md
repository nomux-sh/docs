---
title: After a restart
description: What a restart of the Host does to the Sessions, how a dormant Session starts again, the restore policies, the configuration file, the service file and what is and is not restored.
---

A restart of the Host stops each process, also each holder and each command of a Session.
nomux keeps the description and the output of each Session on disk. Thus after the restart, `nomux ls` shows each Session as **dormant**, and one command starts it again.

The output on this page is the real output of one run with nomux 0.5.0 on Linux. The home directory of the run is shown as `/home/user`. The run did not restart the computer: it stopped each nomux process of a temporary home directory with `kill -9` (the daemon, the holders and the commands of the Sessions), which is what a restart does to these processes. Your session identifiers and process IDs are different.

## What is restored and what is not

| After a restart | Restored |
|---|---|
| The Session, its identifier and its place in `nomux ls` | Yes |
| The command, its arguments, its working directory and the window size | Yes: the restore starts the same command there |
| The output from before the restart | Yes: it is in the journal on disk. An attach shows its end, and `nomux capture` prints it |
| The restore policy of the Session | Yes |
| A [hibernated Session](/docs/guides/hibernation/) | Yes: it stays hibernated. The daemon never starts it at its own start, also with the policy `auto` |
| The processes of the Session: the shell, the programs that ran in it, their memory | **No.** The new command starts from the beginning |
| The environment variables of the command | **No.** The new command gets the [environment of a Session](/docs/guides/session-environment/) that the daemon makes at the time of the restore: the environment of the daemon, with `TERM`, `COLORTERM`, a UTF-8 character set and the three `NOMUX_*` variables of the Session. nomux does not store the environment of the old command, because it can have secrets |
| The output of the last second before the stop | Maybe not. The holder writes the output to disk after 1 second at most. A power cut can also lose what the kernel did not write to the disk yet |

A program that can continue its own work, for example an agent with a resume command, must do that itself after the restore.

## Before the restart

This run has three Sessions: a shell, a server and a command that must not start again by itself. The shell got a line of text, typed in an attach (the attach ran in a pseudo-terminal).

```console
$ nomux new --cwd project -- sh
ded2ph33
$ nomux attach ded2ph33
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$
detached from session ded2ph33
$ nomux new -- sh -c 'echo server started; exec sleep 600'
o6kczknv
$ nomux new -- sleep 700
7e27dogj
```

Each Session gets a [restore policy](#restore-policies). The default is `on-focus`. Here the server gets `auto` and the last command gets `manual`:

```console
$ nomux restore-policy o6kczknv auto
session o6kczknv has the restore policy auto
$ nomux restore-policy 7e27dogj manual
session 7e27dogj has the restore policy manual
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  running  4187180  sleep 700
ded2ph33  running  4187171  sh
o6kczknv  running  4187177  sh -c echo server started; exec sleep 600
```

## After the restart

No nomux process runs now. The first command starts the daemon, and the daemon reads the state directory:

```console
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  dormant  -        sleep 700
ded2ph33  dormant  -        sh
o6kczknv  running  4187842  sh -c echo server started; exec sleep 600
```

- `ded2ph33` and `7e27dogj` are dormant. No process of them runs, and `PID` is `-`.
- `o6kczknv` has the policy `auto`, thus the daemon started its command again at its own start. It has a new process ID.

`nomux daemon status` shows the new daemon, the number of Sessions and the path of the configuration file that it read:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4187840, 3 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

The second line says if the operating system applies a [memory limit](/docs/guides/hibernation/#the-memory-limit) to a Session. A **hibernated** Session, which the daemon stopped on purpose to give its memory back, is not dormant by accident: it stays hibernated, and `nomux ls` shows `hibernated` for it. [Hibernation and the memory limit](/docs/guides/hibernation/#after-a-restart) has the output.

A dormant Session has no process. `nomux status` shows it as `idle` and `nomux ls --memory` shows `-` for its memory: [Session memory](/docs/guides/session-memory/) has the rules.

A pooled holder is not a Session, and it ends with its daemon, thus a restart ends it too. The new daemon starts its own pool at the first request of a client: [Holder pool](/docs/guides/holder-pool/).

The output of a dormant Session is on disk. `nomux capture` prints it without a restore:

```console
$ nomux capture ded2ph33 --lines 2
written before the restart
sh-5.3$
```

The real output also has the escape sequences of the prompt of the shell. [Read the output of a Session](/docs/guides/quick-start/#read-the-output-of-a-session) explains them.

## Start a dormant Session again

**With an attach.** `nomux attach` starts the command again and attaches. The command gets the window size of your terminal. The terminal first shows the end of the old output, then a line from nomux, then the new command:

```console
$ nomux attach ded2ph33
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$
--- nomux: the session started again. The output before this line is from the command that stopped ---

sh-5.3$ echo typed after the restart
typed after the restart
sh-5.3$
detached from session ded2ph33
```

The run had many empty lines between the line of nomux and the new prompt: the old output and the line move to the scrollback of your terminal, and the new shell draws its screen below them. The example shows one empty line.
The new shell is a new process. It knows nothing of the commands that you typed before the restart.

**Without an attach.** `nomux start` starts the command again with the window size that the Session had. A Session with the policy `manual` starts only in this way:

```console
$ nomux attach 7e27dogj
nomux: session 7e27dogj is dormant and its restore policy is manual: run `nomux start 7e27dogj`
$ nomux start 7e27dogj
session 7e27dogj runs
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  running  4188320  sleep 700
ded2ph33  running  4187852  sh
o6kczknv  running  4187842  sh -c echo server started; exec sleep 600
```

The `attach` of a `manual` Session has the exit code 1. `nomux start` for a Session whose command runs succeeds and changes nothing. For a hibernated Session, `nomux start` starts its resume command, as `nomux wake` does.

If the command cannot start, for example because its working directory is gone, the command fails with the exit code 1 and the Session stays dormant.

`capture` now prints the output of the two runs of the command, the old one and the new one (without the escape sequences):

```console
$ nomux capture ded2ph33
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$ sh-5.3$ echo typed after the restart
typed after the restart
sh-5.3$
```

## Restore policies

| Policy | The daemon starts the command again |
|---|---|
| `auto` | When the daemon starts, for example at login. Use it for a development server or a watcher. Never for a hibernated Session |
| `on-focus` | At the first `nomux attach` or `nomux start`. This is the default |
| `manual` | Only with `nomux start`. `nomux attach` fails with the exit code 1 |

- `nomux restore-policy <id> <policy>` sets the policy of one Session. It works for a Session that runs and for a dormant Session.
- `auto` applies only at the start of the daemon. A Session that becomes dormant while the daemon runs waits for a client.
- `nomux ls --json` shows the policy of each Session in the field `restore_policy`.

The default for the Sessions that have no policy of their own is in the configuration file of the daemon:

| Host | Path |
|---|---|
| Linux | `~/.config/nomux/config.toml` |
| macOS | `~/Library/Application Support/nomux/config.toml` |
| Each host, if `XDG_CONFIG_HOME` is an absolute path | `$XDG_CONFIG_HOME/nomux/config.toml` |

The daemon reads no other path. On macOS, a file in `~/.config/nomux` has no effect if `XDG_CONFIG_HOME` is not set. `nomux daemon status` prints the path that the daemon reads (the last line of the block above). The Linux path is the one of this run; the macOS path comes from the documents of nomux, because no Mac ran for this page.

```toml
[restore]
default_policy = "on-focus"   # auto | on-focus | manual

[sessions]
ended_retention = "24h"       # a number with the unit s, m, h or d
```

The daemon reads the file one time, at its start. A file that is not valid does not stop the daemon: the daemon writes the problem to its log and uses the defaults. These two keys come from [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#configuration) of nomux 0.5.0. The file has more tables: `[pool]` for the holder pool ([Holder pool](/docs/guides/holder-pool/)), `[sessions]` keys for the memory limits, and `[agents]` for the hibernation ([Hibernation and the memory limit](/docs/guides/hibernation/#the-settings)).

## Remove a dormant Session

A dormant Session has no command to end. `nomux kill` removes it and its output. Before this command, a second stop of each nomux process made the Session `ded2ph33` dormant again:

```console
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  dormant  -        sleep 700
ded2ph33  dormant  -        sh
o6kczknv  running  4188967  sh -c echo server started; exec sleep 600
$ nomux kill ded2ph33
session ded2ph33 ended
$ nomux capture ded2ph33
nomux: no session has the identifier or the name ded2ph33, and no session has a name or an identifier that starts with it
```

Nothing else removes a dormant Session. Its journal has 32 MiB of files at most.

A Session whose command ended is different: the daemon keeps it for the retention time, 24 hours by default, and then removes it. [End a Session](/docs/guides/quick-start/#end-a-session) shows it.

## Start the daemon at login

Without a service, the first `nomux` command after the restart starts the daemon. Thus a Session with the policy `auto` starts at that moment, not at login.
To start the daemon at login, write the service file:

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

`--dry-run` prints the path and the content and writes nothing. The command needs no `sudo`, and it starts no program: run the command of its output to give the file to systemd. The `systemctl` command was not run for this page.

| Computer | File | Then run |
|---|---|---|
| Linux | `~/.config/systemd/user/nomuxd.service`, or below `$XDG_CONFIG_HOME/systemd/user/` | `systemctl --user daemon-reload && systemctl --user enable --now nomuxd.service` |
| macOS | `~/Library/LaunchAgents/sh.nomux.nomuxd.plist` | `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/sh.nomux.nomuxd.plist` |

The macOS row comes from `docs/daemon.md`. The nomux documents say that the launchd agent was not loaded on a Mac.

- **`KillMode=process`.** A stop of the unit stops only the daemon, and the Sessions continue. With the default of systemd, a stop of the unit ends each holder too.
- **`--replace`.** The daemon of the service takes the place of a daemon that a command started before. No Session ends.
- **`Restart=on-failure`.** A daemon that fails starts again. A daemon that `nomux daemon stop` stopped stays stopped.
- **The path of `nomuxd`** is in the file. If you move the binaries, run `nomux daemon install-service` again.
- **The environment.** A service manager gives the daemon no `TERM`, and launchd gives it no `LANG`. A Session gets `TERM` and a UTF-8 character set from nomux anyway. For a language, add `LANG` to the file: `Environment=` in the unit, `EnvironmentVariables` in the launchd agent. [Session environment](/docs/guides/session-environment/) has the rules.

To remove the file:

```console
$ nomux daemon uninstall-service
removed /home/user/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
```

`uninstall-service` has the exit code 0 also when the file does not exist:

```console
$ nomux daemon uninstall-service
no service file: /home/user/.config/systemd/user/nomuxd.service does not exist
```

**A logout.** systemd stops the user manager after the last logout, and with it each process of its units: the daemon and the holders. `loginctl enable-linger` keeps the user manager, and thus the Sessions, after a logout. This behaviour comes from the documentation of systemd; the nomux documents say that it was not tested.

## Limits of this version

- The processes of a Session do not come back. Only the command starts again.
- A restore gives the command the environment that the daemon makes at that time, not the environment of the first command. The client that attaches gives no variable: [Session environment](/docs/guides/session-environment/) has the gap.
- An attach that starts a Session again shows 1 MiB of the old output at most. `nomux capture` prints the rest of the journal.
- No command starts the command of an ended Session again, and no command removes an ended Session before its retention time is over.

The [CLI reference](/docs/reference/cli/#nomux-start) has `start`, `restore-policy`, `capture` and the service commands with their JSON documents. [How it works](/docs/concepts/how-it-works/#what-is-kept-where) shows the files on disk. The terms on this page come from the [Glossary](/docs/reference/glossary/).
