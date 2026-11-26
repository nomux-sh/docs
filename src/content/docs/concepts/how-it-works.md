---
title: How it works
description: The three nomux processes, what an attach does, why a Session continues when the daemon stops, how nomux knows the status of an agent, how a new Session opens fast, what a Session gets and uses, what stays after a restart of the Host, and what is kept where.
---

nomux runs three types of process on a Host: the client, the daemon and the holder.
This page describes what exists in nomux 0.4.0. The [concepts overview](/docs/concepts/overview/) describes the full design.

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
It keeps the [agent status](#what-nomux-knows-about-an-agent) of each Session, and it keeps a few holders ready for new Sessions: [the holder pool](#the-holder-pool).

**The holder** is `nomux-holder`. One holder runs for each Session.
It opens the PTY, starts the command of the Session and reads the output of the command, also when no client and no daemon is connected.
It keeps the current screen of the Session in memory: the visible cells with their colours, the cursor and the terminal modes.
It writes the description of the Session and its output to the disk: refer to [The journal](#the-journal).
It also reads what the programs report in their output: the program status (the OSC 7501 terminal sequence), the prompt marks of a shell (OSC 133) and notifications (OSC 9 and OSC 777). The daemon uses the first two for the [agent status](#what-nomux-knows-about-an-agent). No command shows the notifications in this version.
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
- The holder of a Session has no pipe to the daemon. It does not fail when the daemon is gone.
- It writes three files into the runtime directory. A new daemon reads these files, finds the holder and connects to it.

When a daemon starts, it scans the runtime directory. It connects to each holder that runs, and removes the directory of each holder that is gone.
This is why `nomux ls` shows the same Sessions after `nomux daemon stop`, after `kill -9` of the daemon and after a daemon failure.
The [quick start](/docs/guides/quick-start/#stop-the-daemon-the-session-continues) shows it with real commands.

Only one daemon can run for one runtime directory. A second daemon ends with an error and changes nothing. `nomuxd --replace` stops the daemon that runs and takes its place, and no Session ends.

A holder in the [holder pool](#the-holder-pool) is the exception: it has no Session yet, and it ends with the daemon.

## The journal

The holder writes the output of its Session to the journal on disk, in the state directory of the user. The journal has the bytes as the command wrote them and, at intervals, a checkpoint: a copy of the screen at that position.

- The holder writes the output to the journal 1 second after it read it, or earlier after 64 KiB. It does not wait for the disk while the command runs.
- The holder writes a checkpoint at the start, after each 1 MiB of output and after a change of the window size.
- The journal of one Session has 32 MiB of files at most. The holder removes the oldest files first. 32 MiB hold 50 MiB to 90 MiB of terminal output.
- If the disk is full, the holder stops the journal and the Session continues.

The holder also writes a description of the Session to the state directory: the command and its arguments, the working directory, the window size, the start time and, after the end, the exit status. The description has no environment variable, because the environment can have secrets.

`nomux capture` reads the journal. Thus it prints lines that left the screen, and the output of a Session whose command stopped.

## What nomux knows about an agent

The daemon keeps the **agent status** of each Session: what runs in it, its state (`idle`, `working`, `done`, `needs you` or `error`) and the source of that state. A client can always tell the report of a program from a guess of the daemon. A guess is never shown as a fact.

The daemon asks six sources in a fixed order. The first source that reports an item gives its state:

| Order | Source | What it is |
|---:|---|---|
| 1 | Adapter | An adapter extension that reports from the hook events of an agent tool |
| 2 | Program status | A program reports in the terminal stream (OSC 7501) |
| 3 | Self-report | A program in the Session runs `nomux status set` |
| 4 | Session restore | The Session lost its process: what stays of its status |
| 5 | Prompt marks | The prompt marks of the shell: a command runs, or the input line waits. This is a guess |
| 6 | Foreground program | A program that is not the command of the Session has the terminal. This is a guess |

- `nomux status` prints one row for each Session, and `(guess)` marks a guess. `nomux status --tree` adds the Child work. `nomux agent explain <id>` prints each source in this order with what it says. `nomux events --follow` prints each change when it happens.
- The most urgent status decides the status of the Session: `needs you` first, then an `error` or a `done` that you did not see, then `working`. An attach marks the results of the Session as seen.
- A Session without a process runs no work. When a Session becomes dormant, its `working` and `needs you` become `done` with the source "session restore". An ended Session keeps its last Agent run, the **kept run**, until the daemon removes the Session. The daemon keeps 64 kept runs at most.
- The daemon keeps no status on disk. After the daemon starts again, it reads the program reports from the holders. The self-reports, the reports of the adapters, the times in the state and the events are gone.

### Adapters and hooks

An adapter is an extension that takes the hook events of one agent tool. The tool runs `nomux hook <tool> <event>` at its events. The command sends the event to the daemon and waits 80 ms at most. Its exit code is always 0, thus it never blocks or breaks the tool. The daemon checks the token of the Session, gives the event to the adapter, and the adapter reports the status.

`nomux hooks install <tool>` prints the change that the hooks need in the settings file of the tool. It writes the file only with `--apply`. In this version a hook gets no answer from nomux: nomux decides no permission request yet.

The adapter of Claude Code is in the `extensions` repository and has release 0.1.0: the [extensions page](/docs/concepts/extensions/) says what exists. The guides [Agent status](/docs/guides/agent-status/), [Agent adapters and hooks](/docs/guides/agent-adapters/) and [Claude Code adapter](/docs/guides/claude-code/) show the commands.

## The holder pool

A new Session must open in less than 10 ms, and a shell with its start files can need 200 ms or more. Thus the daemon keeps a few holders ready: 2 by default. Each **pooled holder** has started the shell of the user in the home directory. A new Session with the shell takes the oldest pooled holder, and no process starts. [Performance targets](/docs/reference/performance/#new-session) has the measured times.

- The pool starts at the first request of a client. A daemon that gets no request runs no pooled holder.
- After 10 minutes without a new Session, the pool empties. `pool.size` (0 to 8) and `pool.idle_time` in `config.toml` change the pool. With 0, the pool is off.
- A pooled holder is not a Session. `nomux ls` does not show it, and it has no state directory and no journal. Its standard input is a pipe from the daemon: when the daemon ends, also after `kill -9`, the pooled holder and its shell end. A new daemon takes no pooled holder of an earlier daemon.
- If the Session has a working directory that is not the home directory, the daemon types ` cd '<directory>'` into the shell. The line is visible on the screen and in the journal.
- A Session with a command always gets a new holder. The pool is off if the shell of the user is not `sh`, `bash`, `zsh`, `dash`, `ksh`, `mksh` or `fish`.
- A pooled holder and its shell use memory while they wait: approximately 1 MB for the holder with the musl build, and the memory of the shell.

The guide [Holder pool](/docs/guides/holder-pool/) shows the pool with real commands.

## The environment of a Session

The holder makes the environment of the command. It starts with the environment of the daemon and sets these variables:

| Variable | Value |
|---|---|
| `TERM` | `xterm-256color` |
| `COLORTERM` | `truecolor` |
| `NOMUX_SESSION_ID` | The session identifier |
| `NOMUX_SOCK` | The socket of the daemon |
| `NOMUX_TOKEN` | A random token of 128 bits for each start of the holder. A restore gives a new token |

- `TERM` is the terminal of nomux, not the terminal of a client: a Session has clients with different terminals at different times.
- If the daemon has no locale (`LC_ALL`, `LC_CTYPE` and `LANG` have no value), the command gets a UTF-8 character set. The variables `COLUMNS`, `LINES`, `TERM_PROGRAM` and `TERM_PROGRAM_VERSION` are never passed.
- Nothing comes from the client. A client with another locale, or with `SSH_AUTH_SOCK`, does not give them to its Session.
- A program in the Session uses the three `NOMUX_` variables to tell the daemon which Session it is in, for example `nomux status set` and `nomux hook`. The token proves that a request comes from a process of the Session. No file has it. It does not protect against another process of the same user, which can read the environment too.

The guide [Environment of a Session](/docs/guides/session-environment/) has the details.

## The memory of a Session

`nomux ls --memory` shows the memory of the processes of each Session: the command and each process that descends from it, the number of these processes, and the holder as a separate value. The measure is `pss` on Linux. It is `rss` on macOS, and on Linux for a Session that has a process whose `pss` the kernel does not give.

- The daemon measures only when a client asks. It has no timer and keeps no value between two requests, thus an idle daemon uses no CPU time.
- A Session without a process has no values.
- A process that left the process tree of the holder, as a program that makes itself a daemon does, is not counted.
- nomux shows the memory and sets no limit for it in this version.

The guide [Memory of Sessions](/docs/guides/session-memory/) explains the two measures.

## A long home directory

A Unix socket path has 107 bytes at most on Linux and 103 bytes at most on macOS. If the longest socket path of `~/.nomux/run` has more than 103 bytes, which a home directory of more than 73 bytes causes, nomux opens the runtime directory through the symbolic link `/tmp/nomux-<hash>`. The files stay in `~/.nomux/run`. The link gives them a short path, and `NOMUX_SOCK` has that path. nomux makes the link again if a cleanup of `/tmp` removed it. The rule uses the limit of macOS on each host, thus a client knows the socket of a remote Host from its home directory only.

The guide [Long home directories](/docs/guides/long-home-paths/) has the details.

## After a restart of the Host

A restart ends each process, also each holder and each command. The state directory stays.
When the daemon starts again, it reads the state directory. A Session whose description says that its command ran, and that has no holder, is **dormant**: `nomux ls` shows it with its command and without a process.

A restore starts the command of a dormant Session again: the daemon starts a new holder with the same session identifier, the same command, the same working directory and the same window size. The new holder writes to the same journal, and the Session gets the next epoch.
The [restore policy](/docs/guides/after-a-restart/#restore-policies) of the Session decides when this happens: when the daemon starts, at the first attach, or only with `nomux start`.

The processes of the Session from before the restart do not come back. The new command starts from the beginning. The output from before stays in the journal, and an attach shows its end above the new screen.

The same thing happens when a holder is killed with `SIGKILL`, or when it fails: the Session becomes dormant. [After a restart](/docs/guides/after-a-restart/) shows it with real commands.

### When a Session ends

- Its command ends, or you end it with `nomux kill`. The daemon keeps the ended Session, its exit status and its journal for the retention time, 24 hours by default. `nomux ls --all` shows it. The daemon keeps its last Agent run too: [the kept run](#what-nomux-knows-about-an-agent).
- You remove a dormant Session with `nomux kill`. Its journal is removed too.
- A service manager stops all the processes of the daemon together. The service file of `nomux daemon install-service` has `KillMode=process`, thus a stop of that unit stops only the daemon. With the default `KillMode=control-group` of systemd, a stop of the unit ends the holders too, and the Sessions become dormant.

## What is kept where

| Data | Where | Lifetime |
|---|---|---|
| The PTY and the command | The holder process | Until the command ends, or the holder ends |
| The current screen and the most recent 256 KiB of output | The memory of the holder | Until the holder ends |
| The reports of the programs: 64 program status records at most, the last prompt mark and the last 16 notifications | The memory of the holder | Until the holder ends |
| The list of the Sessions | The memory of the daemon | A new daemon makes it again from the runtime directory and the state directory |
| The agent status of each Session, the kept runs (64 at most) and the events (1024 at most) | The memory of the daemon | Until the daemon ends. A new daemon reads the program reports from the holders again and starts with no event |
| `nomuxd.sock`, `nomuxd.lock`, `nomuxd.log` | `~/.nomux/run/` | The socket, the lock and the log of the daemon. The log stays empty if there is no problem |
| `pid`, `sock`, `ready` | `~/.nomux/run/<session identifier>/` | The files of one holder. The holder removes them when it ends |
| `pid`, `sock`, `ready` | `~/.nomux/run/<session identifier>.pool/` | The files of a pooled holder. The directory has the plain session identifier when a Session takes the holder |
| The socket link | `/tmp/nomux-<hash>` | Only for a long home directory. nomux makes it again if it is gone |
| `session`, `restore-policy`, `journal/` | `~/.local/state/nomux/sessions/<session identifier>/` on Linux, `~/Library/Application Support/nomux/sessions/<session identifier>/` on macOS | The description, the restore policy and the journal of one Session. They stay after a restart, until `nomux kill` of a dormant Session or the end of the retention time of an ended Session |
| The installed extensions | `~/.local/share/nomux/extensions/` on Linux, `~/Library/Application Support/nomux/extensions/` on macOS | Until `nomux ext rm` |
| The record of the installed hooks of a tool | `~/.local/share/nomux/hooks/<tool>/` on Linux, `~/Library/Application Support/nomux/hooks/<tool>/` on macOS | `nomux hooks install <tool> --apply` writes it. It stays after a restart, and `nomux hooks uninstall <tool>` reads it |
| The remote Hosts, the restore policy for new Sessions, the retention time, the keys of the holder pool | `~/.config/nomux/config.toml` on Linux, `~/Library/Application Support/nomux/config.toml` on macOS | Until you change the file. `nomux host add` writes it |

This is the state directory of one Session after a restore. The run stopped each nomux process with `kill -9`, as a restart does, and then ran `nomux start pieithls`:

```console
$ ls -A .local/state/nomux/sessions/pieithls
journal
session
$ ls -A .local/state/nomux/sessions/pieithls/journal
00000001-0000000000000000.journal
00000002-0000000000000000.journal
$ cat .local/state/nomux/sessions/pieithls/session
nomux-session 1
epoch 2
started 1795690824
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
- The command of a Session gets the environment of the daemon, thus of the shell that started the daemon, with the changes of [the environment of a Session](#the-environment-of-a-session). A restore gives the command the environment of the daemon at that time. Its terminal has 24 rows and 80 columns until a client attaches.
- The Claude Code adapter has release 0.1.0. A tool that sends no OSC 7501 has only the self-report and the two guesses as sources.
- The size limit of the journal is fixed at 32 MiB for each Session.

The [roadmap](/docs/project/roadmap/) is the one place for the work that comes next.
The reasons for the process model are in [ADR-0001](https://github.com/nomux-sh/docs/blob/main/adr/0001-session-holder-model.md). The budgets for disk and memory are in [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md).
The terms on this page come from the [Glossary](/docs/reference/glossary/).
