---
title: Glossary
description: The one name of each nomux concept. This page is the naming authority for code, the CLI and the UI.
---

This page is the naming authority for nomux.
Each concept has one name. Code, the CLI, the UI and the documentation use that name and no other.

If you write code, a command, a UI label, a page or a decision record, use the term from this table.
If you need a new concept, add it to this table first, in English and in Turkish.

## Terms

| English term | Turkish term | Definition |
|---|---|---|
| Host | Host | A machine that runs `nomuxd`. A Host is local, or you connect to it through SSH or through a direct connection. |
| Project | Proje | A repository on a Host. A Project has a folder, a default agent and a color. |
| Worktree | Worktree | A git worktree of a Project. A Task usually runs in its own Worktree. |
| Session | Session | One PTY that one holder process keeps. A shell, an agent and a development server are all Sessions. |
| Agent run | Agent çalışması | One agent that runs in a Session. An Agent run has a tool, a model, a status and the session identifier of the provider. The provider identifier lets the agent resume. |
| Child work | Alt iş | A subagent, a teammate or a background task of an Agent run. A Child work can have its own Child work. The depth limit is 8. |
| Team | Takım | A group of Sessions with one leader and its members. A Team lives in one Tab. The members can be different tools. |
| Task | Görev | A unit of work that the user or an agent opens. A Task has a title, a Worktree and an assigned Session or Team. |
| Pane | Pane | A leaf in the Pane tree. A Pane holds a stack of Tabs. |
| Tab | Tab | One content item in a Pane. A registry of content types supplies the type of the Tab. |
| Surface ID | Yüzey kimliği | The identifier of a Tab. It does not change during the life of the Tab. The Session gets it through an environment variable. |

## Processes and files

These terms name the processes of a Host and their files. Write them in lowercase.

| English term | Turkish term | Definition |
|---|---|---|
| holder | holder | The process that keeps the PTY of one Session. One holder runs for each Session. Its binary is `nomux-holder`. |
| daemon | daemon | The process that starts the holders, finds them again after a restart and answers the clients. One daemon runs for each user on a Host. Its binary is `nomuxd`. |
| client | istemci | A program that connects to the daemon to show or change Sessions. The CLI (`nomux`), the desktop application and the mobile applications are clients. |
| runtime directory | runtime dizini | The directory in which the daemon and the holders keep their sockets and their discovery files: `~/.nomux/run`. |
| session identifier | session kimliği | The name of one Session on a Host. The daemon makes it: 8 characters from `a` to `z` and `2` to `7`. The CLI prints it and accepts it. |
| state directory | state dizini | The directory in which each Session keeps its description and its journal: `~/.local/state/nomux` on Linux, `~/Library/Application Support/nomux` on macOS. It stays after a restart of the Host. |
| journal | journal | The output of one Session on disk, in the state directory. The holder writes it. It has 32 MiB of files at most for one Session. `nomux capture` reads it. |
| checkpoint | checkpoint | A copy of the screen of a Session at one position of its journal. The holder writes one at the start, after each 1 MiB of output and after a change of the window size. |
| epoch | epoch | The number of one run of the command of a Session: 1 for a new Session, and 1 more after each restore. |
| service file | servis dosyası | The file that starts the daemon at login: a systemd user unit on Linux, a launchd agent on macOS. `nomux daemon install-service` writes it. |

## Session states and restore

Write these terms in lowercase, but Session. The CLI shows the states as `running`, `unreachable`, `dormant`, `ended` and `damaged`.

| English term | Turkish term | Definition |
|---|---|---|
| dormant Session | uykudaki Session | A Session without a process: its holder is gone and its command did not end, for example after a restart of the Host. The daemon keeps its description and its journal. A restore starts its command again. |
| ended Session | biten Session | A Session whose command ended. The daemon keeps it with its exit status and its journal for the retention time. Only `nomux ls --all` shows it. |
| damaged Session | bozuk Session | A Session whose description the daemon cannot read. `nomux kill` removes it. |
| restore | geri yükleme | To start the command of a dormant Session again, with its command, its working directory and its window size. The processes from before do not come back. The output from before stays in the journal. |
| restore policy | geri yükleme politikası | When the daemon restores a dormant Session: `auto` (when the daemon starts), `on-focus` (at the first attach or `nomux start`, the default) or `manual` (only with `nomux start`). The CLI command is `nomux restore-policy`. |
| retention time | saklama süresi | How long the daemon keeps an ended Session: 24 hours by default. |
| hibernation | hazırda bekletme | Planned, not in nomux 0.3.0: the daemon stops the command of an idle agent and starts it again with its resume command when you open its Session. Not the same as a dormant Session, which comes from the end of its holder. |

## Remote Hosts

| English term | Turkish term | Definition |
|---|---|---|
| remote Host | uzak Host | A Host that a client reaches through SSH. `nomux host add` saves it, and `--host <name>` selects it. |
| bootstrap | bootstrap | The steps that put the nomux binaries on a remote Host: probe the system, download and verify the release archive on the client, copy the binaries to `~/.nomux/bin/<version>` on the Host and verify them. `nomux host add` does it, and each command with `--host` does it if the binaries are absent. |

## Attach and extensions

Write these terms in lowercase too.

| English term | Turkish term | Definition |
|---|---|---|
| attach | attach | To connect the terminal of a client to the terminal of a Session: the client shows the screen of the Session and sends its keys to it. "An attach" is one such connection. More than one client can be attached to one Session. The CLI command is `nomux attach`. |
| detach | detach | To end an attach. The Session continues. The CLI command is `nomux detach`. |
| extension | extension | A package that adds a feature to nomux. An extension has a manifest (`extension.toml`) and one or more parts. `nomux ext install` installs it on a Host. |
| daemon part | daemon parçası | The part of an extension that runs on the Host as a separate process. `nomuxd` starts it at the first call and stops it after 60 seconds without a call. |
| extension host | extension host | The part of the daemon that keeps the installed extensions and runs their daemon parts. |
| permission | izin | Access that an extension asks for in its manifest and that the user approves at the install: a directory (`fs`), a program (`process`), network access (`network`) or the scope of a host service (`scope`). |
| UI part | arayüz parçası | The part of an extension that runs in a client. |

## How the concepts relate

```text
Host → Project → Worktree → Session (holder) → Agent run → Child work* (subagent | teammate | background task)
                          ↘ Team (leader Session + member Sessions)
```

`nomuxd` owns the state and writes it to its database.
Each holder keeps the smallest copy of the state of its own Session.
If the daemon stops, the state is not lost. When the daemon connects again, it reads the state from the holder.

View state belongs to one client and is not part of the shared Session state.
Examples of view state are the open Tab, the Pane ratios and the sidebar width.
Thus a desktop client and a mobile client can connect to the same Session with different views.

## Rules for the terms

- Use the exact term. Do not use a synonym, for example "workspace" for Project or "window" for Pane.
- In English text, write the English term. In Turkish text, write the Turkish term.
- These terms are the same in the two languages: Host, Worktree, Session, Pane, Tab, holder, daemon, journal, checkpoint, epoch, bootstrap, attach, detach, extension and extension host.
- A value that the CLI prints or accepts is not translated: the states (`running`, `dormant`, `ended`) and the restore policies (`auto`, `on-focus`, `manual`).
- Names in code follow the English term. Examples are the database tables `sessions`, `agent_runs` and `child_work`, and the environment variable `NOMUX_SURFACE_ID`.
