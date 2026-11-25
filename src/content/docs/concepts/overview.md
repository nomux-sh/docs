---
title: Concepts overview
description: What nomux is, what the core contains, and how the parts fit together.
sidebar:
  label: Overview
---

nomux is a native agentic development environment.
You open a Task. nomux connects a Worktree and an agent Session to the Task. The agent does the work.
You see each Agent run and each Child work with its status. You examine the changes in a diff, approve them and commit them.

The terms on this page come from the [Glossary](/docs/reference/glossary/).

## Three ideas

**The Session lives on the Host.**
A small holder process keeps the PTY of each Session.
If you close the laptop, the connection drops, or the daemon stops, the terminal and the agent continue to run.
A client is a window that connects and disconnects. The clients are the desktop application, the CLI and the mobile application.

**The core is almost empty. Each feature is an extension.**
Git, files, agent adapters, the browser, notification channels, programming language support, themes and UI languages are extensions.
You can install and remove each one. An extension that you do not use is not loaded.

**Each status has a known source.**
nomux reads the status of an agent from adapter events, from the OSC 7501 terminal sequence, from a self-report, or from a fallback.
It stores the source with the status. It does not show an estimated value as a certain value.

## What the core contains

- Hosts and transport: local, SSH and direct connection. Each Host runs one `nomuxd` and one `nomux-holder` for each Session.
- The data model: Host, Project, Worktree, Session, Agent run, Child work, Team and Task.
- Persistent terminal Sessions that continue when the daemon stops or updates.
- The workspace: a Pane tree, a stack of Tabs in each Pane, and an open registry of content types.
- The agent status engine: the order of status sources, the tree of Child work, and attention signals.
- The Team Tab and its message boxes. The agents do the orchestration themselves.
- The extension hosts, the theme engine and the UI language engine.
- The clients: the CLI, the desktop application and the mobile applications.

## How the parts connect

```text
[Desktop]   [CLI]   [Mobile]
     \        |        /
      nomux protocol over SSH or QUIC
              |
           nomuxd (one on each Host)
           /                    \
 nomux-holder (one for      extensions (separate
 each Session; keeps        processes, started
 the PTY)                   on demand)
```

All clients use one protocol.
A client that disconnects does not stop a process. A daemon that stops does not stop a process.

## Platforms

A Host runs Linux or macOS. On Windows, the Host runs in WSL.
The clients run on Linux, macOS and Windows. The mobile clients run on iOS and Android.

## What nomux does not do

- The core has no language intelligence. Language extensions supply it.
- nomux has no accounts, no cloud service and no telemetry.
- nomux does not depend on tmux and does not copy the tmux commands.
- nomux does not start an agent with flags that skip permission prompts.

## Status

nomux is in development. Versions earlier than 1.0.0 are pre-releases: interfaces can change between minor versions.
The [roadmap](/docs/project/roadmap/) shows which parts exist now.
The [architecture decisions](/docs/reference/decisions/) record the main design choices.
