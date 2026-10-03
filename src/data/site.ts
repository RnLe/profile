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
  /** Background facts first, then tools; a stronger pipe marks the change. */
  register: 'background' | 'tools';
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
  /** The hero's first line, and the page's H1. */
  greeting: 'Hey, I’m Rene! Welcome to my profile.',
  /** The greeting bubble is hidden for now; the page keeps a visually hidden H1 with the name. */
  showGreeting: false,
  /** The fields the work sits in, spread over the hero's width. */
  fields: ['Computational Physics', 'Research Visualization', 'AI'],
  /**
   * The hero statement, set as a quote: one sentence per line, all in one
   * paragraph. `**words**` are set strong and `==words==` highlighted.
   */
  statement: [
    'My passion is to build **mathematical and physical models** and to apply them to ==real-world problems==.',
    'Along the way, I love creating ==interactive scientific visualizations==, applications, and websites.',
    'After my M.Sc. in theoretical physics, I now focus on **machine learning, neural network architectures, and tensor networks**.',
  ],
  email: 'rene.marcel.lehner@gmail.com',
  githubUser: 'RnLe',
  github: 'https://github.com/RnLe',
  linkedin: 'https://www.linkedin.com/in/rene-marcel-lehner-52b066283/',
  location: 'Essen, Germany',
  /** One line, derived from `languages` so the two can never drift apart. */
  languages: languageLine,
} as const;

/** The landing page's project list leads with these, in this order. */
export const landingPins = ['blaze2d', 'envelope-approximation'] as const;

/** Compact evidence strip: verified background, then the tools I build with. */
export const evidenceStrip: StripItem[] = [
  { label: 'M.Sc. Physics', register: 'background' },
  { label: 'Python', icon: 'python', register: 'tools' },
  { label: 'PyTorch', icon: 'pytorch', register: 'tools' },
  { label: 'Rust', icon: 'rust', register: 'tools' },
  { label: 'TypeScript', icon: 'typescript', register: 'tools' },
];

export type SiteInfo = typeof site;

/**
 * Display form of the address. The `mailto:` href still carries the real thing,
 * so this only defeats scrapers that read rendered text rather than markup; it
 * is a small nuisance to them, not protection. Obfuscating the href as well
 * would need JavaScript, which would break the address for anyone without it.
 */
export const emailDisplay = site.email.replace('@', ' [at] ');
