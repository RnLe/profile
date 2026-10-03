/**
 * Route-gated projects: work with a sanctioned public name and status but no
 * content file and no route yet. Each renders only as a non-clickable
 * placeholder (list entry, related-work item) until its content file and
 * registry record exist; from then on the resolved project takes over and the
 * placeholder disappears by itself.
 */
import type { ProjectKind, ProjectLink } from '../lib/schemas';

export interface GatedProject {
  title: string;
  question: string;
  statusText: string;
  statusDate: string;
  /** Year the work began; list placement only, never a claim about progress. */
  year: number;
  /** Academic, software, hardware: the index rail's type columns. */
  kinds: ProjectKind[];
  /** Owner-sanctioned public targets; the same link row a routed project gets. */
  links: ProjectLink[];
}

/** None at present: Grounded Recovery, the last one, now resolves as a project. */
export const gatedProjects: Record<string, GatedProject> = {};

/** Every id that content, claims, media, and documents may reference (published projects + gated members). */
export const knownProjectIds = [
  'blaze2d',
  'envelope-approximation',
  'residual-worlds',
  'recover-in-real-time',
  'swarm-dynamics',
  'grounded-recovery',
  'hard-spheres',
  'facial-emotion-recognition',
  ...Object.keys(gatedProjects),
];
