// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
  site: 'https://nomux.sh',
  integrations: [
    starlight({
      title: 'nomux',
      description:
        'Documentation for nomux, a native agentic development environment. Sessions stay alive on the host when the client disconnects.',
      // English is the default locale and is served from the site root.
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        tr: { label: 'Türkçe', lang: 'tr' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/nomux-sh' }],
      sidebar: [
        {
          label: 'Concepts',
          translations: { tr: 'Kavramlar' },
          items: [{ slug: 'concepts/overview' }],
        },
        {
          label: 'Reference',
          translations: { tr: 'Başvuru' },
          items: [{ slug: 'reference/glossary' }, { slug: 'reference/decisions' }],
        },
      ],
      // The build fails if a page has a broken internal link or anchor.
      plugins: [starlightLinksValidator()],
    }),
  ],
});
