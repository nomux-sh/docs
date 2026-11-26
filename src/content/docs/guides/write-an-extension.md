---
title: Write an extension
description: Write the daemon part of a nomux extension in Rust, TypeScript or Go, check its manifest and install it. The SDK READMEs have the code.
---

The daemon part of an extension is a program. The daemon of the Host starts it when a client needs it, and stops it when it is idle.
The host and the program exchange messages on the standard input and the standard output of the program. Thus you can write an extension in each language that can read and write bytes.
An SDK does the protocol for you: the framing, the handshake, your methods, the calls of host services, the events, the cancellation and the shutdown.

This page is short on purpose. It says which SDK to take and what to do with the result. The code is in the README of each SDK, and this page does not copy it.
The output on this page is the real output of nomux 0.4.0 on Linux.

## Take an SDK

All three SDKs are from the [`extension-api`](https://github.com/nomux-sh/extension-api) repository. They have the same parts, and the same conformance suite checks each one with its `echo` example. Versions earlier than 1.0.0 are pre-releases: interfaces can change between minor versions.

| Language | SDK | Version | Needs | Guide |
|---|---|---|---|---|
| Rust | crate [`nomux-extension`](https://crates.io/crates/nomux-extension) | 0.1.3 | A Rust toolchain | [Write an extension](https://github.com/nomux-sh/extension-api#write-an-extension) in the README of the repository, and [docs.rs](https://docs.rs/nomux-extension) |
| TypeScript | package [`@nomux-sh/extension`](https://www.npmjs.com/package/@nomux-sh/extension) | 0.1.3 | Node.js 22 or later on the Host that runs the extension | [README of the TypeScript SDK](https://github.com/nomux-sh/extension-api/blob/main/sdk/typescript/README.md) |
| Go | module `github.com/nomux-sh/extension-api/sdk/go` | v0.1.3 | Go 1.26 or later to build | [README of the Go SDK](https://github.com/nomux-sh/extension-api/blob/main/sdk/go/README.md) |

A Python SDK is planned ([issue #5](https://github.com/nomux-sh/extension-api/issues/5)). It does not exist yet.

The SDK versions were read from the registries for this page: crates.io, npm and the Go module proxy.
nomux 0.4.0 builds against `nomux-extension` 0.1.1, thus its extension API is 0.1.1. The extension API version is separate from the SDK version: the SDKs at version 0.1.3 implement the extension API 0.1.1. By default, an extension asks the host for the lowest version that has each feature that its SDK uses: `^0.1.0`. An extension that uses a later feature states the version in `api` with the same minimum. An adapter needs `^0.1.1`. The [versioning rules](https://github.com/nomux-sh/extension-api#versioning-rules) of the README and the [version rule](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md#version-rule) of the protocol have the exact rule.

Each SDK has the same rules for your program:

- The standard output carries the protocol. Write your logs to the standard error.
- The host calls your methods one at a time. While a method waits, the extension still answers health requests and records cancellations.
- Your extension is a small program that starts fast. The `echo` example of each SDK starts in less than 30 ms, with the program from 0.6 MB (Rust) to 3.7 MB (Go). The TypeScript bundle is 77 KB, and it needs Node.js. The README of the repository has the table and says how it measured.

## Write the manifest

Next to the program, you write the manifest `extension.toml`. This is the manifest of the `echo` example in Go. The manifests of the Rust and the TypeScript examples are close to it:

```toml
[extension]
id = "nomux.echo-go"
name = "Echo (Go)"
version = "0.1.0"
api = "^0.1"

[daemon]
command = "bin/nomux-echo"
lazy = true
```

`command` is a path in the package. The daemon part of the TypeScript example has a launcher script that runs `node` with one bundled file, and the Go and Rust examples are binaries.
If the extension needs a file, a program or the network, or a service of the host, the manifest has a `[permissions]` table, and the user approves each permission when they install the extension: [Extensions](/docs/guides/extensions/) shows what the user sees. An extension that reads the hook events of an agent tool is an [adapter](/docs/guides/agent-adapters/).

`nomux ext validate` checks a manifest without a daemon. These are the manifests of the three `echo` examples, read from the `main` branch of the repository:

```console
$ nomux ext validate echo
extension.toml is valid: nomux.echo 0.1.0 (Echo) asks for no permissions
$ nomux ext validate echo-typescript
extension.toml is valid: nomux.echo-typescript 0.1.0 (Echo (TypeScript)) asks for no permissions
$ nomux ext validate echo-go
extension.toml is valid: nomux.echo-go 0.1.0 (Echo (Go)) asks for no permissions
```

The command checks the manifest only. `nomux ext install` also checks that the package has the program of the daemon part.

## Install and call it

A package is a directory with `extension.toml` and the program. Build your program, put the files in a directory, and install it. [Extensions](/docs/guides/extensions/) shows `nomux ext install`, `ext ls`, `ext call` and `ext rm` with real output.

## What the host gives an extension

- Events: an extension can send an event. `nomux events --follow --filter extension-event` prints it.
- Host services: the daemon supplies `sessions.list` (scope `sessions:read`) and, for adapters, `agent.report` and `agent.child` (scope `agent:report`). The daemon gets a new service together with the official extension that needs it.
- The daemon applies only the scopes of host services. It does not restrict the files, the programs and the network of an extension yet. Write an extension that keeps to the permissions that it asks for.

## What does not exist yet

- The UI part of an extension (a WASM component) is not in the SDKs, and no client loads it. The desktop client does not exist yet.
- A project template (`cargo-generate`) does not exist. It will come after an official extension proves the shape of the SDK.
- No registry lists extensions, and no official extension has a release. [Extensions](/docs/guides/extensions/) says how to build the two official ones from source.
