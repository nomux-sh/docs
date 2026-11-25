---
title: Performance targets
description: The performance targets of nomux and the values measured so far, each one with its source in the nomux repository.
sidebar:
  label: Performance targets
---

The performance targets of nomux come before features. A change that breaks a target is not merged.
This page lists the targets and the values that are measured now. Each value has its source in the [`nomux`](https://github.com/nomux-sh/nomux) repository.

## Targets

The source of this table is [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/main/bench/README.md#targets).
The owner is the part of the project that measures the target.

| Measurement | Target | Owner | Measured |
|---|---|---|---|
| Local key press to screen | < 10 ms | core + desktop | Core part with the CLI: [yes](#attach). Desktop part: no |
| Remote key press, visible (predictive echo) | < 10 ms; real confirmation in RTT + 5 ms | core + desktop | No |
| Output flood of 10 MB/s | UI at 60 fps or more; input latency does not change | core + desktop | Input latency with the CLI: [yes](#attach). UI: no |
| New Session start (warm pool) | < 10 ms | core | No |
| Network change | The connection stays open | core | No |
| Reconnect after a disconnect | < 1 s, no data loss | core | No |
| Daemon update or daemon crash | No Session stops | core | Daemon crash: tested. Daemon update: no |
| First screen after a reboot | < 1 s (lazy restore) | core | No |
| RAM of an idle `nomuxd` | < 10 MB | core | [Yes](#daemon) |
| RAM of one holder for each Session | < 3 MB (scrollback is on disk) | core | [Yes](#holder) |
| Size of the `nomux-holder` binary | < 1 MB | core | [Yes](#holder) |
| Size of the `nomuxd` binary | < 10 MB | core | [Yes](#daemon) |
| Desktop cold start | < 300 ms | desktop | No |
| Desktop idle RAM | < 80 MB; in the background < 40 MB | desktop | No |
| Desktop idle CPU | Approximately 0 % (budget in CI) | desktop | No |

"No" means that the part that the target applies to does not exist yet, or that no measurement is recorded.
The [roadmap](/docs/project/roadmap/) shows the sequence of the work.

The end-to-end tests in [`tests/session_lifecycle.rs`](https://github.com/nomux-sh/nomux/blob/main/tests/session_lifecycle.rs) kill the daemon and its process group with `SIGKILL` and make sure that the Session continues.
[`tests/attach.rs`](https://github.com/nomux-sh/nomux/blob/main/tests/attach.rs) kills the daemon during an attach and makes sure that a new attach shows the same screen.

## Measured values

The values are the values of the source documents at the tag [`v0.1.0`](https://github.com/nomux-sh/nomux/tree/v0.1.0).
All values are from Linux x86-64 with the release profile. There is no measurement on macOS and none on aarch64.
"glibc" is a dynamic build for the C library of the machine. "musl" is the static build that a release archive contains.

### Attach

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements).

"Key to echo" is the time from the write of one key to the terminal of `nomux attach` until that terminal has the echo of the key. The Session runs `cat`, and the terminal of the Session echoes the key.
The path has the CLI, the daemon, the holder and the terminal of the Session, two times. It has no network and no desktop client, thus it is the core part of the target "local key press to screen".

| Measurement | Median | 99th percentile | Target |
|---|---|---|---|
| Key to echo, local Session | 0.2 ms to 0.5 ms | 0.5 ms to 5.4 ms | < 10 ms |
| Key to echo during a flood of 10 MB/s in a second attached Session | 0.2 ms to 0.5 ms | 1.4 ms to 4.7 ms | No change that matters |
| Key to echo during a flood without a limit in a second attached Session (19 MB/s to 36 MB/s to its client) | 0.2 ms to 0.8 ms | 3.1 ms to 5.3 ms | No change that matters |

The program [`tests/measurements/attach.rs`](https://github.com/nomux-sh/nomux/blob/main/tests/measurements/attach.rs) types 2000 keys with 2 ms between them. Each range is the result of 3 runs.
The largest value of a run is between 3 ms and 58 ms: a small number of keys wait for the scheduler of a computer that does other work. Thus the largest value is above the target in some runs.
[`tests/README.md`](https://github.com/nomux-sh/nomux/blob/main/tests/README.md#measurements) says how to run the program.

| Measurement | Result | Target |
|---|---|---|
| Growth of the resident memory of the daemon during a flood of 32 MiB to a client that takes no output | Less than 8 MiB, which is the limit of the test | No growth with the length of the output |

### Holder

The source is the section "Measurements" of [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/main/docs/holder.md#measurements).

| Measurement | Result | Target |
|---|---|---|
| Size of `nomux-holder` (glibc) | 560 KB | < 1 MB |
| Size of `nomux-holder` (musl) | 652 KB | < 1 MB |
| Resident memory, idle holder with `/bin/sh` (glibc) | 2.6 MB | < 3 MB |
| Resident memory, ring buffer full (glibc) | 2.9 MB | < 3 MB |
| Resident memory, ring buffer full and program reports full (glibc) | 3.2 MB | < 3 MB: not met |
| Resident memory, idle holder with `/bin/sh` (musl) | 0.7 MB | < 3 MB |
| Resident memory, ring buffer full (musl) | 1.0 MB | < 3 MB |
| Resident memory, ring buffer full and program reports full (musl) | 1.3 MB | < 3 MB |
| CPU time and context switches in 10 s, idle | 0 and 0 | 0 |
| Output of `cat` of a 128 MiB file through the holder, plain text | 71 MiB/s | No target |
| Output of `cat` of a 128 MiB file through the holder, colored words | 84 MiB/s | No target |
| Output of `cat` of a 32 MiB file through the holder, a program status report in each line | 54 MiB/s | No target |

The ring buffer is the memory in which the holder keeps the most recent output of a Session.
"Program reports full" is the largest state that a program can make: 64 program status records and 16 notifications, each with texts of the largest length. One value does not meet its target: the glibc build with a full ring buffer and full program reports. The release archives have the musl build.
The same document says that the screen state adds approximately 0.2 MB to the resident memory of a window of 80 x 24 cells.

The three output values are the best of 11 runs on a machine that did other work at the same time. The same document says that the median is 10 % to 15 % lower.

### Daemon

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements). That section also has the commands of the measurement.

| Measurement | Result | Target |
|---|---|---|
| Size of `nomuxd` (glibc) | 878 KiB (899504 bytes) | < 10 MB |
| Size of `nomuxd` (musl) | 974 KiB (996952 bytes) | < 10 MB |
| Resident memory, idle daemon without a Session (glibc) | 2.9 MB | < 10 MB |
| Resident memory, idle daemon with 2 Sessions (glibc) | 3.1 MB | < 10 MB |
| Resident memory, idle daemon with 1 Session and 1 attached client (glibc) | 3.1 MB | < 10 MB |
| Resident memory, idle daemon with 1 Session (musl) | 1.1 MB | < 10 MB |
| CPU time and context switches in 30 s, idle daemon with 2 Sessions | 0 and 0 | 0 |
| CPU time and context switches in 30 s, idle daemon with 1 attached client | 0 and 0 | 0 |

### CLI

The CLI has no target. Its size is 943 KiB (966104 bytes) with glibc and 1045 KiB (1069952 bytes) with musl, from the same section of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements).

### Binaries of the 0.1.0 archive

These sizes are not from a document. They are the sizes of the three files in the archive `nomux-0.1.0-x86_64-unknown-linux-musl.tar.gz` of the [0.1.0 release](https://github.com/nomux-sh/nomux/releases/tag/v0.1.0), read with `ls -l` for this page.

| Binary | Size | Target |
|---|---|---|
| `nomux-holder` | 660144 bytes (645 KiB) | < 1 MB |
| `nomuxd` | 997016 bytes (974 KiB) | < 10 MB |
| `nomux` | 1074120 bytes (1049 KiB) | No target |

## Limits of these values

- A person measured these values on one machine. No CI job measures them, and no CI job fails a build that is worse than a target. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/main/bench/README.md) says that this job comes with the benchmarks of the holder and the daemon.
- "Key to echo" is not the full target "local key press to screen". It does not have the time that a terminal emulator or the desktop client needs to draw the key.
- The target for the memory of a holder assumes that the scrollback is on disk. The holder keeps no scrollback now.
- The values change with the code. The two source documents on the `main` branch have the current values.

The measurements that selected the VT library are in [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md).
