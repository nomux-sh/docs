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

## Attach and extensions

Write these terms in lowercase too.

| English term | Turkish term | Definition |
|---|---|---|
| attach | attach | To connect the terminal of a client to the terminal of a Session: the client shows the screen of the Session and sends its keys to it. "An attach" is one such connection. More than one client can be attached to one Session. The CLI command is `nomux attach`. |
| detach | detach | To end an attach. The Session continues. The CLI command is `nomux detach`. |
| extension | extension | A package that adds a feature to nomux. An extension has a manifest (`extension.toml`) and one or more parts. |
| daemon part | daemon parçası | The part of an extension that runs on the Host as a separate process. `nomuxd` starts it. |
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
- Ten terms are the same in the two languages: Host, Worktree, Session, Pane, Tab, holder, daemon, attach, detach and extension.
- Names in code follow the English term. Examples are the database tables `sessions`, `agent_runs` and `child_work`, and the environment variable `NOMUX_SURFACE_ID`.
