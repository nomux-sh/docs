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

The current release is [nomux 0.5.0](https://github.com/nomux-sh/nomux/releases/tag/v0.5.0).
The CLI starts, lists and ends Sessions, attaches your terminal to a Session and detaches it. A Session continues when you detach and when the daemon stops. After a restart of the Host, a Session is dormant and starts again on demand, with its output from before.
The CLI also uses remote Hosts through SSH and installs and calls extensions.
nomux 0.5.0 shows what works in each Session, what is done and what needs you, with the source of each status. It shows the memory of each Session, and it keeps ready holders for new Sessions.
New in 0.5.0: Sessions have names, Projects are in Groups, you can send keys to a Session and follow its output, and the daemon hibernates idle agent Sessions and can limit the memory of a Session.
Not built yet: the desktop client (in development, no release), the mobile clients and the sandbox of a Session.
The [install page](/docs/guides/install/) has Homebrew, the install script and the other paths to the binaries.

The [roadmap](/docs/project/roadmap/) is the one place that shows what comes next.
This site grows with the product. A page is added only when its content is ready.

## Use nomux

- [Install](/docs/guides/install/) tells you how to get the binaries, where they go and how to remove them.
- [Quick start](/docs/guides/quick-start/) starts a Session, attaches to it, detaches, stops the daemon, shows that the Session continues and reads its output.
- [Sessions](/docs/guides/sessions/) gives a Session a name, finds it by a target and attaches to it, with the prefix keys of an attach.
- [Scripting Sessions](/docs/guides/scripting-sessions/) sends keys to a Session, follows its output and ends all Sessions.
- [Coming from tmux and screen](/docs/guides/coming-from-tmux-and-screen/) maps the commands of the two programs to the commands of nomux.
- [Projects and Groups](/docs/guides/projects-and-groups/) keeps your Projects in Groups and shows the status of each Group.
- [After a restart](/docs/guides/after-a-restart/) shows the dormant Sessions, the restore policies and the daemon at login.
- [Remote hosts](/docs/guides/remote-hosts/) adds a server through SSH and uses its Sessions.
- [Agent status](/docs/guides/agent-status/) shows what works, what is done and what needs you in each Session, and why.
- [Agent adapters and hooks](/docs/guides/agent-adapters/) lets an agent tool report its status, with a diff before nomux writes a settings file. [Claude Code adapter](/docs/guides/claude-code/) is the first adapter.
- [Memory of Sessions](/docs/guides/session-memory/) shows how much memory each Session uses.
- [Hibernation and the memory limit](/docs/guides/hibernation/) shows when the daemon stops an idle agent, how it starts the agent again and how to limit the memory of a Session.
- [Holder pool](/docs/guides/holder-pool/), [Environment of a Session](/docs/guides/session-environment/) and [Long home paths](/docs/guides/long-home-paths/) explain how a new Session opens fast, which variables it gets and what nomux does with a long home directory.
- [Extensions](/docs/guides/extensions/) installs an extension with the permissions that you approve, and calls it. [Write an extension](/docs/guides/write-an-extension/) says how to write one in Rust, TypeScript or Go.
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
