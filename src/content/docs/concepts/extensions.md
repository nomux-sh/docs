---
title: Extensions
description: What a nomux extension is, which of its parts exist today, and what the extension SDK has.
---

In the design of nomux, each feature that is not in the core is an extension: git, files, agent adapters and more. The [concepts overview](/docs/concepts/overview/) describes that design.
This page describes what exists today.

:::caution
nomux 0.1.0 does not run extensions. The daemon has no extension host yet, and no command installs an extension.
Today you can write the daemon part of an extension with the SDK and test it. You cannot use it in nomux.
:::

## What an extension is

An extension is a package with a manifest, `extension.toml`, and one or more parts.

| Part | Where it runs | State today |
|---|---|---|
| daemon part | On the Host, as a separate process | The protocol and a Rust SDK are published. The daemon does not start a daemon part yet. |
| UI part | In a client | Does not exist. The work starts with the desktop client. |

**The daemon part** is a program. In the design, the daemon starts it as a child process when a client needs it, and stops it when it is idle.
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
- A `[permissions]` table names the directories, the programs, the network access and the scopes of host services that the extension needs. The protocol gives the approved permissions to the daemon part in the handshake. No version of nomux applies them yet.

## What is not there yet

- The extension host in the daemon. `nomuxd` 0.1.0 starts no extension.
- The host services that an extension can call, and the list of the scope names. The protocol specifies how an extension calls a host service, and names only the scope `sessions:read`.
- The UI part and its API.
- Official extensions, a registry and a command to install an extension.

Extensions are the subject of stage M3 of the [roadmap](/docs/project/roadmap/). The terms on this page come from the [Glossary](/docs/reference/glossary/).
