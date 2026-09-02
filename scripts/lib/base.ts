/**
 * The path prefix the site is served under, as the build saw it.
 *
 * Root deployment by default; SITE_BASE names a subpath for a project-site
 * deployment. Node-side checkers read the environment directly, because they
 * inspect the built artifact rather than running inside Vite.
 */
const requested = process.env.SITE_BASE;

/** '' at the site root, '/profile' under SITE_BASE=/profile/. */
export const basePrefix =
  !requested || requested === '/' ? '' : `/${requested.replace(/^\/+|\/+$/g, '')}`;

/** A built URL path with the deployment prefix removed, so route sets compare. */
export const stripBase = (path: string): string => {
  if (!basePrefix || !path.startsWith(basePrefix)) return path;
  return path.slice(basePrefix.length) || '/';
};
