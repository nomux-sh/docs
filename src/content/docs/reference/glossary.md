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
| Project | Proje | A directory on a Host, with a name. A Project holds the Sessions whose working directory is the directory of the Project or is below it. A default agent and a color are planned: nomux 0.5.0 does not have them. |
| Group | Grup | A named item that holds Projects and other Groups, to any depth. `nomux group` makes and changes Groups. |
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
| session identifier | session kimliği | The identifier of one Session on a Host. The daemon makes it: 8 characters from `a` to `z` and `2` to `7`. It never changes. The CLI prints it and accepts it. |
| session name | session adı | The name that the user gives to a Session, for example `api`. It has 1 to 64 characters, is unique on the Host among the Sessions that are not ended, and can change with `nomux rename`. |
| target | hedef | What a command takes to find a Session: the session identifier, the session name, or the start of one of the two. |
| state directory | state dizini | The directory in which each Session keeps its description and its journal: `~/.local/state/nomux` on Linux, `~/Library/Application Support/nomux` on macOS. It stays after a restart of the Host. |
| workspace tree | workspace ağacı | The Groups and the Projects of a Host, in the sequence that the user chose. The daemon keeps it in the file `workspace.json` of the state directory. `nomux group ls --tree` lists it, and `nomux status --tree` shows its status. A client computes the status of a Group or a Project from the Sessions below it. |
| node | düğüm | A Group or a Project of the workspace tree. The commands `nomux project` and `nomux group` take a node by its identifier or by its path, the names from the top level down to it with `/` between them. |
| journal | journal | The output of one Session on disk, in the state directory. The holder writes it. It has 32 MiB of files at most for one Session. `nomux capture` reads it. |
| checkpoint | checkpoint | A copy of the screen of a Session at one position of its journal. The holder writes one at the start, after each 1 MiB of output and after a change of the window size. |
| epoch | epoch | The number of one run of the command of a Session: 1 for a new Session, and 1 more after each restore. |
| service file | servis dosyası | The file that starts the daemon at login: a systemd user unit on Linux, a launchd agent on macOS. `nomux daemon install-service` writes it. |

## Session states and restore

Write these terms in lowercase, but Session. The CLI shows the states as `running`, `unreachable`, `dormant`, `hibernated`, `ended` and `damaged`.

| English term | Turkish term | Definition |
|---|---|---|
| dormant Session | uykudaki Session | A Session without a process: its holder is gone and its command did not end, for example after a restart of the Host. The daemon keeps its description and its journal. A restore starts its command again. |
| ended Session | biten Session | A Session whose command ended. The daemon keeps it with its exit status and its journal for the retention time. Only `nomux ls --all` shows it. |
| damaged Session | bozuk Session | A Session whose description the daemon cannot read. `nomux kill` removes it. |
| restore | geri yükleme | To start the command of a dormant Session again, with its command, its working directory and its window size. The processes from before do not come back. The output from before stays in the journal. |
| restore policy | geri yükleme politikası | When the daemon restores a dormant Session: `auto` (when the daemon starts), `on-focus` (at the first attach or `nomux start`, the default) or `manual` (only with `nomux start`). The CLI command is `nomux restore-policy`. |
| retention time | saklama süresi | How long the daemon keeps an ended Session: 24 hours by default. |
| hibernation | hazırda bekletme | The daemon stops the agent of an idle agent Session and keeps the Session, with its output and its resume command. The Session then has the state `hibernated`. Not the same as a dormant Session, which comes from the end of its holder: a hibernated Session is a dormant Session that the daemon made on purpose. |
| hibernated Session | hazırda bekleyen Session | A Session whose agent the daemon stopped by hibernation. `nomux ls` shows it as `hibernated`. |
| wake | uyandırma | To start the resume command of a hibernated Session. `nomux wake` and `nomux attach` do it. |
| pin | sabitleme | The exclusion of a Session from automatic hibernation. `nomux pin` sets it and `nomux unpin` takes it back. |
| resume command | devam komutu | The command that starts an agent again with its earlier conversation. The adapter of the tool reports it. A wake starts it. |
| agent Session | agent Session | A Session whose command runs and whose adapter gave the details of its Agent run. Only an agent Session can hibernate. |
| memory limit | bellek limiti | The most memory that the processes of a Session can use: `sessions.memory_limit`. Where the operating system can apply it, it ends the processes at the limit. Else it is a threshold of the hibernation. |

## Agent status

These terms name what nomux knows about the work in a Session. Write them in lowercase. The CLI prints the states as `idle`, `working`, `done`, `needs you` and `error`.

| English term | Turkish term | Definition |
|---|---|---|
| agent status | agent durumu | What nomux knows about the work of an Agent run and of its Child work: a state, the source of the state, and optionally a message, a title, a progress and a tool. `nomux status` shows it. |
| state | durum | The value of an agent status: `idle`, `working`, `done`, `needs you` or `error`. `needs you` can have a kind: `permission`, `question`, `auth` or `prompt`. |
| source | kaynak | Where an agent status comes from. The daemon asks the sources in a fixed order: adapter, program status, self-report, session restore, prompt marks and foreground program. The last two are guesses. |
| guess | tahmin | A status that the daemon infers and that no program reported. The CLI marks it `(guess)`. |
| adapter | adapter | An extension that reports the agent status of one agent tool from the hook events of that tool. Also called adapter extension. |
| hook | hook | A command that an agent tool runs at an event of its work. The command for nomux is `nomux hook <tool> <event>`. `nomux hooks install` writes the hooks into the settings file of the tool. |
| self-report | öz bildirim | A status that a program in a Session reports with `nomux status set`. |
| seen | görüldü | For `done` and `error`: the user saw the result. An attach marks the results of the Session as seen. The CLI shows `(seen)`. |
| kept run | saklanan çalışma | The last Agent run of an ended Session. The daemon keeps it until it removes the Session, so that `nomux status` and `nomux agent explain` still show the result and the resume command. |
| event | olay | A change that the daemon writes to its event log, for example a new state of an Agent run. `nomux events --follow` prints the events. |
| session token | session token | A random token that the holder gives to the command of a Session in `NOMUX_TOKEN`. The daemon accepts a report for a Session only with its token. |

## Holder pool and memory

Write these terms in lowercase.

| English term | Turkish term | Definition |
|---|---|---|
| holder pool | holder havuzu | The holders that the daemon keeps ready for new Sessions, each with the shell of the user already started. The setting `pool.size` sets how many. |
| pooled holder | havuzdaki holder | A holder in the holder pool. It has no Session yet. A new Session with the shell takes it. |
| pool start file | havuz başlangıç dosyası | A file of nomux that a pooled `bash`, `zsh` or `fish` reads after your start files. It changes to the directory of the Session before the first prompt. `pool.shell_start_files` turns it on and off. |
| memory pressure | bellek baskısı | The state in which the kernel reports that processes wait for memory (Linux only). With `agents.hibernate_on_pressure`, it is a trigger of the hibernation. |
| memory measure | bellek ölçüsü | How nomux counts the memory of a Session: `pss` (proportional set size, on Linux) or `rss` (resident set size). `nomux ls --memory` shows it in the column `MEASURE`. |
| socket link | soket bağlantısı | The symbolic link `/tmp/nomux-<hash>` to the runtime directory. nomux uses it when a long home directory makes a socket path too long. |

## Remote Hosts

| English term | Turkish term | Definition |
|---|---|---|
| remote Host | uzak Host | A Host that a client reaches through SSH. `nomux host add` saves it, and `--host <name>` selects it. |
| bootstrap | bootstrap | The steps that put the nomux binaries on a remote Host: probe the system, download and verify the release archive on the client, copy the binaries to `~/.nomux/bin/<version>` on the Host and verify them. `nomux host add` does it, and each command with `--host` does it if the binaries are absent. |

## Attach and extensions

Write these terms in lowercase too.

| English term | Turkish term | Definition |
|---|---|---|
| prefix key | prefix tuşu | The key that comes before each key of nomux in an attach. The default keys are `Ctrl-a` and `Ctrl-\`. The prefix key and then `d` detaches. |
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
- These terms are the same in the two languages: Host, Worktree, Session, Pane, Tab, holder, daemon, journal, checkpoint, epoch, bootstrap, attach, detach, extension, extension host, adapter, hook, session token and agent Session.
- A value that the CLI prints or accepts is not translated: the states (`running`, `dormant`, `hibernated`, `ended`) and the restore policies (`auto`, `on-focus`, `manual`).
- Names in code follow the English term. Examples are the database tables `sessions`, `agent_runs` and `child_work`, and the environment variable `NOMUX_SURFACE_ID`.
