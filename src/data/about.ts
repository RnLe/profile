import type { CountryCode } from '../lib/flags';

/**
 * Curriculum-vitae facts: education, selected teaching, programs,
 * service, awards. Everything here is verifiable against official records or
 * the CV; grades and conversions stay in the official documents.
 */

/**
 * An artifact belonging to a CV entry.
 *
 * `state` is the publication gate, not a formatting hint. Only `live` links
 * render, so an artifact that sits in a private repository or has not been
 * built yet can be recorded here without putting a dead link on a public page.
 * When the target becomes reachable, flip the state; nothing else changes.
 */
export interface ArtifactLink {
  label: string;
  /** Chooses the marker in front of the label. */
  kind: 'web' | 'pdf' | 'repo';
  /**
   * Artifacts of a separate project, set off from the entry's own by a rule
   * and the project's mark.
   */
  group?: 'blaze2d';
  /**
   * Length of the document, shown before its size. A staged document takes
   * this from its artifact record instead. Either way it is left off slide
   * decks, where counting slides says nothing about how much there is to read.
   */
  pages?: number;
  /** Size of the file itself, shown after a document link. */
  sizeMb?: number;
  /** Absent while the artifact has no location at all, not even a private one. */
  href?: string;
  /**
   * A document this site stages itself, named by its `src/data/artifacts.yaml`
   * id. The href and the file size then come from that record, and the record
   * can only withhold the link, never grant one: an artifact that is not
   * `public` with a checksummed file renders as pending whatever `state` says.
   */
  artifactId?: string;
  state: 'live' | 'pending';
  /** Draws the eye to the single most important artifact of an entry. */
  emphasis?: boolean;
  /** Why a pending link is withheld, so the reason survives in the source. */
  note?: string;
}

export interface AboutEntry {
  title: string;
  /** Institution or body. Omitted where the title already names it. */
  org?: string;
  /** City and country, rendered next to the period rather than on its own line. */
  location?: string;
  /** Flag shown after the location. */
  country?: CountryCode;
  period: string;
  description: string;
  items?: { name: string; period: string }[];
  links?: ArtifactLink[];
}

export const education: AboutEntry[] = [
  {
    title: 'M.Sc. Physics',
    org: 'TU Dortmund University',
    location: 'Dortmund, Germany',
    period: '2023 – 2026',
    description:
      'Specialization in theoretical and computational condensed-matter photonics. Thesis: "Photonic Band Theory of Moiré Crystals: A Two-Scale Approach" (Condensed Matter Theory).',
    links: [
      {
        label: 'Thesis',
        kind: 'pdf',
        artifactId: 'msc-research-continuation',
        state: 'live',
        emphasis: true,
      },
      {
        label: 'Manuscript',
        kind: 'pdf',
        artifactId: 'msc-manuscript',
        state: 'live',
      },
      {
        label: 'Defense slides',
        kind: 'pdf',
        artifactId: 'msc-slides',
        state: 'live',
      },
      {
        label: 'Technical report',
        kind: 'web',
        group: 'blaze2d',
        href: 'https://rnle.github.io/blaze2d/blaze/',
        state: 'live',
      },
      {
        label: 'Report',
        kind: 'pdf',
        group: 'blaze2d',
        pages: 16,
        sizeMb: 0.7,
        href: 'https://rnle.github.io/blaze2d/reports/blaze2d-technical-report.pdf',
        state: 'live',
      },
      {
        label: 'Website',
        kind: 'web',
        group: 'blaze2d',
        href: 'https://rnle.github.io/blaze2d/',
        state: 'live',
      },
      {
        label: 'Manuscript',
        kind: 'pdf',
        group: 'blaze2d',
        pages: 12,
        sizeMb: 0.9,
        href: 'https://rnle.github.io/blaze2d/paper/blaze2d.pdf',
        state: 'live',
      },
      {
        label: 'Repository',
        kind: 'repo',
        group: 'blaze2d',
        href: 'https://github.com/RnLe/blaze2d',
        state: 'live',
      },
    ],
  },
  {
    title: 'B.Sc. Physics',
    org: 'TU Dortmund University',
    location: 'Dortmund, Germany',
    period: '2019 – 2023',
    description:
      'Thesis on stochastic neighborhood rules and multi-agent reinforcement learning in swarm dynamics.',
    links: [
      {
        label: 'Thesis',
        kind: 'pdf',
        artifactId: 'ba-thesis',
        state: 'live',
      },
      {
        label: 'Manuscript',
        kind: 'pdf',
        artifactId: 'ba-manuscript',
        state: 'live',
      },
      {
        label: 'Defense slides',
        kind: 'pdf',
        artifactId: 'ba-slides',
        state: 'live',
      },
      {
        label: 'Repository',
        kind: 'repo',
        href: 'https://github.com/RnLe/bachelor_thesis23',
        state: 'live',
      },
    ],
  },
];

export const teaching: AboutEntry[] = [
  {
    title: 'Physics & Mathematics Tutor',
    org: 'TU Dortmund University',
    location: 'Dortmund, Germany',
    period: 'Oct 2021 – Sep 2024',
    description:
      'Led weekly exercise groups of up to 30 students, one core lecture per semester across the physics curriculum; grading, guidance, and didactic training.',
    // Newest first, matching the way the sections themselves read.
    items: [
      {
        name: 'Statistical Methods of Data Analysis (incl. Machine Learning)',
        period: 'Apr – Sep 2024',
      },
      { name: 'Thermodynamics & Statistical Physics', period: 'Oct 2023 – Mar 2024' },
      { name: 'Quantum Mechanics', period: 'Apr – Sep 2023' },
      { name: 'Analytical Mechanics', period: 'Oct 2022 – Mar 2023' },
      { name: 'Advanced Mathematics', period: 'Apr – Sep 2022' },
      { name: 'Introductory Physics (main first-year lecture)', period: 'Oct 2021 – Mar 2022' },
    ],
  },
];

export const programs: AboutEntry[] = [
  {
    title: 'International Program',
    org: 'Tohoku University',
    location: 'Sendai, Japan',
    country: 'jp',
    period: 'Jun – Aug 2026',
    description:
      'Two-month international program including academic exchange with faculty and research groups.',
  },
  {
    title: 'Science Communication for Physicists',
    org: 'DPG-Akademie',
    location: 'Berlin, Germany',
    country: 'de',
    period: 'Nov 2025',
    description:
      'Two-day seminar on conveying research precisely and with confidence, led by Dr. Sabrina Patsch (Physicus Minimus) and Dr. Jürgen Rink (c’t Magazin). Held as „Wissenschaftskommunikation für Physiker:innen – Forschung souverän und punktgenau vermitteln“.',
  },
  {
    title: 'XXXI INC International Summer School',
    location: 'Madrid, Spain',
    country: 'es',
    period: 'Aug – Sep 2025',
    description:
      'Quantum photonic technologies; intersections of quantum computing and machine learning.',
  },
  {
    title: 'European Quantum Technology Summer School',
    location: 'Paderborn, Germany',
    country: 'de',
    period: 'Jul 2025',
    description: 'Hands-on workshops on quantum algorithms; exchange with deep-tech startups.',
  },
  {
    title: 'Japanese Program (TUJP)',
    org: 'Tohoku University',
    location: 'Sendai, Japan',
    country: 'jp',
    period: 'Jul – Aug 2024',
    description: 'Four-week intercultural program with international faculty and peers.',
  },
];

export const service: AboutEntry[] = [
  {
    title: 'PeP et al. e.V., Physics Student & Alumni Association',
    org: 'TU Dortmund University',
    period: 'Board member since Dec 2023 · Managing director 2024 – 2025',
    description:
      'Organized academic retreats and career fairs; built long-term networking infrastructure between students and alumni.',
  },
  {
    title: 'Student Council (Fachschaftsrat Physik)',
    org: 'TU Dortmund University',
    period: 'Member Oct 2018 – Apr 2022 · Chairperson Oct 2019 – Apr 2022',
    description:
      'Directed the council’s priorities and modernized internal digital workflows; managed communication between the student body and faculty.',
  },
  {
    title: 'Faculty Council (Fakultätsrat Physik)',
    org: 'TU Dortmund University',
    period: 'Elected member Aug 2021 – Aug 2025',
    description:
      'Represented student interests in faculty governance, contributing to decisions on curriculum development and structural planning.',
  },
];

export const awards: AboutEntry[] = [
  {
    title: 'Problem Solver Award',
    org: 'TU Dortmund University',
    period: '2020',
    description:
      'For significant community contributions during the COVID-19 pandemic: digital learning environments, student websites, and student–faculty communication.',
  },
  {
    title: 'GFOS Innovation Award, 1st place',
    org: 'Regional programming competition',
    period: '2015',
    description:
      'First place for a software project in a regional programming competition for school students.',
  },
];

/** Every CV entry, in page order, for validators and tests. */
export const allEntries: AboutEntry[] = [
  ...education,
  ...teaching,
  ...programs,
  ...service,
  ...awards,
];
