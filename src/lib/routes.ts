/**
 * Route helpers.
 *
 * The site deploys to the domain root by default (`base` omitted); a project
 * base remains one `SITE_BASE` env var away, so every internal href, document
 * link, and public-asset reference still goes through `withBase`.
 */

/** Pure core of withBase, unit-tested for root and project-base modes. */
export const applyBase = (baseUrl: string, path: string): string => {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

export const withBase = (path: string): string =>
  applyBase(import.meta.env.BASE_URL, path);

/** Route kinds: only `canonical` routes may enter the sitemap. */
export type RouteKind = 'canonical' | 'legacy-alias' | 'error';

/** Legacy alias stubs (old path → new canonical path). Kept out of the sitemap. */
export const legacyAliases: Record<string, string> = {
  '/research/': '/projects/',
  '/research/blaze2d/': '/projects/blaze2d/',
  '/research/envelope-approximation/': '/projects/envelope-approximation/',
  '/research/recover-in-real-time/': '/projects/recover-in-real-time/',
  '/research/residual-worlds/': '/projects/residual-worlds/',
  '/research/swarm-dynamics/': '/projects/swarm-dynamics/',
  '/blaze2d/': '/projects/blaze2d/',
  '/thesis/': '/projects/envelope-approximation/',
  '/about/': '/cv/',
  '/documents/': '/cv/',
  '/academic-service/': '/cv/#teaching-service',
  '/contact/': '/#contact',
};

/** Titles for the alias stubs generated from the map above, so no stub reads content. */
export const legacyAliasTitles: Record<string, string> = {
  '/research/': 'Projects',
  '/research/blaze2d/': 'Blaze2D',
  '/research/envelope-approximation/': 'Envelope Approximation for Photonic Moiré Crystals',
  '/research/recover-in-real-time/': 'Recover in Real Time',
  '/research/residual-worlds/': 'Residual Worlds',
  '/research/swarm-dynamics/': 'Neural Swarm Dynamics',
};
