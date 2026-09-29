/**
 * The three kinds of work a project is marked with, in their fixed order, with
 * the mark and the name every list, legend, and tooltip uses. This is the one
 * place the set is defined; each project's own kinds and tooltip keywords live
 * in its content entry (`kinds`, `focus`), and KindMarks.astro is the one
 * renderer of both. A kind's colours are the `--kind-<kind>` and
 * `--kind-<kind>-tint` tokens in tokens-academic.css.
 */
import type { IconName } from './icons';
import type { ProjectKind } from './schemas';

export interface Kind {
  kind: ProjectKind;
  icon: IconName;
  label: string;
}

export const KINDS: Kind[] = [
  { kind: 'robotics', icon: 'bot', label: 'Robotics' },
  { kind: 'learning', icon: 'brain-circuit', label: 'Machine learning' },
  { kind: 'theory', icon: 'sigma', label: 'Theory' },
];

/** A kind as a reader hears it: its name, and the project's keywords for it. */
export const kindPhrase = (kind: Kind, focus: Partial<Record<ProjectKind, string>>): string =>
  focus[kind.kind] ? `${kind.label}: ${focus[kind.kind]}` : kind.label;

/** The kind's colours, for a style attribute: `--kind` and `--kind-tint`. */
export const kindColours = (kind: ProjectKind): string =>
  `--kind: var(--kind-${kind}); --kind-tint: var(--kind-${kind}-tint);`;
