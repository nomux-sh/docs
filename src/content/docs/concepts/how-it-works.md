---
title: How it works
description: The three nomux processes, what an attach does, why a Session continues when the daemon stops, what stays after a restart of the Host, and what is kept where.
---

nomux runs three types of process on a Host: the client, the daemon and the holder.
This page describes what exists in nomux 0.3.0. The [concepts overview](/docs/concepts/overview/) describes the full design.

## The three processes

<figure>
<svg viewBox="0 0 540 452" role="img" aria-labelledby="processes-title processes-description" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 540px; height: auto;" fill="none" stroke="currentColor" stroke-width="1.5" font-size="14">
<title id="processes-title">The three nomux processes and the disk</title>
<desc id="processes-description">The client connects to the daemon through a Unix socket. The daemon connects to one holder for each Session through a control socket, and it reads the terminal output of the Session from shared memory of the holder. The holder owns the PTY of the command and writes the description and the journal of the Session to the disk. The daemon reads the disk to find the Sessions after a restart. The holder and the command continue when the daemon stops.</desc>
<rect x="20" y="12" width="320" height="60" rx="6"/>
<rect x="20" y="126" width="320" height="60" rx="6"/>
<rect x="8" y="232" width="344" height="208" rx="10" stroke-dasharray="6 5"/>
<rect x="20" y="246" width="320" height="60" rx="6"/>
<rect x="20" y="366" width="320" height="60" rx="6"/>
<rect x="372" y="246" width="160" height="60" rx="6"/>
<path d="M180 72 V124 M174 116 L180 124 L186 116"/>
<path d="M180 186 V244 M174 236 L180 244 L186 236"/>
<path d="M180 306 V364 M174 356 L180 364 L186 356 M174 314 L180 306 L186 314"/>
<path d="M340 276 H370 M362 270 L370 276 L362 282"/>
<path d="M340 156 H500 V244 M494 236 L500 244 L506 236" stroke-dasharray="4 4"/>
<g stroke="none" fill="currentColor">
<text x="34" y="37" font-weight="600">client: nomux (the CLI)</text>
<text x="34" y="58" font-size="12.5">runs one command, or stays attached</text>
<text x="194" y="95" font-size="12.5">Unix socket</text>
<text x="194" y="112" font-size="12" font-family="monospace">~/.nomux/run/nomuxd.sock</text>
<text x="34" y="151" font-weight="600">daemon: nomuxd</text>
<text x="34" y="172" font-size="12.5">one for each user: starts and finds holders</text>
<text x="388" y="148" font-size="12.5">reads at its start</text>
<text x="194" y="209" font-size="12.5">control socket</text>
<text x="194" y="226" font-size="12" font-family="monospace">~/.nomux/run/&lt;id&gt;/sock</text>
<text x="372" y="209" font-size="12.5">terminal output:</text>
<text x="372" y="226" font-size="12.5">shared memory</text>
<text x="34" y="271" font-weight="600">holder: nomux-holder</text>
<text x="34" y="292" font-size="12.5">one for each Session: owns the PTY</text>
<text x="384" y="271" font-weight="600">disk</text>
<text x="384" y="292" font-size="12.5">description, journal</text>
<text x="194" y="341" font-size="12.5">PTY</text>
<text x="34" y="391" font-weight="600">command of the Session</text>
<text x="34" y="412" font-size="12.5">a shell, an agent, a server</text>
<text x="366" y="332" font-size="12.5">continue when</text>
<text x="366" y="349" font-size="12.5">the daemon stops</text>
</g>
</svg>
<figcaption>An arrow points from the process that connects to the process that answers, or from the writer to the disk. The PTY carries data in the two directions. During an attach, the Unix socket of the daemon carries the keys to the Session and the terminal output to the client. The disk is the state directory of the user: it stays after a restart of the Host.</figcaption>
</figure>

**The client** is the program that you use. Now the only client is the CLI, `nomux`.
It reads the command line, connects to the daemon, sends its request, prints the result and ends.
For an attach, it stays connected and gives your keyboard and your screen to the Session.
If no daemon runs, the CLI starts one. For a [remote Host](/docs/guides/remote-hosts/), the CLI connects to the daemon of that Host through SSH, and the daemon and the holders run there.

**The daemon** is `nomuxd`. One daemon runs for each user.
It starts a holder for each new Session, keeps the list of the Sessions and answers the clients.
It carries the keys and the terminal output between an attached client and the holder.
It owns no terminal. It also runs the daemon parts of the [extensions](/docs/guides/extensions/), each as a separate process.

**The holder** is `nomux-holder`. One holder runs for each Session.
It opens the PTY, starts the command of the Session and reads the output of the command, also when no client and no daemon is connected.
It keeps the current screen of the Session in memory: the visible cells with their colours, the cursor and the terminal modes.
It writes the description of the Session and its output to the disk: refer to [The journal](#the-journal).
It also reads what the programs report in their output: the program status (the OSC 7501 terminal sequence), the prompt marks of a shell (OSC 133) and notifications (OSC 9 and OSC 777). No command shows these reports in this version.
A holder is a small process with one thread. It does no work while the command writes nothing.

A client talks only to the daemon. Only the daemon talks to a holder.

## What an attach does

`nomux attach` and `nomux new --attach` connect your terminal to the terminal of a Session. The [quick start](/docs/guides/quick-start/#attach-again) shows it with real commands.

1. **The window size.** The CLI sends the size of your terminal, and the Session gets that size.
2. **The screen.** The daemon asks the holder for the current screen. The holder gives a byte sequence that draws that screen in an empty terminal. The CLI writes the sequence to your terminal. Thus you see the Session as it is now, also if its programs drew the screen hours before.
3. **The output stream.** After the screen, the client gets each byte that the command writes, in sequence. The screen and the stream fit together: no byte is absent and no byte comes two times.
4. **The keys.** Each key goes from the CLI to the daemon, to the holder and into the PTY.

The holder does not know the clients and never waits for one. It keeps the most recent 256 KiB of output in memory, and the daemon has one buffer of 64 KiB for each client.
**A slow client gets a fresh screen.** If a client takes its output more slowly than the command writes it, and the output that it needs next is no longer in the memory of the holder, the daemon sends the current screen again and continues from there. That client gets the latest screen and not the bytes between.
Thus a flood of output does not make the memory of the daemon grow and does not slow the command. A slow client changes nothing for a different client of the same Session.

More than one client can be attached to one Session. Each client gets the same output, and each one can type. A Session has one window size: the size of the client that attached or changed its size last.

A detach closes only the connection of the client. The command of the Session gets no signal and sees no change.
An attach goes through the daemon. If the daemon stops, the attach ends with an error, and the Session continues: attach again, and the new daemon gets the screen from the holder.

An attach shows the screen, not the lines that left the screen. `nomux capture` prints these lines from the journal.

## Why a Session continues when the daemon stops

The command of a Session is a child of its holder, not of the daemon. The terminal of the command belongs to the holder.
Thus the end of the daemon closes no terminal and stops no command.

The holder is also independent of the process that started it:

- It has its own process session and its own process group. A signal for the daemon or for its group does not reach the holder.
- It has no pipe to the daemon. It does not fail when the daemon is gone.
- It writes three files into the runtime directory. A new daemon reads these files, finds the holder and connects to it.

When a daemon starts, it scans the runtime directory. It connects to each holder that runs, and removes the directory of each holder that is gone.
This is why `nomux ls` shows the same Sessions after `nomux daemon stop`, after `kill -9` of the daemon and after a daemon failure.
The [quick start](/docs/guides/quick-start/#stop-the-daemon-the-session-continues) shows it with real commands.

Only one daemon can run for one runtime directory. A second daemon ends with an error and changes nothing. `nomuxd --replace` stops the daemon that runs and takes its place, and no Session ends.

## The journal

The holder writes the output of its Session to the journal on disk, in the state directory of the user. The journal has the bytes as the command wrote them and, at intervals, a checkpoint: a copy of the screen at that position.

- The holder writes the output to the journal 1 second after it read it, or earlier after 64 KiB. It does not wait for the disk while the command runs.
- The holder writes a checkpoint at the start, after each 1 MiB of output and after a change of the window size.
- The journal of one Session has 32 MiB of files at most. The holder removes the oldest files first. 32 MiB hold 50 MiB to 90 MiB of terminal output.
- If the disk is full, the holder stops the journal and the Session continues.

The holder also writes a description of the Session to the state directory: the command and its arguments, the working directory, the window size, the start time and, after the end, the exit status. The description has no environment variable, because the environment can have secrets.

`nomux capture` reads the journal. Thus it prints lines that left the screen, and the output of a Session whose command stopped.

## After a restart of the Host

A restart ends each process, also each holder and each command. The state directory stays.
When the daemon starts again, it reads the state directory. A Session whose description says that its command ran, and that has no holder, is **dormant**: `nomux ls` shows it with its command and without a process.

A restore starts the command of a dormant Session again: the daemon starts a new holder with the same session identifier, the same command, the same working directory and the same window size. The new holder writes to the same journal, and the Session gets the next epoch.
The [restore policy](/docs/guides/after-a-restart/#restore-policies) of the Session decides when this happens: when the daemon starts, at the first attach, or only with `nomux start`.

The processes of the Session from before the restart do not come back. The new command starts from the beginning. The output from before stays in the journal, and an attach shows its end above the new screen.

The same thing happens when a holder is killed with `SIGKILL`, or when it fails: the Session becomes dormant. [After a restart](/docs/guides/after-a-restart/) shows it with real commands.

### When a Session ends

- Its command ends, or you end it with `nomux kill`. The daemon keeps the ended Session, its exit status and its journal for the retention time, 24 hours by default. `nomux ls --all` shows it.
- You remove a dormant Session with `nomux kill`. Its journal is removed too.
- A service manager stops all the processes of the daemon together. The service file of `nomux daemon install-service` has `KillMode=process`, thus a stop of that unit stops only the daemon. With the default `KillMode=control-group` of systemd, a stop of the unit ends the holders too, and the Sessions become dormant.

## What is kept where

| Data | Where | Lifetime |
|---|---|---|
| The PTY and the command | The holder process | Until the command ends, or the holder ends |
| The current screen and the most recent 256 KiB of output | The memory of the holder | Until the holder ends |
| The reports of the programs: 64 program status records at most, the last prompt mark and the last 16 notifications | The memory of the holder | Until the holder ends |
| The list of the Sessions | The memory of the daemon | A new daemon makes it again from the runtime directory and the state directory |
| `nomuxd.sock`, `nomuxd.lock`, `nomuxd.log` | `~/.nomux/run/` | The socket, the lock and the log of the daemon. The log stays empty if there is no problem |
| `pid`, `sock`, `ready` | `~/.nomux/run/<session identifier>/` | The files of one holder. The holder removes them when it ends |
| `session`, `restore-policy`, `journal/` | `~/.local/state/nomux/sessions/<session identifier>/` on Linux, `~/Library/Application Support/nomux/sessions/<session identifier>/` on macOS | The description, the restore policy and the journal of one Session. They stay after a restart, until `nomux kill` of a dormant Session or the end of the retention time of an ended Session |
| The installed extensions | `~/.local/share/nomux/extensions/` on Linux, `~/Library/Application Support/nomux/extensions/` on macOS | Until `nomux ext rm` |
| The remote Hosts, the restore policy for new Sessions, the retention time | `~/.config/nomux/config.toml` on Linux, `~/Library/Application Support/nomux/config.toml` on macOS | Until you change the file. `nomux host add` writes it |

This is the state directory of one Session after a restore. The run stopped each nomux process with `kill -9`, as a restart does, and then ran `nomux start c5ii5inn`:

```console
$ ls -A .local/state/nomux/sessions/c5ii5inn
journal
session
$ ls -A .local/state/nomux/sessions/c5ii5inn/journal
00000001-0000000000000000.journal
00000002-0000000000000000.journal
$ cat .local/state/nomux/sessions/c5ii5inn/session
nomux-session 1
epoch 2
started 1795674526
rows 24
columns 80
restore on-focus
profile
directory /tmp/nomux-demo/project
command sh
argument -c
argument echo first run; exec sleep 600
status running
```

Each journal file is one segment. The name has the epoch and the position of the first byte of the segment. The two files are the output of the first run of the command and of the run after the restore.
The `restore` line of the `session` file is not the restore policy: the daemon keeps the policy in the file `restore-policy`. This Session has no such file, thus it has the default policy.

The directories have the mode 0700, and the files and each socket have the mode 0600. The daemon and the holders also close a connection that comes from a different user. nomux has no database.

## Limits of this version

- An attach shows the current screen of a Session and the output from that moment. It does not show the lines that left the screen. `nomux capture` prints them with their escape sequences.
- An attach that starts a dormant Session again shows 1 MiB of the old output at most.
- You cannot change the detach keys.
- The command of a Session gets the environment of the daemon, thus of the shell that started the daemon. A restore gives the command the environment of the daemon at that time. Its terminal has 24 rows and 80 columns until a client attaches.
- The size limit of the journal is fixed at 32 MiB for each Session.

The [roadmap](/docs/project/roadmap/) is the one place for the work that comes next.
The reasons for the process model are in [ADR-0001](https://github.com/nomux-sh/docs/blob/main/adr/0001-session-holder-model.md). The budgets for disk and memory are in [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md).
The terms on this page come from the [Glossary](/docs/reference/glossary/).
