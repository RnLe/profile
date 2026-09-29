/**
 * The scale of Blaze2D in a few numbers, counted in its working tree on
 * 2026-09-29: lines of code by cloc (code lines only, no blanks or
 * comments), tests as test functions (Rust #[test], Python test_*, and the
 * website's browser tests), commits in the history. Registered as
 * BLAZE-SCALE-001; update both together.
 */
export interface ScaleMetric {
  value: number;
  label: string;
  detail: string;
}

export const blazeScaleAsOf = 'September 2026';

export const blazeScale: ScaleMetric[] = [
  { value: 50399, label: 'lines of Rust', detail: 'the solver and its interfaces' },
  { value: 663, label: 'automated tests', detail: 'in Rust, Python, and the browser' },
  { value: 8, label: 'crates', detail: 'in one Rust workspace' },
  { value: 17636, label: 'lines of TypeScript', detail: 'the website and the Workbench' },
  { value: 443, label: 'commits', detail: 'since November 2025' },
];
