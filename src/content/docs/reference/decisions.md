---
title: Architecture decisions
description: What a nomux architecture decision record (ADR) is, where the records are and how a decision changes.
---

An architecture decision record (ADR) records one design decision: the context, the decision, the consequences and the alternatives.
A change to the architecture of nomux starts with an ADR.

## Where the records are

The ADRs are plain Markdown files in the [`adr/` directory](https://github.com/nomux-sh/docs/tree/main/adr) of the `nomux-sh/docs` repository.
They are written in English only.

The [ADR index](https://github.com/nomux-sh/docs/blob/main/adr/README.md) lists each record with its title and its status.
The index is the one source of this list. This site does not copy it.

## How a decision changes

- A new record has the status `Proposed`. The discussion occurs in its pull request.
- When the maintainers agree, the status becomes `Accepted` or `Rejected`.
- The decision of an accepted record does not change. If the decision changes, a new record replaces the old one, and the old record names the new one.
- An accepted record is not rewritten. If new facts change how a decision is applied and the decision stays, the record gets a dated amendment section.

The full process and the meaning of each status are in the [ADR index](https://github.com/nomux-sh/docs/blob/main/adr/README.md#process).
