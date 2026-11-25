---
title: Architecture decisions
description: The list of nomux architecture decision records (ADRs) and the status of each one.
---

An architecture decision record (ADR) records one design decision: the context, the decision, the consequences and the alternatives.
A change to the architecture of nomux starts with an ADR.

The ADR files are plain Markdown in the [`adr/` directory](https://github.com/nomux-sh/docs/tree/main/adr) of the `nomux-sh/docs` repository.
The ADRs are written in English only.
This page is an index. It does not show the full text of the ADRs.

## Records

| ADR | Title | Status | Decision in one sentence |
|---|---|---|---|
| [0001](https://github.com/nomux-sh/docs/blob/main/adr/0001-session-holder-model.md) | Session holder model | Accepted | A separate holder process keeps the PTY of each Session, thus a Session continues when the daemon stops. |
| [0002](https://github.com/nomux-sh/docs/blob/main/adr/0002-protocol-protobuf-and-binary-frames.md) | Protocol: protobuf and binary frames | Accepted | Control messages are protobuf. Terminal data moves in binary frames with a fixed header. |
| [0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md) | VT library | Proposed | The decision waits for the benchmark of the three candidates in milestone M1. |
| [0004](https://github.com/nomux-sh/docs/blob/main/adr/0004-gpui-desktop.md) | GPUI for the desktop client | Accepted | The desktop client uses GPUI. It does not use a WebView or Electron. |
| [0005](https://github.com/nomux-sh/docs/blob/main/adr/0005-extension-model.md) | Extension model | Accepted | Daemon parts are separate processes. UI parts are WASM components. A manifest declares the permissions. |
| [0006](https://github.com/nomux-sh/docs/blob/main/adr/0006-licensing.md) | Licensing | Accepted | Code is `MIT OR Apache-2.0`. Documentation is CC BY 4.0. Contributions use the DCO. |
| [0007](https://github.com/nomux-sh/docs/blob/main/adr/0007-status-source-order.md) | Status source order | Accepted | One resolver merges the status sources in a fixed order and stores the source with each status. |

## Status values

| Status | Meaning |
|---|---|
| Proposed | The record is open for discussion. The decision is not made. |
| Accepted | The decision is made and is in effect. |
| Rejected | The proposal was discussed and not accepted. |
| Deprecated | The decision is no longer in effect and no record replaces it. |
| Superseded | A newer record replaces this record. The record names the newer one. |
