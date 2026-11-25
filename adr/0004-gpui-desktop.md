# ADR-0004: GPUI for the desktop client

- Status: Accepted
- Date: 2026-11-25

## Context

The desktop client is one of the clients of nomux. It runs on Linux, macOS and Windows.

The project puts low weight and speed before each feature. The desktop client has measured targets:

- Cold start in less than 300 ms.
- Idle memory less than 80 MB, and less than 40 MB in the background.
- Idle CPU near 0 %.
- With an output flood of 10 MB/s, 60 frames per second or more.

The products that nomux compares itself with use Electron or a web stack. nomux does not take a UI that is based on Electron or on the web from them.

The rest of nomux is written in Rust.

## Decision

The desktop client uses GPUI.

- The UI framework is the `gpui` crate, version 0.2.2, license Apache-2.0. This is the official release of Zed on crates.io. The version is pinned.
- The component library is `gpui-component`, version 0.11.0. If a component is missing, we write it as a native GPUI component.
- The application UI does not use a WebView and does not use Electron.
- The one exception is the content of a browser Tab. A web page needs a web engine. The `browser` extension uses the system web engine through `wry`. The engine is loaded only while a browser Tab is open.
- The `ui` and `terminal_view` crates of Zed are licensed under the GPL. We do not use them. We can read them to learn. We do not copy code from them.

The mobile clients are out of the scope of this record. They use SwiftUI on iOS and Jetpack Compose on Android.

## Consequences

- The application UI is native and is written in Rust, the same language as the core.
- The GPUI API can change between versions. The version pin controls this risk. An upgrade is a planned task.
- Some components do not exist in `gpui-component`. We must write them. The diff view is a custom GPUI component with virtual scroll.
- The reusable Zed UI code is not available to us because of its license. We write our own UI components and our own terminal element.
- `cargo deny` blocks GPL and AGPL dependencies, thus a GPL crate cannot enter the build by accident. See [ADR-0006](0006-licensing.md).
- Things that are not visible are not drawn: a hidden window, a background Tab and a Pane that zoom hides. The application releases GPU memory when it is in the background.

## Alternatives considered

**Electron.**
Some reference products use it.
We did not select it. The rule of the project is native UI in all clients, with no Electron.

**A web UI in a WebView.**
A web stack in a system WebView or a similar shell.
We did not select it. The rule of the project is native UI in all clients. A web engine is permitted only for the content of a browser Tab.

**A native toolkit for one platform.**
Some reference projects use Swift with libghostty and run on macOS only.
We did not select it because the desktop client must run on Linux, macOS and Windows.

## Open questions

- Does the terminal element start from `sheprd` (`penso/sheprd`, Apache-2.0)? `sheprd` is a native terminal, Worktree and agent client in Rust and GPUI. The evaluation is not complete. Owner: milestone M5.
- When and how often do we move the pinned `gpui` version? There is no policy. Owner: milestone M5.
