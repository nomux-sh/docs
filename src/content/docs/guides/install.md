---
title: Install
description: How to get the three nomux binaries on a Linux or macOS machine, where nomux keeps its files and how to remove them.
---

nomux has three binaries: `nomux` (the CLI), `nomuxd` (the daemon) and `nomux-holder` (the holder).
[How it works](/docs/concepts/how-it-works/) tells you what each one does.

## Release status

The current release is [nomux 0.4.0](https://github.com/nomux-sh/nomux/releases/tag/v0.4.0).
It is a pre-release, as each version earlier than `1.0.0` is: interfaces can change between minor versions.
The [roadmap](/docs/project/roadmap/) shows the state of the work.

There are four paths to the binaries. Use the first one that applies:

1. [Homebrew](#homebrew), if you use it.
2. The [install script](#install-script).
3. A [manual download](#manual-download) with a checksum that you verify yourself.
4. A [build from source](#build-from-source).

You install nomux only on the computer on which you type. A remote Host needs no install: `nomux host add` puts the binaries there. Refer to [Remote hosts](/docs/guides/remote-hosts/).

The output on this page is the real output of version 0.4.0 on Linux x86_64. The home directory of that run is the temporary directory `/tmp/nomux-demo`.
Homebrew is the exception: the machine of the run had no Homebrew, thus `brew install` did not run. [Homebrew](#homebrew) says what was checked instead.

## Supported machines

| Machine | Target of the release archive |
|---|---|
| Linux, x86_64 | `x86_64-unknown-linux-musl` |
| Linux, aarch64 | `aarch64-unknown-linux-musl` |
| macOS, Intel | `x86_64-apple-darwin` |
| macOS, Apple silicon | `aarch64-apple-darwin` |

The Linux binaries of a release are static. They do not use the C library of the machine.
There is no build for Windows.

## Homebrew

The tap [`nomux-sh/homebrew-tap`](https://github.com/nomux-sh/homebrew-tap) has one formula for macOS and Linux:

```sh
brew install nomux-sh/tap/nomux
```

The command adds the tap and installs the three binaries. Make sure that the shell finds the CLI:

```sh
nomux --version
```

- The formula does not build nomux. It downloads the release archive of your machine and compares its SHA-256 checksum with the value in the formula. If the two are different, Homebrew installs nothing.
- Homebrew 6.0.0 and later versions load a formula of a tap that is not from Homebrew only after you trust it. An install with the full name `nomux-sh/tap/nomux` trusts this one formula. Refer to [Tap Trust](https://docs.brew.sh/Tap-Trust) in the Homebrew documentation.
- The formula gets a new version after the release of nomux: a workflow of the tap looks for a new release one time each day, and a maintainer merges the change.

These commands and statements come from the [README of the tap](https://github.com/nomux-sh/homebrew-tap#readme). `brew install` was not run for this page. What was checked:

- The formula at version 0.4.0 names four archives, one for each machine of the table above. The SHA-256 value of each archive in the formula is the same as the SHA-256 value of the file that the URL gives, and the same as the value in `SHA256SUMS` of the release.
- The `test` block of the formula runs `nomux --version`, `nomuxd --version` and `nomux-holder --version` and expects `<binary> 0.4.0`. The three binaries of the Linux archive print exactly that:

  ```console
  $ nomux --version
  nomux 0.4.0
  $ nomuxd --version
  nomuxd 0.4.0
  $ nomux-holder --version
  nomux-holder 0.4.0
  ```

## Install script

The script does these steps:

1. It finds the target of the machine from `uname`.
2. It downloads the archive of that target and the file `SHA256SUMS` from the GitHub release.
3. It verifies the SHA-256 checksum of the archive. If the checksum is wrong, it installs nothing.
4. It puts `nomux`, `nomuxd` and `nomux-holder` into `~/.local/bin`.

The script does not use `sudo`. It needs `curl`, `tar`, and `sha256sum` or `shasum`.

```console
$ curl -fsSL https://raw.githubusercontent.com/nomux-sh/nomux/main/install.sh | sh
Downloading nomux-0.4.0-x86_64-unknown-linux-musl.tar.gz
The SHA-256 checksum is correct.
Installed nomux 0.4.0 in /tmp/nomux-demo/.local/bin: nomux nomuxd nomux-holder
/tmp/nomux-demo/.local/bin is not in PATH. Add it to PATH to run nomux by name.
```

The last line is there because `~/.local/bin` was not in `PATH` in this run. If the directory is in `PATH`, the script does not print it. [Where the files are](#where-the-files-are) has the line for the startup file of your shell.

| Option | Default | Function |
|---|---|---|
| `--version <version>` | The newest version that has no suffix | The version to install, for example `0.4.0` |
| `--dir <directory>` | `~/.local/bin` | The directory for the binaries |

To give an option, add `-s --` after `sh`:

```console
$ curl -fsSL https://raw.githubusercontent.com/nomux-sh/nomux/main/install.sh | sh -s -- --version 0.4.0 --dir ~/bin
Downloading nomux-0.4.0-x86_64-unknown-linux-musl.tar.gz
The SHA-256 checksum is correct.
Installed nomux 0.4.0 in /tmp/nomux-demo/bin: nomux nomuxd nomux-holder
/tmp/nomux-demo/bin is not in PATH. Add it to PATH to run nomux by name.
```

Make sure that the shell finds the CLI:

```console
$ nomux --version
nomux 0.4.0
```

## Manual download

Each release has one archive for each target and one `SHA256SUMS` file.
An archive contains the three binaries, the README and the two license files.

1. Set the version and the target of the machine:

   ```sh
   version=0.4.0
   target=x86_64-unknown-linux-musl
   ```

2. Download the archive and the checksums from the [releases page](https://github.com/nomux-sh/nomux/releases):

   ```sh
   curl -fsSLO "https://github.com/nomux-sh/nomux/releases/download/v$version/nomux-$version-$target.tar.gz"
   curl -fsSLO "https://github.com/nomux-sh/nomux/releases/download/v$version/SHA256SUMS"
   ```

3. Verify the checksum. The command must print the name of the archive and `OK`. If it does not, do not continue:

   ```console
   $ grep "nomux-$version-$target.tar.gz" SHA256SUMS | sha256sum --check
   nomux-0.4.0-x86_64-unknown-linux-musl.tar.gz: OK
   ```

   On macOS, replace `sha256sum --check` with `shasum -a 256 --check`.

4. Extract the archive and copy the binaries:

   ```sh
   tar -xzf "nomux-$version-$target.tar.gz"
   mkdir -p ~/.local/bin
   cp "nomux-$version-$target/nomux" "nomux-$version-$target/nomuxd" "nomux-$version-$target/nomux-holder" ~/.local/bin/
   ```

The checksum shows that the download is complete and is the file of the release. It does not show who made the release.
The binaries are not signed and not notarized. The [README of `nomux`](https://github.com/nomux-sh/nomux#install) says that code signing and notarization start with the first stable release.

## Build from source

You need `git` and [rustup](https://rustup.rs). The repository pins the Rust version, and rustup installs it automatically.

1. Get the source of the release and build the binaries:

   ```sh
   git clone --branch v0.4.0 https://github.com/nomux-sh/nomux.git
   cd nomux
   cargo build --release
   ```

   Without `--branch v0.4.0`, you build the `main` branch, which can be newer than the release.

2. Copy the three binaries to a directory that is in `PATH`. Keep them in the same directory:

   ```sh
   mkdir -p ~/.local/bin
   cp target/release/nomux target/release/nomuxd target/release/nomux-holder ~/.local/bin/
   ```

A build on Linux uses the C library of the machine. It is not the static binary of the release archive.

## Where the files are

| Path | Content |
|---|---|
| `~/.local/bin/nomux`, `nomuxd`, `nomux-holder` | The binaries. The path is different if you used Homebrew or `--dir`, or copied them to a different directory. |
| `~/.nomux/run/` | The runtime directory: the socket, the lock and the log of the daemon, and one directory for each Session that runs. nomux makes it at the first command. |
| `~/.local/state/nomux/` on Linux, `~/Library/Application Support/nomux/` on macOS | The state directory: for each Session, its description and its journal. [After a restart](/docs/guides/after-a-restart/) says what nomux does with them. |
| `~/.local/share/nomux/extensions/` on Linux, `~/Library/Application Support/nomux/extensions/` on macOS | The extensions that you installed, with the permissions that you approved. Refer to [Extensions](/docs/guides/extensions/). |
| `~/.local/share/nomux/hooks/` on Linux, `~/Library/Application Support/nomux/hooks/` on macOS | The record of each `nomux hooks install --apply`: the bytes of the settings file before the install. Refer to [Agent adapters and hooks](/docs/guides/agent-adapters/). |
| `~/.config/nomux/config.toml` on Linux, `~/Library/Application Support/nomux/config.toml` on macOS | The configuration file. If `XDG_CONFIG_HOME` is an absolute path, the file is `$XDG_CONFIG_HOME/nomux/config.toml`. nomux makes the file when you add a remote Host. It also has the [pool settings](/docs/guides/holder-pool/#the-settings). |
| `~/.config/systemd/user/nomuxd.service` on Linux, `~/Library/LaunchAgents/sh.nomux.nomuxd.plist` on macOS | The service file. It exists only after `nomux daemon install-service`. |

The paths for macOS come from the documents of the `nomux` repository. This page has output from Linux only.
A home directory of more than 73 bytes makes nomux use a short link in `/tmp`: [Long home paths](/docs/guides/long-home-paths/).

The CLI starts `nomuxd`, and the daemon starts `nomux-holder`. Each one looks for the other binary in its own directory first, and then in `PATH`.
Thus the three binaries must be in one directory, or all of them must be in `PATH`.

If `~/.local/bin` is not in `PATH`, add this line to the startup file of your shell:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

## Update

Install the new version in the same directory. With Homebrew, use these commands:

```sh
brew update
brew upgrade nomux-sh/tap/nomux
```

A daemon and the holders that run continue with the old binaries.
To start the new daemon, stop the old one. The pooled holders of the old daemon end with it: [Holder pool](/docs/guides/holder-pool/) says why.

```sh
nomux daemon stop
```

The next command starts the new daemon, and it finds the Sessions that run. A holder that runs is not replaced: a Session keeps its holder until its command ends.

If you installed the service file and the path of the binaries changed, run `nomux daemon install-service` again. The file has the path of `nomuxd`.

## Remove

1. End each Session and stop the daemon. `nomux kill` also removes a dormant Session with its output:

   ```sh
   for id in $(nomux ls --quiet); do nomux kill "$id"; done
   nomux daemon uninstall-service
   nomux daemon stop
   ```

2. Remove the binaries. With Homebrew:

   ```sh
   brew uninstall nomux-sh/tap/nomux
   brew untap nomux-sh/tap
   ```

   Without Homebrew:

   ```sh
   rm ~/.local/bin/nomux ~/.local/bin/nomuxd ~/.local/bin/nomux-holder
   ```

3. Remove the directories of nomux. These are the paths on Linux:

   ```sh
   rm -r ~/.nomux ~/.local/state/nomux ~/.local/share/nomux ~/.config/nomux
   ```

   A directory that nomux did not make does not exist: remove it from the command.

If you added `~/.local/bin` to `PATH` only for nomux, remove that line from the startup file of your shell.
[Remote hosts](/docs/guides/remote-hosts/#remove-nomux-from-a-host) says how to remove nomux from a remote Host.

## Next step

Continue with the [quick start](/docs/guides/quick-start/).
