# ADR-0009: Resource budgets for disk and memory

- Status: Accepted
- Date: 2026-11-25

## Context

The terminal layer of nomux is light. A holder and the daemon each use less than 3 MB of memory.
The tools that run in the Sessions are not light. Two measurements on one development machine show the cost:

- 36 open agent Sessions used 7 GB of memory, approximately 500 MB for each visible Session. Most of these Sessions were idle.
- Seven Worktrees of a Rust project used 15 GB of build output, 2 to 4 GB for each Worktree. The disk of the machine became full. Nothing removed a Worktree after its pull request was merged.

Three more facts apply:

- An agent tool that is open and idle keeps its memory. nomux cannot change the memory use of a tool that it does not own.
- The source of a Worktree is small. The build output is the cost, and each Worktree makes its own build output.
- When memory is low, the user cannot see which Session uses it. One agent that grows without limit can make the full Host unusable.

A Task gets a Worktree and an agent Session. Thus the number of agent processes and the number of Worktrees grow with the number of Tasks.
A principle of the project puts low weight and speed before each feature. A product that is light itself and fills the memory and the disk of the Host through its normal use does not obey this principle.

## Decision

nomux manages the memory and the disk that its Sessions and its Worktrees use. The decision has two parts and three principles.

### Principles

These principles decide a case that the rules below do not name.

1. **What can be made again goes first.** nomux removes build output before source, and it stops an idle agent that can resume before one that cannot.
2. **Nothing that the user sees is lost.** A stop or a removal does not lose the screen of a Session, the conversation of an agent, or work that is not committed or not pushed.
3. **No sampling when no client asks.** nomux measures memory and disk use only while a client asks for the values. The idle CPU use of the daemon stays at zero.

### Memory

nomux does not make an agent smaller. It does not run what does not need to run.

- **Restore on demand.** After a restart of the Host, the Sessions come back as metadata only. No process starts. A Session starts when the user opens its Tab for the first time, and an agent continues with its resume command. Each Session has a restore policy: `auto`, `on-focus` (the default) or `manual`.
- **Hibernation.** To hibernate an agent is to stop its process and to show a placeholder in the place of its Session. nomux hibernates an agent only if it is not on screen, is idle and can resume. Two triggers start a hibernation:
  - **Count.** More agents are live than `agents.max_live` (default 12), and an agent did not change for `agents.hibernate_after` (default 60 s). The agents that are idle for the longest time stop first.
  - **Memory pressure.** The free memory of the Host is below a threshold. The agent that is idle for the longest time stops first. This trigger needs no fixed count, thus it applies to a small Host and to a large Host.
- **Limits of hibernation.** nomux never hibernates an agent that works, that waits for the user or that has input that is not sent. The user can exclude a Session.
- **A Task that is done.** An agent that reported its Task as done is a candidate at once. It does not wait for `agents.hibernate_after`.
- **Resume.** When the user opens a hibernated Session, nomux starts the agent again with its saved resume command. The resume command keeps the model, the sandbox and the configuration flags of the Agent run. It does not keep prompts or secrets. The agent continues in the same conversation.
- **Visible memory.** The daemon reports the resident memory of the process tree of each Session. `nomux ls` and `nomux status` show it with `--memory`. `nomux status` shows which Sessions are hibernated and why.
- **Optional limit.** A Session can have a memory limit where the operating system gives one. On Linux, the holder starts the command of the Session in its own cgroup with the limit from the configuration. A Session that reaches its limit does not stop the other Sessions.

### Disk

The life of a Worktree is a part of the product.

- **Archive on completion.** When the Task of a Worktree is done (its pull request is merged, or the user marks it as done), nomux removes the directory of the Worktree and keeps the branch. This is on by default. A setting for each Project and for each Task changes it.
- **Shared build output.** The `[worktrees]` table in `nomux.toml` gives environment variables to each Session of a Worktree. Examples are a shared `CARGO_TARGET_DIR`, an `sccache` directory and a package store. Thus the Worktrees of one Project do not each build from zero.
- **Disk budget.** nomux shows the size of each Worktree. A Project can have a limit. When the Worktrees of the Project use more than the limit, nomux removes the build output of the oldest finished Worktrees first.
- **Dormant Worktrees.** For a Worktree with no activity for a set time, nomux removes the build output and keeps the source.
- **`nomux worktree gc`.** The command does the same steps by hand. With `--dry-run`, it lists what it would remove and the number of bytes that the removal frees.
- **The limit of each rule.** No rule and no command removes work that is not committed or not pushed. If a Worktree has such work, nomux does not remove it and reports it.

## Consequences

- The number of open Tasks no longer sets the memory use of the Host. The number of agents that work at the same time sets it.
- A restart of the Host does not start each agent at the same time. This saves CPU time, memory and the rate limits and the cost of the providers.
- Hibernation needs the status of an Agent run: nomux must know that an agent is idle, works or waits for the user. [ADR-0007](0007-status-source-order.md) gives the sources of the status. A status from a fallback source is an estimate, thus the rules must say which sources are sufficient to stop a process.
- Hibernation needs a resume command for each agent tool. An agent that cannot resume is never hibernated.
- The placeholder shows what the holder and the daemon keep. Today the holder keeps the current screen and the program reports of its Session. The journal and the scrollback on disk are in progress ([nomux issue 9](https://github.com/nomux-sh/nomux/issues/9)). Until that work is complete, a hibernated Session cannot show its scrollback.
- The first input after a resume is slower than input to a live agent, because the process must start.
- The memory limit is not the same on each operating system. The documentation must say what each operating system gives.
- The daemon needs the data model of Worktrees and Tasks to know that a Task is done. It also needs the state of the pull request or a mark from the user.
- nomux removes directories. Each removal path needs a test that proves that work that is not committed or not pushed stays. `--dry-run` must report the same items that the real command removes.
- A shared build directory can make two builds wait for one lock. The Project selects this setting. nomux does not set it by default.
- The work items are [nomux issue 36](https://github.com/nomux-sh/nomux/issues/36) (hibernation), [nomux issue 38](https://github.com/nomux-sh/nomux/issues/38) (memory of each Session), [nomux issue 37](https://github.com/nomux-sh/nomux/issues/37) (Worktree lifecycle) and [nomux issue 12](https://github.com/nomux-sh/nomux/issues/12) (restore on demand).

## Alternatives considered

**Leave it to the user.**
nomux starts Sessions and Worktrees, and the user closes agents and removes directories by hand.
We did not select it. The two measurements in the context are the result of this approach: the memory and the disk filled during normal work. nomux makes the Sessions and the Worktrees, thus nomux knows when one is idle or finished.

**Limits only.**
Each Session gets a memory limit and each Project gets a disk limit, with no hibernation and no Worktree lifecycle.
We did not select it as the full answer. A limit stops the growth of one Session. It does not release the memory of 36 idle agents that are each below the limit. A limit that the operating system applies stops a process without a resume, and it is not available on each operating system. The limit stays in the decision as an option.

**A container for each Session.**
Each Session runs in a container with its own memory and disk limits.
We did not select it. A container does not make an agent smaller and does not remove the build output of a finished Worktree. It adds a runtime to each Host, and it adds weight and start time to each Session. The targets for a holder (less than 3 MB) and for a new Session (less than 10 ms) do not permit that.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- Which thresholds apply? The value of the free memory that starts a hibernation, the default disk limit of a Project and the time after which a Worktree is dormant are not set. Measurements must give them. Owner: stage M1 for memory ([nomux issue 36](https://github.com/nomux-sh/nomux/issues/36)), and [nomux issue 37](https://github.com/nomux-sh/nomux/issues/37) for disk.
- What does the memory limit do on macOS? macOS has no cgroups. The work must find what macOS permits and do only that. Owner: stage M1 ([nomux issue 38](https://github.com/nomux-sh/nomux/issues/38)).
- How is the resume command validated? nomux must know that a saved resume command starts the same conversation before it stops the agent, and it must not keep a prompt or a secret in the command. The checks are not defined. Owner: stage M1 ([nomux issue 36](https://github.com/nomux-sh/nomux/issues/36)).
- Which key of the `[worktrees]` table holds the environment variables? The name and the form are not set. Owner: [nomux issue 37](https://github.com/nomux-sh/nomux/issues/37).
