---
title: Claude Code adapter
description: Install the nomux.agent-claude extension and the hooks of Claude Code, which permissions the extension asks for, what nomux shows for a Claude Code Session, and what is not available yet.
---

The extension `nomux.agent-claude` is the [adapter](/docs/guides/agent-adapters/) of the tool `claude` ([Claude Code](https://code.claude.com)).
It reads the hook events of Claude Code and reports the [status](/docs/guides/agent-status/) of the Agent run and of its Child work to the daemon.

**This extension has release 0.1.0.** Its archive is on the [releases page](https://github.com/nomux-sh/extensions/releases). You can also build it from source and install it from a directory.
The README of the extension says that it was tested with Claude Code 2.1.332 on Linux, in five short runs. The repository has the hook data of those runs. The data of the events that these runs did not show come from the documentation of Claude Code.

The output on this page is the real output of nomux 0.4.0 on Linux. The home directory of the run is the temporary directory `/tmp/nomux-demo`.
**Claude Code did not run for this page.** The status examples replay the hook data that the `extensions` repository holds. These data are the real data of Claude Code runs, and the real `nomux hook` command of nomux 0.4.0 sent them to a real daemon and the real adapter. The scripts replayed them, not Claude Code.

## Build and install the extension

You need `git` and [rustup](https://rustup.rs). The repository pins the Rust version, and rustup installs it.

```sh
git clone https://github.com/nomux-sh/extensions.git
cd extensions
cargo build --release -p nomux-agent-claude --locked
```

An extension package is a directory with `extension.toml` and the program that the manifest names. Make it, and ask nomux to install it:

```sh
mkdir -p ~/claude-adapter/bin
cp agent-claude/extension.toml ~/claude-adapter/
cp target/release/nomux-agent-claude ~/claude-adapter/bin/
```

### The permissions

Without an approval, `nomux ext install` prints the permissions that the extension asks for and installs nothing:

```console
$ nomux ext install ./claude-adapter
nomux: the extension nomux.agent-claude 0.1.0 asks for these permissions:
  scope=hooks:read
  scope=agent:report
Nothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>
```

The exit code is 4. The two scopes are all that the extension asks for:

| Permission | Why |
|---|---|
| `scope=hooks:read` | The daemon gives the hook events of `claude` to the extension. |
| `scope=agent:report` | The extension reports the Agent run and the Child work to the daemon. |

The extension asks for no file, no program and no network access. It reads no transcript and no file of Claude Code.
The daemon applies only the scopes of host services. The extension must obey the other limits itself: see [Extensions](/docs/guides/extensions/). With `agent:report`, an adapter can report for each Session of the Host.

Approve the two scopes:

```console
$ nomux ext install ./claude-adapter --grant-all
extension nomux.agent-claude 0.1.0 installed with the permissions: scope=hooks:read scope=agent:report
$ nomux ext ls
ID                  NAME                 VERSION  STATE    PERMISSIONS                          REASON
nomux.agent-claude  Claude Code adapter  0.1.0    stopped  scope=hooks:read,scope=agent:report
```

The extension is `stopped`. The daemon starts it at the first hook event, and stops it after 60 seconds without an event.

## Install the hooks

Install the hooks of Claude Code with a diff first. [Agent adapters and hooks](/docs/guides/agent-adapters/#install-the-hooks) shows the output.

```sh
nomux hooks install claude            # show the diff
nomux hooks install claude --apply    # write ~/.claude/settings.json
nomux hooks status                    # installed, missing or different
nomux hooks uninstall claude --apply  # remove the hooks
```

- Each event gets one entry that runs `nomux` with the arguments `hook claude <event>`, without a shell. `nomux` must be on the `PATH` of Claude Code.
- The settings path is the same on Linux and macOS. A Claude Code that uses another configuration directory (`CLAUDE_CONFIG_DIR`) does not read this file: install the hooks there by hand, or pass the file with `claude --settings`.
- Start Claude Code in a nomux Session. The hook command reads `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN` from the environment of the Session. Outside a Session, `nomux hook` does nothing.

## What nomux shows

The first example has two Sessions. In the first, a prompt started a Bash call. In the second, a subagent still reads a file after the turn ended.

```console
$ nomux status --tree
  SESSION              COMMAND                            STATE    FOR  MESSAGE
* am5cbfor             ./replay.sh /tmp/nomux-demo/fifo1  working  2s
+ t53mgmym             ./replay.sh /tmp/nomux-demo/fifo2  done     0s   1 task runs in the background
*   a45f24c823c444cb5                                     working  1s   read a.txt
```

The second Session is `done`, with the message `1 task runs in the background`. Its subagent is a Child work that works. When it ends, the Session has no message.

Then the first Session asks for a permission:

```console
$ nomux status
  SESSION   COMMAND                            STATE                  FOR  MESSAGE
! am5cbfor  ./replay.sh /tmp/nomux-demo/fifo1  needs you: permission  0s   touch b.txt
+ t53mgmym  ./replay.sh /tmp/nomux-demo/fifo2  done                   0s   1 task runs in the background
$ nomux agent explain am5cbfor
session am5cbfor: needs you: permission for 0s, from adapter; message from adapter: touch b.txt

sources, in the sequence in which they decide:
  adapter             needs you: permission: touch b.txt (an adapter extension reported it from the events of the agent tool)
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000006
  resume: claude --resume 00000000-0000-4000-8000-000000000006
```

The adapter shows:

- The state of the Agent run: `working`, `needs you` with the kind (`permission`, `question` or `auth`), `done` and `error`.
- For a permission request: the tool and a short detail of the call (the command, the file path or the URL), 160 bytes at most. A word that looks like a key, a token or a password is shown as `[hidden]`. A secret of another form can still show in the detail of a command.
- Each subagent and teammate as Child work.
- Work in the background: `done` with the message `1 task runs in the background` while a subagent of the finished turn still works.
- The details of the run: the session identifier of Claude Code, the model if Claude Code sent it, and a resume command. The resume command has `claude --resume <session>`, and `--model`, `--agent` and `--permission-mode` only for the safe values. It never has a mode that skips or relaxes the permission checks (`bypassPermissions`, `auto`), a prompt or an environment variable.

## What the adapter never does

- It never answers a permission request, an elicitation or a question for you. The answer of each hook is empty.
- It never changes the permission mode of Claude Code.
- It never reads, keeps or sends a transcript, a prompt, the content of a file or the full input of a tool.
- It keeps nothing on disk. It keeps what it needs in memory, and it forgets it when the daemon stops it after 60 seconds without an event.

## Limits

- No release. You build the extension and install it from a directory.
- Claude Code did not run for the examples on this page: see above.
- `SessionStart` of Claude Code does not always have the model. Then the details have no model until the model changes.
- The Child work is one level deep: a subagent of a subagent is a Child work of the Agent run.
- When the command of a Session is `claude` and it ends, the Session ends. nomux keeps its last Agent run and the resume command ([Ended Sessions](/docs/guides/agent-status/#ended-sessions)). After the hook data of a turn and `nomux kill`, `nomux agent explain` ends with these lines:

  ```console
  $ nomux agent explain ehiz2fmv | tail -4

  from the adapter:
    tool session: 00000000-0000-4000-8000-000000000006
    resume: claude --resume 00000000-0000-4000-8000-000000000006
  ```

  The README of the extension still says that nomux shows nothing in this case. It describes an older version of nomux.
- No UI part exists. The desktop client does not exist yet.
- Not available yet: the current tool and the last line of a subagent from its transcript, an answer for approval cards (the daemon does not send the answer of a hook to Claude Code), agent teams beyond the `TeammateIdle` event, and usage and cost.

The [README of the extension](https://github.com/nomux-sh/extensions/blob/main/agent-claude/README.md) has the table of the rules that map each hook event to a status.
