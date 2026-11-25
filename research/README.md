# Research notes

This directory contains the research notes of the nomux project.
The notes record what we learned from other projects and from specifications, and where each idea in nomux comes from.

## What belongs here

- A note about one reference project: what it is, what nomux takes from it, and what nomux does not take.
- A note about a specification or a protocol that nomux uses, for example OSC 7501 or the Agent Client Protocol.
- The results of a comparison or a benchmark that an architecture decision record (ADR) uses.
- Paths to the important files of a reference project, so that a reader can find the source.

## What does not belong here

- Text, code or images that are copied from a third-party project. Write a summary in your own words and give a link.
- Decisions. A decision goes into an ADR in [`adr/`](../adr/README.md). A research note can be the evidence for an ADR.
- User documentation. It goes into the site content in `src/content/docs/`.

## Rules

- Write one note for one subject. Use a file name in lowercase with hyphens, for example `kmux.md`.
- Give the date of the review and the version or commit that you examined. Projects change.
- Before you copy code from a reference project, find its license class in the index below. The rules are in [ADR-0006](../adr/0006-licensing.md).
- Use the terms from the [glossary](../src/content/docs/reference/glossary.md).
- Notes are written in English.

## License classes

| Class | Meaning |
|---|---|
| Code reusable | The license permits code reuse in nomux. Obey the conditions of the license, for example a NOTICE file. |
| Conditional | Code reuse is possible only with a condition. Read the note in the index. |
| Ideas only | Do not copy code. You can read the project to learn and you can use its ideas. |

## Index of reference projects

A project gets a "Note" link when its note is written. No notes are written at this time.
The license column gives the license as recorded in the review of 2026-11-25. Examine the license file of the project again before you use its code.

| Project | Class | License | URL |
|---|---|---|---|
| rmux | Code reusable | MIT / Apache | <https://github.com/helvesec/rmux> |
| omux | Code reusable | MIT | <https://github.com/onurozcan/omux> |
| lmux | Code reusable | MIT | <https://github.com/sooftware/lmux> |
| kmux | Code reusable | MIT | <https://github.com/kkd927/kmux> |
| psmux | Code reusable | MIT | <https://github.com/psmux/psmux> |
| xmux | Code reusable | MIT | <https://github.com/zer0ken/xmux> |
| qmux | Code reusable | MIT | <https://github.com/progrium/qmux> |
| emux | Code reusable | MIT | <https://github.com/IISweetHeartII/emux> |
| gmux | Code reusable | MIT (according to its README) | <https://github.com/davinche/gmux> |
| Orca | Code reusable | MIT | <https://github.com/stablyai/orca> |
| OpenChamber | Code reusable | MIT | <https://github.com/openchamber/openchamber> |
| tmux-ide | Code reusable | MIT | <https://github.com/wavyrai/tmux-ide> |
| sheprd (earlier name: herdr-gpui) | Code reusable | Apache-2.0 | <https://github.com/penso/sheprd> |
| tmux-claude-status | Code reusable | Apache-2.0 (with its NOTICE) | <https://github.com/farnots/tmux-claude-status> |
| tmux-mem-cpu-load | Code reusable | Apache-2.0 | Not recorded |
| tmux-sidebar | Code reusable | MIT | Not recorded |
| tmux-simple-git-status | Code reusable | MIT | Not recorded |
| tmux-notify | Code reusable | MIT | Not recorded |
| tmux-code-time | Code reusable | MIT | Not recorded |
| tmux-network-bandwidth | Code reusable | MIT | Not recorded |
| tmux-lazy-restore | Code reusable | MIT | Not recorded |
| agent-sandbox | Code reusable | MIT | <https://github.com/navruzm/agent-sandbox> |
| bmux | Conditional | MPL-2.0 (copyleft at file level) | <https://github.com/BSteffaniak/bmux> |
| cmux | Ideas only | GPL-3.0 and BUSL | <https://github.com/manaflow-ai/cmux> |
| mmux | Ideas only | GPL-3.0 | <https://github.com/marvinvr/mmux> |
| jmux | Ideas only | AGPL-3.0 | <https://github.com/jarredkenny/jmux> |
| termoso | Ideas only | AGPL-3.0 | <https://github.com/termoso/termoso> |
| Voltius | Ideas only | AGPL-3.0 | <https://github.com/VoltiusApp/voltius> |
| claude_codex_bridge | Ideas only | AGPL-3.0 | <https://github.com/SeemSeam/claude_codex_bridge> |
| amux | Ideas only | MIT with the Commons Clause | <https://github.com/mixpeek/amux> |
| Zed `ui` and `terminal_view` crates | Ideas only | GPL | Not recorded |

"Not recorded" means that the review did not record a URL for the project. Add the URL when you write the note.
The six tmux plugins with the MIT license are recorded as one group, "other tmux plugins (MIT)". Examine each license file before code reuse.
