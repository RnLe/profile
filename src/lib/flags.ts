/**
 * Country codes for the inline flags, kept in a plain module so data files can
 * reference the type without importing an `.astro` component (which `tsc`
 * cannot resolve). The drawings themselves live in `Flag.astro`.
 */
export type CountryCode = 'de' | 'gb' | 'jp' | 'es';
