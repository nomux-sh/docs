---
title: Extensions
description: Install an extension with the permissions that you approve, list it, call it, disable it and remove it with the nomux CLI.
---

An extension adds a feature to nomux. Its daemon part is a program that the daemon of the Host starts at the first call and stops when it is idle.
This page shows how to use an extension with the CLI. To write an extension, read [Write an extension](/docs/guides/write-an-extension/) and the [extension SDK](https://github.com/nomux-sh/extension-api#write-an-extension). [Extensions](/docs/concepts/extensions/) describes the model.

The output on this page is the real output of nomux 0.4.0 on Linux in a temporary home directory `/tmp/nomux-demo`.

## Which extensions exist

No extension has a release yet. There is no registry and no package to download: `nomux ext install` installs from a directory.
This page uses two extensions, built from their source for this run, and checks the manifest of a third one:

| Extension | Identifier | Source | Permissions in its manifest |
|---|---|---|---|
| Echo | `nomux.echo` | The example of the SDK: [`extension-api/examples/echo`](https://github.com/nomux-sh/extension-api/tree/v0.1.1/examples/echo) at the tag `v0.1.1` | None |
| Git | `nomux.git` | The [`git`](https://github.com/nomux-sh/extensions/tree/main/git) directory of the `extensions` repository, on its `main` branch. Version 0.1.0 is not released | `fs=${worktree}`, `process=git` |
| Claude Code adapter | `nomux.agent-claude` | The [`agent-claude`](https://github.com/nomux-sh/extensions/tree/main/agent-claude) directory of the `extensions` repository, on its `main` branch. Version 0.1.0 is not released | `scope=hooks:read`, `scope=agent:report` |

The Claude Code adapter reports the status of Claude Code. This page only checks its manifest. The [Claude Code adapter guide](/docs/guides/claude-code/) builds, installs and uses it.

Build the echo example from the tag `v0.1.1`. nomux 0.4.0 supplies the extension API version 0.1.1 to an extension. The example on the `main` branch of the SDK is built for version 0.1.2: the host refuses it with the message `the extension API version is not compatible`.

A package is a directory with the manifest `extension.toml` and the program that the `[daemon]` table of the manifest names. For the git extension, the [README of the extension](https://github.com/nomux-sh/extensions/tree/main/git#readme) has the build steps:

```sh
cargo build --release -p nomux-git
mkdir -p package/bin
cp git/extension.toml package/
cp target/release/nomux-git package/bin/
```

The echo example has the same steps in the `extension-api` repository:

```sh
cargo build --release -p nomux-echo
mkdir -p package/bin
cp examples/echo/extension.toml package/
cp target/release/nomux-echo package/bin/
```

## Check a package

`nomux ext validate` checks the manifest of a directory on this computer. It needs no daemon:

```console
$ nomux ext validate ./nomux-echo
extension.toml is valid: nomux.echo 0.1.0 (Echo) asks for no permissions
$ nomux ext validate ./nomux-git
extension.toml is valid: nomux.git 0.1.0 (Git) asks for the permissions: fs=${worktree} process=git
$ nomux ext validate ./nomux-agent-claude
extension.toml is valid: nomux.agent-claude 0.1.0 (Claude Code adapter) asks for the permissions: scope=hooks:read scope=agent:report
```

A manifest that is not valid has one line for each problem, with the path of the field, and the exit code 1:

```console
$ nomux ext validate ./broken
extension.toml is not valid:
  `extension.id` must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`
```

`validate` does not check the other files of the package. `install` also makes sure that the package has the program of its daemon part.

## Install with permissions

An extension gets only the permissions that you approve. No command asks a question, thus you give the approval on the command line.
Without an approval, `install` prints what the extension asks for, installs nothing and has the exit code 4:

```console
$ nomux ext install ./nomux-git
nomux: the extension nomux.git 0.1.0 asks for these permissions:
  fs=${worktree}
  process=git
Nothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>
```

| Command line | Result |
|---|---|
| `--grant <permission>`, one or more times | The extension gets these permissions and not the others that it asks for |
| `--grant-all` | The extension gets each permission that it asks for, but not a directory that starts with `${worktree}` |
| `--grant-all --grant fs=<directory>` | The same, and the directory for `${worktree}` |
| No option, and the manifest asks for no permission | The extension is installed |

A permission has one of these forms: `fs=<directory>`, `process=<program>`, `network` or `scope=<scope>`. For an item that starts with `${worktree}`, give an absolute path.

With `--grant-all` only, the git extension gets `process=git` and no directory. A second install of the same extension fails with the exit code 1:

```console
$ nomux ext install ./nomux-git --grant-all
extension nomux.git 0.1.0 installed with the permissions: process=git
$ nomux ext install ./nomux-git --grant-all --grant fs=/tmp/nomux-demo/project
nomux: the extension `nomux.git` is already installed
```

To change the permissions or to install a new version, remove the extension and install it again. A `--grant` for a permission that the manifest does not ask for fails with the exit code 1, and nothing is installed:

```console
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext install ./nomux-git --grant network
nomux: the manifest does not ask for the permission `network`
$ nomux ext install ./nomux-git --grant-all --grant fs=/tmp/nomux-demo/project
extension nomux.git 0.1.0 installed with the permissions: fs=/tmp/nomux-demo/project process=git
$ nomux ext install ./nomux-echo
extension nomux.echo 0.1.0 installed with no permissions
```

The daemon copies the package. Thus a change in the source directory after the install changes nothing. A package can have only regular files and directories: the daemon refuses a symbolic link.
`install` starts no process. The first call does.

A scope gives access to a host service or to events of the daemon. nomux 0.4.0 has three:

| Scope | Gives |
|---|---|
| `sessions:read` | The host service `sessions.list`: the Sessions of the Host |
| `agent:report` | The host services `agent.report` and `agent.child`: the status of an Agent run and of its Child work |
| `hooks:read` | The hook events of the tools that the `[adapter]` table of the manifest names |

The `[adapter]` table makes an extension the [adapter](/docs/guides/agent-adapters/) of an agent tool. It needs the extension API version `^0.1.1`, as the manifest of `nomux.agent-claude` has it.

:::caution
In nomux 0.4.0 the daemon applies only the scopes (`sessions:read`, `agent:report` and `hooks:read`). It gives the other approved permissions (`fs`, `process` and `network`) to the extension, and the extension must obey them. The process of an extension has the file access of the daemon.
The git extension applies its permissions to each request: its [README](https://github.com/nomux-sh/extensions/tree/main/git#permissions) has the rules.
Install only an extension whose source you trust.
:::

## List

```console
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    stopped  fs=/tmp/nomux-demo/project,process=git
```

| State | Meaning |
|---|---|
| `stopped` | The extension is enabled, and its process does not run. The next call starts it |
| `starting` | The process started and is not ready |
| `running` | The process runs. It stops after 60 seconds without a call |
| `failed` | The process failed. After a pause, the next call starts it again. `REASON` has the failure |
| `disabled` | The daemon does not start the extension. `REASON` says why: you disabled it, or it failed 5 times in sequence |

An installed extension that gets no call has no process. It costs the daemon one entry in a list.

## Call

`nomux ext call` calls one method of an extension and writes the payload of the result to the standard output, with no other byte. The command is for scripts and tests.
The payloads are bytes. The method specifies their encoding. The methods of the two extensions on this page use protobuf messages.

This is a call of the method `status` of the git extension for the Git repository in `/tmp/nomux-demo/project`. The file `status-request.bin` has a `StatusRequest` message whose `repository` field is that directory. The schemas of the messages are in the [`proto`](https://github.com/nomux-sh/extensions/tree/main/git/proto/nomux/git/v1) directory of the extension.

```console
$ nomux ext call nomux.git status --payload @status-request.bin > status-response.bin
$ wc -c status-response.bin
23 status-response.bin
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    running  fs=/tmp/nomux-demo/project,process=git
```

The call started the process of the extension. The repository of this run is a new repository on the branch `main` with one file that git does not track. The result is a `StatusResponse` message of 23 bytes.

The method `echo` of the example gives back the message that it gets. Its payload is a protobuf message with the text `hi`:

```console
$ printf '\n\002hi' > request.bin
$ nomux ext call nomux.echo echo --payload @request.bin > response.bin
$ od -c response.bin
0000000  \n 002   h   i
0000004
```

`--payload <text>` sends the bytes of a text, and `--payload @<file>` sends the content of a file. Without the option, the payload is empty.

| Result | Exit code |
|---|---|
| The method gave a result | 0 |
| No extension has the identifier, or the extension does not have the method | 2 |
| The extension did not answer in 30 seconds | 3 |
| The extension answered that it does not have the permission | 4 |
| The extension is disabled, its process cannot start or failed, or it answered with a different error | 1 |

```console
$ nomux ext call nomux.echo nothing
nomux: the extension answered with an error: the extension has no method `nothing`
$ nomux ext call nomux.echo echo
nomux: the extension answered with an error: the text is empty
```

A failure of an extension stays in its process. The daemon, the Sessions and the other extensions continue.

## Events

An extension can send an event. The daemon puts it into its event log, and a client reads the log with `nomux events --follow`. The `echo` method of the example sends the event `echoed` with the length of its text at each call.

`--filter extension-event` prints only the events of extensions. Start this command in one terminal, and run `nomux ext call nomux.echo echo --payload @request.bin` in a second terminal:

```console
$ nomux events --follow --filter extension-event
2 extension nomux.echo: echoed (2 bytes)
```

A line has the position of the event in the log (the number starts again when the daemon starts), the identifier of the extension, the name of the event and the size of its payload. With `--json`, an event is one JSON document on one line. The payload is in base64, because the extension chooses its encoding. Here `CAI=` is a protobuf message with the length 2:

```console
$ nomux --json events --follow --filter extension-event
{"schema_version":1,"event":{"seq":3,"at_ms":1795691297643,"type":"extension_event","extension":{"id":"nomux.echo","name":"echoed","payload_base64":"CAI="}}}
```

The command prints the events after its start, and it ends with the exit code 0 on `Ctrl-C`. The daemon keeps the last 1024 events in memory and drops an event with a payload of more than 64 KiB. [Agent status](/docs/guides/agent-status/) uses the same command for the status events.

## Disable, enable and remove

```console
$ nomux ext disable nomux.echo
extension nomux.echo disabled
$ nomux ext call nomux.echo echo --payload @request.bin
nomux: the extension nomux.echo: the extension is disabled: the user disabled the extension
$ nomux ext enable nomux.echo
extension nomux.echo enabled
```

`disable` stops the process of the extension. `nomux ext ls` then shows the state `disabled` and the reason `the user disabled the extension`. `enable` also enables an extension that the daemon disabled after 5 failures in sequence.

`rm` stops the process and removes the package, the approved permissions and the working directory of the extension:

```console
$ nomux ext rm nomux.echo
extension nomux.echo removed
$ nomux ext rm nomux.echo
nomux: no extension has the identifier nomux.echo
$ nomux ext ls
ID         NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.git  Git   0.1.0    running  fs=/tmp/nomux-demo/project,process=git
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext ls
no extensions
```

`enable`, `disable` and `rm` have the exit code 2 if no extension has the identifier.

## Where the extensions are

| Computer | Directory |
|---|---|
| Linux | `~/.local/share/nomux/extensions` |
| macOS | `~/Library/Application Support/nomux/extensions` |

The directory has the mode 0700. It has the packages, the approved permissions of each extension and the working directory of each extension. An installed extension stays after a restart of the Host.

The extensions belong to one Host. With `--host <name>`, the `ext` commands use the daemon of a [remote Host](/docs/guides/remote-hosts/), and the directory of `install` is an absolute path on that Host. `ext validate` always reads a directory on your computer.

## Limits of this version

These items come from [`docs/extensions.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/extensions.md#not-done-yet) of nomux 0.4.0:

- The daemon does not restrict the files, the programs and the network of an extension.
- The daemon has three host services: `sessions.list` (the scope `sessions:read`), and `agent.report` and `agent.child` for the adapters (the scope `agent:report`).
- No install from a registry, no signature check and no update command.
- The daemon sends an event to an extension only as a call of the method `hook` of an adapter. No client shows the UI part of an extension.
- When the daemon stops the process of an extension, the processes that the extension started continue to run.

The [CLI reference](/docs/reference/cli/#nomux-ext-install) has each `ext` command with its JSON document. The terms on this page come from the [Glossary](/docs/reference/glossary/).
