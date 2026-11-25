---
title: How it works
description: The three nomux processes, why a Session continues when the daemon stops, and what is kept where.
---

nomux runs three types of process on a Host: the client, the daemon and the holder.
This page describes what exists now. The [concepts overview](/docs/concepts/overview/) describes the full design.

## The three processes

<figure>
<svg viewBox="0 0 540 452" role="img" aria-labelledby="processes-title processes-description" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 540px; height: auto;" fill="none" stroke="currentColor" stroke-width="1.5" font-size="14">
<title id="processes-title">The three nomux processes</title>
<desc id="processes-description">The client connects to the daemon through a Unix socket. The daemon connects to one holder for each Session through a control socket. The holder owns the PTY of the command. The holder and the command continue when the daemon stops.</desc>
<rect x="20" y="12" width="320" height="60" rx="6"/>
<rect x="20" y="126" width="320" height="60" rx="6"/>
<rect x="8" y="232" width="344" height="208" rx="10" stroke-dasharray="6 5"/>
<rect x="20" y="246" width="320" height="60" rx="6"/>
<rect x="20" y="366" width="320" height="60" rx="6"/>
<path d="M180 72 V124 M174 116 L180 124 L186 116"/>
<path d="M180 186 V244 M174 236 L180 244 L186 236"/>
<path d="M180 306 V364 M174 356 L180 364 L186 356 M174 314 L180 306 L186 314"/>
<g stroke="none" fill="currentColor">
<text x="34" y="37" font-weight="600">client: nomux (the CLI)</text>
<text x="34" y="58" font-size="12.5">runs one command, then ends</text>
<text x="194" y="95" font-size="12.5">Unix socket</text>
<text x="194" y="112" font-size="12" font-family="monospace">~/.nomux/run/nomuxd.sock</text>
<text x="34" y="151" font-weight="600">daemon: nomuxd</text>
<text x="34" y="172" font-size="12.5">one for each user: starts and finds holders</text>
<text x="194" y="209" font-size="12.5">control socket</text>
<text x="194" y="226" font-size="12" font-family="monospace">~/.nomux/run/&lt;id&gt;/sock</text>
<text x="34" y="271" font-weight="600">holder: nomux-holder</text>
<text x="34" y="292" font-size="12.5">one for each Session: owns the PTY</text>
<text x="194" y="341" font-size="12.5">PTY</text>
<text x="34" y="391" font-weight="600">command of the Session</text>
<text x="34" y="412" font-size="12.5">a shell, an agent, a server</text>
<text x="366" y="332" font-size="12.5">continue when</text>
<text x="366" y="349" font-size="12.5">the daemon stops</text>
</g>
</svg>
<figcaption>An arrow points from the process that connects to the process that answers. The PTY carries data in the two directions.</figcaption>
</figure>

**The client** is the program that you use. Now the only client is the CLI, `nomux`.
It reads the command line, connects to the daemon, sends one request, prints the result and ends.
If no daemon runs, the CLI starts one.

**The daemon** is `nomuxd`. One daemon runs for each user.
It starts a holder for each new Session, keeps the list of the Sessions and answers the clients.
It owns no terminal.

**The holder** is `nomux-holder`. One holder runs for each Session.
It opens the PTY, starts the command of the Session and reads the output of the command, also when no client and no daemon is connected.
It keeps the current screen of the Session in memory.
A holder is a small process with one thread. It does no work while the command writes nothing.

A client talks only to the daemon. Only the daemon talks to a holder.

## Why a Session continues when the daemon stops

The command of a Session is a child of its holder, not of the daemon. The terminal of the command belongs to the holder.
Thus the end of the daemon closes no terminal and stops no command.

The holder is also independent of the process that started it:

- It has its own process session and its own process group. A signal for the daemon or for its group does not reach the holder.
- It has no pipe to the daemon. It does not fail when the daemon is gone.
- It writes three files into the runtime directory. A new daemon reads these files, finds the holder and connects to it.

When a daemon starts, it scans the runtime directory. It connects to each holder that runs, and removes the directory of each holder that is gone.
This is why `nomux ls` shows the same Sessions after `nomux daemon stop`, after `kill -9` of the daemon and after a daemon failure.
The [quick start](/docs/guides/quick-start/#stop-the-daemon-the-sessions-continue) shows it with real commands.

Only one daemon can run for one runtime directory. A second daemon ends with an error and changes nothing.

### When a Session ends

- Its command ends, or you end it with `nomux kill`.
- Its holder is killed.
- The Host restarts. A holder is a process, and a restart ends each process. There is no restore after a restart yet.
- A service manager stops all the processes of the daemon together. If you run `nomuxd` as a systemd unit, set `KillMode=process`. With the default `KillMode=control-group`, a stop of the unit ends the holders too. nomux has no unit file yet.

## What is kept where

| Data | Where | Lifetime |
|---|---|---|
| The PTY and the command | The holder process | Until the command ends |
| The current screen and the most recent 256 KiB of output | The memory of the holder | Until the holder ends |
| The list of the Sessions | The memory of the daemon | A new daemon makes it again from the runtime directory |
| `nomuxd.sock`, `nomuxd.lock` | `~/.nomux/run/` | The socket and the lock of the daemon |
| `nomuxd.log` | `~/.nomux/run/` | The log of a daemon that the CLI started. It stays empty if there is no problem |
| `pid`, `sock`, `ready` | `~/.nomux/run/<session identifier>/` | The files of one holder. The holder removes them when its Session ends |

Nothing else is on disk. There is no database, no scrollback on disk and no configuration file.
The exit status of a command is not kept: a Session leaves the list when its command ends.

The runtime directory has the mode 0700 and each socket has the mode 0600. The daemon and the holders also close a connection that comes from a different user.

## Limits of this version

- No client can attach to the terminal of a Session.
- The command of a Session gets the environment of the daemon, thus of the shell that started the daemon. Its terminal has 24 rows and 80 columns.
- The daemon serves only the local machine. There is no remote connection.

The [roadmap](/docs/project/roadmap/) is the one place for the work that comes next.
The reasons for the process model are in [ADR-0001](https://github.com/nomux-sh/docs/blob/main/adr/0001-session-holder-model.md).
The terms on this page come from the [Glossary](/docs/reference/glossary/).
