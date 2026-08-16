// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeScrollableRegions from './scripts/rehype-scrollable-regions.mjs';

// Root deployment by default (https://rnle.github.io/, no base path).
// A project-site deployment stays one env var away: SITE_BASE=/subpath/.
const site = process.env.SITE_URL ?? 'https://rnle.github.io';
const requestedBase = process.env.SITE_BASE;
const isRoot = !requestedBase || requestedBase === '/';

// Routes that must never enter the sitemap: the 404 page and the legacy alias
// stubs (kept in sync with src/lib/routes.ts; a dist-level test asserts the
// emitted sitemap equals the canonical route set).
const sitemapExcluded = [
  '/404',
  '/research/',
  '/research/blaze2d/',
  '/research/envelope-approximation/',
  '/research/recover-in-real-time/',
  '/research/residual-worlds/',
  '/research/swarm-dynamics/',
  '/blaze2d/',
  '/thesis/',
  '/about/',
  '/documents/',
  '/academic-service/',
  '/contact/',
];

export default defineConfig({
  site,
  ...(isRoot ? {} : { base: requestedBase }),
  output: 'static',
  trailingSlash: 'always',
  // Fail-closed public assets: .generated-public is recreated by
  // scripts/prepare-public.ts from audited, manifest-allowlisted sources only.
  // Never hand-edit it; never point publicDir back at a free-form directory.
  publicDir: '.generated-public',
  integrations: [
    sitemap({
      filter: (page) => {
        // Under a project-site base the emitted paths carry the prefix, so the
        // canonical list is compared with it applied.
        const path = new URL(page).pathname;
        const prefix = isRoot ? '' : requestedBase.replace(/\/$/, '');
        return !sitemapExcluded.some(
          (excluded) => path === `${prefix}${excluded}` || path.startsWith(`${prefix}/404`),
        );
      },
    }),
    react(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { output: 'html' }], rehypeScrollableRegions],
  },
  vite: {
    plugins: [tailwindcss()],
    build: { sourcemap: false },
  },
});
