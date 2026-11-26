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

Eight repositories exist, each with CI: [`.github`](https://github.com/nomux-sh/.github), [`nomux`](https://github.com/nomux-sh/nomux), [`proto`](https://github.com/nomux-sh/proto), [`extension-api`](https://github.com/nomux-sh/extension-api), [`extensions`](https://github.com/nomux-sh/extensions), [`themes`](https://github.com/nomux-sh/themes), [`homebrew-tap`](https://github.com/nomux-sh/homebrew-tap) and [`docs`](https://github.com/nomux-sh/docs).

### Released

| Component | Version | Content |
|---|---|---|
| [`nomux`](https://github.com/nomux-sh/nomux/releases/tag/v0.3.0) | 0.3.0 | Local Sessions with attach, the journal of each Session and `nomux capture`, dormant Sessions and their restore after a restart of the Host, the service file for the daemon at login, remote Hosts through SSH, and the extension host with the `ext` commands. The [install page](/docs/guides/install/) has the steps. |
| [Homebrew formula](https://github.com/nomux-sh/homebrew-tap) | 0.3.0 | `brew install nomux-sh/tap/nomux` installs the binaries of the `nomux` release on macOS and Linux. |
| [`nomux-proto`](https://crates.io/crates/nomux-proto) | 0.7.0 | The protocol crate of the `proto` repository. nomux 0.3.0 uses version 0.5.0. |
| [`nomux-extension`](https://crates.io/crates/nomux-extension) | 0.1.0 | The extension SDK, from the `extension-api` repository. The [extensions page](/docs/concepts/extensions/) says what it has. |
| [`nomux-theme`](https://crates.io/crates/nomux-theme) | 0.1.0 | The crate that loads and checks a theme, from the `themes` repository. The [preview page](https://nomux-sh.github.io/themes/) shows each theme. |

No official extension has a release. The git extension (`nomux.git`) is on the `main` branch of the `extensions` repository, without a UI part.

### Stage M1: nearly complete

nomux 0.3.0 has most of stage M1: a Session continues when the client disconnects and when the daemon stops, and after a restart of the Host it is dormant and starts again on demand with its output from before.
The first screen after a restart is not measured: the measured value is the list of 50 dormant Sessions in 25.3 ms (median). The [performance page](/docs/reference/performance/#restore) has the details.

The work that remains is in the open issues of the [0.4.0 milestone](https://github.com/nomux-sh/nomux/milestone/5) of the `nomux` repository:

- The warm holder pool ([#11](https://github.com/nomux-sh/nomux/issues/11)).
- Terminal correctness: fuzz tests, golden tests and vttest ([#13](https://github.com/nomux-sh/nomux/issues/13)), and a defect of the screen state ([#29](https://github.com/nomux-sh/nomux/issues/29)).
- Performance budgets in CI ([#14](https://github.com/nomux-sh/nomux/issues/14)).

The same milestone also has:

- The memory of each Session ([#38](https://github.com/nomux-sh/nomux/issues/38)), the hibernation of idle agents ([#36](https://github.com/nomux-sh/nomux/issues/36)) and the life cycle of Worktrees ([#37](https://github.com/nomux-sh/nomux/issues/37)).
- The status of each Session ([#60](https://github.com/nomux-sh/nomux/issues/60)), which is work of stage M4.
- The size of the `nomux` binary with the SSH client ([#47](https://github.com/nomux-sh/nomux/issues/47)), processes that the tests of remote Hosts leave ([#55](https://github.com/nomux-sh/nomux/issues/55)), and a correction of `docs/cli.md` ([#39](https://github.com/nomux-sh/nomux/issues/39)).

The milestone page has the current list.

### Stage M2: done, with exceptions

nomux 0.3.0 has remote Hosts: `nomux host add` connects through SSH, installs the binaries and saves the Host, `--host` uses its daemon, and an attach connects again after a cut connection without lost output. [Remote hosts](/docs/guides/remote-hosts/) describes it.
These items are not done. The source is [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#open-points-for-the-next-versions) of nomux 0.3.0:

- Servers without streamlocal forwarding: the bridge command as a second way.
- Configurations that the client does not support: the fallback to the `ssh` program with `ControlMaster`.
- Local echo before the answer of the Host, for a connection with a long round trip. Thus the test "typing feels the same as on a local Host with 100 ms of latency" is not met: a key waits one round trip.
- Host certificates and user certificates (`CertificateFile`).
- Removal of old versions from `~/.nomux/bin`.
- The environment of a Session on a remote Host.
- `/etc/ssh/ssh_config`.
- QUIC, port forwarding and file transfer.

The same document says that a measurement with real packet loss was not made: the loss of the measurements is a model in a relay program.

### Stage M3: in progress

- `nomuxd` 0.3.0 has the extension host. It installs an extension from a directory with the permissions that the user approves, starts its daemon part at the first call and stops it when it is idle. [Extensions](/docs/guides/extensions/) shows the commands.
- The git extension is on the `main` branch of the `extensions` repository. It has no release.
- Not done: an extension for file access, the events of an extension for the clients, more host services (the daemon supplies only `sessions.list`), the restriction of the files, programs and network of an extension, and the data model of Projects and Worktrees.

### Other stages

- **M5.** The `themes` repository has the token set, the base themes and the `nomux-theme` crate. The desktop client does not exist.

All other stages are planned.

## Stages M2 and M3: work has started

- **M2.** The work on remote Hosts has started. Its work items are the issues of the [0.3.0 milestone](https://github.com/nomux-sh/nomux/milestone/3) of the `nomux` repository. No version has a remote Host yet.
- **M3.** The work on the extension SDK has started: `nomux-extension` 0.1.0 is published. The daemon does not start extensions yet.

All other stages are planned.

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
| **M2** Remote Hosts | One command adds a remote Host through SSH and installs the binaries on it. Typing stays fast on a slow connection. | You add a new server with `nomux host add`: nomux installs the binaries and opens a Session. With 100 ms of latency and 2% packet loss, typing feels the same as on a local Host. | `nomux`, `proto` | `done` |
| **M3** Extension host with git and files | The daemon runs extensions as separate processes. The first official extensions supply git status and file access. The data model of Projects and Worktrees is in place. | You install an extension from a directory. The daemon starts its daemon part at the first use and stops it when it is idle. A crash of the extension does not stop the daemon and ends no Session. The git extension reports the new status of a Worktree after a file changes, without polling. | `nomux`, `extension-api`, `extensions` | `in progress` |
| **M4** Agent status engine and Teams | nomux shows the status of each Agent run and each Child work together with the source of the status. Agents of different tools work together in a Team. | Not defined. | `nomux`, `proto`, `extensions` | `planned` |
| **M5** Desktop client | A native desktop client shows the Pane tree, the Tabs and the terminal. It has a theme engine and a UI language engine. | Not defined. | `desktop`, `themes`, `locales` | `in progress` |
| **M6** Agent and extension UI | The desktop client shows agents, Teams and approval requests. The official extensions get their UI: git with diff, files with an editor, processes and a browser. | Not defined. | `desktop`, `extensions` | `planned` |
| **M7** Languages, registry and skills | Programming language extensions supply language support. A registry lists extensions, themes and language packs. Agent skills teach an agent to use the nomux CLI. The extension API gets its final form. | Not defined. | `languages`, `registry`, `skills`, `extension-api`, `desktop` | `planned` |
| **M8** Direct connection and port forwarding | A client connects to a Host directly, without SSH, after the two devices are paired. A port of a remote Host is available on the client. | Not defined. | `nomux`, `proto`, `relay`, `desktop` | `planned` |
| **M9** Mobile | The iOS and Android clients show Sessions, agents and Teams. You can approve a request, use a full terminal and commit changes. | Not defined. | `mobile`, `nomux` | `planned` |
| **M10** 1.0.0 release work | A security audit, the final measurement of each performance target, installers, automatic updates and code signing. This stage ends with version `1.0.0`. | Not defined. | All repositories | `planned` |

"Not defined" means that the stage does not have an acceptance test at this time. The test is added to this page before the work on the stage starts.

A repository that does not exist is created when the first stage that needs it starts.
The terms on this page come from the [Glossary](/docs/reference/glossary/).
