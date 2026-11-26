---
title: Quick start
description: Start a Session and attach to it, detach, attach again, stop the daemon, see that the Session continues, read its output and end it.
---

This page uses the three binaries from the [install page](/docs/guides/install/).
The output on this page is the real output of one run with nomux 0.3.0 on Linux. Your session identifiers and process IDs are different.

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
detached from session kodx55mz
$
```

The CLI ends with the exit code 0. The Session continues, and its programs do not see the detach.
The message has the session identifier. `nomux ls` shows it too:

```console
$ nomux ls
ID        STATE    PID      COMMAND
kodx55mz  running  2624204  sh
```

`PID` is the process ID of the command of the Session, not of its holder.

## Attach again

```console
$ nomux attach kodx55mz
```

The terminal shows the same screen as before the detach:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

The screen comes from the holder of the Session, which keeps it while no client is attached. A program that drew its screen before, for example an editor, is visible immediately.

More than one terminal can be attached to one Session at the same time. Each terminal shows the same output, and each one can type.
Here a second terminal runs the same `nomux attach kodx55mz`, and you type a command in it. The two terminals then show this screen:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

To detach a terminal that you cannot reach, use `nomux detach` from a different terminal. It detaches each client of the Session:

```console
$ nomux detach kodx55mz
detached 1 client from session kodx55mz
```

The terminal that was attached shows `detached from session kodx55mz`, as after the detach keys.

## Stop the daemon: the Session continues

The daemon owns no terminal. Each Session lives in its own holder process.
Attach to the Session in one terminal, and stop the daemon from a second terminal:

```console
$ nomux daemon status
nomuxd 0.3.0 runs: process ID 2624202, 1 session
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
nomux: the daemon stopped. The session continues: run `nomux attach kodx55mz` to attach again
$
```

No daemon runs now. The next command that needs a daemon starts a new one, and the new daemon finds the Session:

```console
$ nomux ls
ID        STATE    PID      COMMAND
kodx55mz  running  2624204  sh
$ nomux daemon status
nomuxd 0.3.0 runs: process ID 2624275, 1 session
```

The process ID of the command is the same as before: the command did not stop. Only the daemon has a new process ID.

The result is the same when the daemon ends without a clean stop:

```console
$ kill -9 2624275
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID      COMMAND
kodx55mz  running  2624204  sh
```

[How it works](/docs/concepts/how-it-works/) explains why. A restart of the Host is a different case: it stops the command, and the Session becomes dormant. [After a restart](/docs/guides/after-a-restart/) shows it.

## Start a Session without an attach

Without `--attach`, `nomux new` prints the session identifier and ends. The command of the Session runs without a client.
To start the command in a different directory, add `--cwd`. The directory must exist:

```console
$ nomux new --cwd project -- sleep 600
3fvz2ujk
$ nomux ls
ID        STATE    PID      COMMAND
3fvz2ujk  running  2624294  sleep 600
kodx55mz  running  2624204  sh
```

## Read the output of a Session

`nomux capture` prints the last lines that the command of a Session wrote, without an attach. The default is 100 lines, and `--lines` sets the number.
This Session runs a command that prints the numbers 1 to 200 and then waits:

```console
$ nomux new -- sh -c 'seq 1 200; exec sleep 600'
f4dr3ij2
$ nomux capture f4dr3ij2 --lines 3
198
199
200
```

The lines come from the journal of the Session on disk, not from its screen. Thus `capture` also prints lines that left the screen, and it prints the output of a Session whose command stopped.
The output is the bytes as the command wrote them, with their escape sequences. The output of a shell has the escape sequences of its prompt.

An attach shows the current screen and the output from that moment. It does not show the lines that left the screen: use `capture` for them.

## End a Session

A Session ends when its command ends. If a terminal is attached at that moment, the CLI prints the exit status of the command and ends with the same value as its exit code:

```console
sh-5.3$ exit 3
exit

session kodx55mz ended with exit status 3
$ echo $?
3
```

`nomux kill` ends a Session from outside. It sends `SIGHUP` to the command, as the close of a terminal does, and waits until the command has ended:

```console
$ nomux kill 3fvz2ujk
session 3fvz2ujk ended
```

A Session that ended leaves the list of `nomux ls`. The daemon keeps it and its output for 24 hours, and `nomux ls --all` shows it with a note that says how its command ended:

```console
$ nomux ls
ID        STATE    PID      COMMAND
f4dr3ij2  running  2624301  sh -c seq 1 200; exec sleep 600
$ nomux ls --all
ID        STATE    PID      COMMAND                          NOTE
3fvz2ujk  ended    -        sleep 600                        signal 1
f4dr3ij2  running  2624301  sh -c seq 1 200; exec sleep 600
kodx55mz  ended    -        sh                               exit status 3
```

`nomux capture` still prints the output of an ended Session. Each other command for it fails with the exit code 2:

```console
$ nomux kill 3fvz2ujk
nomux: session 3fvz2ujk ended: its command does not run
```

## Use the commands in a script

Each command accepts `--json` and `--quiet`. This is the list of the three Sessions as JSON, before one of them ended:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"3fvz2ujk","state":"running","pid":2624294,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795655661,"epoch":1,"restore_policy":"on-focus"},{"id":"f4dr3ij2","state":"running","pid":2624301,"command":["sh","-c","seq 1 200; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655661,"epoch":1,"restore_policy":"on-focus"},{"id":"kodx55mz","state":"running","pid":2624204,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655650,"epoch":1,"restore_policy":"on-focus"}]}
```

Put `--json` or `--quiet` before `--`. All arguments after `--` belong to the command of the Session.
`attach` and `new --attach` need a terminal on the standard input. In a script without a terminal, they fail with the exit code 1.

The [CLI reference](/docs/reference/cli/) has each command, the keys of an attach, the JSON documents and the exit codes.

## Next steps

- [After a restart](/docs/guides/after-a-restart/): dormant Sessions, restore policies and the daemon at login.
- [Remote hosts](/docs/guides/remote-hosts/): the same commands on a server, through SSH.
- [Extensions](/docs/guides/extensions/): install an extension, approve its permissions and call it.
