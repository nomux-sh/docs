# ADR-0003: VT library

- Status: Proposed
- Date: 2026-11-25

The decision is pending. The benchmark in milestone M1 gives the numbers for the decision.
This record lists the candidates and the criteria. It does not select a candidate.

## Context

The holder of each Session reads the PTY and keeps the terminal state (see [ADR-0001](0001-session-holder-model.md)).
The holder needs a VT library to parse the output and to hold the screen state.
The screen state is the source for the journal, the checkpoints and the screen that a client gets when it connects again.

The library must agree with these limits:

- **Correctness.** nomux must support true color, the kitty keyboard protocol, OSC 7, 8, 52, 133, 9, 99, 777 and 7501, kitty graphics, sixel, bracketed paste and the mouse modes.
- **Memory.** A holder must use less than 3 MB of memory for each Session.
- **Binary size.** The `nomux-holder` binary must be smaller than 1 MB.
- **Speed.** With an output flood of 10 MB/s, the UI must stay at 60 frames per second or more and the input delay must not change.
- **No async runtime.** The holder has no async runtime.
- **License.** The license of the library must be on the permitted list in [ADR-0006](0006-licensing.md).

## Decision

No decision is made.

The candidates are:

| Candidate | What it is |
|---|---|
| `alacritty_terminal` | The terminal state crate of the Alacritty project. |
| `libghostty-vt` | The Rust crate for the VT library of the Ghostty project. |
| The vt100 fork of psmux | The fork of the `vt100` crate that the psmux project keeps. |

The benchmark compares the candidates on three criteria:

| Criterion | What we measure |
|---|---|
| Speed | Throughput of the parser and the screen state with terminal benchmark input and with output floods. |
| Memory | Memory of the terminal state for each Session, against the holder target of less than 3 MB. |
| Correctness | Results of terminal conformance tests and of scenarios with real TUI programs. |

The numbers decide. The benchmark is the first work item of milestone M1 (week 1).
When the benchmark is complete, this record gets the results, the selected candidate and the status `Accepted`.

## Consequences

- Work on the holder that depends on the screen state cannot go past week 1 of milestone M1 without this decision.
- The VT parser gets fuzz tests and golden snapshot tests, whichever candidate we select.
- If the selected candidate does not support a required feature, nomux must add the feature or send it upstream.

## Alternatives considered

The three candidates are the alternatives. The benchmark compares them.
No other alternative is recorded.

## Open questions

- Which candidate does nomux use? Owner: milestone M1, week 1.
- Which tools and inputs does the benchmark use for each criterion? The planned measurement tools include `vtebench` for speed, `heaptrack` or `dhat` for memory, and `vttest` and `esctest` for correctness. The final list is not set. Owner: milestone M1.
- Is the license of each candidate, in the version that we measure, on the permitted list? Owner: the benchmark work in milestone M1.
- Does each candidate support kitty graphics and sixel, or must nomux add them? Owner: the benchmark work in milestone M1.
- Does the mobile client core use the same library for its VT state? Owner: milestone M9.
