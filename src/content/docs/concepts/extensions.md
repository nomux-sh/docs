---
title: Extensions
description: What a nomux extension is, what the daemon does with it, which of its parts exist today, and what the extension SDK has.
---

In the design of nomux, each feature that is not in the core is an extension: git, files, agent adapters and more. The [concepts overview](/docs/concepts/overview/) describes that design.
This page describes what exists today.

nomux 0.3.0 runs the daemon part of an extension. The `nomux ext` commands install an extension from a directory, list it, call it and remove it. [Extensions](/docs/guides/extensions/) in the guides shows them.

## What an extension is

An extension is a package with a manifest, `extension.toml`, and one or more parts.

| Part | Where it runs | State today |
|---|---|---|
| daemon part | On the Host, as a separate process | The protocol and a Rust SDK are published. `nomuxd` 0.3.0 starts and stops it. |
| UI part | In a client | Does not exist. The work starts with the desktop client. |

**The daemon part** is a program. The daemon starts it as a child process at the first call, and stops it after 60 seconds without a call.
The two processes exchange messages on the standard input and the standard output of the daemon part. The daemon part writes its log to the standard error.
The daemon part is a separate process, thus its failure is not a failure of the daemon. The protocol has this rule: if the process of an extension ends, the daemon and the Sessions continue to run.

**The UI part** is planned as a WASM component that runs in a client. The manifest already accepts a `[ui]` table, but nothing loads a UI part.

[ADR-0005](https://github.com/nomux-sh/docs/blob/main/adr/0005-extension-model.md) records the extension model and its reasons.

## What the SDK has today

The SDK is the [`extension-api`](https://github.com/nomux-sh/extension-api) repository. Its first version is 0.1.0.

| Part | Content |
|---|---|
| [Extension protocol](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md) | The specification of the messages between the daemon and a daemon part: the handshake, the life cycle, calls in the two directions, events, errors and cancellation. Its status is draft. |
| [`nomux-extension`](https://crates.io/crates/nomux-extension) 0.1.0 | The Rust crate for the daemon part of an extension. You register methods, and the crate does the protocol. The documentation is on [docs.rs](https://docs.rs/nomux-extension). |
| Manifest | The [JSON Schema](https://github.com/nomux-sh/extension-api/blob/main/schema/extension.schema.json) of `extension.toml`, and a validator in the crate (the feature `manifest`). |
| [Example](https://github.com/nomux-sh/extension-api/tree/main/examples/echo) | One extension with one method and one event, and a test that runs it as a child process. |

The crate has no async runtime. It runs the methods of an extension on one thread, one at a time.
The [README of `extension-api`](https://github.com/nomux-sh/extension-api#write-an-extension) shows how to write a daemon part.

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

- `api` gives the versions of the extension API that the extension can use. The extension API has its own version, which is the version of the `nomux-extension` crate. It is independent of the version of nomux.
- `daemon.command` is the program of the daemon part. With `lazy = true`, which is the default, the daemon part starts only when a client needs it.
- A `[permissions]` table names the directories, the programs, the network access and the scopes of host services that the extension needs. You approve them with `nomux ext install`. The daemon gives the approved permissions to the daemon part in the handshake.
- The daemon applies only the scopes of host services. The extension must obey the other permissions itself: the daemon does not restrict its files, its programs and its network in nomux 0.3.0.

## What is not there yet

- The restriction of an extension to its approved directories, programs and network.
- More host services. The daemon has one host service, `sessions.list`, with the scope `sessions:read`.
- Events of an extension for the clients.
- The UI part and its API.
- A release of an official extension, a registry, signature checks and an update command. The git extension is on the `main` branch of the [`extensions`](https://github.com/nomux-sh/extensions) repository.

Extensions are the subject of stage M3 of the [roadmap](/docs/project/roadmap/). The terms on this page come from the [Glossary](/docs/reference/glossary/).
