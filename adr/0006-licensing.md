# ADR-0006: Licensing

- Status: Accepted
- Date: 2026-11-25
- Amended: 2026-11-26, see "Amendment 2026-11-26: GPL crates of Zed"

## Context

nomux is an open source project with many repositories.
The design of nomux uses ideas from many reference projects. Some of them also have code that nomux can use again.
The reference projects have different licenses: permissive licenses, file-level copyleft, strong copyleft and licenses with a commercial limit.

The project needs rules for:

- the license of the nomux code and of the documentation,
- how contributors give their contributions,
- which third-party code can enter the repositories.

## Decision

**Code.**
All code repositories use `MIT OR Apache-2.0`.
The reasons are:

- This is the default of the Rust ecosystem.
- We can use reference code that has an MIT or Apache license without conditions.
- The Apache license has a patent clause.
- The license does not put an obstacle in front of extension authors.

**Documentation.**
The documentation uses CC BY 4.0.

**Themes and language packs.**
Themes and language packs use the same license as the code.

**Copyright holder.**
The copyright holder in the license files is "The nomux Authors".

**Contributions.**
Contributors sign off each commit with the Developer Certificate of Origin (DCO), a `Signed-off-by` line.
There is no contributor license agreement (CLA).

**Third-party code.**
Third-party code can come only from sources with one of these licenses: MIT, Apache, BSD, ISC, Zlib, or MPL (at file level).
Each piece of third-party code is listed in the `THIRD_PARTY.md` and `NOTICE` files of its repository.
`cargo deny` blocks dependencies with a GPL or AGPL license.
We do not take code from projects with a GPL license, an AGPL license or the Commons Clause.

**Reference projects.**
The table shows which reference projects permit code reuse. For "ideas only" projects, we can read the code to learn. We do not copy it.

| Class | Projects |
|---|---|
| Code reusable | rmux (MIT / Apache), omux (MIT), lmux (MIT), kmux (MIT), psmux (MIT), xmux (MIT), qmux (MIT), emux (MIT), gmux (MIT, according to its README), Orca (MIT), OpenChamber (MIT), tmux-ide (MIT), sheprd (Apache-2.0), tmux-claude-status (Apache-2.0, with its NOTICE), tmux-mem-cpu-load (Apache-2.0), the other tmux plugins (MIT), agent-sandbox (MIT) |
| Conditional | bmux (MPL-2.0, copyleft at file level) |
| Ideas only | cmux (GPL-3.0 and BUSL), mmux (GPL-3.0), jmux (AGPL-3.0), termoso (AGPL-3.0), Voltius (AGPL-3.0), claude_codex_bridge (AGPL-3.0), amux (MIT with the Commons Clause), the `ui` and `terminal_view` crates of Zed (GPL) |

The index with the URLs of the projects is in [`research/README.md`](../research/README.md).

**Trademark.**
A short trademark policy covers the name "nomux" and the logo. A fork uses a different name.

## Consequences

- Each code repository has the two license files and each commit has a `Signed-off-by` line. CI examines the sign-off on pull requests.
- Before we copy code from a reference project, we must find its class in the table. If the class is "Ideas only", we do not copy.
- Code from an Apache-2.0 source that has a NOTICE file brings the NOTICE obligations with it.
- If we take a file from an MPL-2.0 source, the file stays under MPL-2.0.
- Some useful dependencies are not available to us because of their license. One example is the `ui` crate of Zed. See [ADR-0004](0004-gpui-desktop.md).
- Each release includes a software bill of materials and a license list.

## Alternatives considered

**MIT only.**
We did not select it because the Apache license adds a patent clause.

**A copyleft license.**
We did not select it. A copyleft license can be an obstacle for extension authors, and the dual permissive license is the default of the Rust ecosystem.

**A contributor license agreement.**
We did not select it. The project uses the DCO only. No other reason is recorded.

## Amendment 2026-11-26: GPL crates of Zed

### What stays

The decision stays: we do not copy code from a project or a crate with a GPL license. The class "Ideas only" of the table of reference projects stays.

### What changes

The table names only two crates of Zed as GPL: `ui` and `terminal_view`. Zed has more GPL crates.
The [amendment of ADR-0004](0004-gpui-desktop.md#amendment-2026-11-25-pin-strategy) examined 23 crates at the `main` branch of `zed-industries/zed` (commit `8aeb64f`, 2026-11-25). These crates have `GPL-3.0-or-later` in the `license` field of their `Cargo.toml`:
`terminal`, `terminal_view`, `ui`, `ui_input`, `ui_macros`, `theme`, `syntax_theme`, `rope`, `text`, `editor`, `workspace`, `settings`, `picker`, `menu`, `title_bar`, `command_palette` and `markdown`.

These crates have `Apache-2.0`: `gpui`, `gpui_platform`, `gpui_macros`, `sum_tree`, `collections` and `util`.

- The row "Ideas only" applies to each crate of the GPL list, not only to `ui` and `terminal_view`.
- The list is not complete. A Zed crate that the list does not name is "Ideas only" until its `license` field says `Apache-2.0`. Examine the field before you copy code.

### Why

The table is the place where a contributor finds the class of a source. With two crates only, the table suggests that the other crates of Zed can be copied.

### Not verified

- This amendment examined no crate itself. The lists come from the amendment of ADR-0004.
- The licenses of the Zed crates that the two lists do not name.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- The license of gmux is MIT according to its README only. Examine the license file before code reuse. Owner: the person who wants to use the code.
- The text of the trademark policy is not written. Owner: stage M10.
- The license of each tmux plugin in the "other tmux plugins" group must be examined one by one before code reuse. Owner: the person who wants to use the code.
- The license of each Zed crate that the amendment does not name. Owner: the person who wants to use the code.
