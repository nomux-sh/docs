---
title: Memory of Sessions
description: See how much memory the processes of each Session use with nomux ls --memory, what the numbers count, what nomux does not measure, and where the memory limit is.
---

`nomux ls --memory` shows the memory that the processes of each Session use now. When memory runs low, you see which Session uses it.

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the run is shown as `/home/user`.
The commands of the four Sessions were `python3 hog.py 200` (a program that allocates 200 MiB), a `sh` that starts two such programs (50 MiB and 30 MiB), `sleep 3600` and the shell of the user.

## Show the memory

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
2e4zs63j  running  141.0 KiB  1          337.0 KiB  pss      -      -      sleep 3600
3qbpriwd  running  738.0 KiB  1          350.0 KiB  pss      -      -      /bin/bash
mh47dxf4  running  88.4 MiB   3          337.0 KiB  pss      -      -      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
pdo3uuvt  running  204.0 MiB  1          336.0 KiB  pss      -      -      python3 hog.py 200
total: 293.3 MiB in 6 processes of 4 sessions, and 1.3 MiB in the holders (pss)
```

| Column | Meaning |
|---|---|
| `MEMORY` | The memory of the process tree of the command: the command and each process that descends from it. |
| `PROCESSES` | The number of processes in that tree. |
| `HOLDER` | The memory of the holder of the Session. **The holder is not in `MEMORY`.** nomux shows it as a separate value. |
| `MEASURE` | How nomux counted the two values: `pss` or `rss`. |
| `LIMIT` | The [memory limit](/docs/guides/hibernation/#the-memory-limit) that the operating system applies to the processes of the command. `-` if none applies. |
| `FREED` | For a [hibernated Session](/docs/guides/hibernation/): the memory that its hibernation gave back. `-` for each other Session. |

The Session `mh47dxf4` has 3 processes: the `sh` and its two children. Its 88.4 MiB are the 50 MiB and the 30 MiB of the children and the memory of the shell and the interpreters.

A Session without a process has no values and is not in the total. Here the holder of `2e4zs63j` ended with `kill -9`, as a restart of the Host would end it:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
2e4zs63j  dormant  -          -          -          -        -      -      sleep 3600
3qbpriwd  running  742.0 KiB  1          376.0 KiB  pss      -      -      /bin/bash
mh47dxf4  running  88.4 MiB   3          358.0 KiB  pss      -      -      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
pdo3uuvt  running  204.0 MiB  1          362.0 KiB  pss      -      -      python3 hog.py 200
total: 293.2 MiB in 5 processes of 3 sessions, and 1.0 MiB in the holders (pss)
```

A [hibernated Session](/docs/guides/hibernation/) is also a Session without a process. It has `-` in the first five columns and its freed memory in `FREED`. The last lines of the output then have the sum:

```console
$ nomux ls --memory
ID        STATE       MEMORY  PROCESSES  HOLDER  MEASURE  LIMIT  FREED      COMMAND
57anosge  hibernated  -       -          -       -        -      159.5 MiB  claude
total: no session has a process
hibernated: 159.5 MiB given back by 1 session
```

(This run is from the [hibernation guide](/docs/guides/hibernation/): the Session ran a stand-in for an agent tool.)

The values are from the moment of the command. A second command measures again. A client that wants a live view sends the request again at its own interval. No such client exists yet.

With `--json`, each Session has a `memory` object. It is `null` for a Session without a process. The value of `limit_bytes` is `null` if no limit applies:

```json
"memory":{"command_bytes":144384,"command_processes":1,"holder_bytes":345088,"measure":"pss","limit_bytes":null}
```

On a narrow terminal, the table leaves out columns, so that each row fits. It leaves out `MEASURE` first, then `LIMIT`, `FREED`, `PROCESSES` and `HOLDER`. The total line names the measure, and the last line has the sum of `FREED`. A terminal of 60 columns showed this (a pseudo-terminal of that width ran the command):

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     COMMAND
3gb2lalj  running  204.9 MiB  1          388.0 KiB  python3…
4oxnfuld  running  158.0 KiB  1          376.0 KiB  sleep 3…
total: 205.0 MiB in 2 processes of 2 sessions, and 764.0 KiB
in the holders (pss)
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

## The memory limit

`sessions.memory_limit` in the configuration file limits the memory of a Session. On Linux with a systemd user manager, the kernel applies it: it ends the processes of a Session that reaches the limit, and `ls --memory` shows the limit in the column `LIMIT`. On macOS, and on Linux without the user manager, the limit is only a threshold for the [hibernation](/docs/guides/hibernation/) of idle agent Sessions, and `LIMIT` shows `-`.

`nomux daemon status` has a line that says which of the two cases applies to your Host:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4034392, 3 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

The limit counts memory that `ls --memory` does not count (the memory of the kernel for the processes and the page cache), so a Session can reach its limit while the table shows less. The guide [Hibernation and the memory limit](/docs/guides/hibernation/) has the settings, the differences of the platforms, the triggers of the hibernation and the real output of a Session that the kernel ended.

[ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md) records the decision on the budgets of disk and memory.
