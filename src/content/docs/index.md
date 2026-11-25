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

Now the CLI starts, lists and ends Sessions, and a Session continues when the daemon stops. A client cannot attach to the terminal of a Session yet.
No release exists yet. The first release is in preparation, and you can [build the binaries from source](/docs/guides/install/#build-from-source).

The [roadmap](/docs/project/roadmap/) is the one place that shows what comes next.
This site grows with the product. A page is added only when its content is ready.

## Use nomux

- [Install](/docs/guides/install/) tells you how to get the binaries, where they go and how to remove them.
- [Quick start](/docs/guides/quick-start/) starts a Session, stops the daemon and shows that the Session continues.
- [CLI reference](/docs/reference/cli/) has each command, its JSON output and the exit codes.

## Understand nomux

- [Concepts](/docs/concepts/overview/) tells you what nomux is and how its parts fit together.
- [How it works](/docs/concepts/how-it-works/) describes the three processes and why a Session continues when the daemon stops.
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
