---
title: Contributing
description: Where the contribution rules of nomux are, and which repository contains which part of the project.
---

The rules for a contribution are the same in each repository of the [nomux-sh](https://github.com/nomux-sh) organization.
This page links the guides. It does not copy them.

## Guides of the organization

| Guide | Content |
|---|---|
| [Contribution guide](https://github.com/nomux-sh/.github/blob/main/CONTRIBUTING.md) | How to start, the sign-off of each commit (DCO), the format of commit messages and pull requests, the Rust rules and the license rules. |
| [Code of Conduct](https://github.com/nomux-sh/.github/blob/main/CODE_OF_CONDUCT.md) | The rules of behaviour for all participants. |
| [Security policy](https://github.com/nomux-sh/.github/blob/main/SECURITY.md) | How to report a vulnerability. Do not report it in a public issue. |
| [Support](https://github.com/nomux-sh/.github/blob/main/SUPPORT.md) | Where to report a bug and where to ask for a feature. |
| [Release guide](https://github.com/nomux-sh/.github/blob/main/RELEASING.md) | The version rules, the changelog and the release steps. |

Each repository also has an `AGENTS.md` file with the rules of that repository. The rules apply to people and to coding agents.

## Repository map

- [`nomux`](https://github.com/nomux-sh/nomux): the core in Rust. It has the holder, the daemon, the extension host, the SSH transport, the client library and the CLI.
- [`proto`](https://github.com/nomux-sh/proto): the protocol between a client and the daemon. It has the schemas, the specifications and the `nomux-proto` crate.
- [`extension-api`](https://github.com/nomux-sh/extension-api): the extension SDK. It has the protocol between the daemon and the daemon part of an extension, the `nomux-extension` crate and the format of `extension.toml`.
- [`extensions`](https://github.com/nomux-sh/extensions): the official extensions. It has the git extension now.
- [`themes`](https://github.com/nomux-sh/themes): the design tokens, the themes and the `nomux-theme` crate. Its [preview page](https://nomux-sh.github.io/themes/) shows each theme.
- [`homebrew-tap`](https://github.com/nomux-sh/homebrew-tap): the Homebrew formula of nomux.
- [`docs`](https://github.com/nomux-sh/docs): this site, the glossary, the roadmap, the architecture decision records and the research notes.
- [`.github`](https://github.com/nomux-sh/.github): the guides of the table above, the organization profile and the CI workflows that the repositories share.
- A repository that does not exist yet is created when the work needs it. The [roadmap](/docs/project/roadmap/) names these repositories.

## Where to start

- For a bug or a small change, open an issue or a pull request in the repository that has the code.
- For a large change, open an issue first and get agreement on the design.
- A change to the architecture starts with an architecture decision record. Refer to [architecture decisions](/docs/reference/decisions/).
- Before you use a new name in code, in the CLI or in a page, add it to the [Glossary](/docs/reference/glossary/).

To build and check the core, use the commands in the [README of `nomux`](https://github.com/nomux-sh/nomux#build). To build this site, use the commands in the [README of `docs`](https://github.com/nomux-sh/docs#readme).

## Licenses

The code is licensed under `MIT OR Apache-2.0`. The documentation is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
