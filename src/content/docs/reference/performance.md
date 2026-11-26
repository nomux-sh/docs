---
title: Performance targets
description: The performance targets of nomux and the values measured so far, each one with its source in the nomux repository.
sidebar:
  label: Performance targets
---

The performance targets of nomux come before features. A change that breaks a target is not merged.
This page lists the targets and the values that are measured now. Each value has its source in the [`nomux`](https://github.com/nomux-sh/nomux) repository.

## Targets

The source of this table is [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/bench/README.md#targets).
The owner is the part of the project that measures the target.

| Measurement | Target | Owner | Measured |
|---|---|---|---|
| Local key press to screen | < 10 ms | core + desktop | Core part with the CLI: [yes](#attach). Desktop part: no |
| Remote key press, visible (predictive echo) | < 10 ms; real confirmation in RTT + 5 ms | core + desktop | Confirmation through SSH: [yes](#remote-hosts). Predictive echo: does not exist |
| Output flood of 10 MB/s | UI at 60 fps or more; input latency does not change | core + desktop | Input latency with the CLI: [yes](#attach). UI: no |
| New Session start (warm pool) | < 10 ms | core | No |
| Network change | The connection stays open | core | No |
| Reconnect after a disconnect | < 1 s, no data loss | core | No data loss: [tested](#remote-hosts). Time: no |
| Daemon update or daemon crash | No Session stops | core | Daemon crash: tested. Daemon update: no |
| First screen after a reboot | < 1 s (lazy restore) | core | The list of the Sessions: [yes](#restore). The first screen: no |
| RAM of an idle `nomuxd` | < 10 MB | core | [Yes](#daemon) |
| RAM of one holder for each Session | < 3 MB (scrollback is on disk) | core | [Yes](#holder) |
| Size of the `nomux-holder` binary | < 1 MB | core | [Yes](#holder) |
| Size of the `nomuxd` binary | < 10 MB | core | [Yes](#daemon) |
| Desktop cold start | < 300 ms | desktop | No |
| Desktop idle RAM | < 80 MB; in the background < 40 MB | desktop | No |
| Desktop idle CPU | Approximately 0 % (budget in CI) | desktop | No |

"No" means that the part that the target applies to does not exist yet, or that no measurement is recorded.
The [roadmap](/docs/project/roadmap/) shows the sequence of the work.

The end-to-end tests in [`tests/session_lifecycle.rs`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/session_lifecycle.rs) kill the daemon and its process group with `SIGKILL` and make sure that the Session continues.
[`tests/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/attach.rs) kills the daemon during an attach and makes sure that a new attach shows the same screen.

## Measured values

The values are the values of the source documents at the tag [`v0.3.0`](https://github.com/nomux-sh/nomux/tree/v0.3.0).
All values are from Linux x86-64 with the release profile. There is no measurement on macOS and none on aarch64.
"glibc" is a dynamic build for the C library of the machine. "musl" is the static build that a release archive contains.

### Attach

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/daemon.md#measurements).

"Key to echo" is the time from the write of one key to the terminal of `nomux attach` until that terminal has the echo of the key. The Session runs `cat`, and the terminal of the Session echoes the key.
The path has the CLI, the daemon, the holder and the terminal of the Session, two times. It has no network and no desktop client, thus it is the core part of the target "local key press to screen".

| Measurement | Median | 99th percentile | Target |
|---|---|---|---|
| Key to echo, local Session | 0.2 ms to 0.5 ms | 0.5 ms to 5.4 ms | < 10 ms |
| Key to echo during a flood of 10 MB/s in a second attached Session | 0.2 ms to 0.5 ms | 1.4 ms to 4.7 ms | No change that matters |
| Key to echo during a flood without a limit in a second attached Session (19 MB/s to 36 MB/s to its client) | 0.2 ms to 0.8 ms | 3.1 ms to 5.3 ms | No change that matters |

The program [`tests/measurements/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/measurements/attach.rs) types 2000 keys with 2 ms between them. Each range is the result of 3 runs.
The largest value of a run is between 3 ms and 58 ms: a small number of keys wait for the scheduler of a computer that does other work. Thus the largest value is above the target in some runs.
[`tests/README.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/README.md#measurements) says how to run the program.

| Measurement | Result | Target |
|---|---|---|
| Growth of the resident memory of the daemon during a flood of 32 MiB to a client that takes no output | Less than 8 MiB, which is the limit of the test | No growth with the length of the output |

### Remote hosts

The source is the section "Measurements" of [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#measurements).
The SSH server is `sshd` of OpenSSH 10.2 on the same computer. The client reaches it through a relay program that can add a delay. Each range is the result of 2 runs.

| Measurement | Median | 99th percentile | Target |
|---|---|---|---|
| Key to echo, SSH to the same computer | 0.3 ms to 3.2 ms | 1.1 ms to 11.6 ms | No target |
| The same during a flood in a second attached Session | 0.3 ms to 1.3 ms | 2.6 ms to 10.5 ms | No change that matters |
| Key to echo with a round trip of 100 ms | 100.9 ms | 103.3 ms | Confirmation in RTT + 5 ms |
| The same during a flood in a second attached Session | 100.7 ms | 107.4 ms | Confirmation in RTT + 5 ms |
| Key to echo with a round trip of 100 ms and the loss model | 100.8 ms | 300.9 ms | No target for loss |
| The same during a flood in a second attached Session | 101.0 ms | 302.2 ms | No target for loss |

| Measurement | Result |
|---|---|
| First `nomux host add`: connection, archive, upload of 5.3 MB, checksums, start of the daemon | 0.3 s to 0.7 s |
| Later command `nomux --host vps ls`, median of 20 | 31 ms to 104 ms |
| The same command on the local Host | 1 ms to 12 ms |
| Output that was lost or came two times in these measurements, and after a cut connection in the tests | None |

- **Delay.** The relay holds each chunk of bytes for 50 ms in each direction.
- **Loss model.** The relay makes 2 % of the chunks wait 200 ms more, as TCP does after a lost packet. The same document says that a measurement with real packet loss was not made.
- **Predictive echo does not exist.** A key shows when the Host sent its echo, thus a key waits one round trip. The target "visible in < 10 ms" is not met for a remote Host.
- The time of a reconnect was not measured.

### Restore

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/daemon.md#measurements).

| Measurement | Median | Slowest of 11 runs | Target |
|---|---|---|---|
| Start of the daemon to a complete `nomux ls --json`, 50 dormant Sessions with a journal of 32 MiB each | 25.3 ms | 31.4 ms | < 1 s for the first screen |

- The measurement is the list of the Sessions, not the first screen of a Session. The time to restore a Session and show its screen is not measured.
- The files were on a `tmpfs` file system, thus the value has no cost of a disk. The same document says that a read with an empty page cache was not measured.

| Measurement | Result | Target |
|---|---|---|
| Resident memory, idle daemon with 3 dormant Sessions and 1 ended Session (glibc) | 4.3 MB | < 10 MB |
| CPU time and context switches in 30 s, idle daemon with 3 dormant Sessions and 1 ended Session | 0 and 0 | 0 |

### Holder

The source is the section "Measurements" of [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/holder.md#measurements). The holder of these values writes the journal.

| Measurement | Result | Target |
|---|---|---|
| Size of `nomux-holder` (glibc) | 624 KB | < 1 MB |
| Size of `nomux-holder` (musl) | 722 KB | < 1 MB |
| Resident memory, idle holder with `/bin/sh` (musl) | 0.8 MB | < 3 MB |
| Resident memory, ring buffer full, after 8 MB of output (musl) | 1.2 MB | < 3 MB |
| Resident memory, ring buffer full and program reports full (musl) | 1.5 MB | < 3 MB |
| Resident memory, idle holder with `/bin/sh` (glibc) | 2.6 MB | < 3 MB |
| Resident memory, ring buffer full, after 8 MB of output (glibc) | 3.1 MB | < 3 MB: not met |
| Resident memory, ring buffer full and program reports full (glibc) | 3.3 MB | < 3 MB: not met |
| CPU time and context switches in 10 s, idle | 0 and 0 | 0 |
| Output of `cat` of a 128 MiB file through the holder, plain text | 82 MiB/s | No target |
| Output of `cat` of a 128 MiB file through the holder, colored words | 69 MiB/s | No target |
| Output of `cat` of a 32 MiB file through the holder, a program status report in each line | 30 MiB/s | No target |
| Journal on disk for 1 MiB of output: plain words, colored words, `git log -p` with colors | 618 KiB, 464 KiB, 366 KiB | No target |
| Screen of a position from the checkpoint before it, colored words | 3 ms to 12 ms | No target |

The ring buffer is the memory in which the holder keeps the most recent output of a Session.
"Program reports full" is the largest state that a program can make: 64 program status records and 16 notifications, each with texts of the largest length.
Two values do not meet their target: the glibc build with a full ring buffer, with and without full program reports. **The release archives have the musl build**, which meets the target.

The output values are the best of 11 runs on a machine that did other work at the same time. The same document says that the journal makes a flood 15 % to 30 % slower, and that the holder is still 7 times faster than the target of 10 MB/s.

### Daemon

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/daemon.md#measurements). That section also has the commands of the measurement.

| Measurement | Result | Target |
|---|---|---|
| Size of `nomuxd` (glibc), with the extension host, the journal and the restore | 1737 KiB (1778864 bytes) | < 10 MB |
| Resident memory, idle daemon without a Session (glibc) | 2.9 MB | < 10 MB |
| Resident memory, idle daemon with 2 Sessions (glibc) | 3.1 MB | < 10 MB |
| Resident memory, idle daemon with 1 Session (musl) | 1.1 MB | < 10 MB |
| Resident memory with the extension host, idle daemon with 2 Sessions (glibc) | 4.0 MB | < 10 MB |
| Resident memory, idle daemon with 1 installed extension that is not in use (glibc) | 4.1 MB | < 10 MB |
| Resident memory of the same daemon after the extension ran and stopped after its idle time | 4.2 MB | < 10 MB |
| CPU time and context switches in 30 s, idle daemon with 2 Sessions | 0 and 0 | 0 |
| CPU time and context switches in 30 s, idle daemon with 1 attached client | 0 and 0 | 0 |
| CPU time and context switches in 30 s, idle daemon with 1 installed extension that is not in use | 0 and 0 | 0 |

The same document has older rows for builds before the extension host. The rows without "with the extension host" are from an earlier measurement and an earlier build.

### CLI

The CLI has no target. The SSH client made it larger. The source is the section "Measurements" of [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#measurements):

| Build of `nomux` (glibc) | Size |
|---|---|
| Without the SSH client | 943 KiB (966104 bytes) |
| With the SSH client | 3822 KiB (3913456 bytes) |

The issue [#47](https://github.com/nomux-sh/nomux/issues/47) of the `nomux` repository is about this size.

### Binaries of the 0.3.0 archive

These sizes are not from a document. They are the sizes of the three files in the archive `nomux-0.3.0-x86_64-unknown-linux-musl.tar.gz` of the [0.3.0 release](https://github.com/nomux-sh/nomux/releases/tag/v0.3.0), read with `tar -tvzf` for this page.

| Binary | Size | Target |
|---|---|---|
| `nomux-holder` | 725680 bytes (709 KiB) | < 1 MB |
| `nomuxd` | 1890216 bytes (1846 KiB) | < 10 MB |
| `nomux` | 4389032 bytes (4286 KiB) | No target |

## Limits of these values

- A person measured these values on one machine. No CI job measures them, and no CI job fails a build that is worse than a target. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/bench/README.md) says that this job comes with the benchmarks of the holder and the daemon. The issue [#14](https://github.com/nomux-sh/nomux/issues/14) is about this job.
- "Key to echo" is not the full target "local key press to screen". It does not have the time that a terminal emulator or the desktop client needs to draw the key.
- The values change with the code. The source documents on the `main` branch have the current values.

The measurements that selected the VT library are in [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md). The budgets for disk and memory are in [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md).
