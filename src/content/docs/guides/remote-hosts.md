---
title: Remote hosts
description: Add a server as a remote Host through SSH, use its Sessions with --host, and know what nomux reads, trusts and writes.
---

A remote Host is a computer that you reach through SSH, for example a server or a second workstation.
Its Sessions live on that computer: they continue when your laptop sleeps or the connection ends.

You install nomux only on the computer on which you type. `nomux host add` puts the binaries on the remote Host.

:::note
**What ran for this page.** The Host in the examples is a second `sshd` of OpenSSH on the same Linux computer. It listened on its own port, had its own host key and its own user key, and gave its Sessions a separate home directory. nomux 0.5.0 reached it through SSH with a `Host` entry named `vps` in `~/.ssh/config`. The outputs show `deploy@vps.example.com`, port 22 and the home directory `/home/deploy` in place of the real values.
These commands ran: `host add` (with the download of the release archive), `host ls`, `host rm`, `host doctor`, `--host` with `new`, `ls`, `status`, `send`, `capture`, `kill`, `daemon status`, `daemon stop` and `ext`, an attach while the daemon of the Host was replaced, a server that refuses the channel, and the commands that cannot use `--host`.
These did not run: a Host on a second computer, a Host with macOS or with ARM64, a slow connection, a key with a passphrase, `ProxyJump`, a changed host key, the options of `~/.ssh/config` that stop the command, and the replacement of a daemon that has no common protocol version with the client. Their rows below come from [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/remote.md), [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) and [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md) of nomux 0.5.0.
:::

## What the remote Host needs

- An SSH server that permits a forward to a Unix socket. The defaults of OpenSSH permit it. Refer to [When the server refuses the channel](#when-the-server-refuses-the-channel).
- A POSIX shell (`sh`) and its standard programs: `uname`, `cat`, `mkdir`, `chmod`, `mv`, `rm`, `ls` and `id`. nomux uses `sha256sum` or `shasum` if one of them exists.
- Linux or macOS on x86_64 or aarch64.

The Host needs no nomux package, no internet access and no `scp` or `sftp`. Your login shell on the Host can be a different shell: each command of nomux is `sh -c '<script>'`.

## Add a Host

```sh
nomux host add deploy@vps.example.com --name vps
```

The SSH target is `[user@]host`, `ssh://[user@]host[:port]` or a `Host` name of `~/.ssh/config`.
Without `--name`, the name is the host part of the target: `deploy@vps.example.com` gives `vps.example.com`. A name has only `a` to `z`, `A` to `Z`, `0` to `9`, `.`, `_` and `-`.

`host add` does these steps, and it saves the Host only if all of them succeed:

1. **Connect.** It connects with its own SSH client. It does not start the `ssh` program.
2. **Probe.** One command gets the output of `uname -s` and `uname -m`, your home directory and whether `~/.nomux/bin/<version>` has the three binaries.
3. **Install, only if the binaries are absent.**
   1. On your computer, it downloads the release archive for the Host and `SHA256SUMS` from the release of its own version, and verifies the SHA-256 checksum. It uses `curl` and `tar` of your computer.
   2. It sends each binary to a temporary directory below `~/.nomux/bin/` on the Host, with `cat > file`.
   3. It compares the SHA-256 checksum of each file on the Host with its own.
   4. It runs `nomuxd --version` on the Host. A binary for a different processor fails here.
   5. It renames the directory to `~/.nomux/bin/<version>`. A failure before this step leaves no install.
4. **Start the daemon** on the Host if no daemon runs, and ask it for its version.
5. **Save** the Host in the configuration file of your computer.

You can run the command again with the same name and the same target: it installs nothing that the Host has. A name that exists with a different target is an error.

| `uname -s` | `uname -m` | Release target |
|---|---|---|
| `Linux` | `x86_64`, `amd64` | `x86_64-unknown-linux-musl` |
| `Linux` | `aarch64`, `arm64` | `aarch64-unknown-linux-musl` |
| `Darwin` | `x86_64` | `x86_64-apple-darwin` |
| `Darwin` | `arm64` | `aarch64-apple-darwin` |

A different system is an error.

This is the first `host add` in the run. The Host key was not known, thus the command stopped and told what to do. The fingerprint is the one that the SSH server of the run has:

```console
$ nomux host add vps
nomux: the host key of vps.example.com is not known. The host sent the ssh-ed25519 key with the fingerprint SHA256:UYdsWSeDf9G83x/lrT1v7m38J3MLhsKDlru4dLpczN0. If the fingerprint is correct, run `ssh -o HostKeyAlgorithms=ssh-ed25519 'vps' exit` and answer `yes`, then run nomux again
$ ssh -o HostKeyAlgorithms=ssh-ed25519 vps exit
Warning: Permanently added 'vps.example.com' (ED25519) to the list of known hosts.
$ nomux host add vps
nomux: downloading https://github.com/nomux-sh/nomux/releases/download/v0.5.0/nomux-0.5.0-x86_64-unknown-linux-musl.tar.gz
nomux: installing nomux 0.5.0 for x86_64-unknown-linux-musl on the host (8761 KiB)
host vps added: Linux x86_64, nomux in ~/.nomux/bin/0.5.0 (installed), nomuxd 0.5.0 runs: process ID 4161064, 0 sessions
memory limit: the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
```

The second command shows the real line that `ssh` printed in the run. In the run, the whole `host add` took about 1.5 seconds. A second `host add vps` installs nothing: it says `(already there)` in place of `(installed)`.

The last line is new in nomux 0.5.0. The daemon of the Host tells if the operating system can apply a [memory limit](/docs/guides/session-memory/) to the Sessions. Here the SSH session of the run had no user manager of systemd (`DBUS_SESSION_BUS_ADDRESS` and `$XDG_RUNTIME_DIR/bus` were missing), thus the limit is only a threshold for the [hibernation](/docs/guides/hibernation/) of an idle agent Session. On a Host that has a user manager for your SSH login, the line says `the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax`.

### What is on the Host after that

| Path | Content | Mode |
|---|---|---|
| `~/.nomux/bin/<version>/` | `nomux`, `nomuxd` and `nomux-holder` of one version | 0700 |
| `~/.nomux/run/` | The socket, the lock and the log of the daemon, and one directory for each Session. A directory with the suffix `.pool` is a pooled holder | 0700, the socket 0600 |

After the run, `~/.nomux` had these paths: `bin/0.5.0/` with the three binaries, and `run/` with `nomuxd.sock`, `nomuxd.lock`, `nomuxd.log`, the directory `pool` and one `<id>.pool` directory for each pooled holder.

The holders of the Host also write the state of each Session to the state directory of the Host, as on your computer. [After a restart](/docs/guides/after-a-restart/) describes it.
nomux changes no shell startup file, no `PATH` and no service on the Host.
The daemon on the Host listens only on its Unix socket. It has no network port.
The daemon on the Host is the same daemon as on your computer. It starts its [holder pool](/docs/guides/holder-pool/) at the first request, and a pooled holder is a process of your user on the Host.
If the home directory of the Host is long, the socket path of `~/.nomux/run` can be too long. Then the daemon and the client use a short link `/tmp/nomux-<hash>` to the directory, and the client computes it from the home directory that the probe gets: [Long home paths](/docs/guides/long-home-paths/).

## Use the Host

Put `--host <name>` before the command:

```sh
nomux --host vps new --attach
nomux --host vps ls
nomux --host vps attach k3xq2abc
nomux --host vps daemon status
```

This is a short session with the Host of the run:

```console
$ nomux --host vps daemon status
nomuxd 0.5.0 runs: process ID 4161064, 0 sessions
memory limit: the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
$ nomux --host vps new -n web
gfo7fn3d
$ nomux --host vps ls
ID        NAME  STATE    PID      COMMAND
gfo7fn3d  web   running  4161066  /bin/bash
$ nomux --host vps status
  SESSION  COMMAND    STATE  FOR  MESSAGE
  web      /bin/bash  idle   1s
```

[Sessions](/docs/guides/sessions/) describes the Session commands, and [Agent status](/docs/guides/agent-status/) shows the status of the Sessions of a Host. A [hibernated Session](/docs/guides/hibernation/) lives on the Host too.

- Each command first makes sure that the Host has the binaries of the version of your CLI. If they are absent, the command installs them as `host add` does, and writes one line about it to the standard error.
- `new --cwd <dir>` needs an absolute path on the Host. Without `--cwd`, the command starts in your home directory on the Host.
- `ext install <directory>` needs an absolute path on the Host. The directory is on the Host, not on your computer. In the run, `nomux --host vps ext install /path/to/package` installed an extension, and `ext ls` and `ext rm` worked. `ext validate` always reads a directory on your computer.
- `ls --memory` shows the memory of the processes on the Host, because the daemon of the Host measures them.
- `--host` does not work with the `host` commands, with `daemon install-service` and `daemon uninstall-service`, with `status set` and with the `hooks` commands. `version` prints the version of the CLI.

The name must be in the configuration file:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
```

The first command has the exit code 2, and the second one has the exit code 1. The two commands of a tool that acts on your own computer fail in the same way, with the exit code 1:

```console
$ nomux --host vps status set working
nomux: the --host option cannot be used with `status set`: the session is on the host of this process
$ nomux --host vps hooks status
nomux: the --host option cannot be used with a `hooks` command: the settings file of a tool is on its own computer, thus run the command there
```

### When the connection ends during an attach

The attach connects again. It gets the output that it does not have, thus no output is absent and none comes two times.
If the daemon no longer has these bytes, which is more than 256 KiB of output during the outage, you get the current screen.

- The pauses between the attempts are 0.25, 0.5, 1, 2, 4 and then 8 seconds, for 10 attempts: approximately 48 seconds. After that, the attach ends with an error that says how to attach again.
- During the outage, the title of the terminal window is `nomux: connection lost, connecting again`. nomux writes nothing on the screen of the Session.
- The keys that you type during the outage are discarded. nomux does not type into a Session that you cannot see. The detach keys work.

A command that is not an attach connects one time. If it cannot connect, it fails with the reason.

### When the daemon of the Host is replaced

A client replaces the daemon of a Host when the daemon and the client have no common protocol version (`nomuxd --replace`). The first daemon answers the requests that it began, removes its socket and ends. No Session ends: a holder is never replaced.

nomux 0.5.0 adds a rule to this step: a connection that the first daemon did not answer closes, and the client connects again until the new daemon answers. This page did not run this rule, because it needs a daemon that has no common protocol version with the client.

An attach does not survive a replacement. In the run, `nomuxd --detach --replace` ran on the Host while the CLI was attached to the Session `web`. The title of the terminal window changed to `nomux: connection lost, connecting again`, and then the attach ended with this message and the exit code 1:

```text
nomux: the daemon stopped. The session continues: run `nomux --host vps attach web` to attach again
```

The Session continued, and its output from before was still there. Attach again, and you get the new daemon.

## What nomux reads from `~/.ssh/config`

nomux reads `~/.ssh/config` with the rules of OpenSSH: the first value of an option wins, `Host` and `Match` select the lines, and an `Include` is read at its position. It does not read `/etc/ssh/ssh_config`.

| Supported option | Notes |
|---|---|
| `Host` | Patterns with `*`, `?` and `!` |
| `Match` | `all`, `host`, `originalhost`, `user` and `localuser`, also with `!` |
| `Include` | A relative path is relative to `~/.ssh`. The last part of the path can have `*` and `?` |
| `HostName` | With `%h` and `%%` |
| `User`, `Port` | The user and the port of the SSH target come first |
| `IdentityFile` | More than one. `none` removes all of them |
| `IdentitiesOnly`, `IdentityAgent` | |
| `ProxyJump` | A list of jump hosts, or `none`. Each jump host uses its own configuration |
| `UserKnownHostsFile`, `GlobalKnownHostsFile` | More than one file. `none` is no file |
| `StrictHostKeyChecking` | Refer to [Trust rules](#trust-rules) |
| `HostKeyAlias` | |
| `ConnectTimeout` | The default is 30 seconds |
| `ServerAliveInterval`, `ServerAliveCountMax` | The defaults of nomux are 5 seconds and 3. OpenSSH sends no keepalive by default; nomux does, so that an attach learns quickly that its connection is dead |

**These options stop the command.** If one of them applies to the Host, nomux does not connect, and the message names the option, the file and the line:

- `ProxyCommand`, `CertificateFile`, `PKCS11Provider`, `SecurityKeyProvider` or `KnownHostsCommand` with a value that is not `none`.
- `CanonicalizeHostname` with a value that is not `no` or `none`.
- `BindAddress` and `BindInterface`.
- `Match` with `exec`, `canonical`, `final`, `tagged` or `localnetwork`.
- An `Include` with a wildcard in a directory name, and a token such as `%C`.

nomux has no fallback to the `ssh` program for such a Host.

**nomux ignores each other option.** Examples are the options for forwards and terminals that nomux never asks for (`ForwardAgent`, `ForwardX11`, `LocalForward`, `RequestTTY`, `RemoteCommand`, `SendEnv`), the options of the `ssh` program (`ControlMaster`, `ControlPath`, `ControlPersist`) and the algorithm lists (`Ciphers`, `KexAlgorithms`, `MACs`, `HostKeyAlgorithms`). nomux uses the algorithms of its SSH library, thus a server that needs an old algorithm can refuse the connection.

## Keys: nomux asks for no password

nomux has no password prompt, stores no secret and asks no question. It tries these keys in this sequence:

1. Each key of ssh-agent: the socket of `IdentityAgent`, or of `SSH_AUTH_SOCK`. With `IdentitiesOnly yes`, only the keys that an `IdentityFile` names.
2. Each key file of `IdentityFile`. Without `IdentityFile`: `~/.ssh/id_rsa`, `id_ecdsa`, `id_ecdsa_sk`, `id_ed25519` and `id_ed25519_sk`, if they exist.

nomux does not read a key file that has a passphrase. Add such a key to ssh-agent with `ssh-add`.
If the Host accepts no key, the command ends with the exit code 4, and the message names each key that nomux could not use.

nomux never asks the Host for agent forwarding, for a terminal of the SSH connection, for X11 forwarding or for a TCP port forward. It writes no key and no content of a Session to a log.

## Trust rules

nomux checks the key of the Host against the files of known hosts, as OpenSSH does: `~/.ssh/known_hosts`, `~/.ssh/known_hosts2`, `/etc/ssh/ssh_known_hosts` and `/etc/ssh/ssh_known_hosts2`, or the files that the configuration names.
Hashed names, patterns and `@revoked` lines work. nomux ignores `@cert-authority` lines, because it does not use host certificates.

| The files have | `StrictHostKeyChecking yes` or `ask` (the default) | `accept-new`, `no` or `off` |
|---|---|---|
| The key that the Host sent | Connect | Connect |
| No key of that type for the Host | Error | Add the key to your first file, then connect |
| A different key of that type for the Host | Error | Error |
| The key on a `@revoked` line | Error | Error |

- nomux asks no question, thus `ask` is the same as `yes`.
- A changed key is an error with each value.

**A key that is not known.** The message has the fingerprint and the OpenSSH command that adds the key. This is the text from `docs/remote.md`:

```text
nomux: the host key of vps.example.com is not known. The host sent the ssh-ed25519 key with the fingerprint SHA256:... If the fingerprint is correct, run `ssh -o HostKeyAlgorithms=ssh-ed25519 'deploy@vps.example.com' exit` and answer `yes`, then run nomux again
```

Compare the fingerprint that `ssh` shows with the fingerprint that the administrator of the Host gives you. Then run nomux again.

**A key that changed.** nomux does not connect. The message names the file and the line of the old key, and it has the `ssh-keygen -R` command that removes the old key. Run that command only if you know that the Host has a new key.

## When the server refuses the channel

nomux sends its requests through an SSH channel to the Unix socket of the daemon (`direct-streamlocal`). A server refuses this channel if:

- `sshd_config` has `AllowStreamLocalForwarding no` or `remote`, or `DisableForwarding yes`, or
- the key in `authorized_keys` has `restrict` or `no-port-forwarding`.

`AllowTcpForwarding no` does not change it. For such a server, nomux fails with a message that names these options. nomux 0.5.0 has no second way for these servers. In the run, a second `sshd` had `AllowStreamLocalForwarding no`. `host add` stopped with this message, and `host doctor` showed the same text as the failed check `daemon`:

```console
$ nomux host add locked
nomux: the SSH server refuses connections to Unix sockets. nomux needs them to reach its daemon. On the host, `AllowStreamLocalForwarding` must permit `local` (the default is `yes`) and `DisableForwarding` must be `no` in `sshd_config`, and the key in `authorized_keys` must not have `restrict` or `no-port-forwarding`
```

The channel goes to the socket `~/.nomux/run/nomuxd.sock` on the Host, or to the socket in the short link of a long home directory.

## Session environment on a remote Host

A Session on a remote Host gets the environment that the daemon of that Host makes. Nothing comes from the computer on which you type.

- The daemon of the Host got its environment from `sshd`: the environment of a command, without the startup files of a login shell.
- nomux adds `TERM=xterm-256color`, `COLORTERM=truecolor`, a UTF-8 character set if the daemon has no locale, and the variables `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`.
- In the run, the shell of a Session on the Host had these variables: `COLORTERM`, `HOME`, `LC_CTYPE`, `LOGNAME`, `MAIL`, `NOMUX_SESSION_ID`, `NOMUX_SOCK`, `NOMUX_TOKEN`, `PATH`, `PWD`, `SHELL`, `SHLVL`, `SSH_CLIENT`, `SSH_CONNECTION`, `TERM` and `USER`. `SSH_CLIENT` and `SSH_CONNECTION` come from `sshd`, and `LC_CTYPE` is the UTF-8 character set that nomux adds.
- Variables of your computer, for example `LANG`, `DISPLAY` and `SSH_AUTH_SOCK`, do not pass. [Issue 75](https://github.com/nomux-sh/nomux/issues/75) has this gap.

[Session environment](/docs/guides/session-environment/) has the full rule.

## Check a Host

`nomux host doctor <name>` checks one Host, and `nomux host doctor` checks each Host of the configuration file. The command changes nothing on a Host: it installs nothing and starts no daemon.

| Check | Passes if |
|---|---|
| `connection` | The SSH connection, the host key and the authentication are correct |
| `platform` | nomux has binaries for the system and the processor of the Host |
| `binaries` | The Host has the binaries of the version of the CLI |
| `permissions` | `~/.nomux`, `~/.nomux/bin`, `~/.nomux/run` and the socket belong to you, other users cannot write to the first two, and other users have no access to the last two |
| `daemon` | A daemon answers, or no daemon runs. It fails if the SSH server refuses the channel to the socket |
| `versions` | The CLI and the daemon have a common protocol version. Only if a daemon answers |
| `memory-limit` | Always passes. It says if the operating system of the Host applies a memory limit to the Sessions: see [Session memory](/docs/guides/session-memory/) |

A check that cannot run after a failure is not in the output. The exit code is 0 if each check passed, and 1 if a check failed. A failed check has `FAIL`, the reason and what to do.

This is the output for the Host of the run:

```console
$ nomux host doctor vps
vps
  ok    connection    deploy@vps.example.com port 22, host key ssh-ed25519 SHA256:UYdsWSeDf9G83x/lrT1v7m38J3MLhsKDlru4dLpczN0
  ok    platform      Linux x86_64: x86_64-unknown-linux-musl
  ok    binaries      nomux 0.5.0 is in ~/.nomux/bin/0.5.0
  ok    permissions   private to the user: ~/.nomux drwx------, ~/.nomux/bin drwx------, ~/.nomux/run drwx------, ~/.nomux/run/nomuxd.sock srw-------
  ok    daemon        nomuxd 0.5.0 runs: process ID 4161064, 0 sessions
  ok    versions      the client and the daemon have the version 0.5.0
  ok    memory-limit  the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
```

The check `memory-limit` has no entry in the check list of the [CLI documentation](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md#host-doctor) of nomux 0.5.0, but the command prints it and the [memory documentation](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/memory.md) describes it.

Without a Host in the configuration file:

```console
$ nomux host doctor
no hosts
$ nomux host doctor vps
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
```

## The configuration file

`host add` saves the Host on your computer. The Host of the run was added with the `Host` entry `vps`, thus the file has this content:

```toml
[hosts.vps]
ssh = "vps"
```

With `nomux host add deploy@vps.example.com --name vps`, the line is `ssh = "deploy@vps.example.com"`.

| Computer | Path |
|---|---|
| If `XDG_CONFIG_HOME` is an absolute path | `$XDG_CONFIG_HOME/nomux/config.toml` |
| Linux | `~/.config/nomux/config.toml` |
| macOS | `~/Library/Application Support/nomux/config.toml` |

nomux keeps each other part of the file, also the comments, when it writes the file. It writes the file with the mode 0600.

The daemon reads the same file one time, when it starts. It reads no other path. On macOS, a file in `~/.config/nomux` has no effect if `XDG_CONFIG_HOME` is not set. A relative `XDG_CONFIG_HOME` is ignored. `nomux daemon status` shows the path of the file. In the run on Linux, it showed `~/.config/nomux/config.toml`, and with `XDG_CONFIG_HOME=/tmp/xdgtest` it showed `/tmp/xdgtest/nomux/config.toml`. The path of the macOS file comes from the [documentation of the daemon](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#configuration): this page did not run it on macOS.

`host ls` and `host rm` read and change only this file. They do not connect to a Host:

```console
$ nomux host ls
NAME  SSH
vps   vps
$ nomux host rm vps
host vps removed
$ nomux host ls
no hosts
$ nomux host rm vps
nomux: no host has the name vps
```

The last command has the exit code 2.

## Remove nomux from a Host

```sh
nomux --host vps daemon stop      # the Sessions continue until they end
ssh deploy@vps.example.com 'rm -rf ~/.nomux ~/.local/state/nomux'   # after each Session ended
nomux host rm vps                 # on your computer
```

`~/.local/state/nomux` is the state directory on a Linux Host. On a macOS Host it is `~/Library/Application Support/nomux`, which also has the extensions of that Host.
An old version stays in `~/.nomux/bin` until you remove it. Remove a version only when no Session uses its holder.

## Limits of this version

These items come from the open points of [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/remote.md#open-points-for-the-next-versions) of nomux 0.5.0:

- No second way for a server that refuses the channel to the socket.
- No fallback to the `ssh` program for an option that the SSH client of nomux does not support.
- No local echo before the answer of the Host: on a connection with a long round trip, a key shows after one round trip.
- No host certificates and no user certificates.
- No removal of old versions from `~/.nomux/bin`.
- A Session on a remote Host gets the environment of the daemon of that Host: no variable of your computer passes, and the startup files of a login shell are not read. [Session environment on a remote Host](#session-environment-on-a-remote-host) has the rule.
- `/etc/ssh/ssh_config` is not read.
- No QUIC transport, no port forwarding and no file transfer.
- An attach ends when the daemon of the Host is replaced or stops. The Session continues: [When the daemon of the Host is replaced](#when-the-daemon-of-the-host-is-replaced).
- A Host that has no user manager of systemd for your SSH login applies no [memory limit](/docs/guides/session-memory/) to the Sessions. `host doctor` and `daemon status` say it.

If the Host has `KillUserProcesses=yes` in the configuration of `systemd-logind`, a logout stops the daemon and the Sessions.

The [CLI reference](/docs/reference/cli/#nomux-host-add) has each `host` command with its JSON document. The terms on this page come from the [Glossary](/docs/reference/glossary/).
