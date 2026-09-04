/**
 * The site's breakpoint ladder, in one place.
 *
 * These values also appear as literals inside component `<style>` blocks,
 * because an Astro style block cannot read a TypeScript constant and a CSS
 * custom property cannot be used in a media query condition. This module is
 * the authority for the JavaScript that has to agree with those blocks (the
 * project modal decides here whether to open at all), and a unit test in
 * tests/unit/source-discipline.test.ts scans every .astro and .css file in src
 * and fails on any width query outside this ladder, so the two cannot drift.
 *
 * The ladder is max-width, so a component's base rules are its widest layout
 * and each step narrows it. New components should prefer a container query
 * over adding a step here: a card that sizes to its container keeps working
 * when it is placed somewhere other than the full page width.
 */

/** Phone. Below this a stripe stacks and the year leaves the thumbnail column. */
export const PHONE = '40rem';

/** Phone and small tablet. The header collapses and the modal stops opening. */
export const COMPACT = '47.99rem';

/** Below the desktop grid: two-column layouts fold into one. */
export const WIDE = '63.99rem';

export const breakpoints = [PHONE, COMPACT, WIDE] as const;

/**
 * The modal is not opened on a phone, in either orientation: 80% of a phone
 * screen is not enough to read a case study in, so the entry navigates to the
 * real page instead. The height clause catches landscape, where the viewport
 * is wide enough to pass the width test but only ~300 px tall.
 */
export const NARROW = `(max-width: ${COMPACT}), (max-height: 30rem)`;
