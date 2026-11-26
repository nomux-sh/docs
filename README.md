# docs

The nomux documentation: the documentation site, the glossary, the public roadmap, architecture decision records, and research notes.

This repository is a part of [nomux](https://github.com/nomux-sh), a native and lightweight agentic development environment. Sessions stay alive on the host when the client disconnects.

## Status

In development. Versions earlier than 1.0.0 are pre-releases: interfaces can change between minor versions.

The site has the user guides (install, quick start, after a restart, remote hosts, extensions), the concepts pages (overview, how it works, extensions), the CLI reference, the performance targets, the glossary, the roadmap, the contribution page and a page about the architecture decisions, in English and in Turkish. This repository also has nine architecture decision records and the index of reference projects. The [roadmap](https://github.com/nomux-sh/docs/blob/main/src/content/docs/project/roadmap.md) shows the order of the future work.

The site has no version. Each merge to `main` publishes it.

## Other repositories of nomux

| Repository | Content |
|---|---|
| [`nomux`](https://github.com/nomux-sh/nomux) | The core: the holder, the daemon, the extension host, the SSH transport, the client library and the CLI. |
| [`proto`](https://github.com/nomux-sh/proto) | The protocol between a client and the daemon, and the `nomux-proto` crate. |
| [`extension-api`](https://github.com/nomux-sh/extension-api) | The extension SDK: the extension protocol, the `nomux-extension` crate and the format of `extension.toml`. |
| [`extensions`](https://github.com/nomux-sh/extensions) | The official extensions. It has the git extension now. |
| [`themes`](https://github.com/nomux-sh/themes) | The design tokens, the themes and the `nomux-theme` crate. The [preview page](https://nomux-sh.github.io/themes/) shows each theme. |
| [`homebrew-tap`](https://github.com/nomux-sh/homebrew-tap) | The Homebrew formula of nomux. |
| [`.github`](https://github.com/nomux-sh/.github) | The guides of the organization and the CI workflows that the repositories share. |

## Layout

| Path | Content |
|---|---|
| `src/content/docs/` | Site pages in English. English is the default locale and has no language prefix in the URL. |
| `src/content/docs/tr/` | Site pages in Turkish, served below `tr/`. |
| `src/content/docs/reference/glossary.md` | The glossary. It is the one source of the names in code, the CLI and the UI. |
| `src/content/docs/project/roadmap.md` | The public roadmap. Other repositories link to this file. |
| `adr/` | Architecture decision records (ADRs), plain Markdown, English only. |
| `research/` | Research notes and the index of reference projects. |
| `public/` | Static files that are copied to the site as they are. |
| `astro.config.mjs` | Site configuration: URL, base path, locales, sidebar. |
| `lychee.toml` | Options of the link check on the built site. |
| `AGENTS.md` | Rules for coding agents and for people. `CLAUDE.md` and `QWEN.md` refer to it. |
| `.github/workflows/` | CI, the shared organization checks and the deployment to GitHub Pages. |

The site uses [Astro](https://astro.build) with [Starlight](https://starlight.astro.build). The site URL is <https://nomux-sh.github.io/docs/>.
The site has no analytics, no external fonts and no external scripts.

## Local development

You need [Bun](https://bun.sh) 1.3.14 or later.

```sh
bun install --frozen-lockfile
bun run dev
```

The development server prints the local URL. The site is below the base path `/docs/`. Changes to a page show immediately.

## Build

```sh
bun run check   # type check
bun run build   # build the site into dist/docs/
bun run preview # serve the built site locally
```

The build fails if a page has a broken internal link or anchor.

To check the links between the built files, install [lychee](https://lychee.cli.rs) 0.24.2 and run it after the build. The options are in `lychee.toml`. lychee makes no network requests.

```sh
lychee 'dist/**/*.html'
```

CI runs the type check, the build and the link check on each pull request.

## Deployment

The workflow `.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages on each push to `main`.
GitHub Pages serves the site below `/docs/`. Thus `astro.config.mjs` sets `base` to `/docs`, and each internal link in a page starts with `/docs/`.

## Writing rules

- Use the terms from the glossary. Do not use a synonym for a glossary term.
- Add a page only when it has real content. Do not add an empty page or a placeholder.
- Write each site page in English and in Turkish. Write the Turkish page as a Turkish developer writes it. Do not translate word for word.
- Start each internal link in a site page with the base path, for example `/docs/reference/glossary/`.
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
4. Open a pull request.

The full process and the status values are in [`adr/README.md`](adr/README.md).

## Contributing

Read the [contributing guide](https://github.com/nomux-sh/.github/blob/main/CONTRIBUTING.md) of the organization. The rules for this repository are in [`AGENTS.md`](AGENTS.md).

- A commit message is one subject line, `type: description`, and the sign-off.
- Sign off each commit (`git commit -s`). The project uses the Developer Certificate of Origin and has no CLA.
- Enable the commit hook one time in each clone: `git config core.hooksPath .githooks`.

To report a vulnerability, obey the [security policy](https://github.com/nomux-sh/.github/blob/main/SECURITY.md).

## Deferred work

| Item | When |
|---|---|
| The domain of the site. The site is on GitHub Pages at this time. When the domain exists, `site` and `base` in `astro.config.mjs` and the internal links change. | When the domain is registered |
| User guides, extension guides, theme and language pack guides, protocol specification. | Each guide comes with the stage of the [roadmap](https://github.com/nomux-sh/docs/blob/main/src/content/docs/project/roadmap.md) that makes its subject usable |
| Final logo and favicon. The favicon is a temporary mark. | With the design work for the desktop client |
| Check of external links. CI checks internal links only. | A scheduled workflow, after the first deployment |

## License

Documentation is licensed under [CC BY 4.0](LICENSE). Copyright: The nomux Authors.
