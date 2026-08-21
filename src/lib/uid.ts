/**
 * Build-time unique ids for inline SVG (clip paths, gradients, masks).
 *
 * Astro component frontmatter re-runs for every instance, so a counter declared
 * there resets each time and two instances would collide. This module's scope
 * persists for the whole build, which is exactly the lifetime an id has to be
 * unique across.
 */
let counter = 0;

export const nextId = (prefix: string): string => `${prefix}-${(counter += 1)}`;
