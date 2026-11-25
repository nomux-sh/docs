# ADR-0002: Protocol: protobuf and binary frames

- Status: Accepted
- Date: 2026-11-25

## Context

nomux has one protocol and many clients: the desktop application, the CLI and the mobile applications.
The protocol runs over SSH and over QUIC.

The protocol carries two kinds of traffic with different needs:

- **Control traffic.** Requests and replies for Hosts, Projects, Worktrees, Sessions, Agent runs, Teams, Tasks, events and extensions. This traffic needs a schema with versions and must be usable from more than one programming language.
- **Terminal data.** Output and input bytes of a Session. This traffic is on the hot path. It must move without a copy and must not wait for other traffic.

Other limits apply:

- Old and new versions of the client and the daemon run together for some time, for example during an update of a remote Host.
- A terminal with much output must not slow down other terminals or the input of the user.
- A client that connects again must get only the missing data.

## Decision

**Control messages are protobuf.**
The implementation uses `prost`, and `buf` manages the schema. The schema has versions.
Each request is a numbered frame. The reply has the same number.
The daemon also pushes event frames that no request asked for.
The control services are `Handshake`, `Host`, `Project`, `Worktree`, `Session`, `Agent`, `Team`, `Task`, `Events` and `Ext`. Extensions send their own calls through `Ext`.

**Terminal data uses binary frames with a fixed header.**
The frames are not protobuf. The header contains the Session, the epoch, the sequence number, the type and the length.
The format is specific to nomux and is read without a copy (`zerocopy`).
The frame types are `Output`, `ScreenSnapshot`, `ScreenDiff`, `Ack`, `Credit` and `Input`.
The daemon pushes output without a request. After a client connects again, the daemon sends only the missing part.

**The handshake carries capabilities.**
The client sends `Hello` with `version`, `oldest`, `capabilities`, `client_kind` and `token`.
The daemon replies with `Welcome` with `version`, `oldest`, `capabilities` and `host_id`.
`version` is an integer protocol version. `oldest` is the oldest version that the sender supports.
The capabilities are flags, for example `waits` and `pane_state_events`.

**Flow control uses credit windows.**
Each channel has its own credit window. Interactive channels use a small packet size.
On QUIC, the built-in flow control of each stream does this work.

**Channels are separate.**
Control, input, terminal data, bulk data and port forwarding use separate channels on SSH and separate streams on QUIC.

**The holder protocol is separate.**
The protocol between the holder and the daemon has its own version and the strictest version rule. See [ADR-0001](0001-session-holder-model.md).

## Consequences

- The control schema is independent of a programming language. The mobile clients and the extensions can use it.
- There are two encodings to keep and to test. The frame codec needs unit tests and fuzz tests.
- Terminal data does not pay the cost of protobuf encoding on the hot path.
- A feature can be added behind a capability flag. A peer that does not know the flag continues to work.
- The daemon supports the clients of the last two minor versions. An older client gets the error code `5` (version not compatible) with a clear message.
- One terminal with much output cannot take the capacity of the other channels. Bulk traffic cannot slow down input.
- Other repositories depend on the protocol through published versions of the `proto` repository.

## Alternatives considered

**One version number without capability flags.**
The handshake compares one number.
We did not select it because capability flags are more flexible: two peers can agree on each feature separately.

**Terminal data as protobuf messages.**
One encoding for all traffic is simpler.
We did not select it because terminal data must move without a copy, and a fixed header lets the receiver read a frame in place.

**One connection for each request, and snapshots only.**
One reference project uses this model.
We did not select it. nomux pushes output on a connection that stays open and sends only the missing part after a reconnect.

**Channels without types.**
One reference project that supplies the credit window idea uses channels without types.
We took the credit windows and did not take the channels without types. Each nomux channel has one purpose.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- The exact layout of the frame header (field order and field sizes) is not set. Owner: the `proto` repository, stage M1.
- The full list of capability flags is not set. Only `waits` and `pane_state_events` are named. Owner: the `proto` repository.
- The sizes of the credit windows and the packet size for interactive channels are not set. Owner: stages M1 and M2, from measurement.
- The condition that starts zstd compression on a link with low bandwidth is not set. Owner: stage M2.
- The format of the event log and of the snapshot and delta synchronization for mobile clients is not set. Owner: stage M9.
