# ADR-0007: Status source order

- Status: Accepted
- Date: 2026-11-25

## Context

nomux shows the status of each Agent run and of each Child work.
The status can come from more than one source, and the sources do not always agree.
Agent tools are different: some have hooks, some speak the Agent Client Protocol (ACP), some send the OSC 7501 terminal sequence, and some have none of these.

A principle of the project is honesty: nomux does not show an estimated value as a certain value.
The user must be able to ask where a status comes from.

The support of the agent tools for hooks, ACP and OSC 7501 changes with time. A status that depends on one source only is thus a risk.

## Decision

One resolver merges the status sources in this order. A source that is higher in the list has priority.

1. **Adapter events.** Hooks of the agent tool and ACP `session/update` notifications. Extensions supply the adapters.
2. **OSC 7501.** The Program Status Protocol sequence `OSC 7501 ; key=value:key=value ST`. The holder parses it.
3. **Self-report.** The command `nomux status set`, or the socket that the Session gets. Any script can use it.
4. **Fallbacks.** The foreground process (the holder knows the process identifier and the tty of the child), marks in the OSC title, and screen manifests that are kept as data.

**Each status carries its source.**
The resolver stores the source with each status. An estimated status is never shown as a certain status.

**`agent explain`.**
The command `nomux agent explain <session>` prints why a Session shows its status, with the sources.

**OSC 7501 is a first-class source.**
For tools that support it, OSC 7501 is almost as strong as hooks and needs no code that is specific to a vendor.
Hooks add data that OSC 7501 does not carry: the inventory of Child work, the tool name and the detail of an approval.

**OSC 7501 in the holder.**

- The keys are `state` (`idle`, `working`, `done`, `blocked`, `error`, `clear`), `id` (a path with slashes identifies a child record), `app`, `kind` (`permission`, `question`, `auth`; only with `blocked`), `progress` (0 to 100), and `title` and `msg` (base64).
- A tool sends the status only if the terminal answers the query `OSC 7501 ; ?`. The holder answers this query.
- Because the holder parses the sequence, the status is not lost when the daemon stops. After the daemon connects again, the holder replays the status.
- Protection against a false status: a record is valid only if the foreground program of the Pane agrees with the `app` name.

## Consequences

- A status is correct for the largest number of tools: a tool that has no adapter can still report through OSC 7501, a self-report or a fallback.
- The data model keeps a source field for each status. The `agent_runs` table has a `status_source` column.
- The UI and the CLI can show the source. Attention signals are for the UI only and are not used for usage or cost calculation.
- The core has no code for one vendor. The adapters for each tool are extensions.
- If a tool changes its hooks or its OSC 7501 support, the lower sources still give a status. Each tool needs its own test.
- The resolver needs rules for conflicts between sources, for example a late hook event after a stop event.

## Alternatives considered

**One source only: vendor hooks.**
We did not select it. Not all tools have hooks, and it puts vendor logic at the center of the status engine.

**Estimates from the screen only.**
Some reference tools read the screen content at intervals to estimate the status.
We did not select it as a main source. It is slow and it is an estimate. Screen manifests stay as the last fallback, and the status then carries that source.

**A status without a source.**
We did not select it. It does not agree with the honesty principle, and the user cannot find the cause of a wrong status.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- OSC 7501 support is verified for Claude Code, Codex and Qwen Code. Gemini CLI does not have it. OpenCode and Goose are not examined. Owner: stage M4.
- OSC 7501 is a proposal (specification revision 0.4). The keys can change. Owner: stage M4, with a test for each tool.
- Claude Code and Codex also send OSC 21337 (tab status) in one terminal. The holder can read it. It is not decided if the holder reads it and where it is in the order. Owner: stage M4.
- The full rules for conflicts between sources in one tool are not part of this record. The rules for each tool belong to its adapter extension. Owner: stage M4.
