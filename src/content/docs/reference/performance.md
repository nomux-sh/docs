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
| Local key press to screen | < 10 ms | core + desktop | No |
| Remote key press, visible (predictive echo) | < 10 ms; real confirmation in RTT + 5 ms | core + desktop | No |
| Output flood of 10 MB/s | UI at 60 fps or more; input latency does not change | core + desktop | No |
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

## Measured values

All values are from Linux x86-64 with the release profile. There is no measurement on macOS and none on aarch64.
"glibc" is a dynamic build for the C library of the machine. "musl" is the static build that a release archive contains.

### Holder

The source is the section "Measurements" of [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/main/docs/holder.md#measurements).

| Measurement | Result | Target |
|---|---|---|
| Size of `nomux-holder` (glibc) | 538 KB | < 1 MB |
| Size of `nomux-holder` (musl) | 636 KB | < 1 MB |
| Resident memory, idle holder with `/bin/sh` (glibc) | 2.6 MB | < 3 MB |
| Resident memory, ring buffer full (glibc) | 2.8 MB | < 3 MB |
| Resident memory, idle holder with `/bin/sh` (musl) | 0.7 MB | < 3 MB |
| Resident memory, ring buffer full (musl) | 0.9 MB | < 3 MB |
| CPU time and context switches in 10 s, idle | 0 and 0 | 0 |
| Output of `cat` of a 128 MiB file through the holder, plain text | 82 MiB/s | No target |
| Output of `cat` of a 128 MiB file through the holder, colored words | 110 MiB/s | No target |

The ring buffer is the memory in which the holder keeps the most recent output of a Session.
The two output values are the median of 5 runs. The same document says that two sets of runs of one binary differ by 10 %.

### Daemon

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements). That section also has the commands of the measurement.

| Measurement | Result | Target |
|---|---|---|
| Size of `nomuxd` (glibc) | 772 KiB (790272 bytes) | < 10 MB |
| Size of `nomuxd` (musl) | 866 KiB (886264 bytes) | < 10 MB |
| Resident memory, idle daemon without a Session (glibc) | 2.8 MB | < 10 MB |
| Resident memory, idle daemon with 2 Sessions (glibc) | 2.9 MB | < 10 MB |
| Resident memory, idle daemon with 1 Session (musl) | 1.0 MB | < 10 MB |
| CPU time and context switches in 30 s, idle daemon with 2 Sessions | 0 and 0 | 0 |

### CLI

The CLI has no target. Its size is 819 KiB (838936 bytes) with glibc, from the same section of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements).

## Limits of these values

- A person measured these values on one machine. No CI job measures them, and no CI job fails a build that is worse than a target. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/main/bench/README.md) says that this job comes with the benchmarks of the holder and the daemon.
- The target for the memory of a holder assumes that the scrollback is on disk. The holder keeps no scrollback now.
- The values change with the code. The two source documents have the current values.

The measurements that selected the VT library are in [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md).
