---
title: Memory of Sessions
description: See how much memory the processes of each Session use with nomux ls --memory, what the numbers count, and what nomux does not measure.
---

`nomux ls --memory` shows the memory that the processes of each Session use now. When memory runs low, you see which Session uses it.

The output on this page is the real output of nomux 0.4.0 on Linux. The home directory of the run is the temporary directory `/tmp/nomux-demo`.
The commands of the four Sessions were `python3 hog.py 200` (a program that allocates 200 MiB), a `sh` that starts two such programs (50 MiB and 30 MiB), `sleep 3600` and the shell of the user.

## Show the memory

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
epvdx7iy  running  155.0 KiB  1          325.0 KiB  pss      sleep 3600
myuy5zl4  running  203.9 MiB  1          332.0 KiB  pss      python3 hog.py 200
nubgqpss  running  88.2 MiB   3          332.0 KiB  pss      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
ynz3inyu  running  784.0 KiB  1          355.0 KiB  pss      /bin/bash
total: 293.1 MiB in 6 processes of 4 sessions, and 1.3 MiB in the holders (pss)
```

| Column | Meaning |
|---|---|
| `MEMORY` | The memory of the process tree of the command: the command and each process that descends from it. |
| `PROCESSES` | The number of processes in that tree. |
| `HOLDER` | The memory of the holder of the Session. **The holder is not in `MEMORY`.** nomux shows it as a separate value. |
| `MEASURE` | How nomux counted the two values: `pss` or `rss`. |

The Session `nubgqpss` has 3 processes: the `sh` and its two children. Its 88.2 MiB are the 50 MiB and the 30 MiB of the children and the memory of the shell and the interpreters.

A Session without a process has no values and is not in the total. Here the holder of `epvdx7iy` ended with `kill -9`, as a restart of the Host would end it:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
epvdx7iy  dormant  -          -          -          -        sleep 3600
myuy5zl4  running  204.1 MiB  1          352.0 KiB  pss      python3 hog.py 200
nubgqpss  running  88.7 MiB   3          352.0 KiB  pss      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
ynz3inyu  running  785.0 KiB  1          376.0 KiB  pss      /bin/bash
total: 293.6 MiB in 5 processes of 3 sessions, and 1.0 MiB in the holders (pss)
```

The values are from the moment of the command. A second command measures again. A client that wants a live view sends the request again at its own interval. No such client exists yet.

With `--json`, each Session has a `memory` object:

```json
"memory":{"command_bytes":158720,"command_processes":1,"holder_bytes":332800,"measure":"pss"}
```

[CLI reference](/docs/reference/cli/) has the full document.

## `pss` and `rss`

| Measure | Where | Meaning |
|---|---|---|
| `pss` | Linux | Proportional set size. A page that more than one process uses is divided between them, thus a sum counts each page one time. |
| `rss` | Linux, for a process whose `pss` the kernel does not give, and macOS | Resident set size. A page that more than one process uses is in the value of each one, thus a sum can be larger than the memory in use. |

- A Session has `pss` only if nomux has it for the holder and for each process of the command. One process without it makes each value of the Session `rss`. nomux never adds the two kinds.
- On a Host where the Sessions have different measures, the total line says `pss and rss`.
- Both measures count the pages that are in memory now. They do not count the swap or the memory that the kernel uses for the processes.
- macOS has no proportional set size, thus the measure there is always `rss`. The macOS code ran its tests in CI only. It was not tried with real Sessions on a Mac, and the value is not the one that Activity Monitor shows.

## What nomux counts

The command of a Session is the only child of its holder. The process tree of the command is each process that descends from the holder. A shell that starts jobs in their own process group stays in the tree.

A process that left the tree is **not counted**: when a process ends, the operating system gives its children to process 1. A program that makes itself a daemon does this on purpose, and nomux cannot know that it came from the Session.

nomux reads the process table, and then the memory of each process, and then the identity of each process again. A process counts only if it did not change between the two reads. Thus a value is never the memory of a process of another program. The cost is a value that is too small for one request while a part of the tree ends.

## The cost

- The daemon measures only when a client asks. It has no timer and keeps no value between two requests.
- The work runs on a thread that ends 10 seconds after the request. An idle daemon uses no CPU time.
- The [performance page](/docs/reference/performance/) has the time of a request for 50 Sessions and for 200 Sessions, from the measurements of the `nomux` repository.

## A memory limit is not built

nomux 0.4.0 shows the memory. It does not limit it. The `memory_limit` key, a limit for each Session and the column of the limit are a design in [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/memory.md#design-an-optional-memory-limit-for-a-session): no code exists. The design uses control groups on Linux and gives no limit on macOS.

Issue [#38](https://github.com/nomux-sh/nomux/issues/38) is open for it. Hibernation of idle agents ([#36](https://github.com/nomux-sh/nomux/issues/36)) is also open. [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md) records the decision on the budgets of disk and memory.
