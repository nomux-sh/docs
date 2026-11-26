---
title: Claude Code adapter
description: Install the nomux.agent-claude extension from its release archive, install the hooks of Claude Code, see which permissions the extension asks for, what nomux shows for a Claude Code Session, and what is not available yet.
---

The extension `nomux.agent-claude` is the [adapter](/docs/guides/agent-adapters/) of the tool `claude` ([Claude Code](https://code.claude.com)).
It reads the hook events of Claude Code and reports the [status](/docs/guides/agent-status/) of the Agent run and of its Child work to the daemon. It also reports the [resume command](/docs/guides/hibernation/) of the run.

**This extension has release 0.1.0.** The release is on the [releases page](https://github.com/nomux-sh/extensions/releases/tag/agent-claude@0.1.0) of the `extensions` repository, and GitHub marks it as a pre-release. The README of the extension says that it needs nomux 0.4.0 or later. It also says that the extension was tested with Claude Code 2.1.332 on Linux, in five short runs. The repository has the hook data of those runs. The data of the events that these runs did not show come from the documentation of Claude Code.

## What ran for this page

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the run is shown as `/home/user`.

- **Ran:** the release archive of the extension for Linux on x86-64 (download, checksum, `nomux ext validate`, `nomux ext install`), `nomux hooks install`, the real `nomux hook claude <event>` command, the real daemon and the real adapter.
- **Did not run:** Claude Code. The status examples replay hook data. The runs of `captured` data (a permission request, a tool call, a subagent in the background and a login that is missing) are the real data of Claude Code 2.1.332. The other data are examples that the repository of the extension wrote from the documentation of Claude Code, and the text says which examples use them. A script typed the commands into the shell of a Session. Claude Code did not send them.
- **Not tried:** the archives for Linux on ARM64 and for macOS.

## Install the extension

The archive of a release has one directory. This directory is the package of the extension. `nomux ext install` reads a package from a directory: it does not read an archive or a URL. Thus you download the archive, check its checksum and extract it first.

The release has one archive for each target and the file `SHA256SUMS`:

| Target | Computer |
|---|---|
| `x86_64-unknown-linux-musl` | Linux on x86-64 |
| `aarch64-unknown-linux-musl` | Linux on ARM64 |
| `x86_64-apple-darwin` | macOS on Intel |
| `aarch64-apple-darwin` | macOS on Apple silicon |

For Linux on x86-64, work in a new, empty directory:

```sh
tag='agent-claude@0.1.0'
archive=nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl
base="https://github.com/nomux-sh/extensions/releases/download/$tag"
mkdir claude-download && cd claude-download
curl -fsSLO "$base/$archive.tar.gz" -O "$base/SHA256SUMS"
grep " $archive.tar.gz\$" SHA256SUMS | sha256sum --check   # on macOS: shasum -a 256 --check
```

```console
$ grep " $archive.tar.gz$" SHA256SUMS | sha256sum --check
nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl.tar.gz: OK
```

Extract the archive into its own new directory, then check the manifest:

```console
$ mkdir ../claude-adapter && tar -xzf $archive.tar.gz -C ../claude-adapter
$ cd ../claude-adapter
$ ls -R
.:
nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl

./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl:
bin
extension.toml
LICENSE-APACHE
LICENSE-MIT

./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl/bin:
nomux-agent-claude
$ nomux ext validate ./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl
extension.toml is valid: nomux.agent-claude 0.1.0 (Claude Code adapter) asks for the permissions: scope=hooks:read scope=agent:report
```

### The permissions

Without an approval, `nomux ext install` prints the permissions that the extension asks for and installs nothing:

```console
$ nomux ext install ./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl
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

You approve the permissions on the command line. `--grant-all` approves both. `--grant <permission>` approves one permission, and the extension does not get the others. The adapter needs both: with `--grant scope=hooks:read` only, the command installs the extension, but it cannot report a status.

```console
$ nomux ext install ./nomux-agent-claude-0.1.0-x86_64-unknown-linux-musl --grant-all
extension nomux.agent-claude 0.1.0 installed with the permissions: scope=hooks:read scope=agent:report
$ nomux ext ls
ID                  NAME                 VERSION  STATE    PERMISSIONS                          REASON
nomux.agent-claude  Claude Code adapter  0.1.0    stopped  scope=hooks:read,scope=agent:report
```

The extension is `stopped`. The daemon starts it at the first hook event, and stops it after 60 seconds without an event. To install a new version, remove the extension first with `nomux ext rm nomux.agent-claude`.

## Install the hooks

Install the hooks of Claude Code with a diff first. [Agent adapters and hooks](/docs/guides/agent-adapters/#install-the-hooks) shows the output and says how the install keeps the format of your settings file.

```sh
nomux hooks install claude            # show the diff
nomux hooks install claude --apply    # write ~/.claude/settings.json
nomux hooks status                    # installed, missing or different
nomux hooks uninstall claude --apply  # remove the hooks
```

- Each event gets one entry that runs `nomux` with the arguments `hook claude <event>`, without a shell. `nomux` must be on the `PATH` of Claude Code.
- The settings path is the same on Linux and macOS. A Claude Code that uses another configuration directory (`CLAUDE_CONFIG_DIR`) does not read this file: install the hooks there by hand, or pass the file with `claude --settings`.
- The settings file must be strict JSON, as Claude Code 2.1 needs it. A comment or a comma after the last value stops the install, and nomux changes nothing.
- Start Claude Code in a nomux Session. The hook command reads `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN` from the environment of the Session. Outside a Session, `nomux hook` does nothing.

## What nomux shows

The adapter turns each hook event into a status. This table has the main rules. The replays on this page used the events `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `PostToolBatch`, `SubagentStart`, `SubagentStop`, `Stop`, `SessionEnd`, `Elicitation`, `StopFailure` and the notifications `idle_prompt` and `elicitation_url_dialog`. The other rows come from the README of the extension and its tests. The [README of the extension](https://github.com/nomux-sh/extensions/blob/agent-claude%400.1.0/agent-claude/README.md#rules) has the complete table.

| Hook event | Status |
|---|---|
| `SessionStart` | `idle`, with the details of the run (the session of Claude Code, the model, the resume command) |
| `UserPromptSubmit` | `working` |
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure` | `working`, with the tool. The adapter only infers this state from the tool event, thus it never ends a wait for you. |
| `PermissionRequest` | `needs you: permission`, with the tool and a short detail of the call |
| `Notification` of the type `permission_prompt` | `needs you: permission` |
| `Notification` of the type `elicitation_dialog`, `idle_prompt` or `agent_needs_input` | `needs you: question` |
| `Notification` of the type `elicitation_url_dialog` | `needs you: auth` |
| `Elicitation` | `needs you: question`, or `needs you: auth` if its `mode` is `url`. The message is the name of the MCP server. |
| `SubagentStart`, `SubagentStop` | A Child work starts, and ends as `done` |
| `Stop` | `done`, or `done` with `N task runs in the background` while a subagent still works |
| `StopFailure` | `error`, with the error type and its details |
| `SessionEnd` | Each Child work ends, and the run is `done` (or it keeps its `error`) |

The first example has the captured data of a permission request. A script typed these commands into the shell of a Session `fix-tests`:

```console
$ nomux hook claude SessionStart < 01-SessionStart.json
$ nomux hook claude UserPromptSubmit < 02-UserPromptSubmit.json
$ nomux status
  SESSION    COMMAND    STATE    FOR  MESSAGE
* fix-tests  /bin/bash  working  0s
$ nomux hook claude PreToolUse < 03-PreToolUse.json
$ nomux hook claude PermissionRequest < 04-PermissionRequest.json
$ nomux status
  SESSION    COMMAND    STATE                  FOR  MESSAGE
! fix-tests  /bin/bash  needs you: permission  0s   touch b.txt
$ nomux agent explain fix-tests
session 4v3bafnc: needs you: permission for 0s, from adapter; message from adapter: touch b.txt

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

The Claude Code of that run asked for a permission to run `touch b.txt`. After the answer, the events `PostToolBatch` and `Stop` made the status `working` and then `done`.

The second example has the captured data of a run with a subagent in the background. After the `Stop` event of the turn, the Session is `done`, and its subagent still works. The message says it:

```console
$ nomux status --tree
  NAME                 COMMAND    STATE    FOR  MESSAGE
+ fix-tests            /bin/bash  done     6s
+ refactor             /bin/bash  done     0s   1 task runs in the background
*   a45f24c823c444cb5             working  2s   read a.txt
```

When the `SubagentStop` event comes, the Child work is `done`, and the Session has no message:

```console
$ nomux status --tree | grep -E 'NAME|refactor|a45f'
  NAME                 COMMAND    STATE  FOR  MESSAGE
+ refactor             /bin/bash  done   3s
+   a45f24c823c444cb5             done   0s   read a.txt
```

The other examples use data that the repository of the extension wrote from the documentation of Claude Code. The Session `mcp-setup` got `Elicitation` events of an MCP server, and then the failure of a request because of a rate limit:

```console
$ nomux status
  SESSION    COMMAND    STATE                FOR  MESSAGE
! mcp-setup  /bin/bash  needs you: question  0s   my-mcp-server
$ nomux status
  SESSION    COMMAND    STATE            FOR  MESSAGE
! mcp-setup  /bin/bash  needs you: auth  0s   my-mcp-server
$ nomux status
  SESSION    COMMAND    STATE  FOR  MESSAGE
x mcp-setup  /bin/bash  error  0s   rate_limit: 429 Too Many Requests
```

The permission request has the tool and a short detail of the call (the command, the file path or the URL), 160 bytes at most. A word that looks like a key, a token or a password is shown as `[hidden]`. A secret of another form can still show in the detail of a command.

### Details and the resume command

The adapter reports the details of the run: the session identifier of Claude Code, the model if Claude Code sent it, and a resume command. The hook data has no command line of Claude Code, thus the adapter makes the resume command from what it knows:

- `claude --resume <session>`.
- `--model <model>` and `--agent <agent>` if the hook data have them and the value is a plain name.
- `--permission-mode <mode>` only for `plan`, `acceptEdits` and `dontAsk`. It never has a mode that skips or relaxes the permission checks (`bypassPermissions`, `auto`), a prompt or an environment variable.

With the data of a `SessionStart` that has a model and an agent type, the details look like this:

```console
$ nomux agent explain za6bvxp6 | tail -5

from the adapter:
  model: claude-haiku-4-5
  tool session: 00000000-0000-4000-8000-000000000100
  resume: claude --resume 00000000-0000-4000-8000-000000000100 --model claude-haiku-4-5 --agent code-reviewer
```

The details stay when the Session ends or hibernates. A [wake](/docs/guides/hibernation/) of a hibernated Session starts the resume command, unchanged. In this run, a small script with the name `claude` stood in for Claude Code. It prints the arguments that it gets. It is not Claude Code. This is the result for the Session `fix-tests` after its `Stop` event:

```console
$ nomux hibernate fix-tests
session 4v3bafnc hibernated: 736.0 KiB given back (pss)
$ nomux wake fix-tests
session fix-tests (4v3bafnc) woke: claude --resume 00000000-0000-4000-8000-000000000006
$ nomux capture fix-tests --lines 1
stand-in claude started with: --resume 00000000-0000-4000-8000-000000000006
```

The Session `fix-tests` ran a shell before the hibernation. After the wake, its command is the resume command: `nomux ls` shows `claude --resume 00000000-0000-4000-8000-000000000006`.

## What the adapter never does

- It never answers a permission request, an elicitation or a question for you. The answer of each hook is empty.
- It never changes the permission mode of Claude Code.
- It never reads, keeps or sends a transcript, a prompt, the content of a file or the full input of a tool.
- It keeps nothing on disk. It keeps what it needs in memory, and it forgets it when the daemon stops it after 60 seconds without an event.

## Limits

- **`idle_prompt` is a question in release 0.1.0.** Claude Code sends the notification `idle_prompt` about 60 seconds after the end of a turn if you did not type. The released adapter reports it as `needs you: question`, not as `needs you: prompt`. A Session at its prompt then does not hibernate on its own, and `nomux hibernate` refuses it:

  ```console
  $ nomux hibernate docs-site
  nomux: session it3abqm5 cannot hibernate: its agent waits for an answer of the user
  ```

  The `main` branch of the `extensions` repository has a change that reports `prompt` for this notification ([commit `b79f370`](https://github.com/nomux-sh/extensions/commit/b79f370)). No release has it. A build of that branch showed `needs you: prompt` for the same hook data in a test run for this page, and `nomux hibernate` then hibernated the Session. Until a release has the change, use the released behavior that this page describes. The `nomux` documentation of [adapters](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/adapters.md#not-done-yet) lists the gap too.
- `SessionStart` of Claude Code does not always have the model. Then the details have no model until the model changes. The captured data of the run on this page had none: `nomux --json status` shows `"model": null`.
- The Child work is one level deep: a subagent of a subagent is a Child work of the Agent run.
- When the command of a Session is `claude` and it ends, the Session ends. nomux keeps its last Agent run and the resume command ([Ended Sessions](/docs/guides/agent-status/#ended-sessions)). After the hook data of a turn and `nomux kill`, `nomux agent explain` ends with these lines:

  ```console
  $ nomux agent explain za6bvxp6 | tail -5

  from the adapter:
    model: claude-haiku-4-5
    tool session: 00000000-0000-4000-8000-000000000100
    resume: claude --resume 00000000-0000-4000-8000-000000000100 --model claude-haiku-4-5 --agent code-reviewer
  ```

  The README of the extension release still says that nomux shows nothing in this case. It describes an older version of nomux.
- In one replay of the same hook data, the `error` of a `StopFailure` event had no message, and the message did not appear later. Eleven other replays of the same events gave `rate_limit: 429 Too Many Requests`. The first case did not come again.
- No UI part exists. The desktop client does not exist yet.
- Not available yet: the current tool and the last line of a subagent from its transcript, an answer for approval cards (the daemon does not send the answer of a hook to Claude Code), agent teams beyond the `TeammateIdle` event, and usage and cost.
