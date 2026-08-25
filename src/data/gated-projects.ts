/**
 * Route-gated projects: work with a sanctioned public name and status but no
 * content file and no route yet. Each renders only as a non-clickable
 * placeholder (list entry, related-work item) until its content file and
 * registry record exist; from then on the resolved project takes over and the
 * placeholder disappears by itself.
 *
 * Grounded Recovery's name, question, and release-preparation status are the
 * exact publicly sanctioned copy.
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

export const gatedProjects: Record<string, GatedProject> = {
  'grounded-recovery': {
    title: 'Grounded Recovery',
    question:
      'When expert time is fixed, does labeling the learner’s recoverable mistakes buy more robustness than collecting more nominal behavior?',
    statusText:
      'Release preparation: public repository, report, and evidence bundle have not yet passed publication review.',
    statusDate: '2026-08-30',
    year: 2026,
    kinds: ['academic', 'software'],
    links: [
      {
        label: 'Website',
        href: 'https://rnle.github.io/recovery-policy-learning/',
        kind: 'site',
      },
      {
        label: 'Preliminary report',
        href: 'https://rnle.github.io/recovery-policy-learning/reports/Recovery_Policy_Learning_Technical_Report.pdf',
        kind: 'report',
        pages: 36,
        sizeMb: 1.6,
      },
      {
        label: 'Repository',
        href: 'https://github.com/RnLe/recovery-policy-learning',
        kind: 'source',
      },
    ],
  },
};

/** Every id that content, claims, media, and documents may reference (routed projects + gated members). */
export const knownProjectIds = [
  'blaze2d',
  'envelope-approximation',
  'residual-worlds',
  'recover-in-real-time',
  'swarm-dynamics',
  ...Object.keys(gatedProjects),
];
