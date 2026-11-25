# AGENTS.md

Rules for coding agents and for people who work in this repository. `CLAUDE.md` and `QWEN.md` refer to this file.

## This repository

`nomux-sh/docs` has the nomux documentation site, the glossary, the public roadmap, the architecture decision records (ADRs) and the research notes. The site uses Astro with Starlight. Each merge to `main` publishes it to GitHub Pages. The site has no version.

| Path | Content |
|---|---|
| `src/content/docs/` | Site pages in English, the default locale. |
| `src/content/docs/tr/` | Site pages in Turkish. Each page has the same path as its English page. |
| `src/content/docs/reference/glossary.md` | The glossary. It is the one source of the names in code, the CLI, the UI and the documentation. |
| `src/content/docs/project/roadmap.md` | The public roadmap. Other repositories link to this file. |
| `adr/` | The ADRs, the index (`README.md`) and the template. Plain Markdown, English only. |
| `research/` | Research notes and the index of reference projects. |
| `public/` | Static files that the build copies to the site unchanged. |
| `astro.config.mjs` | Site URL, base path, locales and sidebar. |
| `lychee.toml` | Options of the link check on the built site. |
| `.github/actions/install-dependencies/` | The install steps that the two workflows with a build share. |
| `.github/workflows/` | `ci.yml` (type check, build, link check), `pr-checks.yml` (shared organization checks), `deploy.yml` (GitHub Pages). |

## Rules for this repository

- Before you use a new concept in a page, add it to the glossary in English and in Turkish.
- Write each site page in English and in Turkish, at the same path. Write the Turkish page as a Turkish developer writes it. Do not translate word for word.
- Add a page only when it has real content.
- Start each internal link in a site page with the base path, for example `/docs/reference/glossary/`. The base path is `base` in `astro.config.mjs`.
- The files in `adr/` are the one source of the decisions. A site page links to an ADR. It does not copy the text or the status of an ADR.
- Do not change the decision of an accepted ADR. Write a new ADR and set the old status to `Superseded by ADR-NNNN`.
- The [roadmap](src/content/docs/project/roadmap.md) is the one source of the stage identifiers (M1 to M10). If a file uses a stage identifier, it must link to the roadmap.
- Do not write dates or time estimates in the roadmap.
- Do not add analytics, external fonts or external scripts to the site.
- Do not copy text from third-party projects. The content has the CC BY 4.0 license.
- Pin each action to a full commit SHA with a version comment.

## Checks

```sh
bun install --frozen-lockfile
bun run check
bun run build
lychee 'dist/**/*.html'
```

CI runs these four commands. The link check needs [lychee](https://lychee.cli.rs) 0.24.2 and reads its options from `lychee.toml`.

If you change a workflow or `AGENTS.md`, also run these commands. The second command needs a clone of [`nomux-sh/.github`](https://github.com/nomux-sh/.github) next to this repository.

```sh
actionlint
sh ../.github/standards/sync.sh . && git diff --exit-code
```

<!-- nomux:common:start -->
## Organization rules

These rules apply to each repository of the nomux-sh organization. The source of this block is `standards/AGENTS.common.md` in the [`.github`](https://github.com/nomux-sh/.github) repository. Do not edit the block in other repositories. CI compares it with the source.

### Before you change something

- Read the code around the change. Use the names, the structure and the style that the repository already has.
- Use the terms of the [glossary](https://github.com/nomux-sh/docs/blob/main/src/content/docs/reference/glossary.md). One concept has one name in code, CLI, UI and documentation.
- An architecture change needs an ADR in the [`docs`](https://github.com/nomux-sh/docs) repository before the implementation.
- Check versions, APIs and file paths before you use them. Do not guess.

### Scope

- Make only the change that the task asks for. Do not add options, abstractions or helpers that the task does not need.
- Do not add a placeholder that looks like an implementation. If work is deferred, say it in the pull request.
- Validate input at system boundaries. Trust internal code.

### Code

- Keep it simple (KISS). Build only what the task needs now (YAGNI). Have one source for each piece of logic (DRY).
- Write modern, readable code. Do not write clever code that the reader must decode.
- One type, one module and one file have one responsibility. Do not make a type that knows or does everything. Split it before it grows.
- Keep the file tree tidy. A new file goes where its neighbours have the same responsibility. Do not make catch-all directories or files such as `utils`, `common`, `helpers` or `misc`.
- Give each file, type and function a name that says what it is or does. Do not use abbreviations that the glossary does not have.
- Keep functions short and at one level of abstraction. Do not nest deeply. Return early.
- Do not duplicate code. If the same logic is necessary in a second place, move it to one place and call it.
- Comments: none by default. Write one line only for a reason that the code cannot show.
- Do not swallow errors. Do not add retries without a known cause.
- The performance targets of the project come before features. A change that breaks a target is not merged.
- Do not copy code from GPL, AGPL or Commons Clause projects.

### Tests

- Complete the code first. Write the tests last, and run them when the work is complete.
- Write the tests that matter: edge cases, behaviour that can break later, and the proof that the current behaviour is correct.
- Do not write a test only to have a test. Do not test what is obvious or what the compiler already guarantees.
- A test must fail when the behaviour that it guards is removed or moved.
- Do not mock the thing that the test examines.

### CI

- CI must be fast. Reviews and CI are the only things that slow a merge.
- Cache dependencies and build output. Run independent jobs in parallel. Cancel a run when a newer commit arrives.
- Put slow work (long fuzz runs, benchmarks, full matrix builds) in scheduled runs, not in pull request runs.
- When you add a CI step, measure the time that it adds and say it in the pull request.

### Text

- Write code, comments, documentation, commit messages and pull requests in English.
- Use short sentences, the active voice and one word for one concept. Put the condition before the instruction.
- Do not use these words: delve, robust, seamless, seamlessly, leverage, utilize, harness, pivotal, intricate, furthermore, moreover, notably, cutting-edge, best-in-class.

### Commits

- One subject line: `type: description`. No scope. 72 characters at most.
- Types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`. Add `!` before the colon for a breaking change.
- The description says what changed, in plain English. Do not name a phase, a milestone or a ticket.
- Sign off each commit with `git commit -s`. `Signed-off-by` is the only trailer.
- Do not add `Co-authored-by`, a tool name or a "generated with" line to a commit or to a pull request.
- Enable the commit hook one time in each clone: `git config core.hooksPath .githooks`.

### Pull requests

- One logical change in each pull request. The branch name is short and names the change.
- The title has the format of a commit subject, 70 characters at most.
- The description says what changed and why, then shows the commands that you ran and their real result.
- Each commit in the pull request obeys the commit rules. The maintainers merge with a rebase, thus each commit goes to `main` unchanged.
- Do not merge when a check fails. Do not disable a check to make it pass.

### Never commit

- Secrets, tokens, keys or passwords.
- Paths, host names or account names of a local machine.
- Generated build output, editor files or local configuration.

### Before you push

1. Run the checks that the "Checks" section of this file lists.
2. Read your diff from top to bottom.
3. Make sure that the changelog and the documentation agree with the change.
<!-- nomux:common:end -->
