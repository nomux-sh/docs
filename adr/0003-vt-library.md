# ADR-0003: VT library

- Status: Accepted
- Date: 2026-11-25

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

The library must also let nomux do two things, or the missing part must be small:

- Write the current screen as a byte sequence that makes the same screen in a new terminal. The daemon sends this sequence to a client that attaches.
- Give the holder the OSC codes that the library does not know (OSC 7501, 133, 9 and 777).

The requirements have this priority: the license, the holder limits for size and memory, correctness for full-screen programs and agent TUIs, the two functions above, and then speed.
If two candidates are almost equal, the candidate with fewer dependencies and a pure Rust build is better.

### Candidates

| Candidate | Version | Release date | What it is |
|---|---|---|---|
| `vt100` | 0.18.1 | 2026-10-19 | A parser with screen state, built on `vte`. |
| `vt100-psmux` | 0.16.13 | 2026-10-13 | The fork of `vt100` that the psmux project keeps. |
| `alacritty_terminal` | 0.26.0 | 2026-04-06 | The terminal state crate of the Alacritty project, built on `vte`. |
| `libghostty-vt` | 0.2.2 | 2026-09-28 | The Rust binding for the VT library of the Ghostty project. It builds a Ghostty commit with Zig. |
| `vte` | 0.15.0 | 2025-02-02 | The parser only, without screen state. It is in the benchmark as a reference. |

`wezterm-term` is not in the benchmark. It is not on crates.io, and the dependency policy of the `nomux` repository permits no git source.

### Benchmark

The benchmark is in [`bench/vt-candidates`](https://github.com/nomux-sh/nomux/tree/main/bench/vt-candidates) of the `nomux` repository.
[`bench/README.md`](https://github.com/nomux-sh/nomux/blob/main/bench/README.md) shows the command and the method.
Each candidate has one probe binary. All probes share the same measurement code, thus the difference between two probes is the candidate only.
The baseline probe has no VT library.

The run that this record uses:

- Host: Linux 7.1.7 x86_64, 11th Gen Intel Core i9-11900F at 2.50 GHz
- Compiler: rustc 1.100.0. Zig 0.15.2 for `libghostty-vt`
- Target of the probes: `x86_64-unknown-linux-musl`, static, stripped, with the release profile of the `nomux` repository (`lto = "fat"`, `codegen-units = 1`, `panic = "abort"`)

The probes were measured on Linux x86_64 only. No candidate was measured on macOS or on aarch64.

**Parse throughput in MiB/s.** Each probe feeds 16 MiB to a terminal of 80 x 24 cells with 1000 lines of scrollback, in blocks of 64 KiB. The value is the median of 5 runs. Other programs ran on the machine, thus the values have a tolerance of approximately 10 %.

| Candidate | plain text | SGR color | cursor motion | Unicode | scroll flood |
|---|---|---|---|---|---|
| `vte` (parser only) | 998 | 298 | 341 | 311 | 1020 |
| `vt100` | 73 | 116 | 105 | 72 | 17 |
| `vt100-psmux` | 46 | 83 | 82 | 46 | 7 |
| `alacritty_terminal` | 168 | 162 | 154 | 126 | 155 |
| `libghostty-vt` | 536 | 58 | 129 | 213 | 113 |

**Memory of one Session.** Resident set size of the probe process in KiB with one terminal of 80 x 24 cells. The value in brackets is the difference from the baseline probe.

| Candidate | Screen only | 1000 lines of scrollback | 10000 lines of scrollback |
|---|---|---|---|
| Baseline | 308 | 320 | 300 |
| `vt100` | 428 (+120) | 3196 (+2876) | 27432 (+27132) |
| `vt100-psmux` | 556 (+248) | 4628 (+4308) | 41308 (+41008) |
| `alacritty_terminal` | 508 (+200) | 2544 (+2224) | 20840 (+20540) |
| `libghostty-vt` | 1796 (+1488) | 2300 (+1980) | 2508 (+2208) |

`libghostty-vt` kept 1001 lines in the second column and 737 lines in the third column: its scrollback limit is a number of bytes, not a number of lines.

**Binary size and build requirements.** Size of the stripped probe binary in bytes. The value in brackets is the difference from the baseline probe. The second column has the same profile with `opt-level = "z"`. "Crates" is the number of crates that the candidate adds to the binary.

| Candidate | Release profile | With `opt-level = "z"` | Crates | Build tools |
|---|---|---|---|---|
| Baseline | 414384 | 402096 | 0 | cargo |
| `vte` (parser only) | 426672 (+12288) | 414384 (+12288) | 3 | cargo |
| `vt100` | 496304 (+81920) | 467632 (+65536) | 6 | cargo |
| `vt100-psmux` | 521040 (+106656) | 480080 (+77984) | 6 | cargo |
| `alacritty_terminal` | 537264 (+122880) | 500400 (+98304) | 27 | cargo |
| `libghostty-vt` | 2048984 (+1634600) | 1459224 (+1057128) | 9 | cargo, Zig 0.15.2, git, network access |

**Conformance.** 46 cases with sequences that full-screen programs and agent TUIs send. A case passes if the screen text and the cursor position are correct.

| Candidate | Passed | Failed cases |
|---|---|---|
| `vt100` | 37 of 46 | Save and restore cursor with `CSI s` and `CSI u`, set tab stop (HTS), backward tab (CBT), index and next line (IND, NEL), autowrap off (DECAWM), insert mode (IRM), cursor position after DEC mode 1049, DEC mode 1047, the DEC line drawing character set |
| `vt100-psmux` | 37 of 46 | The cases of `vt100` without `CSI s` and `CSI u`, and repeat character (REP) |
| `alacritty_terminal` | 45 of 46 | DEC mode 1047 |
| `libghostty-vt` | 46 of 46 | None |

### Features

Each cell has the method: **T** is a test that ran (a conformance case of the benchmark, or a contract test of `nomux-term`), **S** is the source of the measured version.

| Feature | `vt100` 0.18.1 | `vt100-psmux` 0.16.13 | `alacritty_terminal` 0.26.0 | `libghostty-vt` 0.2.2 |
|---|---|---|---|---|
| True color | Yes (S: `attrs.rs`, `screen.rs`) | Yes (S: `attrs.rs`) | Yes (T: `nomux-term` test for colors) | Yes (S: `style.rs`) |
| Kitty keyboard protocol | No. The sequences go to `unhandled_csi` (S: `perform.rs`) | No (S: `perform.rs`) | Yes, if `Config::kitty_keyboard` is on (T: `nomux-term` test for modes) | Yes (S: `terminal.rs`, `key.rs`) |
| Kitty graphics | No (S) | No (S) | No (S: no APC handler) | Yes, feature `kitty-graphics` (S: `kitty/graphics.rs`) |
| Sixel | No (S) | No (S: no sixel code in `src/`) | No (S) | No API in the binding (S) |
| OSC 8 hyperlinks | No (S) | Yes (S: `perform.rs`, `screen.rs`) | Yes (S: `term/cell.rs`) | Yes (S: `screen.rs`) |
| OSC 52 clipboard | Yes, as callbacks (S: `callbacks.rs`) | Yes (S: `perform.rs`) | Yes (S: `term/mod.rs`) | Write only (S: `terminal.rs`) |
| OSC 133 prompt marks | Not handled. It goes to `unhandled_osc` (S: `perform.rs`) | Yes (S: `perform.rs`) | Not handled. `nomux-term` gives it to the caller (T: `nomux-term` test for OSC) | State for each row, no callback (S: `screen.rs`) |
| Mouse modes | Yes (S: `screen.rs`) | Yes (S: `screen.rs`) | Yes (T: `nomux-term` test for modes) | Yes (S: `mouse.rs`) |
| Bracketed paste | Yes (S: `screen.rs`) | Yes (S: `screen.rs`) | Yes (T: `nomux-term` test for modes) | Yes (S: `paste.rs`) |
| Alternate screen | DEC modes 47 and 1049 (T: 1049 passes, 1047 fails) | DEC modes 47 and 1049 (T) | DEC mode 1049 only (T: 1047 fails) | DEC modes 47, 1047 and 1049 (T) |
| Scrollback access | Yes (S: `screen.rs`) | Yes (S: `screen.rs`) | Yes (S: `grid/mod.rs`) | Yes, with a limit in bytes (T: memory measurement) |
| Screen as escape sequences | Yes: `state_formatted`, without the screen behind the alternate screen (S: `screen.rs`) | Yes (S: `screen.rs`) | No (S). `nomux-term` writes it (T: `nomux-term` tests for the redraw sequence) | Yes: `fmt::Formatter` (S: `fmt.rs`) |
| Damage for each row | No. A difference from an earlier copy of the screen (S: `screen.rs`) | No (S) | Yes: `Term::damage` (S: `term/mod.rs`) | Yes (S: `render.rs`) |
| Hook for unknown OSC codes | Yes: `Callbacks::unhandled_osc` (S: `callbacks.rs`) | Yes (S: `callbacks.rs`) | No. The parser writes a log line (S: `vte` `ansi.rs`). `nomux-term` finds the sequences (T: `nomux-term` tests for OSC) | No (S: `terminal.rs`) |
| License of the measured version | MIT | MIT | Apache-2.0 | MIT OR Apache-2.0 for the binding, MIT for Ghostty |
| Last release | 2026-10-19 | 2026-10-13 | 2026-04-06 | 2026-09-28 |

`cargo deny check` with the policy of the `nomux` repository passes for the benchmark workspace: the license of each candidate and of each of its dependencies is on the permitted list, and no dependency has a security advisory.

## Decision

nomux uses `alacritty_terminal` 0.26.0. The library is behind the `nomux-term` crate, and no other nomux crate uses it directly.

The reasons, in the sequence of the requirements:

1. **License.** Apache-2.0 is on the permitted list.
2. **Holder limits.** The library adds 122,880 bytes to a static musl binary and uses 508 KiB for a Session without scrollback. `libghostty-vt` adds 1,634,600 bytes with the release profile and 1,057,128 bytes with `opt-level = "z"`: the library alone is larger than the limit of 1 MB for the holder binary. It also uses 1.8 MB of the 3 MB memory limit for an empty Session.
3. **Correctness.** `alacritty_terminal` passes 45 of 46 conformance cases. `vt100` and `vt100-psmux` fail 9 cases. Full-screen programs use the DEC line drawing character set, insert mode, autowrap off and tab stops, thus the screen state of these two candidates can be wrong for an ncurses program.
4. **Redraw and OSC codes.** `alacritty_terminal` has neither function. The two missing parts are small and are in `nomux-term`: a module that writes the redraw sequence from the screen state, and a scanner that finds the OSC sequences.
5. **Speed.** `alacritty_terminal` has 126 to 168 MiB/s on all corpora. It is the fastest candidate on three of the five corpora and has no slow case.

`nomux-term` has this interface: make a terminal with a size, feed bytes, resize, read the visible screen (cells with attributes, the cursor and the modes), write the redraw sequence, and receive the OSC codes that the library does not handle.
The types of the library are not in the interface.

Measured for `nomux-term` with the same benchmark:

| Measurement | Value |
|---|---|
| Size that `nomux-term` adds to a stripped static musl binary | 118,784 bytes (94,208 bytes with `opt-level = "z"`) |
| Memory of one Session of 80 x 24 cells | 580 KiB resident, 272 KiB more than the baseline probe |
| Parse throughput | 124 to 179 MiB/s |
| Cost of the OSC scanner | 0 to 15 % of the throughput of the library. The largest cost is on output with many escape sequences |
| Conformance | 45 of 46 cases, the same as the library |

The `nomux-holder` binary of the day of this record is 500,336 bytes on `x86_64-unknown-linux-musl` without `nomux-term`. With `nomux-term` it stays below the limit of 1 MB.

## Consequences

- The holder keeps no scrollback in the VT state. 1000 lines of scrollback use 2.2 MB in the library, which is most of the memory limit. The scrollback is on disk (see [ADR-0001](0001-session-holder-model.md)).
- `nomux-term` owns the redraw sequence. It makes the visible cells with their attributes, the cursor, the modes, the flags of the kitty keyboard protocol and the style of the next character. If the alternate screen is visible, it also makes the screen behind it.
- The redraw sequence does not make the scroll region, the tab stops, the saved cursor and the character sets, because the library has no public read access to them. It also does not make the OSC 8 hyperlinks, the changed palette colors and the marks of wrapped lines.
- `nomux-term` owns the OSC scanner. The scanner uses the rules of the parser of the library for the start and the end of an OSC sequence. It ignores a sequence that is longer than 4096 bytes.
- `nomux-term` turns off the synchronized updates (DEC mode 2026) of the parser. During a synchronized update the parser keeps the output in a buffer, and a redraw sequence from that moment does not have these bytes.
- The library has no kitty graphics and no sixel, and nomux must support the two. `nomux-term` keeps the library replaceable. The decision is examined again when the work on images starts.
- The library brings 27 crates. Some are for functions that nomux does not use (its PTY and its event loop). The linker removes this code from the binary, but the crates are in the build and in the dependency audit.
- The license of the library is Apache-2.0 only, not `MIT OR Apache-2.0`. The third-party notices of a release must have its license text.
- The VT parser gets fuzz tests and golden snapshot tests. The OSC scanner and the redraw sequence are the first targets.
- `libghostty-vt` stays the candidate with the most features. Its numbers in this record are the reason that nomux does not use it now: binary size, memory, and a build that needs Zig, git and network access.

## Alternatives considered

- **`libghostty-vt` 0.2.2.** It passes all conformance cases and has the kitty keyboard protocol, kitty graphics, hyperlinks and a function that writes the screen as escape sequences. We did not select it because it does not agree with the limit for the holder binary (see the decision), because its build needs Zig 0.15.2, git and network access, and because version 0.2.2 has no hook for unknown OSC codes. To select it, the project must increase the limit of the holder binary to approximately 2 MB.
- **`vt100` 0.18.1.** It is the smallest candidate with screen state (81,920 bytes, 6 crates) and has the redraw function and the OSC hook. We did not select it because of the 9 conformance failures and because the scroll flood corpus runs at 17 MiB/s.
- **`vt100-psmux` 0.16.13.** It adds OSC 8 and OSC 133 to `vt100`. We did not select it because it has the same conformance failures, is slower than `vt100` on each corpus and uses more memory.
- **`vte` with a screen state that nomux writes.** `vte` adds 12,288 bytes. We did not select it because a grid with wide characters, an alternate screen, scroll regions and character sets is a large quantity of work that the candidates already did.
- **`wezterm-term`.** We did not measure it. It is not on crates.io.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- DEC mode 1047 is not handled. `nomux-term` does not add it. Do we report it to the Alacritty project, or does `nomux-term` change the sequence before the library gets it? Programs that use the `xterm` terminal description use mode 1049. Owner: stage M1.
- The parser of the library keeps an OSC sequence in a buffer without a limit. A program that never ends an OSC sequence can use more memory than the limit of the holder. Does the holder set a limit before the parser, or do we report it to the `vte` project? Owner: stage M1.
- The library has no public read access to the scroll region, the tab stops, the saved cursor and the character sets. Do we ask the Alacritty project for it, or does `nomux-term` follow these values itself? Owner: the attach work in stage M1.
- A redraw sequence that is made in the middle of an escape sequence is followed by the rest of that escape sequence. Where does the daemon cut the byte stream for a client that attaches? Owner: the attach work in stage M1.
- The library can answer terminal queries (for example the cursor position report). Which component answers a query when no client is connected? Owner: stage M1.
- When does the work on kitty graphics and sixel start, and does the limit of the holder binary change then? Owner: stage M5.
- Does the mobile client core use the same library for its VT state? Owner: stage M9.
