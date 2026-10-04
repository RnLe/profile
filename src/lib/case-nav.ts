/**
 * Ids and entries for a case study's navigation, shared by the rail
 * (CaseRail), the parts (ProjectTabs), and the steps (ProjectSteps), so a
 * rail link and the heading it points at are always built the same way.
 */

/** A heading as an id fragment: lowercase ASCII words joined by hyphens. */
export const slugify = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** The element id of one part's panel. The URL shows the bare part id. */
export const panelId = (slug: string, part: string): string => `${slug}-panel-${part}`;

/** Ids for a run of step headings under one prefix; a repeated heading gets a number. */
export function stepIds(prefix: string, headings: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return headings.map((heading) => {
    const base = `${prefix}-${slugify(heading) || 'step'}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
}

/** A part's number as the rail and the panels show it: the overview has none. */
export const partNumber = (index: number): string => (index === 0 ? '' : String(index).padStart(2, '0'));

export interface RailLink {
  id: string;
  label: string;
}

export interface RailPart extends RailLink {
  /** The part's own key (the tab id); its link points at the panel. */
  part: string;
  num: string;
  steps: RailLink[];
}
