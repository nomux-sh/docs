# Architecture decision records

An architecture decision record (ADR) records one design decision of nomux: the context, the decision, the consequences and the alternatives.
A change to the architecture of nomux starts with an ADR.

The ADRs are plain Markdown and are written in English only.
The ADRs use the terms from the [glossary](../src/content/docs/reference/glossary.md). Do not use a synonym for a glossary term.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-session-holder-model.md) | Session holder model | Accepted |
| [0002](0002-protocol-protobuf-and-binary-frames.md) | Protocol: protobuf and binary frames | Accepted |
| [0003](0003-vt-library.md) | VT library | Accepted |
| [0004](0004-gpui-desktop.md) | GPUI for the desktop client | Accepted |
| [0005](0005-extension-model.md) | Extension model | Accepted |
| [0006](0006-licensing.md) | Licensing | Accepted |
| [0007](0007-status-source-order.md) | Status source order | Accepted |
| [0008](0008-release-early-pre-releases.md) | Release early with pre-releases | Accepted |
| [0009](0009-resource-budgets-for-disk-and-memory.md) | Resource budgets for disk and memory | Accepted |

## Status values

| Status | Meaning |
|---|---|
| Proposed | The record is open for discussion. The decision is not made. |
| Accepted | The decision is made and is in effect. |
| Rejected | The proposal was discussed and not accepted. The record stays in the repository. |
| Deprecated | The decision is no longer in effect and no record replaces it. |
| Superseded | A newer record replaces this record. Write `Superseded by ADR-NNNN` in the status line. |

## Process

1. Find the next free number. Numbers have four digits and are not used again.
2. Copy [`template.md`](template.md) to `adr/NNNN-short-title.md`. Use lowercase words and hyphens in the file name.
3. Fill in all sections. Set the status to `Proposed`.
4. Add a row to the index in this file.
5. Open a pull request. The discussion occurs in the pull request.
6. When the maintainers agree, set the status to `Accepted` or `Rejected` and merge the pull request.

## Rules

- One ADR records one decision.
- Do not change the decision of an accepted ADR. If the decision changes, write a new ADR and set the status of the old ADR to `Superseded by ADR-NNNN`.
- You can correct errors and add links in an accepted ADR.
- If a question is not decided, write it in the "Open questions" section. Do not write a guess as a decision.
- When an open question gets an answer, move the answer into the related section and remove the question. If the answer changes the decision, write a new ADR.
- Keep the status in the ADR file and in the index in this file the same.
- If an ADR names a roadmap stage (M1 to M10), link to the [roadmap](../src/content/docs/project/roadmap.md) in the same file.

## Site

The site has one page about the ADRs: `src/content/docs/reference/decisions.md`, with a Turkish page at the same path below `tr/`.
The page links to this index. It does not copy the index or the text of an ADR.
