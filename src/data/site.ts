import type { IconName } from '../lib/icons';
import type { CountryCode } from '../lib/flags';

/**
 * Site-wide identity and verified contact facts. Copy here follows the
 * evidence rules: no grade conversions, no unverified honors, no invented
 * language levels. A level on the CV is the owner's own statement of it.
 */

export interface StripItem {
  label: string;
  icon?: IconName;
}

export interface StripGroup {
  items: StripItem[];
}

export interface LanguageEntry {
  name: string;
  level: string;
  country: CountryCode;
  /** Extra detail shown on the CV only, such as a level band. */
  note?: string;
}

/** Listed on the CV with flags; joined into one line for the homepage summary. */
export const languages: LanguageEntry[] = [
  { name: 'German', level: 'native', country: 'de' },
  { name: 'English', level: 'fluent', country: 'gb' },
  { name: 'Japanese', level: 'learning', country: 'jp', note: 'N4–N3' },
];

const languageLine = languages.map((l) => `${l.name} (${l.level})`).join(' · ');

export const site = {
  name: 'Rene-Marcel Lehner',
  /** Hero eyebrow. */
  eyebrow: 'Computational Physics · Research Visualization · Physical AI',
  /**
   * The hero statement doubles as the page's H1: the site says what it is by
   * showing the work, not by announcing a title.
   */
  statement:
    'My passion is to turn mathematical and physical models into usable research software, and to visualize science along the way. After my M.Sc. in theoretical physics, I now engage deeply with machine learning and robotics.',
  email: 'rene.marcel.lehner@gmail.com',
  githubUser: 'RnLe',
  github: 'https://github.com/RnLe',
  linkedin: 'https://www.linkedin.com/in/rene-marcel-lehner-52b066283/',
  location: 'Essen, Germany',
  /** One line, derived from `languages` so the two can never drift apart. */
  languages: languageLine,
  /** Rendered in the footer as the last meaningful content update. */
  lastUpdated: '2026-09-02',
} as const;

/** Compact evidence strip: verified background, languages, and domains. */
export const evidenceStrip: StripGroup[] = [
  { items: [{ label: 'M.Sc. Physics' }] },
  {
    items: [
      { label: 'Python', icon: 'python' },
      { label: 'Rust', icon: 'rust' },
      { label: 'TypeScript', icon: 'typescript' },
    ],
  },
  {
    items: [
      { label: 'Simulation' },
      { label: 'Machine Learning & AI' },
      { label: 'Robotics' },
    ],
  },
];

export type SiteInfo = typeof site;

/**
 * Display form of the address. The `mailto:` href still carries the real thing,
 * so this only defeats scrapers that read rendered text rather than markup; it
 * is a small nuisance to them, not protection. Obfuscating the href as well
 * would need JavaScript, which would break the address for anyone without it.
 */
export const emailDisplay = site.email.replace('@', ' [at] ');
