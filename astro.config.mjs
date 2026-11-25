// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
  // GitHub Pages serves the site below /docs/. Each internal link in a page starts with this base path.
  site: 'https://nomux-sh.github.io',
  base: '/docs',
  // The output tree has the same paths as the URLs, thus the link check finds a link that has no base path.
  outDir: './dist/docs',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'nomux',
      description:
        'Documentation for nomux, a native agentic development environment. Sessions stay alive on the host when the client disconnects.',
      // English is the default locale and has no language prefix in the URL.
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        tr: { label: 'Türkçe', lang: 'tr' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/nomux-sh' }],
      sidebar: [
        {
          label: 'Guides',
          translations: { tr: 'Rehberler' },
          items: [{ slug: 'guides/install' }, { slug: 'guides/quick-start' }],
        },
        {
          label: 'Concepts',
          translations: { tr: 'Kavramlar' },
          items: [
            { slug: 'concepts/overview' },
            { slug: 'concepts/how-it-works' },
            { slug: 'concepts/extensions' },
          ],
        },
        {
          label: 'Reference',
          translations: { tr: 'Başvuru' },
          items: [
            { slug: 'reference/cli' },
            { slug: 'reference/performance' },
            { slug: 'reference/glossary' },
            { slug: 'reference/decisions' },
          ],
        },
        { slug: 'project/roadmap' },
        { slug: 'project/contributing' },
      ],
      // The build fails if a page has a broken internal link or anchor.
      plugins: [starlightLinksValidator()],
    }),
  ],
});
