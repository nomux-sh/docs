---
title: Quick start
description: Start a Session and attach to it, detach, attach again, stop the daemon, see that the Session continues, read its output, see its status and memory, and end it.
---

This page uses the three binaries from the [install page](/docs/guides/install/).
The output on this page is the real output of one run with nomux 0.4.0 on Linux. Your session identifiers and process IDs are different.

In the examples, `$` is the prompt of your shell and `sh-5.3$` is the prompt of the shell in the Session.

## Start a Session and attach to it

```console
$ nomux new --attach -- sh
```

`nomux new` starts the daemon if it does not run, and starts a Session.
The arguments after `--` are the command of the Session, here `sh`. Without them, the command is your shell: [Start a shell](#start-a-shell) shows it.
`--attach` makes your terminal the terminal of the Session: the CLI clears the terminal and shows the screen of the Session.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Each key goes to the Session. `Ctrl-C` and `Ctrl-Z` also go to the programs of the Session, not to the CLI.

`--cmd <command> [argument...]` is a second form of the same. Do not use the two forms in one command line. `nomux` cannot know if a `--` after `--cmd` belongs to the command, thus it refuses the line with the exit code 1 and starts no Session:

```console
$ nomux new --cmd sh -- -c true
error: the argument '--cmd <COMMAND>...' cannot be used with '--': nomux cannot know where the command of the session starts. Give the command in one form: `nomux new --cmd <command> [argument...]` or `nomux new -- <command> [argument...]`. For a command that has `--` as an argument, use the second form

Usage: nomux new [OPTIONS] [-- <COMMAND>...]

For more information, try '--help'.
```

A command that has `--` as an argument needs the form with `--`: `nomux new -- git log -- notes.txt`.

## Detach

Press `Ctrl-\` and then `d`.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
detached from session d3g6u2x6
$
```

The CLI ends with the exit code 0. The Session continues, and its programs do not see the detach.
The message has the session identifier. `nomux ls` shows it too:

```console
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
```

`PID` is the process ID of the command of the Session, not of its holder.

## Attach again

```console
$ nomux attach d3g6u2x6
```

The terminal shows the same screen as before the detach:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

The screen comes from the holder of the Session, which keeps it while no client is attached. A program that drew its screen before, for example an editor, is visible immediately.

More than one terminal can be attached to one Session at the same time. Each terminal shows the same output, and each one can type.
Here a second terminal runs the same `nomux attach d3g6u2x6`, and you type a command in it. The two terminals then show this screen:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

To detach a terminal that you cannot reach, use `nomux detach` from a different terminal. It detaches each client of the Session:

```console
$ nomux detach d3g6u2x6
detached 1 client from session d3g6u2x6
```

The terminal that was attached shows `detached from session d3g6u2x6`, as after the detach keys.

## Stop the daemon: the Session continues

The daemon owns no terminal. Each Session lives in its own holder process.
Attach to the Session in one terminal, and stop the daemon from a second terminal:

```console
$ nomux daemon status
nomuxd 0.4.0 runs: process ID 885447, 1 session
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
nomux: the daemon stopped. The session continues: run `nomux attach d3g6u2x6` to attach again
$
```

No daemon runs now. The next command that needs a daemon starts a new one, and the new daemon finds the Session:

```console
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
$ nomux daemon status
nomuxd 0.4.0 runs: process ID 886734, 1 session
```

The process ID of the command is the same as before: the command did not stop. Only the daemon has a new process ID.

The result is the same when the daemon ends without a clean stop:

```console
$ kill -9 886734
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
```

[How it works](/docs/concepts/how-it-works/) explains why. A restart of the Host is a different case: it stops the command, and the Session becomes dormant. [After a restart](/docs/guides/after-a-restart/) shows it.

## Start a Session without an attach

Without `--attach`, `nomux new` prints the session identifier and ends. The command of the Session runs without a client.
To start the command in a different directory, add `--cwd`. The directory must exist:

```console
$ nomux new --cwd project -- sleep 600
m6jfaybz
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
m6jfaybz  running  886750  sleep 600
```

## Start a shell

Without a command, a Session runs your shell. The daemon keeps a few holders ready, each with a shell that already runs: the [holder pool](/docs/guides/holder-pool/). A new Session with your shell takes one, thus the shell has its prompt at once. The pool starts at the first request that the daemon gets, not when the daemon starts.

A Session from the pool starts in your home directory. If `--cwd` names a different directory, nomux types ` cd '<directory>'` into the shell. The line is on the screen of the Session. It starts with a space, thus a shell that is configured for it keeps the line out of its history:

```console
$ nomux new --cwd project
aipxxh7r
$ nomux attach aipxxh7r
bash-5.3$  cd '/tmp/nomux-demo/project'
bash-5.3$
```

A Session with a command, as in the examples above, always gets a new holder and no `cd` line.

## Read the output of a Session

`nomux capture` prints the last lines that the command of a Session wrote, without an attach. The default is 100 lines, and `--lines` sets the number.
This Session runs a command that prints the numbers 1 to 200 and then waits:

```console
$ nomux new -- sh -c 'seq 1 200; exec sleep 600'
wuvotgo2
$ nomux capture wuvotgo2 --lines 3
198
199
200
```

The lines come from the journal of the Session on disk, not from its screen. Thus `capture` also prints lines that left the screen, and it prints the output of a Session whose command stopped.
The holder writes the output to the journal 1 second after it read it, at the latest. A `capture` right after `new` can print less than the command wrote.
The output is the bytes as the command wrote them, with their escape sequences. The output of a shell has the escape sequences of its prompt.

An attach shows the current screen and the output from that moment. It does not show the lines that left the screen: use `capture` for them.

## See the status and the memory

`nomux status` has one row for each Session: its command, its state, the time in the state and a message. A Session in which no program reports anything is `idle`:

```console
$ nomux status
  SESSION   COMMAND                          STATE  FOR  MESSAGE
  d3g6u2x6  sh                               idle   9s
  m6jfaybz  sleep 600                        idle   9s
  wuvotgo2  sh -c seq 1 200; exec sleep 600  idle   9s
```

An agent tool, or a program that reports with `nomux status set`, gives the other states, for example `working` and `needs you`. [Agent status](/docs/guides/agent-status/) shows them.

`nomux ls --memory` adds the memory that the processes of each Session use at the time of the command:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
d3g6u2x6  running  749.0 KiB  1          282.0 KiB  pss      sh
m6jfaybz  running  145.0 KiB  1          268.0 KiB  pss      sleep 600
wuvotgo2  running  151.0 KiB  1          290.0 KiB  pss      sh -c seq 1 200; exec sleep 600
total: 1.0 MiB in 3 processes of 3 sessions, and 840.0 KiB in the holders (pss)
```

`MEMORY` is the memory of the command and of each process that descends from it, and `PROCESSES` is their number. `HOLDER` is the memory of the holder, which is not a part of `MEMORY`. `MEASURE` is `pss` on Linux and `rss` on macOS. [Session memory](/docs/guides/session-memory/) says what the numbers count.

## End a Session

A Session ends when its command ends. If a terminal is attached at that moment, the CLI prints the exit status of the command and ends with the same value as its exit code:

```console
sh-5.3$ exit 3
exit

session d3g6u2x6 ended with exit status 3
$ echo $?
3
```

`nomux kill` ends a Session from outside. It sends `SIGHUP` to the command, as the close of a terminal does, and waits until the command has ended:

```console
$ nomux kill m6jfaybz
session m6jfaybz ended
```

A Session that ended leaves the list of `nomux ls`. The daemon keeps it and its output for 24 hours, and `nomux ls --all` shows it with a note that says how its command ended:

```console
$ nomux ls
ID        STATE    PID     COMMAND
wuvotgo2  running  886755  sh -c seq 1 200; exec sleep 600
$ nomux ls --all
ID        STATE    PID     COMMAND                          NOTE
d3g6u2x6  ended    -       sh                               exit status 3
m6jfaybz  ended    -       sleep 600                        signal 1
wuvotgo2  running  886755  sh -c seq 1 200; exec sleep 600
```

`nomux capture` still prints the output of an ended Session. Each other command for it fails with the exit code 2:

```console
$ nomux kill m6jfaybz
nomux: session m6jfaybz ended: its command does not run
```

## Use the commands in a script

Each command accepts `--json` and `--quiet`. This is the list of the three Sessions as JSON, before one of them ended:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"d3g6u2x6","state":"running","pid":885451,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690878,"epoch":1,"restore_policy":"on-focus"},{"id":"m6jfaybz","state":"running","pid":886750,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690885,"epoch":1,"restore_policy":"on-focus"},{"id":"wuvotgo2","state":"running","pid":886755,"command":["sh","-c","seq 1 200; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690885,"epoch":1,"restore_policy":"on-focus"}]}
```

Put `--json` or `--quiet` before `--`. All arguments after `--` belong to the command of the Session.
`attach` and `new --attach` need a terminal on the standard input. In a script without a terminal, they fail with the exit code 1.

On a terminal, the tables of `ls` and `status` fit the width of the terminal: the command column is shortened first, and an ellipsis (`…`) marks the cut. The output of a script, and the JSON output, are never shortened.

The [CLI reference](/docs/reference/cli/) has each command, the keys of an attach, the JSON documents and the exit codes.

## Next steps

- [After a restart](/docs/guides/after-a-restart/): dormant Sessions, restore policies and the daemon at login.
- [Remote hosts](/docs/guides/remote-hosts/): the same commands on a server, through SSH.
- [Extensions](/docs/guides/extensions/): install an extension, approve its permissions and call it.
