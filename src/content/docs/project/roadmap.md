---
title: Roadmap
description: The stages of the nomux work in order, the goal of each stage, the repositories that it changes and its state.
---

This page shows the order of the nomux work and the state of each stage.
It has no dates and no time estimates. A stage is complete when its work is complete.

## Release policy

- Each stage ends with a `0.x` pre-release of the components that the stage changed.
- The first usable version of each component is published as soon as it works.
- A version earlier than `1.0.0` is a pre-release: interfaces can change between minor versions.
- A component gets the version `1.0.0` when the full scope is complete and each performance target is measured.

[ADR-0008](https://github.com/nomux-sh/docs/blob/main/adr/0008-release-early-pre-releases.md) records this policy.
The [release guide](https://github.com/nomux-sh/.github/blob/main/RELEASING.md) gives the version rules and the release steps.

## State today

Nine repositories exist. Eight of them have CI: [`.github`](https://github.com/nomux-sh/.github), [`nomux`](https://github.com/nomux-sh/nomux), [`proto`](https://github.com/nomux-sh/proto), [`extension-api`](https://github.com/nomux-sh/extension-api), [`extensions`](https://github.com/nomux-sh/extensions), [`themes`](https://github.com/nomux-sh/themes), [`homebrew-tap`](https://github.com/nomux-sh/homebrew-tap) and [`docs`](https://github.com/nomux-sh/docs). The ninth, [`desktop`](https://github.com/nomux-sh/desktop), is in development.

### Released

| Component | Version | Content |
|---|---|---|
| [`nomux`](https://github.com/nomux-sh/nomux/releases/tag/v0.5.0) | 0.5.0 | Local Sessions with attach, the journal of each Session and `nomux capture`, dormant Sessions and their restore after a restart of the Host, the service file for the daemon at login, remote Hosts through SSH, the extension host with the `ext` commands, the agent status of each Session with its source (`nomux status`, `nomux agent explain`, `nomux events`), the adapter extensions and the hooks (`nomux hook`, `nomux hooks`), the memory of each Session (`nomux ls --memory`), the holder pool, the environment of a Session, and short socket paths for a long home directory. New in 0.5.0: [Groups of Projects](/docs/guides/projects-and-groups/) (`nomux project`, `nomux group`), [names for Sessions](/docs/guides/sessions/) with the target rule and attach or create, prefix keys that you can change, [`nomux send`, `nomux capture -f` and `nomux kill --all`](/docs/guides/scripting-sessions/), the page [Coming from tmux and screen](/docs/guides/coming-from-tmux-and-screen/), and [hibernation of idle agent Sessions with a memory limit](/docs/guides/hibernation/). The [install page](/docs/guides/install/) has the steps. |
| [Homebrew formula](https://github.com/nomux-sh/homebrew-tap) | 0.5.0 | `brew install nomux-sh/tap/nomux` installs the binaries of the `nomux` release on macOS and Linux, from a bottle. |
| [`nomux-proto`](https://crates.io/crates/nomux-proto) | 0.13.0 | The protocol crate of the `proto` repository. nomux 0.5.0 uses version 0.12.0. |
| Extension SDKs | 0.1.3 | The crate [`nomux-extension`](https://crates.io/crates/nomux-extension) for Rust, the package [`@nomux-sh/extension`](https://www.npmjs.com/package/@nomux-sh/extension) for TypeScript and the Go module `github.com/nomux-sh/extension-api/sdk/go`, from the `extension-api` repository, with a conformance suite that checks the three. [Write an extension](/docs/guides/write-an-extension/) says how to use them. nomux 0.5.0 uses `nomux-extension` 0.1.3. |
| [`nomux-theme`](https://crates.io/crates/nomux-theme) | 0.3.1 | The crate that loads and checks a theme, from the `themes` repository. The [preview page](https://nomux-sh.github.io/themes/) shows each theme. |

The official extensions have release 0.1.0: the git extension (`nomux.git`) and the Claude Code adapter (`nomux.agent-claude`). They have no UI part. Download an archive and install it as [Install a released extension](https://github.com/nomux-sh/extensions#install-a-released-extension) describes.

### In the main branch, not released

These changes are merged in the `main` branch of `nomux` after 0.5.0. No release has them:

- The holder answers the queries of a program, for example the cursor position and the colors.
- `nomux ext install` takes a release archive or its short form, and not only a directory.

The `extensions` repository also has a change on `main` that makes the Claude Code adapter report the idle prompt as a wait at the prompt. The adapter release 0.1.0 does not have it: a Claude Code Session at rest does not hibernate until a new release of the adapter.

### In development

- The sandbox of a Session: an agent with limits on files and network ([#109](https://github.com/nomux-sh/nomux/issues/109)).
- The life cycle of Worktrees: remove finished Worktrees and share build output ([#37](https://github.com/nomux-sh/nomux/issues/37)).
- The desktop client. The first slice is merged in the [`desktop`](https://github.com/nomux-sh/desktop) repository: one window with the rail of Projects and Groups, the sidebar of the Sessions of a Project and one terminal tab. It has no release.

The [0.6.0 milestone](https://github.com/nomux-sh/nomux/milestone/7) of the `nomux` repository lists the open issues of the next release.

### What is in progress

Stages M1 to M5 are in progress. No stage is done: each stage has an acceptance test or work that is not complete. The sections below say what 0.5.0 has and what is missing.

#### Stage M1: in progress, the acceptance test is not met

nomux 0.5.0 has the core of stage M1: a Session continues when the client disconnects and when the daemon stops, and after a restart of the Host it is dormant and starts again on demand with its output from before. 0.5.0 closed the terminal correctness issues ([#13](https://github.com/nomux-sh/nomux/issues/13) and [#29](https://github.com/nomux-sh/nomux/issues/29)), removed the typed change of the directory from the [holder pool](/docs/guides/holder-pool/) ([#74](https://github.com/nomux-sh/nomux/issues/74)) and added names, Groups, hibernation and the memory limit.
The test "after a restart of the Host, the first screen shows in 1 second" is not measured. The [performance page](/docs/reference/performance/) has the values that are measured.

The work that remains is in the open issues of the [0.6.0 milestone](https://github.com/nomux-sh/nomux/milestone/7):

- Performance budgets in CI ([#14](https://github.com/nomux-sh/nomux/issues/14)).
- A Session does not get the environment variables of the client that asks for it ([#75](https://github.com/nomux-sh/nomux/issues/75)).
- The size of the `nomux` binary with the SSH client ([#47](https://github.com/nomux-sh/nomux/issues/47)).
- Two defects that are not fixed: `nomux status set` can fail in the first moments of a Session ([#83](https://github.com/nomux-sh/nomux/issues/83)), and a holder ended once with `SIGABRT` at the first `nomux new` with a long home path ([#85](https://github.com/nomux-sh/nomux/issues/85)).
- Hibernation on memory pressure on macOS ([#100](https://github.com/nomux-sh/nomux/issues/100)). The count and the memory thresholds work on macOS. The kernel limit of the memory of a Session works on Linux with a systemd user manager only.
- A command that waits for a Session, sends a paste and captures the screen as text ([#104](https://github.com/nomux-sh/nomux/issues/104)).

The milestone page has the current list.

#### Stage M2: in progress, the acceptance test is not met

nomux 0.5.0 has remote Hosts: `nomux host add` connects through SSH, installs the binaries and saves the Host, `--host` uses its daemon, and an attach connects again after a cut connection without lost output. 0.5.0 also fixed the wait for a replacement daemon and a test of remote Hosts that failed on macOS in some runs ([#69](https://github.com/nomux-sh/nomux/issues/69)). [Remote hosts](/docs/guides/remote-hosts/) describes it.
These items are not done. The source is [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/remote.md#open-points-for-the-next-versions) of nomux 0.5.0:

- Servers without streamlocal forwarding: the bridge command as a second way.
- Configurations that the client does not support: the fallback to the `ssh` program with `ControlMaster`.
- Local echo before the answer of the Host, for a connection with a long round trip. Thus the test "typing feels the same as on a local Host with 100 ms of latency" is not met: a key waits one round trip.
- Host certificates and user certificates (`CertificateFile`).
- Removal of old versions from `~/.nomux/bin`.
- The environment of a Session on a remote Host.
- `/etc/ssh/ssh_config`.
- QUIC, port forwarding and file transfer.

The same document says that a measurement with real packet loss was not made: the loss of the measurements is a model in a relay program.

#### Stage M3: in progress

- `nomuxd` 0.5.0 has the extension host. It installs an extension from a directory with the permissions that the user approves, starts its daemon part at the first call and stops it when it is idle. An extension can send events to the clients, and an adapter extension can report a status. [Extensions](/docs/guides/extensions/) shows the commands.
- The extension SDKs exist for Rust, TypeScript and Go. A Python SDK is planned.
- The git extension and the Claude Code adapter have release 0.1.0 in the `extensions` repository.
- The data model of Projects exists in 0.5.0: a Project is a named directory, and Groups hold Projects. The data model of Worktrees does not exist.
- Not done: an extension for file access, the restriction of the files, programs and network of an extension (the sandbox is in development), and the UI part of an extension.

#### Stage M4: in progress

nomux 0.5.0 has the agent status engine: each Session has a status with its source, an Agent run has a tree of Child work, and the order of the sources is fixed. [Agent status](/docs/guides/agent-status/) shows it. The Claude Code adapter ([guide](/docs/guides/claude-code/)) is the first adapter, and it has release 0.1.0. The status of a Group is the most urgent status of the Sessions below it.
Not done: Teams, adapters for other agent tools, and the answer of a hook to the tool, which approval cards need. Stage M4 has no acceptance test yet.

#### Stage M5: in progress, the desktop client is in development

The `themes` repository has the token set, the base themes and the `nomux-theme` crate. The desktop client is in development in the [`desktop`](https://github.com/nomux-sh/desktop) repository, and its first slice is merged: one window, the rail of Projects and Groups, the sidebar of the Sessions of a Project and one terminal tab. It has no release. It has no Worktree rows, no second tab, no split, no settings and no remote Hosts. nomux 0.5.0 has no desktop client: the CLI is the only client.

### Not built

These parts do not exist in nomux 0.5.0:

- The desktop client (in development, no release) and the mobile clients.
- The Pane tree and Tabs, Teams and Tasks.
- The data model of Worktrees and their life cycle ([#37](https://github.com/nomux-sh/nomux/issues/37), in development).
- The sandbox of a Session ([#109](https://github.com/nomux-sh/nomux/issues/109), in development).
- Hibernation on memory pressure on macOS, and a kernel limit of the memory of a Session on macOS and on Linux without a systemd user manager.
- A direct connection without SSH, and port forwarding.
- A registry.

## Stages

The stages run in the order of the table. Other repositories use the identifier of a stage (M1 to M10) to refer to it.

A state is one of these values:

| State | Meaning |
|---|---|
| `planned` | The work on the stage has not started. |
| `in progress` | The work on the stage has started. |
| `done` | The work is complete and the pre-release of the stage is published. |

| Stage | Goal | Done when | Repositories | State |
|---|---|---|---|---|
| **M1** Persistent terminal core | A terminal Session continues on the Host when the client disconnects, when the daemon stops and after a restart of the Host. The CLI creates Sessions and attaches to them. | You start a Session on an SSH Host, close the laptop, open it and attach: the screen is the same. You stop `nomuxd` with `kill -9`: the Session continues. After a restart of the Host, the first screen shows in 1 second. | `nomux`, `proto` | `in progress` |
| **M2** Remote Hosts | One command adds a remote Host through SSH and installs the binaries on it. Typing stays fast on a slow connection. | You add a new server with `nomux host add`: nomux installs the binaries and opens a Session. With 100 ms of latency and 2% packet loss, typing feels the same as on a local Host. | `nomux`, `proto` | `in progress` |
| **M3** Extension host with git and files | The daemon runs extensions as separate processes. The first official extensions supply git status and file access. The data model of Projects and Worktrees is in place. | You install an extension from a directory. The daemon starts its daemon part at the first use and stops it when it is idle. A crash of the extension does not stop the daemon and ends no Session. The git extension reports the new status of a Worktree after a file changes, without polling. | `nomux`, `extension-api`, `extensions` | `in progress` |
| **M4** Agent status engine and Teams | nomux shows the status of each Agent run and each Child work together with the source of the status. Agents of different tools work together in a Team. | Not defined. | `nomux`, `proto`, `extensions` | `in progress` |
| **M5** Desktop client | A native desktop client shows the Pane tree, the Tabs and the terminal. It has a theme engine and a UI language engine. | Not defined. | `desktop`, `themes`, `locales` | `in progress` |
| **M6** Agent and extension UI | The desktop client shows agents, Teams and approval requests. The official extensions get their UI: git with diff, files with an editor, processes and a browser. | Not defined. | `desktop`, `extensions` | `planned` |
| **M7** Languages, registry and skills | Programming language extensions supply language support. A registry lists extensions, themes and language packs. Agent skills teach an agent to use the nomux CLI. The extension API gets its final form. | Not defined. | `languages`, `registry`, `skills`, `extension-api`, `desktop` | `planned` |
| **M8** Direct connection and port forwarding | A client connects to a Host directly, without SSH, after the two devices are paired. A port of a remote Host is available on the client. | Not defined. | `nomux`, `proto`, `relay`, `desktop` | `planned` |
| **M9** Mobile | The iOS and Android clients show Sessions, agents and Teams. You can approve a request, use a full terminal and commit changes. | Not defined. | `mobile`, `nomux` | `planned` |
| **M10** 1.0.0 release work | A security audit, the final measurement of each performance target, installers, automatic updates and code signing. This stage ends with version `1.0.0`. | Not defined. | All repositories | `planned` |

"Not defined" means that the stage does not have an acceptance test at this time. The test is added to this page before the work on the stage starts.

A repository that does not exist is created when the first stage that needs it starts.
The terms on this page come from the [Glossary](/docs/reference/glossary/).
