/**
 * Parked case studies: projects whose page is staged but whose content is
 * still being written. Their route stays live and their list entries are
 * unchanged; the page (and therefore the landing-page modal, which fetches
 * that page) shows a short notice instead of the article.
 *
 * Removing an id here is the only step needed to publish that case study.
 */
export const parkedProjectIds: readonly string[] = [
  'blaze2d',
  'envelope-approximation',
  'residual-worlds',
  'swarm-dynamics',
];

export const isParked = (id: string): boolean => parkedProjectIds.includes(id);
