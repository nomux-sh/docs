---
title: Extensions
description: What a nomux extension is, what the daemon does with it, which of its parts exist today, what the extension SDKs have, how an adapter extension works, and which official extensions exist.
---

In the design of nomux, each feature that is not in the core is an extension: git, files, agent adapters and more. The [concepts overview](/docs/concepts/overview/) describes that design.
This page describes what exists today.

nomux 0.5.0 runs the daemon part of an extension. The `nomux ext` commands install an extension from a directory, list it, call it, disable it and remove it. [Extensions](/docs/guides/extensions/) in the guides shows them. To write an extension, read [Write an extension](/docs/guides/write-an-extension/).

## What an extension is

An extension is a package with a manifest, `extension.toml`, and one or more parts.

| Part | Where it runs | State today |
|---|---|---|
| daemon part | On the Host, as a separate process | The protocol and SDKs for Rust, TypeScript and Go are published. `nomuxd` 0.5.0 starts and stops it. |
| UI part | In a client | Does not exist. The work starts with the desktop client. |

**The daemon part** is a program. The daemon starts it as a child process at the first call, and stops it after 60 seconds without a call.
The two processes exchange messages on the standard input and the standard output of the daemon part. The daemon part writes its log to the standard error.
The daemon part is a separate process, thus its failure is not a failure of the daemon. The protocol has this rule: if the process of an extension ends, the daemon and the Sessions continue to run.
The daemon part can also send events. The daemon puts them in its event log, and `nomux events --follow --filter extension-event` prints them.

**The UI part** is planned as a WASM component that runs in a client. The manifest already accepts a `[ui]` table, but nothing loads a UI part.

[ADR-0005](https://github.com/nomux-sh/docs/blob/main/adr/0005-extension-model.md) records the extension model and its reasons.

## What the SDKs have today

The SDKs are in the [`extension-api`](https://github.com/nomux-sh/extension-api) repository. The SDKs implement the extension API 0.1.1. The version of an SDK package is separate from the version of the extension API: the three SDKs have the version 0.1.3, and nomux 0.5.0 uses the crate `nomux-extension` 0.1.3.

| Part | Content |
|---|---|
| [Extension protocol](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md) | The specification of the messages between the daemon and a daemon part: the handshake, the life cycle, calls in the two directions, events, errors and cancellation. Its status is draft. |
| Rust SDK: the crate [`nomux-extension`](https://crates.io/crates/nomux-extension) 0.1.3 | You register methods, and the crate does the protocol. The documentation is on [docs.rs](https://docs.rs/nomux-extension). |
| TypeScript SDK: the package [`@nomux-sh/extension`](https://github.com/nomux-sh/extension-api/tree/main/sdk/typescript) 0.1.3 | It needs Node.js 22 or later. The package is on [npm](https://www.npmjs.com/package/@nomux-sh/extension). |
| Go SDK: the module [`github.com/nomux-sh/extension-api/sdk/go`](https://github.com/nomux-sh/extension-api/tree/main/sdk/go) v0.1.3 | It needs Go 1.26 or later. |
| [Conformance suite](https://github.com/nomux-sh/extension-api/tree/main/conformance) | One test host runs the same protocol cases against the `echo` extension of each SDK. An SDK is correct when its `echo` extension passes. |
| Manifest | The [JSON Schema](https://github.com/nomux-sh/extension-api/blob/main/schema/extension.schema.json) of `extension.toml`, and a validator in the Rust crate (the feature `manifest`). |
| Examples | The `echo` extension in [Rust](https://github.com/nomux-sh/extension-api/tree/main/examples/echo), [TypeScript](https://github.com/nomux-sh/extension-api/tree/main/examples/echo-typescript) and [Go](https://github.com/nomux-sh/extension-api/tree/main/examples/echo-go): one method and one event each. |

An SDK for Python is planned.

The daemon part is a process, thus you can write it in each language that reads and writes bytes. An SDK gives the framing, the handshake, the methods, the calls of host services, the events, the cancellation and the shutdown.
The Rust crate has no async runtime. It runs the methods of an extension on one thread, one at a time.
The README of `extension-api` shows how to write a daemon part in [Rust](https://github.com/nomux-sh/extension-api#write-an-extension), [TypeScript](https://github.com/nomux-sh/extension-api#write-an-extension-in-typescript) and [Go](https://github.com/nomux-sh/extension-api#write-an-extension-in-go).

## The manifest

This is the manifest of the example extension:

```toml
[extension]
id = "nomux.echo"
name = "Echo"
version = "0.1.0"
api = "^0.1"

[daemon]
command = "bin/nomux-echo"
lazy = true
```

- `api` gives the versions of the extension API that the extension can use. The extension API has its own version, which is the version of the SDKs. It is independent of the version of nomux.
- The extension API of nomux 0.5.0 is 0.1.1. nomux 0.5.0 refuses a manifest that needs a later version, for example `api = "^0.1.2"`: the message is `the extension needs the extension API version ^0.1.2, but the host supplies 0.1.1`. Write `^0.1`, or `^0.1.1` if the manifest has an `[adapter]` table.
- `daemon.command` is the program of the daemon part. With `lazy = true`, which is the default, the daemon part starts only when a client needs it.
- A `[permissions]` table names the directories, the programs, the network access and the scopes of host services that the extension needs. You approve them with `nomux ext install`. The daemon gives the approved permissions to the daemon part in the handshake.
- The daemon applies only the scopes of host services. The extension must obey the other permissions itself: the daemon does not restrict its files, its programs and its network in nomux 0.5.0.

## Host services

An extension calls a host service of the daemon. The daemon answers only if you approved the scope of the service.

| Method | Scope | What it does |
|---|---|---|
| `sessions.list` | `sessions:read` | Gives the Sessions of the Host with their state and description |
| `agent.report` | `agent:report` | Reports the status of the Agent run of a Session |
| `agent.child` | `agent:report` | Starts, changes or ends one Child work |

## Adapter extensions

An adapter is an extension that reports the [agent status](/docs/guides/agent-status/) of an agent tool from the hook events of that tool. The tool runs `nomux hook <tool> <event>` at its events, the daemon checks the token of the Session and gives the event to the adapter, and the adapter calls `agent.report` and `agent.child`.

The manifest of an adapter names its tools in an `[adapter]` table and asks for two scopes. This is the manifest of the Claude Code adapter:

```toml
[extension]
id = "nomux.agent-claude"
name = "Claude Code adapter"
version = "0.1.0"
api = "^0.1.1"

[daemon]
command = "bin/nomux-agent-claude"
lazy = true

[adapter]
tools = ["claude"]

[permissions]
scopes = ["hooks:read", "agent:report"]
network = false
```

| Scope | Gives |
|---|---|
| `hooks:read` | The hook events of the tools in the `[adapter]` table. Without this scope, the daemon gives the extension no event |
| `agent:report` | The host services `agent.report` and `agent.child`. An adapter with this scope can report for each Session of the Host |

- The adapter has two methods. The daemon calls `hook` for each event. `hooks.plan` describes the entries that the hooks of the tool need in its settings file. nomux writes them with `nomux hooks install <tool> --apply`, and the adapter writes no file.
- If more than one extension names a tool, the extension with the smallest identifier is the adapter.
- In this version the answer of a `hook` call is empty: nomux decides no permission request yet.

The guide [Agent adapters and hooks](/docs/guides/agent-adapters/) describes how to install the hooks and how to write an adapter. [Claude Code adapter](/docs/guides/claude-code/) shows the adapter of Claude Code at work.

## The official extensions

The official extensions are in the [`extensions`](https://github.com/nomux-sh/extensions) repository. They use the same public extension API as an extension from a third party. Each has the release 0.1.0 (GitHub marks both as pre-releases) with one archive for each of four targets: Linux and macOS, on x86-64 and on ARM64. `nomux ext install` reads a directory, thus you extract an archive first: [Claude Code adapter](/docs/guides/claude-code/#install-the-extension) shows the steps.

| Extension | Identifier | What it does today |
|---|---|---|
| Git | `nomux.git` | The daemon part has status, diff, staging, commit, branches, log, blame, worktrees and a status that comes from file events. |
| Claude Code adapter | `nomux.agent-claude` | The daemon part reports the status of a Claude Code Session and of its subagents from the hooks of Claude Code, and describes the install of the hooks. |

Neither extension has a UI part.

## What is not there yet

- The restriction of an extension to its approved directories, programs and network.
- More host services.
- Events from the daemon to an extension. An adapter gets its hook events as calls of its `hook` method.
- Adapters for other agent tools, and a `hook` answer with a decision of the user.
- The UI part and its API.
- The install of an extension from an archive or a URL, a registry, signature checks and an update command. To install a new version, remove the extension and install it again.

Extensions are the subject of stage M3 of the [roadmap](/docs/project/roadmap/). The terms on this page come from the [Glossary](/docs/reference/glossary/).
