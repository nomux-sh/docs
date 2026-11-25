# ADR-0001: Session holder model

- Status: Accepted
- Date: 2026-11-25

## Context

The basic promise of nomux is that a Session lives on the Host.
The terminal and the agent must continue to run in these conditions:

- The client disconnects or the laptop closes.
- The daemon `nomuxd` stops because of a failure, an update or `kill -9`.

This must be true for a local Host and for a remote Host.

Other limits apply:

- A holder must use less than 3 MB of memory for each Session. The holder binary must be smaller than 1 MB.
- A client that connects again must get only the data that it does not have.
- During a daemon update, the old daemon and the new daemon must not write to the same Session at the same time.
- After the daemon starts again, it must find the Sessions that are alive. It must not treat a process identifier that the system used again as a live Session.

## Decision

A separate, very small process, `nomux-holder`, keeps the PTY of each Session. One holder keeps one Session.

**Process.**
The holder is a separate binary. It has no async runtime. It uses `rustix` for `openpty` and `poll`.

**Reading.**
The holder always reads the PTY. It sends the data to three places:

- the VT parser,
- the parser for the OSC 7501, OSC 133, OSC 9 and OSC 777 sequences,
- a ring buffer of fixed size that the holder shares through `memfd`. The daemon reads the buffer through `mmap` without a copy.

**Journal, checkpoint and epoch.**
The holder writes screen changes to an ordered journal. At intervals, it writes a checkpoint.
Each Session has an epoch and a sequence number.
A client that connects again sends "epoch E, last sequence N". The holder side sends the missing part from the journal.

**Single-writer lease.**
Only one daemon at a time can write to a holder. During a daemon update, the new daemon takes the lease and the old daemon exits.

**Scrollback.**
The holder compresses long scrollback as raw bytes with zstd and writes it to disk.

**Discovery files.**
Each holder has a directory `~/.nomux/run/<id>/` with these files:

- `pid`: the process identifier and the creation time of the process. The creation time prevents a false match with a process identifier that the system used again.
- `sock`: the socket of the holder.
- `ready`: the holder writes this file last.

When `nomuxd` starts, it finds the holders through these files and connects to them again.

**State.**
`nomuxd` owns the state. Each holder keeps the smallest copy of the state of its own Session. When the daemon connects again, it reads the state from the holder.

**Warm pool.**
Some holders with a started shell wait in a pool. A new Session takes a holder from the pool.

**Input line state.**
The holder knows the state of the input line from the OSC 133 B and C marks. The delivery of Team messages uses this state.

## Consequences

- A Session continues when the client disconnects and when the daemon stops or updates. This is true for a local Host and for a remote Host.
- A running holder is never replaced. A new holder version is used only for new Sessions. Thus the protocol between the holder and the daemon has the strictest version rule: the daemon supports all holder versions in the same major version.
- There is one process for each Session. The memory target for each holder (less than 3 MB) limits what the holder can contain.
- The holder has no async runtime. Code in the holder cannot use libraries that need one.
- The OSC 7501 status is parsed in the holder. Thus the status is not lost when the daemon stops.
- Terminal data does not pass through the owner of the state.
- The daemon needs a discovery step and a lease step at each start.

## Alternatives considered

**All PTYs in the daemon.**
One daemon process keeps all PTYs. Some reference projects use this model.
We did not select it because a daemon failure or a daemon update then stops all Sessions.

**A holder for remote Sessions only.**
One reference project uses a keeper process for each Session on SSH only. Its local Sessions stop with the application.
We did not select it because the promise applies to each Session, local Sessions included.

**A dependency on tmux.**
tmux keeps the Sessions and nomux controls tmux.
We did not select it. A dependency on tmux is a thing that nomux does not take from the reference projects, and compatibility with the tmux commands is not a goal.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- The interval between checkpoints and the size of the ring buffer are not set. Owner: stage M1.
- The size of the warm pool has a default of 2 to 3 holders. The final value comes from measurement. Owner: stage M1.
- The `rmux-pty`, `rmux-ipc` and `rmux-proto` crates are under review for reuse in the holder and the daemon. The result is not known. Owner: the preparation work before stage M1.
- The VT library that the holder uses is not selected. See [ADR-0003](0003-vt-library.md).
