/**
 * Metadata builders. Descriptions use the conservative identity; no
 * prospective results ever enter metadata; search previews outlive page copy.
 */
import { site } from '../data/site';
import type { ResolvedProject } from './publication';

export const defaultTitle = 'Rene-Marcel Lehner · Computational Physics and Physical AI';

export const defaultDescription =
  'Computational physicist building validated research systems and moving toward reliable robot learning. Research software, simulation studies, and robot hardware built and calibrated by hand.';

export const pageTitle = (title?: string): string =>
  title ? `${title} · ${site.name}` : defaultTitle;

interface JsonLd {
  '@context': string;
  [key: string]: unknown;
}

export const personSchema = (origin: string): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  jobTitle: 'Computational Physicist',
  email: `mailto:${site.email}`,
  url: origin,
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'TU Dortmund University' },
  address: { '@type': 'PostalAddress', addressLocality: 'Essen', addressCountry: 'DE' },
  sameAs: [site.github, site.linkedin],
});

/** Structured data for a resolved project (never for gated content). */
export const projectSchema = (project: ResolvedProject, canonicalUrl: string): JsonLd => {
  const isSoftware = project.data.id === 'blaze2d';
  return {
    '@context': 'https://schema.org',
    '@type': isSoftware ? 'SoftwareSourceCode' : 'CreativeWork',
    name: project.data.title,
    description: project.data.summary,
    url: canonicalUrl,
    author: { '@type': 'Person', name: site.name },
    ...(isSoftware && project.sourceUrlAllowed
      ? {
          codeRepository: project.data.links.find((l) => l.kind === 'source')?.href,
          programmingLanguage: ['Rust', 'Python'],
        }
      : {}),
  };
};

export const breadcrumbSchema = (
  origin: string,
  crumbs: Array<{ name: string; path: string }>,
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: new URL(crumb.path, origin).href,
  })),
});
