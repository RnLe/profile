/**
 * Icon names, kept in a plain module so data files can reference them without
 * importing an `.astro` component (which `tsc` cannot resolve). The glyph
 * paths themselves live in `src/components/ui/Icon.astro`.
 */
export type IconName =
  | 'github'
  | 'linkedin'
  | 'package'
  | 'book-open'
  | 'flame'
  | 'mail'
  | 'file-text'
  | 'file-pdf'
  | 'globe'
  | 'arrow-up-right'
  | 'arrow-right'
  | 'arrow-left'
  | 'map-pin'
  | 'menu'
  | 'x'
  | 'download'
  | 'play'
  | 'graduation-cap'
  | 'code'
  | 'wrench'
  | 'python'
  | 'rust'
  | 'typescript';
