# docs

The nomux documentation: the documentation site, the glossary, architecture decision records, and research notes.

This repository is a part of [nomux](https://github.com/nomux-sh), a native and lightweight agentic development environment. Sessions stay alive on the host when the client disconnects.

## Status

In development. There is no public release.
This repository contains the M0 skeleton. The content grows until milestone M10.

## Layout

| Path | Content |
|---|---|
| `src/content/docs/` | Site pages in English. English is the default locale and is served from `/`. |
| `src/content/docs/tr/` | Site pages in Turkish, served from `/tr/`. |
| `src/content/docs/reference/glossary.md` | The glossary. It is the naming authority for code, the CLI and the UI. |
| `adr/` | Architecture decision records (ADRs), plain Markdown, English only. |
| `research/` | Research notes and the index of reference projects. |
| `public/` | Static files that are copied to the site as they are. |
| `astro.config.mjs` | Site configuration: URL, locales, sidebar. |
| `.github/workflows/` | CI. |

The site uses [Astro](https://astro.build) with [Starlight](https://starlight.astro.build). The site URL is `https://nomux.sh`.
The site has no analytics, no external fonts and no external scripts.

## Local development

You need [Bun](https://bun.sh) 1.3.14 or later.

```sh
bun install --frozen-lockfile
bun run dev
```

The development server prints the local URL. Changes to a page show immediately.

## Build

```sh
bun run check   # type check
bun run build   # build the site into dist/
bun run preview # serve dist/ locally
```

The build fails if a page has a broken internal link or anchor.
CI runs the same commands and then checks the links between the built files with [lychee](https://lychee.cli.rs) in offline mode.

## Writing rules

- Use the terms from the glossary. Do not use a synonym for a glossary term.
- Add a page only when it has real content. Do not add an empty page or a placeholder.
- Write each site page in English and in Turkish. A Turkish page is a real translation. It is not a word-for-word copy.
- Write English text in Simplified Technical English (ASD-STE100): short sentences, active voice, one word for one concept, the condition before the command.
- Do not copy text from third-party projects.

## How to add a site page

1. Add the English file below `src/content/docs/`.
2. Add the Turkish file with the same path below `src/content/docs/tr/`.
3. Add the page to `sidebar` in `astro.config.mjs`.
4. Run `bun run build`.

## How to add an ADR

1. Find the next free four-digit number in `adr/`.
2. Copy `adr/template.md` to `adr/NNNN-short-title.md` and fill in all sections. Set the status to `Proposed`.
3. Add a row to the index in `adr/README.md`.
4. Add a row to the site index pages: `src/content/docs/reference/decisions.md` and `src/content/docs/tr/reference/decisions.md`.
5. Open a pull request.

The full process and the status values are in [`adr/README.md`](adr/README.md).

## Contributing

- Use [Conventional Commits](https://www.conventionalcommits.org) for commit messages.
- Sign off each commit (`git commit -s`). The project uses the Developer Certificate of Origin and has no CLA.

## Deferred work

| Item | Owner |
|---|---|
| Deployment to Cloudflare Pages. There is no deploy workflow. | When the Cloudflare account is set up (M0 accounts task) |
| Full text of the ADRs in the site. The site shows an index with links. | M10 |
| User guides, extension guides, theme and language pack guides, protocol specification. | Grow until M10 |
| Final logo and favicon. The favicon is a temporary mark. | Design work of M0 and M5 |
| Check of external links. CI checks internal links only. | When the site has a deploy target |

## License

Documentation is licensed under [CC BY 4.0](LICENSE). Copyright: The nomux Authors.
