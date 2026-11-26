---
title: Write an extension
description: Write the daemon part of a nomux extension in Rust, TypeScript or Go, check its manifest and the SDK with the conformance suite, and install it. The SDK READMEs have the code.
---

The daemon part of an extension is a program. The daemon of the Host starts it when a client needs it, and stops it when it is idle.
The host and the program exchange messages on the standard input and the standard output of the program. Thus you can write an extension in each language that can read and write bytes.
An SDK does the protocol for you: the framing, the handshake, your methods, the calls of host services, the events, the cancellation and the shutdown.

This page is short on purpose. It says which SDK to take and what to do with the result. The code is in the README of each SDK and in the `echo` example of each SDK, and this page does not copy it.
The output on this page is the real output of nomux 0.5.0 on Linux. The three `echo` examples were built from the tag `v0.1.3` of the [`extension-api`](https://github.com/nomux-sh/extension-api) repository and installed in a nomux 0.5.0 daemon.

## Take an SDK

All three SDKs are from the [`extension-api`](https://github.com/nomux-sh/extension-api) repository. They have the same parts, and the same conformance suite checks each one with its `echo` example. Versions earlier than 1.0.0 are pre-releases: interfaces can change between minor versions.

| Language | SDK | Version | Needs | Guide |
|---|---|---|---|---|
| Rust | crate [`nomux-extension`](https://crates.io/crates/nomux-extension) | 0.1.3 | A Rust toolchain | [Write an extension](https://github.com/nomux-sh/extension-api#write-an-extension) in the README of the repository, and [docs.rs](https://docs.rs/nomux-extension) |
| TypeScript | package [`@nomux-sh/extension`](https://www.npmjs.com/package/@nomux-sh/extension) | 0.1.3 | Node.js 22 or later on the Host that runs the extension | [README of the TypeScript SDK](https://github.com/nomux-sh/extension-api/blob/main/sdk/typescript/README.md) |
| Go | module `github.com/nomux-sh/extension-api/sdk/go` | v0.1.3 | Go 1.26 or later to build | [README of the Go SDK](https://github.com/nomux-sh/extension-api/blob/main/sdk/go/README.md) |

A Python SDK is planned ([issue #5](https://github.com/nomux-sh/extension-api/issues/5), open). It does not exist yet.

The newest version of each SDK was read from its registry for this page: crates.io, npm and the Go module proxy. All three have 0.1.3. nomux 0.5.0 builds against `nomux-extension` 0.1.3. The extension API version is separate from the SDK version: the SDKs at version 0.1.3 implement the extension API 0.1.1, and nomux 0.5.0 supplies the API 0.1.1. By default, an extension asks the host for the lowest version that has each feature that its SDK uses: `^0.1.0`. An extension that uses a later feature states the version in `api` with the same minimum. An adapter needs `^0.1.1`. A manifest that asks for `^0.1.2` or later does not install in nomux 0.5.0: the host says `the extension needs the extension API version ^0.1.2, but the host supplies 0.1.1`. The [versioning rules](https://github.com/nomux-sh/extension-api#versioning-rules) of the README and the [version rule](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md#version-rule) of the protocol have the exact rule.

Each SDK has the same rules for your program:

- The standard output carries the protocol. Write your logs to the standard error.
- The host calls your methods one at a time. While a method waits, the extension still answers health requests and records cancellations.
- Your extension is a small program that starts fast. The README of the repository has a table of the start time, the size of the program and the idle memory of the `echo` example of each SDK, and it says how it measured. This page did not measure them again.

## Start from the example

Each SDK has one example, the `echo` extension: one method and one event. It is the conformance extension of the SDK, and it is the shortest working code for the SDK. Start from the example of your language:

| Language | Example | Build |
|---|---|---|
| Rust | [`examples/echo`](https://github.com/nomux-sh/extension-api/tree/v0.1.3/examples/echo) | `cargo build --release -p nomux-echo` |
| TypeScript | [`examples/echo-typescript`](https://github.com/nomux-sh/extension-api/tree/v0.1.3/examples/echo-typescript) | `npm ci` and `npm run build --workspaces`, at the root of the repository |
| Go | [`examples/echo-go`](https://github.com/nomux-sh/extension-api/tree/v0.1.3/examples/echo-go) | `CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/nomux-echo .` |

The Rust toolchain version is pinned in the repository, and rustup installs it. In this run, the three builds worked with these commands. The TypeScript example makes `dist/main.js` (80 KB) and has a launcher `bin/nomux-echo` that runs `exec node "$(dirname "$0")/../dist/main.js"`.

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

`command` is a path in the package. The package of the TypeScript example has a launcher script that runs `node` with one bundled file, and the Go and Rust examples are binaries.
If the extension needs a file, a program or the network, or a service of the host, the manifest has a `[permissions]` table, and the user approves each permission when they install the extension: [Extensions](/docs/guides/extensions/) shows what the user sees. An extension that reads the hook events of an agent tool is an [adapter](/docs/guides/agent-adapters/).
The repository also has the [JSON Schema](https://github.com/nomux-sh/extension-api/blob/main/schema/extension.schema.json) of the manifest.

`nomux ext validate` checks a manifest without a daemon. These are the packages of the three `echo` examples:

```console
$ nomux ext validate ./nomux-echo
extension.toml is valid: nomux.echo 0.1.0 (Echo) asks for no permissions
$ nomux ext validate ./nomux-echo-typescript
extension.toml is valid: nomux.echo-typescript 0.1.0 (Echo (TypeScript)) asks for no permissions
$ nomux ext validate ./nomux-echo-go
extension.toml is valid: nomux.echo-go 0.1.0 (Echo (Go)) asks for no permissions
```

The command checks the manifest only. `nomux ext install` also checks that the package has the program of the daemon part.

## Check the SDK with the conformance suite

The [conformance suite](https://github.com/nomux-sh/extension-api/tree/v0.1.3/conformance) is a Rust program, `nomux-conformance`. It starts an extension program as the daemon does and runs 20 cases against it: the handshake, the version rule, calls, errors, host services, events, cancellation, health requests, bad frames, the shutdown and 1000 calls in a row. An SDK is correct when its `echo` extension passes each case. The README of the suite has the commands:

```sh
cargo build -p nomux-conformance
target/debug/nomux-conformance --manifest examples/echo-go/extension.toml -- examples/echo-go/bin/nomux-echo
```

In this run, the `echo` extension of each of the three SDKs ended with `all cases passed`. `nomux-conformance --list` prints the cases and what each one examines.

## Install and call it

A package is a directory with `extension.toml` and the program. Build your program, put the files in a directory, and install it. [Extensions](/docs/guides/extensions/) shows `nomux ext install`, `ext ls`, `ext call` and `ext rm` with real output. This is the Go example:

```console
$ nomux ext install ./nomux-echo-go
extension nomux.echo-go 0.1.0 installed with no permissions
$ nomux ext call nomux.echo-go echo --payload @request.bin | od -c
0000000  \n 002   h   i
0000004
$ nomux ext rm nomux.echo-go
extension nomux.echo-go removed
```

The file `request.bin` has the protobuf message `Text` with the text `hi`. The three examples gave the same result.

## What the host gives an extension

- Events: an extension can send an event. `nomux events --follow --filter extension-event` prints it.
- Host services: the daemon supplies `sessions.list` (scope `sessions:read`) and, for adapters, `agent.report` and `agent.child` (scope `agent:report`). The daemon gets a new service together with the official extension that needs it.
- The daemon applies only the scopes of host services. It does not restrict the files, the programs and the network of an extension yet. Write an extension that keeps to the permissions that it asks for.

## What does not exist yet

- The UI part of an extension (a WASM component) is not in the SDKs, and no client loads it. The desktop client does not exist yet.
- A project template (`cargo-generate`) is not in the repository. The README of the repository says that it comes after the first official extension proves the shape of the SDK.
- No registry lists extensions, and `nomux ext install` reads only a directory. The two official extensions have a release archive each: [Extensions](/docs/guides/extensions/) says how to use it.
