---
title: Remote hosts
description: Add a server as a remote Host through SSH, use its Sessions with --host, and know what nomux reads, trusts and writes.
---

A remote Host is a computer that you reach through SSH, for example a server or a second workstation.
Its Sessions live on that computer: they continue when your laptop sleeps or the connection ends.

You install nomux only on the computer on which you type. `nomux host add` puts the binaries on the remote Host.

:::note
The commands that connect to a server (`host add`, `host doctor` with a Host, and each command with `--host`) were not run for this page. Their steps and their messages come from [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md) and [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/cli.md) of nomux 0.3.0.
The output on this page is the real output of nomux 0.3.0 on Linux for the commands that do not connect: `host ls`, `host rm`, `host doctor` without a Host, and the errors of a name that does not exist.
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

### What is on the Host after that

| Path | Content | Mode |
|---|---|---|
| `~/.nomux/bin/<version>/` | `nomux`, `nomuxd` and `nomux-holder` of one version | 0700 |
| `~/.nomux/run/` | The socket, the lock and the log of the daemon, and one directory for each Session | 0700, the socket 0600 |

The holders of the Host also write the state of each Session to the state directory of the Host, as on your computer. [After a restart](/docs/guides/after-a-restart/) describes it.
nomux changes no shell startup file, no `PATH` and no service on the Host.
The daemon on the Host listens only on its Unix socket. It has no network port.

## Use the Host

Put `--host <name>` before the command:

```sh
nomux --host vps new --attach
nomux --host vps ls
nomux --host vps attach k3xq2abc
nomux --host vps daemon status
```

- Each command first makes sure that the Host has the binaries of the version of your CLI. If they are absent, the command installs them as `host add` does, and writes one line about it to the standard error.
- `new --cwd <dir>` needs an absolute path on the Host. Without `--cwd`, the command starts in your home directory on the Host.
- `ext install <directory>` needs an absolute path on the Host.
- `--host` does not work with the `host` commands and with `daemon install-service` and `daemon uninstall-service`. `version` prints the version of the CLI.

The name must be in the configuration file:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
```

The first command has the exit code 2, and the second one has the exit code 1.

### When the connection ends during an attach

The attach connects again. It gets the output that it does not have, thus no output is absent and none comes two times.
If the daemon no longer has these bytes, which is more than 256 KiB of output during the outage, you get the current screen.

- The pauses between the attempts are 0.25, 0.5, 1, 2, 4 and then 8 seconds, for 10 attempts: approximately 48 seconds. After that, the attach ends with an error that says how to attach again.
- During the outage, the title of the terminal window is `nomux: connection lost, connecting again`. nomux writes nothing on the screen of the Session.
- The keys that you type during the outage are discarded. nomux does not type into a Session that you cannot see. The detach keys work.

A command that is not an attach connects one time. If it cannot connect, it fails with the reason.

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

`AllowTcpForwarding no` does not change it. For such a server, nomux fails with a message that names these options. nomux 0.3.0 has no second way for these servers.

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

A check that cannot run after a failure is not in the output. The exit code is 0 if each check passed, and 1 if a check failed. A failed check has `FAIL`, the reason and what to do.

Without a Host in the configuration file:

```console
$ nomux host doctor
no hosts
$ nomux host doctor vps
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
```

## The configuration file

`host add` saves the Host on your computer:

```toml
[hosts.vps]
ssh = "deploy@vps.example.com"
```

| Computer | Path |
|---|---|
| If `XDG_CONFIG_HOME` is an absolute path | `$XDG_CONFIG_HOME/nomux/config.toml` |
| Linux | `~/.config/nomux/config.toml` |
| macOS | `~/Library/Application Support/nomux/config.toml` |

nomux keeps each other part of the file, also the comments, when it writes the file. It writes the file with the mode 0600.

`host ls` and `host rm` read and change only this file. They do not connect to a Host. For this run, the file had the content above, written by hand:

```console
$ nomux host ls
NAME  SSH
vps   deploy@vps.example.com
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

These items come from the open points of [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#open-points-for-the-next-versions):

- No second way for a server that refuses the channel to the socket.
- No fallback to the `ssh` program for an option that the SSH client of nomux does not support.
- No local echo before the answer of the Host: on a connection with a long round trip, a key shows after one round trip.
- No host certificates and no user certificates.
- No removal of old versions from `~/.nomux/bin`.
- A Session on a remote Host gets the environment that `sshd` gives a command: the startup files of a login shell are not read.
- `/etc/ssh/ssh_config` is not read.
- No QUIC transport, no port forwarding and no file transfer.

If the Host has `KillUserProcesses=yes` in the configuration of `systemd-logind`, a logout stops the daemon and the Sessions.

The [CLI reference](/docs/reference/cli/#nomux-host-add) has each `host` command with its JSON document. The terms on this page come from the [Glossary](/docs/reference/glossary/).
