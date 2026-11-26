---
title: Performance targets
description: The performance targets of nomux and the values measured so far, each one with its source in the nomux repository.
sidebar:
  label: Performance targets
---

The performance targets of nomux come before features. A change that breaks a target is not merged.
This page lists the targets and the values that are measured now. Each value has its source in the [`nomux`](https://github.com/nomux-sh/nomux) repository.

## Targets

The source of this table is [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/bench/README.md#targets).
The owner is the part of the project that measures the target.

| Measurement | Target | Owner | Measured |
|---|---|---|---|
| Local key press to screen | < 10 ms | core + desktop | Core part with the CLI: [yes](#attach). Desktop part: no |
| Remote key press, visible (predictive echo) | < 10 ms; real confirmation in RTT + 5 ms | core + desktop | Confirmation through SSH: [yes](#remote-hosts). Predictive echo: does not exist |
| Output flood of 10 MB/s | UI at 60 fps or more; input latency does not change | core + desktop | Input latency with the CLI: [yes](#attach). UI: no |
| New Session start (warm pool) | < 10 ms | core | [Yes](#new-session), from the pool. Without the pool, a shell with slow start files misses the target |
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

The end-to-end tests in [`tests/session_lifecycle.rs`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/session_lifecycle.rs) kill the daemon and its process group with `SIGKILL` and make sure that the Session continues.
[`tests/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/attach.rs) kills the daemon during an attach and makes sure that a new attach shows the same screen.

## Measured values

The values are the values of the source documents at the tag [`v0.5.0`](https://github.com/nomux-sh/nomux/tree/v0.5.0).
All values are from Linux x86-64 with the release profile, except the row that says "debug build". There is no measurement on macOS and none on aarch64.
The sections "Attach", "Remote hosts", "Restore", "Holder", "Hooks" and "CLI" have the same values as for 0.4.0: the documents of 0.5.0 did not measure these parts again. The values changed in "New Session" (the rows of the holder pool, measured again with a different shell and a directory that is not the home directory) and in "Daemon" (the three rows of memory of the pool). The sections "Hibernation" and "Workspace tree" are new, and "Memory of Sessions" has one new row.
The source documents did not measure the sizes of the binaries again: the section "Binaries of the 0.5.0 archive" has the sizes of the release archive.
"glibc" is a dynamic build for the C library of the machine. "musl" is the static build that a release archive contains.

### Attach

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#measurements).

"Key to echo" is the time from the write of one key to the terminal of `nomux attach` until that terminal has the echo of the key. The Session runs `cat`, and the terminal of the Session echoes the key.
The path has the CLI, the daemon, the holder and the terminal of the Session, two times. It has no network and no desktop client, thus it is the core part of the target "local key press to screen".

| Measurement | Median | 99th percentile | Target |
|---|---|---|---|
| Key to echo, local Session | 0.2 ms to 0.5 ms | 0.5 ms to 5.4 ms | < 10 ms |
| Key to echo during a flood of 10 MB/s in a second attached Session | 0.2 ms to 0.5 ms | 1.4 ms to 4.7 ms | No change that matters |
| Key to echo during a flood without a limit in a second attached Session (19 MB/s to 36 MB/s to its client) | 0.2 ms to 0.8 ms | 3.1 ms to 5.3 ms | No change that matters |

The program [`tests/measurements/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/measurements/attach.rs) types 2000 keys with 2 ms between them. Each range is the result of 3 runs.
The largest value of a run is between 3 ms and 58 ms: a small number of keys wait for the scheduler of a computer that does other work. Thus the largest value is above the target in some runs.
[`tests/README.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/README.md#measurements) says how to run the program.

| Measurement | Result | Target |
|---|---|---|
| Growth of the resident memory of the daemon during a flood of 32 MiB to a client that takes no output | Less than 8 MiB, which is the limit of the test | No growth with the length of the output |

### Remote hosts

The source is the section "Measurements" of [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/remote.md#measurements).
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

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#measurements).

| Measurement | Median | Slowest of 11 runs | Target |
|---|---|---|---|
| Start of the daemon to a complete `nomux ls --json`, 50 dormant Sessions with a journal of 32 MiB each | 25.3 ms | 31.4 ms | < 1 s for the first screen |

- The measurement is the list of the Sessions, not the first screen of a Session. The time to restore a Session and show its screen is not measured.
- The files were on a `tmpfs` file system, thus the value has no cost of a disk. The same document says that a read with an empty page cache was not measured.

| Measurement | Result | Target |
|---|---|---|
| Resident memory, idle daemon with 3 dormant Sessions and 1 ended Session (glibc) | 4.3 MB | < 10 MB |
| CPU time and context switches in 30 s, idle daemon with 3 dormant Sessions and 1 ended Session | 0 and 0 | 0 |

### New Session

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#measurements). The daemon keeps a few holders ready, each with the shell of the user already started: [How it works](/docs/concepts/how-it-works/#the-holder-pool) describes the holder pool.

| Measurement | Without the pool | From the pool | Target |
|---|---|---|---|
| Request to the first command of the shell in a directory that is not the home directory, `bash` with start files of 200 ms: median of 50 | 205.9 ms | 1.1 ms | < 10 ms |
| The same, `bash` with an empty start file | 2.7 ms | 1.1 ms | < 10 ms |
| `nomux new`, `bash` with an empty start file: median of 50 | 3.2 ms | 2.0 ms | < 10 ms |

| Measurement | Result | Target |
|---|---|---|
| `Session.Create` from the pool, connected client, debug build: median of 11 | 1.2 ms to 2.0 ms | < 10 ms |
| `Session.Create` without the pool, connected client: median, slowest of 50 | 2.31 ms, 2.43 ms | No target |
| The same, the part in the daemon: start of the holder process, wait for `ready`, lease, response | 0.12 ms to 0.19 ms, 2.2 ms, 0.08 ms, 0.03 ms | No target |

- **The target is met from the pool, and it is missed without the pool for a slow shell.** A `bash` whose start files take 200 ms needs 205.9 ms without the pool, which is approximately 20 times the target. From the pool the same Session needs 1.1 ms: the shell ran its start files before the request, thus the time does not depend on them.
- **A shell with an empty start file gains less.** `nomux new` takes 3.2 ms without the pool and 2.0 ms from the pool: the start of the CLI and its connection are the larger part.
- **The directory of the Session is in the rows.** Since 0.5.0, a pooled `bash`, `zsh` or `fish` changes to the directory of the Session before its first prompt, and nothing is typed into the terminal. The first rows are for a directory that is not the home directory. The start files still run in the home directory, before a Session takes the holder.
- **Only `bash`, `zsh` and `fish` get another directory from the pool.** For another shell, and for `pool.shell_start_files = false`, the pool takes only a Session in the home directory, and a Session in another directory gets a new holder. The documents have no measurement for that case.
- **The pool has a holder when the holder is ready, not when its shell finished its start files.** A Session that takes the holder in that time shows its prompt later.
- **A Session with a command always gets a new holder.** The pool gives only the shell of the user. The pool is also off while `sessions.memory_limit` is set.
- The rows are from the program [`tests/measurements/new_session.rs`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/measurements/new_session.rs) with the release build and `SHELL=/bin/bash`, with an empty `.bashrc`, except where a row says more. The 0.4.0 document used `SHELL=/bin/sh` for the rows without start files, and the pool of 0.4.0 typed a `cd` line, thus these rows and the rows of 0.4.0 are not strictly comparable. The part in the daemon was measured with log lines that are not in the code. The row "debug build" is the test `a_session_from_the_pool_opens_in_less_than_10_ms`.
- For comparison, the same document says that `bash -i` with the start files of a real user took 232 ms to its first prompt on the same computer.
- The pool uses memory while it waits: see the rows of the pool in "Holder" and "Daemon".

### Holder

The source is the section "Measurements" of [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/holder.md#measurements). The holder of these values writes the journal.

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
| Size of `nomux-holder` (musl), with the pooled holder | 737968 bytes: 4128 bytes more than before | < 1 MB |
| Resident memory, idle pooled holder with `/bin/sh` (musl) | 0.8 MB to 0.9 MB | < 3 MB |
| Start of the holder to its `ready` file, with `/bin/sh`: median of 50 | 1.07 ms | No target |

The ring buffer is the memory in which the holder keeps the most recent output of a Session.
"Program reports full" is the largest state that a program can make: 64 program status records and 16 notifications, each with texts of the largest length.
Two values do not meet their target: the glibc build with a full ring buffer, with and without full program reports. **The release archives have the musl build**, which meets the target.

The output values are the best of 11 runs on a machine that did other work at the same time. The same document says that the journal makes a flood 15 % to 30 % slower, and that the holder is still 7 times faster than the target of 10 MB/s.

### Daemon

The source is the section "Measurements" of [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#measurements). That section also has the commands of the measurement.

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
| Resident memory with the status engine, idle daemon without a Session (glibc) | 4.4 MB | < 10 MB |
| Resident memory with the status engine, idle daemon with 20 Sessions, each with a status task (glibc) | 7.1 MB to 7.2 MB | < 10 MB |
| CPU time and context switches in 60 s, idle daemon with 20 Sessions, each with a status task | 0 and 0 | 0 |
| The same, and 10 of the Sessions reported a status with a Child work before the 60 s | 0 and 0 | 0 |
| Resident memory of the daemon with a full pool of 2 holders, idle (glibc) | 4.6 MB | < 10 MB |
| Resident memory of 2 pooled holders (glibc) | 5.6 MB, which is 2.8 MB for each holder | < 3 MB for each holder |
| Resident memory of the 2 shells of the pool (`bash` 5.3 with an empty start file) | 8.7 MB | No target |
| CPU time in 30 s of the idle daemon with a full pool, its pooled holders and their shells | 0 | 0 |

The same document has older rows for builds before the extension host and before the status engine. The rows without "with the extension host" or "with the status engine" are from an earlier measurement and an earlier build.
The daemon with 20 Sessions needs 7.1 MB to 7.2 MB, against 4.4 MB without a Session: approximately 0.14 MB for each Session. This is a calculation from the two rows, not a measurement of its own.
The pool adds memory that the daemon rows do not count. The 2 pooled holders use 5.6 MB and their 2 shells use 8.7 MB, in processes of their own. These three rows were 4.4 MB, 5.5 MB and 8.9 MB in 0.4.0. The setting `pool.size = 0` turns the pool off.

### Memory of Sessions

The source is the section "Measurements" of [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/memory.md#measurements). The daemon measures the memory of the processes of each Session only when a client asks (`nomux ls --memory`), and since 0.5.0 also when a trigger of the [hibernation](#hibernation) needs the values.

| Measurement | Result |
|---|---|
| `Session.Memory` request, 50 Sessions with 150 processes of their commands, 614 processes on the Host: median, slowest of 21 requests | 9.9 ms, 11.2 ms |
| The same in a second run | 9.6 ms, 13.0 ms |
| `nomux ls --memory --json` command with these Sessions: median, slowest of 21 runs | 10.9 ms, 12.0 ms |
| `nomux ls --json` command with these Sessions: median, slowest of 21 runs | 1.1 ms, 1.4 ms |
| `Session.Memory` request, 200 Sessions with 600 processes of their commands, 1214 processes on the Host: median, slowest | 28.1 ms, 32.8 ms |
| `nomux ls --memory --json` command, 50 Sessions whose commands each use 32 MiB (1.5 GiB): median, slowest of 21 runs | 17.2 ms, 23.7 ms |
| CPU time of the daemon in 42 s after two memory requests, 2 Sessions | 0 clock ticks |
| Context switches of the daemon in the same 42 s | 0 |
| Threads of the daemon: before a request, immediately after a request, 12 s after a request | 1, 2, 1 |
| Size of `nomuxd` (glibc) with the memory request | 1771 KiB (1813264 bytes) |
| Start of a Session with a memory limit that the kernel applies: the cost of the transient scope for each start | Approximately 4.6 ms |

No target applies to the time of this request. The rows with the CPU time, the context switches and the threads show that the daemon does nothing for the memory between two requests. [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md) records this rule.

- The time has two parts: the read of the process table of the Host, which grows with the number of processes on the Host, and the read of the memory of each process, which grows with the number of processes of the Sessions and with their memory.
- `nomux ls --memory --json` is approximately 10 times slower than `nomux ls --json` for the same 50 Sessions (10.9 ms and 1.1 ms). Without `--memory`, nothing is measured.
- The daemon answers the other clients during a request: the work is not on its thread.
- The program [`tests/measurements/memory.rs`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/measurements/memory.rs) measures the first rows. The CPU time, the context switches and the threads are from commands on the daemon process.
- The macOS code of the memory request was compiled and tested only on the macOS runner of CI. Nobody examined it on a Mac with real Sessions.
- **The memory limit.** The row with 4.6 ms is not from a measurement program. The document [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/memory.md#memory-limit) calls it "the measurement of the design": the cost of the transient scope of `systemd-run --user --scope`, for each start of a Session with a limit. A Session without a limit does not have this cost. The pool is off while `sessions.memory_limit` is set, thus the target of the pool does not apply to such a Session, and the documents have no other measurement of its start.

### Hibernation

The source is the subsection "Hibernation" of the section "Measurements" of [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/memory.md#measurements). The guide [Hibernation](/docs/guides/hibernation/) says how to use it. The program [`tests/measurements/hibernation.rs`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/measurements/hibernation.rs) starts 3 agent Sessions of the test adapter whose agents each hold 200 MiB, hibernates them, and measures. It runs in a scope of its own (`systemd-run --user --scope`). The computer did other work at the same time (load average from 5 to 30 on 8 processors), thus the times have noise.

| Measurement | Result |
|---|---|
| Memory of the commands of the 3 Sessions before the hibernation (`ls --memory`, `pss`) | 600.7 MiB |
| Memory that the hibernations gave back (`ls --memory`, `FREED`) | 600.9 MiB |
| Memory of the control group of the measurement (each process that it started: daemon, holders, agents), before and after | 614.2 MiB, 9.5 MiB |
| Available memory of the Host (`MemAvailable`), before and after | 4436.5 MiB, 4636.6 MiB |
| Attach of a hibernated Session to the first screen of the old run, and to the first output of the resumed run: 3 wakes | 11.7 ms and 12.2 ms, 4.2 ms and 4.2 ms, 4.2 ms and 4.2 ms |
| Idle daemon with each trigger on (count, total threshold, pressure), 60 s after 75 s of rest: CPU time, context switches of each thread, threads | 0 clock ticks, 0, 1 |

- **The memory comes back.** The 3 hibernations gave back 600.9 MiB, and the control group went from 614.2 MiB to 9.5 MiB. `MemAvailable` is not a good measure here, because other programs changed it at the same time.
- **A wake needs approximately 4 ms to 12 ms to the old screen.** This is the time from the start of `nomux attach` (the CLI, the connection, the start of the holder, the redraw) to the screen. The agent of the test prints its line at its start, thus the resumed run is there 0 ms to 0.5 ms after the old screen. A real agent needs its own start time after that, and nobody measured it.
- **The triggers do not wake the daemon.** 0 context switches in 60 s mean 0 wake-ups in each minute. The trigger of the memory pressure is one more descriptor of the reactor, not a thread. The 75 s of rest before the measurement are for two timers that exist without the hibernation: the adapter extension stops 60 s after its last event, and the thread of a memory measurement ends 10 s after it.
- **The pressure trigger was examined once, on Linux.** In a scope with `MemoryHigh=32M` and `MemorySwapMax=0`, a program wrote to 400 MiB: an idle agent Session hibernated with the reason `memory-pressure`, and the event had 200 ms in a window of 2000 ms. macOS has no pressure trigger: the issue [#100](https://github.com/nomux-sh/nomux/issues/100) is open.
- The measurement used the test adapter and an agent that the test writes, not a real agent tool.

### Workspace tree

The source is the section "Measurements" of [`docs/workspace.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/workspace.md#measurements). The [workspace tree](/docs/reference/glossary/) has the Groups and the Projects of a Host: the guide [Projects and Groups](/docs/guides/projects-and-groups/) says how to use them. The start of a Session does not read the tree, and the daemon reads its file only at its start. Measured on Linux (8 cores) with a release build. The tree of 800 nodes is the largest tree that the limits permit: names of 128 bytes and, for each Project, a directory of 1001 bytes.

| Tree | Resident memory of the idle daemon | CPU time of the daemon in 30 s, idle | `nomux new`, warm pool: median of 30 | `group ls --tree`: median of 10 |
|---|---|---|---|---|
| 0 nodes | 4.6 MB | 0 clock ticks | 2.4 ms to 2.7 ms | 1.5 ms |
| 800 nodes | 7.4 MB to 8.2 MB | 0 clock ticks | 2.0 ms to 4.0 ms | 7.1 ms to 7.8 ms |

- **The targets hold with the largest tree.** The idle daemon needs 7.4 MB to 8.2 MB against < 10 MB, and a new Session from the pool needs 2.0 ms to 4.0 ms against < 10 ms. The tree adds approximately 2.8 MB to 3.6 MB to the daemon: this is a calculation from the two rows, not a measurement of its own.
- No target applies to `group ls --tree`.

### Hooks

The source is the section "Measurements" of [`docs/adapters.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/adapters.md#measurements). The program [`tests/measurements/hooks.rs`](https://github.com/nomux-sh/nomux/blob/v0.5.0/tests/measurements/hooks.rs) measures the time of `nomux hook` from the start of the process to its end, as an agent tool runs it. Release build, 100 runs each, with the test adapter installed.

| `nomux hook` | Median | Fastest | Slowest |
|---|---|---|---|
| Daemon runs, adapter installed | 1.0 ms | 0.9 ms | 2.6 ms |
| Daemon stopped | 0.9 ms | 0.8 ms | 1.4 ms |

- No target applies. A hook runs in the tool, thus the command must not slow the tool: it waits 80 ms at most for the daemon, and its exit code is always 0.
- The daemon answers the hook before the adapter gets the event, thus the time does not have the work of the adapter.
- The adapter is a test adapter of a made-up tool, not the adapter of a real tool.

### CLI

The CLI has no target. The SSH client made it larger. The source is the section "Measurements" of [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/remote.md#measurements):

| Build of `nomux` (glibc) | Size |
|---|---|
| Without the SSH client | 943 KiB (966104 bytes) |
| With the SSH client | 3822 KiB (3913456 bytes) |

The issue [#47](https://github.com/nomux-sh/nomux/issues/47) of the `nomux` repository is about this size.

### Binaries of the 0.5.0 archive

These sizes are not from a document. They are the sizes of the three files in the archive `nomux-0.5.0-x86_64-unknown-linux-musl.tar.gz` of the [0.5.0 release](https://github.com/nomux-sh/nomux/releases/tag/v0.5.0), read with `tar -tvzf` for this page. The SHA-256 of the archive is the value in the file `SHA256SUMS` of the release. The last column is the size in the 0.4.0 archive.

| Binary | Size | Target | 0.4.0 |
|---|---|---|---|
| `nomux-holder` | 758512 bytes (741 KiB) | < 1 MB | 746224 bytes (729 KiB) |
| `nomuxd` | 2566792 bytes (2507 KiB) | < 10 MB | 2222280 bytes (2170 KiB) |
| `nomux` | 5646536 bytes (5514 KiB) | No target | 5253320 bytes (5130 KiB) |

Each binary meets its target. The three binaries grew from 0.4.0: `nomux-holder` by 12288 bytes (1.6 %), `nomuxd` by 344512 bytes (15.5 %) and `nomux` by 393216 bytes (7.5 %). The size of `nomux-holder` in this table differs by 20544 bytes from the 737968 bytes in the table "Holder": the two are different builds.

### Values that miss a target

- **Holder with the glibc build.** The resident memory with a full ring buffer is 3.1 MB, and 3.3 MB with full program reports, against < 3 MB. The musl build of the release archive meets the target.
- **New Session without the pool.** A `bash` with start files of 200 ms needs 205.9 ms against < 10 ms. The pool meets the target for a Session with the shell of the user in the home directory, and in another directory for `bash`, `zsh` and `fish`. It does not meet the target for a Session with a command, for another shell in another directory, and for a Session with a memory limit, because the pool is off then.
- **Remote key press.** A key waits one round trip, because predictive echo does not exist. The target "< 10 ms visible" is not met for a remote Host.
- **Largest key-to-echo value.** The largest value of a run is between 3 ms and 58 ms, above 10 ms in some runs. The 99th percentile meets the target.
- **Not measured.** The reconnect time, the update of the daemon, the first screen after a restart, the network change, and each target of the desktop client. For 0.5.0, also: the wake of a real agent tool (only the test agent), the pool for `zsh` and `fish` (the rows use `bash`), the start of a Session with a memory limit with the finished code, the memory pressure trigger on macOS, and the 0.5.0 sizes of the glibc builds.

## Limits of these values

- A person measured these values on one machine. No CI job measures them, and no CI job fails a build that is worse than a target. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/bench/README.md) says that this job comes with the benchmarks of the holder and the daemon. The issue [#14](https://github.com/nomux-sh/nomux/issues/14) is about this job, and it is open in nomux 0.5.0.
- "Key to echo" is not the full target "local key press to screen". It does not have the time that a terminal emulator or the desktop client needs to draw the key.
- The values change with the code. The source documents on the `main` branch have the current values.

The measurements that selected the VT library are in [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md). The budgets for disk and memory are in [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md).
