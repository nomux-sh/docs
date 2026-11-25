# ADR-0004: GPUI for the desktop client

- Status: Accepted
- Date: 2026-11-25
- Amended: 2026-11-25, see "Amendment 2026-11-25: pin strategy"

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

## Amendment 2026-11-25: pin strategy

The decision stays: the desktop client uses GPUI, the UI is native, and the application UI uses no WebView and no Electron.
This amendment changes which crates the decision names and how we pin them. Where this section and the text above do not agree, this section applies.

We examined each fact below on crates.io and on GitHub on 2026-11-25. "Not verified" at the end of this section lists what we did not examine.

### Facts

**Three lines of GPUI crates are on crates.io.**

| Crate | Latest version | Publisher | License |
|---|---|---|---|
| [`gpui`](https://crates.io/crates/gpui) | 0.2.2, published on 2025-10-22 | Zed. The owners are three persons and the crates.io team of the `zed-industries` organization. | Apache-2.0 |
| [`gpui-pre`](https://crates.io/crates/gpui-pre), with `gpui-pre-platform` and other `gpui-pre-*` crates | 0.3.14, published on 2026-11-23 | One person (`huacnlee`), who is not a part of Zed. The same person publishes `gpui-component`. | Apache-2.0 |
| [`bezel-gpui`](https://crates.io/crates/bezel-gpui) | 0.3.30+zed.e4a373, published on 2026-11-22 | One person (`clearloop`), who is not a part of Zed. | Apache-2.0 |

- `gpui` has no release after 0.2.2.
- The description of `gpui-pre` 0.3.14 says that it is a snapshot of the Zed commit `f126950`. That commit exists in `zed-industries/zed` and has the date 2026-11-22. The `repository` field of `gpui-pre` names `zed-industries/zed`, but Zed does not publish the crate.
- The versions 0.3.12, 0.3.13 and 0.3.14 of `gpui-pre` have an interval of seven days.
- The three lines are three different packages. A type of one line is not a type of a different line.

**Zed recommends a git revision at this time.**
A Zed maintainer closed [Zed issue 66275](https://github.com/zed-industries/zed/issues/66275) on 2026-10-30 with this answer: Zed works on automated releases of GPUI, and until they exist, a project must pin a git revision.
In [Zed discussion 55271](https://github.com/zed-industries/zed/discussions/55271), the same maintainer says that the releases will have the weekly interval of the Zed releases.
The repository [`zed-industries/gpui`](https://github.com/zed-industries/gpui) has one commit from 2026-11-23, a README that tells the reader to come back in some weeks.
A dependency on a git revision is the official source, but crates.io accepts no crate with a git dependency.

**The component library needs `gpui-pre`.**
[`gpui-component`](https://crates.io/crates/gpui-component) 0.11.0 (published on 2026-11-23, Apache-2.0) has the requirement `gpui-pre = "=0.3.14"`: an exact version. It has the same exact requirement for `gpui-pre-macros` and `gpui-pre-sum-tree`. It does not depend on the `gpui` crate.
Its repository is [`longbridge/gpui-kit`](https://github.com/longbridge/gpui-kit). The earlier path `longbridge/gpui-component` redirects to it.
Thus the two versions in the decision above (`gpui` 0.2.2 and `gpui-component` 0.11.0) do not go together.

**The terminal reference project is `sheprd-labs/sheprd`.**
The repository [`sheprd-labs/sheprd`](https://github.com/sheprd-labs/sheprd) has the license Apache-2.0. A repository `penso/sheprd` does not exist. The earlier path `penso/herdr-gpui` redirects to `sheprd-labs/sheprd`.
`sheprd` pins `gpui-pre` and `gpui-pre-platform` at `=0.3.12` and uses `alacritty_terminal` 0.26.0. Its terminal crate, `sheprd-terminal`, is not on crates.io and depends on two other crates of `sheprd` (`sheprd-protocol` and `sheprd-backend`).

**More Zed crates are GPL than the decision above lists.**
At the `main` branch of `zed-industries/zed` (commit `8aeb64f`, 2026-11-25), these crates have `GPL-3.0-or-later` in the `license` field of their `Cargo.toml`: `terminal`, `terminal_view`, `ui`, `ui_input`, `ui_macros`, `theme`, `syntax_theme`, `rope`, `text`, `editor`, `workspace`, `settings`, `picker`, `menu`, `title_bar`, `command_palette` and `markdown`.
`syntax_theme` has an Apache license file and a GPL license file, and its `license` field says GPL.
These crates have `Apache-2.0`: `gpui`, `gpui_platform`, `gpui_macros`, `sum_tree`, `collections` and `util`.
The two lists are not complete. We examined 23 crates.

### What changes

- **Which GPUI line.** The desktop client uses the GPUI line that the component library requires. Today that is `gpui-pre` 0.3.14, with the `gpui-pre-*` crates that the client needs at the same version. This replaces "the `gpui` crate, version 0.2.2".
- **Exact pins.** Each GPUI crate and `gpui-component` has an exact version requirement (`=`). The repository of the desktop client commits its `Cargo.lock`.
- **One commit for one move.** One commit moves the GPUI crates and `gpui-component` to a new version together. The versions of the GPUI crates are the ones that the new `gpui-component` version requires.
- **One line in one build.** The build has no second GPUI line. `cargo deny` bans the `gpui` crate and the `bezel-gpui` crates while the client uses `gpui-pre`.
- **GPL crates of Zed.** We copy code only from a Zed crate that has `Apache-2.0` in its `license` field. Examine the field before you copy. The decision above names `ui` and `terminal_view` only. The rule applies to each crate in the GPL list of this section, and to each other Zed crate that is not Apache-2.0.
- **Our own terminal element.** We write the terminal element of the desktop client. We do not start from the code of `sheprd`: its terminal crate is not published, it depends on the protocol crates of `sheprd`, and `sheprd` pins a different `gpui-pre` version. We can read `sheprd` and use its code under the rules of [ADR-0006](0006-licensing.md), with a record in the `NOTICE` file. We do not use the `terminal` and `terminal_view` crates of Zed.

### Risk: the publication of GPUI changes soon

- `gpui-pre` comes from one person who is not a part of Zed, with a name and a `repository` field that look official. The exact pins and the hashes in `Cargo.lock` limit this risk. They do not remove it.
- Zed says that it will publish GPUI releases soon. When it does, `gpui-component` can move to those releases, and the name of the pinned crate then changes again.
- Thus we plan for one migration of the GPUI line. We examine the choice of the line again when Zed publishes its first new release.

### Not verified

- Nothing was built or run for this amendment. The author of the research note that this section started from had no display and did not run a GUI.
- The targets in the context (cold start, idle memory, idle CPU, frame rate) are not measured for a client on any GPUI line.
- The source of `gpui-pre` 0.3.14 was not compared with the Zed commit that its description names. Only the existence of the commit was examined.
- The licenses of the full dependency tree were not examined. `cargo deny` did not run on a real `Cargo.lock`.
- The date, the version numbers and the compatibility policy of the GPUI releases of Zed are not announced.
- The licenses of the Zed crates that the two lists do not name.
- Whether `gpui-component` 0.11.0 has each component that the desktop client needs.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- How often do we move the pinned versions? The amendment says how a move is done. It does not set an interval. Owner: stage M5.
- Do we stay on `gpui-pre`, or do we move to the releases of Zed or to a git revision of `zed-industries/zed`? The answer depends on what Zed publishes and on what `gpui-component` then requires. Owner: stage M5.
- Does a GPUI client meet the targets in the context on Linux, macOS and Windows? No measurement exists. Owner: stage M5.
