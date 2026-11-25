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

Five repositories exist, each with CI: [`.github`](https://github.com/nomux-sh/.github), [`nomux`](https://github.com/nomux-sh/nomux), [`proto`](https://github.com/nomux-sh/proto), [`extension-api`](https://github.com/nomux-sh/extension-api) and [`docs`](https://github.com/nomux-sh/docs).

### Released

| Component | Version | Content |
|---|---|---|
| [`nomux`](https://github.com/nomux-sh/nomux/releases/tag/v0.1.0) | 0.1.0 | Local Sessions with attach. The CLI starts, lists and ends Sessions, attaches a terminal to a Session and detaches it. A Session continues when the client detaches and when the daemon stops. The [install page](/docs/guides/install/) has the steps. |
| [`nomux-proto`](https://crates.io/crates/nomux-proto) | 0.3.0 | The protocol crate of the `proto` repository. |
| [`nomux-extension`](https://crates.io/crates/nomux-extension) | 0.1.0 | The first version of the extension SDK, from the `extension-api` repository. The [extensions page](/docs/concepts/extensions/) says what it has. |

### Stage M1: what remains

Stage M1 is in progress. Version 0.1.0 does not have the full stage: a Session does not continue after a restart of the Host, and an attach shows no scrollback.
The work that remains is the open issues of the [0.2.0 milestone](https://github.com/nomux-sh/nomux/milestone/2) of the `nomux` repository:

- The journal, the checkpoint and the compressed scrollback of the holder ([#9](https://github.com/nomux-sh/nomux/issues/9)).
- The warm holder pool ([#11](https://github.com/nomux-sh/nomux/issues/11)).
- The restore of Sessions after a restart of the Host, on demand ([#12](https://github.com/nomux-sh/nomux/issues/12)).
- Terminal correctness: fuzz tests, golden tests and vttest ([#13](https://github.com/nomux-sh/nomux/issues/13)).
- Performance budgets in CI ([#14](https://github.com/nomux-sh/nomux/issues/14)).
- Six defects that are known in version 0.1.0: four in the screen state and the redraw sequence ([#24](https://github.com/nomux-sh/nomux/issues/24), [#25](https://github.com/nomux-sh/nomux/issues/25), [#27](https://github.com/nomux-sh/nomux/issues/27), [#29](https://github.com/nomux-sh/nomux/issues/29)), one in the reader of the ring buffer ([#26](https://github.com/nomux-sh/nomux/issues/26)) and one test of the attach that fails on macOS in some runs ([#33](https://github.com/nomux-sh/nomux/issues/33)).

The milestone page has the current list.

### Stages M2 and M3: work has started

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
| **M2** Remote Hosts | One command adds a remote Host through SSH and installs the binaries on it. Typing stays fast on a slow connection. | You add a new server with `nomux host add`: nomux installs the binaries and opens a Session. With 100 ms of latency and 2% packet loss, typing feels the same as on a local Host. | `nomux`, `proto` | `in progress` |
| **M3** Extension host with git and files | The daemon runs extensions as separate processes. The first official extensions supply git status and file access. The data model of Projects and Worktrees is in place. | You install an extension from a directory. The daemon starts its daemon part at the first use and stops it when it is idle. A crash of the extension does not stop the daemon and ends no Session. The git extension reports the new status of a Worktree after a file changes, without polling. | `nomux`, `extension-api`, `extensions` | `in progress` |
| **M4** Agent status engine and Teams | nomux shows the status of each Agent run and each Child work together with the source of the status. Agents of different tools work together in a Team. | Not defined. | `nomux`, `proto`, `extensions` | `planned` |
| **M5** Desktop client | A native desktop client shows the Pane tree, the Tabs and the terminal. It has a theme engine and a UI language engine. | Not defined. | `desktop`, `themes`, `locales` | `planned` |
| **M6** Agent and extension UI | The desktop client shows agents, Teams and approval requests. The official extensions get their UI: git with diff, files with an editor, processes and a browser. | Not defined. | `desktop`, `extensions` | `planned` |
| **M7** Languages, registry and skills | Programming language extensions supply language support. A registry lists extensions, themes and language packs. Agent skills teach an agent to use the nomux CLI. The extension API gets its final form. | Not defined. | `languages`, `registry`, `skills`, `extension-api`, `desktop` | `planned` |
| **M8** Direct connection and port forwarding | A client connects to a Host directly, without SSH, after the two devices are paired. A port of a remote Host is available on the client. | Not defined. | `nomux`, `proto`, `relay`, `desktop` | `planned` |
| **M9** Mobile | The iOS and Android clients show Sessions, agents and Teams. You can approve a request, use a full terminal and commit changes. | Not defined. | `mobile`, `nomux` | `planned` |
| **M10** 1.0.0 release work | A security audit, the final measurement of each performance target, installers, automatic updates and code signing. This stage ends with version `1.0.0`. | Not defined. | All repositories | `planned` |

"Not defined" means that the stage does not have an acceptance test at this time. The test is added to this page before the work on the stage starts.

A repository that does not exist is created when the first stage that needs it starts.
The terms on this page come from the [Glossary](/docs/reference/glossary/).
