---
title: nomux documentation
description: Documentation for nomux, a native agentic development environment.
template: splash
hero:
  tagline: A native agentic development environment. Sessions stay alive on the host when the client disconnects.
  actions:
    - text: Quick start
      link: /docs/guides/quick-start/
      icon: right-arrow
    - text: Read the concepts
      link: /docs/concepts/overview/
      variant: minimal
---

## Status

nomux is in development. Versions earlier than 1.0.0 are pre-releases: interfaces can change between minor versions.

The current release is [nomux 0.3.0](https://github.com/nomux-sh/nomux/releases/tag/v0.3.0).
The CLI starts, lists and ends Sessions, attaches your terminal to a Session and detaches it. A Session continues when you detach and when the daemon stops. After a restart of the Host, a Session is dormant and starts again on demand, with its output from before.
The CLI also uses remote Hosts through SSH and installs and calls extensions.
The [install page](/docs/guides/install/) has Homebrew, the install script and the other paths to the binaries.

The [roadmap](/docs/project/roadmap/) is the one place that shows what comes next.
This site grows with the product. A page is added only when its content is ready.

## Use nomux

- [Install](/docs/guides/install/) tells you how to get the binaries, where they go and how to remove them.
- [Quick start](/docs/guides/quick-start/) starts a Session, attaches to it, detaches, stops the daemon, shows that the Session continues and reads its output.
- [After a restart](/docs/guides/after-a-restart/) shows the dormant Sessions, the restore policies and the daemon at login.
- [Remote hosts](/docs/guides/remote-hosts/) adds a server through SSH and uses its Sessions.
- [Extensions](/docs/guides/extensions/) installs an extension with the permissions that you approve, and calls it.
- [CLI reference](/docs/reference/cli/) has each command, its JSON output and the exit codes.

## Understand nomux

- [Concepts](/docs/concepts/overview/) tells you what nomux is and how its parts fit together.
- [How it works](/docs/concepts/how-it-works/) describes the three processes, what an attach does, why a Session continues when the daemon stops and what stays on disk after a restart.
- [Extensions](/docs/concepts/extensions/) tells you what an extension is, what the daemon does with it and what the extension SDK has.
- [Performance targets](/docs/reference/performance/) lists the targets and the values measured so far.
- [Glossary](/docs/reference/glossary/) gives the one name of each concept. Code, the CLI and the UI use the same names.
- [Architecture decisions](/docs/reference/decisions/) tells you where the decision records are and how a decision changes.

## Follow and contribute

- [Roadmap](/docs/project/roadmap/) shows the stages of the work in order and the state of each one.
- [Contributing](/docs/project/contributing/) links the guides of the organization and shows which repository has which part.

## Languages

This site is available in English and Turkish. Use the language menu to change the language.

## License

The documentation is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The nomux code is licensed under `MIT OR Apache-2.0`.
