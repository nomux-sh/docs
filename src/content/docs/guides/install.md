---
title: Install
description: How to get the three nomux binaries on a Linux or macOS machine, where they go and how to remove them.
---

nomux has three binaries: `nomux` (the CLI), `nomuxd` (the daemon) and `nomux-holder` (the holder).
[How it works](/docs/concepts/how-it-works/) tells you what each one does.

## Release status

**No release exists yet. The first release is in preparation.**
Until it is published, [build from source](#build-from-source) is the path that works.

The install script and the manual download need a published release.
These two sections describe what they do from the first release.
The [roadmap](/docs/project/roadmap/) shows the state of the work.

## Supported machines

| Machine | Target of the release archive |
|---|---|
| Linux, x86_64 | `x86_64-unknown-linux-musl` |
| Linux, aarch64 | `aarch64-unknown-linux-musl` |
| macOS, Intel | `x86_64-apple-darwin` |
| macOS, Apple silicon | `aarch64-apple-darwin` |

The Linux binaries of a release are static. They do not use the C library of the machine.
There is no build for Windows.

## Build from source

You need `git` and [rustup](https://rustup.rs). The repository pins the Rust version, and rustup installs it automatically.

1. Get the source and build the binaries:

   ```sh
   git clone https://github.com/nomux-sh/nomux.git
   cd nomux
   cargo build --release
   ```

2. Copy the three binaries to a directory that is in `PATH`. Keep them in the same directory:

   ```sh
   mkdir -p ~/.local/bin
   cp target/release/nomux target/release/nomuxd target/release/nomux-holder ~/.local/bin/
   ```

3. Make sure that the shell finds the CLI:

   ```console
   $ nomux --version
   nomux 0.0.0
   ```

A build from `main` prints `0.0.0` until the first version has its tag.

## Install script

The script does these steps:

1. It finds the target of the machine from `uname`.
2. It downloads the archive of that target and the file `SHA256SUMS` from the GitHub release.
3. It verifies the SHA-256 checksum of the archive. If the checksum is wrong, it installs nothing.
4. It puts `nomux`, `nomuxd` and `nomux-holder` into `~/.local/bin`.

The script does not use `sudo`. It needs `curl`, `tar`, and `sha256sum` or `shasum`.

```sh
curl -fsSL https://raw.githubusercontent.com/nomux-sh/nomux/main/install.sh | sh
```

| Option | Default | Function |
|---|---|---|
| `--version <version>` | The newest version that has no suffix | The version to install, for example `0.1.0` |
| `--dir <directory>` | `~/.local/bin` | The directory for the binaries |

To give an option, add `-s --` after `sh`:

```sh
curl -fsSL https://raw.githubusercontent.com/nomux-sh/nomux/main/install.sh | sh -s -- --version 0.1.0 --dir ~/bin
```

Today the script stops with this message, because there is no release:

```text
install.sh: error: Found no release at https://api.github.com/repos/nomux-sh/nomux/releases?per_page=100
```

## Manual download

Each release has one archive for each target and one `SHA256SUMS` file.
An archive contains the three binaries, the README and the two license files.

1. Set the version and the target of the machine:

   ```sh
   version=0.1.0
   target=x86_64-unknown-linux-musl
   ```

2. Download the archive and the checksums from the [releases page](https://github.com/nomux-sh/nomux/releases):

   ```sh
   curl -fsSLO "https://github.com/nomux-sh/nomux/releases/download/v$version/nomux-$version-$target.tar.gz"
   curl -fsSLO "https://github.com/nomux-sh/nomux/releases/download/v$version/SHA256SUMS"
   ```

3. Verify the checksum. The command must print the name of the archive and `OK`. If it does not, do not continue:

   ```sh
   grep "nomux-$version-$target.tar.gz" SHA256SUMS | sha256sum --check
   ```

   On macOS, replace `sha256sum --check` with `shasum -a 256 --check`.

4. Extract the archive and copy the binaries:

   ```sh
   tar -xzf "nomux-$version-$target.tar.gz"
   mkdir -p ~/.local/bin
   cp "nomux-$version-$target/nomux" "nomux-$version-$target/nomuxd" "nomux-$version-$target/nomux-holder" ~/.local/bin/
   ```

The binaries are not signed and not notarized.

## Where the files are

| Path | Content |
|---|---|
| `~/.local/bin/nomux`, `nomuxd`, `nomux-holder` | The binaries. The path is different if you used `--dir` or copied them to a different directory. |
| `~/.nomux/run/` | The runtime directory: the socket, the lock and the log of the daemon, and one directory for each Session. nomux makes it at the first command. |

nomux writes no other file. It has no configuration file.

The CLI starts `nomuxd`, and the daemon starts `nomux-holder`. Each one looks for the other binary in its own directory first, and then in `PATH`.
Thus the three binaries must be in one directory, or all of them must be in `PATH`.

If `~/.local/bin` is not in `PATH`, add this line to the startup file of your shell:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

## Update

Install the new version in the same directory.
A daemon and the holders that run continue with the old binaries.
To start the new daemon, stop the old one:

```sh
nomux daemon stop
```

The next command starts the new daemon, and it finds the Sessions that run. A holder that runs is not replaced: a Session keeps its holder until it ends.

## Remove

1. End each Session and stop the daemon:

   ```sh
   for id in $(nomux ls --quiet); do nomux kill "$id"; done
   nomux daemon stop
   ```

2. Remove the binaries and the runtime directory:

   ```sh
   rm ~/.local/bin/nomux ~/.local/bin/nomuxd ~/.local/bin/nomux-holder
   rm -r ~/.nomux
   ```

If you added `~/.local/bin` to `PATH` only for nomux, remove that line from the startup file of your shell.

## Next step

Continue with the [quick start](/docs/guides/quick-start/).
