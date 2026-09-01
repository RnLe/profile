import { describe, expect, it } from 'vitest';
import { gatedProjects } from '../../src/data/gated-projects';
import {
  buildProjectLinks,
  buildProjectList,
  compareEntries,
  linkIcon,
  yearLabel,
} from '../../src/lib/projects';
import type { ResolvedProject } from '../../src/lib/publication';
import type { ArtifactRecord, ProjectFrontmatter } from '../../src/lib/schemas';

/* All fixture names are synthetic, never real pending project names. */

const frontmatter = (overrides: Partial<ProjectFrontmatter> = {}): ProjectFrontmatter => ({
  id: 'project-nebula',
  slug: 'project-nebula',
  title: 'Project Nebula',
  oneLine: 'A synthetic fixture project.',
  summary: 'Synthetic fixture.',
  yearStart: 2026,
  kinds: [],
  placement: 'research-selected',
  lifecycle: 'released',
  evidenceLevel: 'validated-result',
  statusDate: '2026-08-30',
  statusNote: 'Fixture status.',
  publication: 'public',
  sourceVisibility: 'public',
  role: 'I built the fixture.',
  collaborators: [],
  domain: 'testing',
  dateRange: '2026',
  methods: [],
  applicationThemes: [],
  citations: [],
  noveltyNote: 'None claimed.',
  claimIds: [],
  mediaIds: [],
  figureIds: [],
  links: [],
  related: [],
  ...overrides,
});

const resolved = (
  overrides: Partial<ProjectFrontmatter> = {},
  artifacts: ArtifactRecord[] = [],
): ResolvedProject => {
  const data = frontmatter(overrides);
  return {
    data,
    registry: {
      id: data.id,
      registryClass: 'public-origin',
      sourceVisibility: 'public',
      sourceUrlAllowed: true,
      sourceExcerptAllowed: false,
      collaboratorPermission: 'not-applicable',
      approvalRefs: [],
      assetProvenanceRefs: [],
      notes: '',
    },
    sourceUrlAllowed: true,
    surfaces: { route: true, navigation: true, sitemap: true, structuredData: true, search: true },
    claims: [],
    media: [],
    artifacts,
  };
};

const artifact = (overrides: Partial<ArtifactRecord> = {}): ArtifactRecord => ({
  id: 'nebula-thesis',
  title: 'Project Nebula: thesis',
  kind: 'thesis',
  projectId: 'project-nebula',
  version: '2026',
  publication: 'public',
  academicStatus: 'official-submission',
  resultChanges: false,
  date: '2026-08-30',
  file: 'Nebula_Thesis.pdf',
  sha256: 'a'.repeat(64),
  bytes: 5634577,
  pages: 37,
  description: 'Synthetic fixture.',
  ...overrides,
});

describe('yearLabel', () => {
  it('renders one year, a closed range, and an open range with an en dash', () => {
    expect(yearLabel(2023, 2023)).toBe('2023');
    expect(yearLabel(2025, 2026)).toBe('2025 \u2013 2026');
    expect(yearLabel(2026)).toBe('2026 \u2013 present');
    for (const label of [yearLabel(2023, 2023), yearLabel(2025, 2026), yearLabel(2026)]) {
      expect(label).not.toContain('\u2014');
    }
  });
});

describe('compareEntries', () => {
  const key = (yearStart: number, yearEnd: number | undefined, title: string, gated = false) => ({
    yearStart,
    yearEnd,
    title,
    gated,
  });

  it('puts the latest start first', () => {
    expect(compareEntries(key(2026, undefined, 'A'), key(2025, undefined, 'B'))).toBeLessThan(0);
    expect(compareEntries(key(2023, 2023, 'A'), key(2025, 2026, 'B'))).toBeGreaterThan(0);
  });

  it('puts ongoing work before ended work in the same year', () => {
    expect(compareEntries(key(2025, undefined, 'Z'), key(2025, 2026, 'A'))).toBeLessThan(0);
  });

  it('never lets a placeholder displace a routed project of its year', () => {
    expect(compareEntries(key(2026, undefined, 'A', true), key(2026, undefined, 'Z'))).toBeGreaterThan(0);
  });

  it('falls back to the title', () => {
    expect(compareEntries(key(2026, undefined, 'Pulsar'), key(2026, undefined, 'Quasar'))).toBeLessThan(0);
  });
});

describe('buildProjectList', () => {
  const gatedIds = Object.keys(gatedProjects);

  it('sorts latest first and appends one placeholder per unresolved gated id', () => {
    const list = buildProjectList([
      resolved({ id: 'project-nebula', slug: 'project-nebula', title: 'Project Nebula', yearStart: 2025, yearEnd: 2026 }),
      resolved({ id: 'project-quasar', slug: 'project-quasar', title: 'Project Quasar', yearStart: 2026 }),
      resolved({ id: 'project-pulsar', slug: 'project-pulsar', title: 'Project Pulsar', yearStart: 2023, yearEnd: 2023 }),
    ]);
    const routed = list.filter((entry) => entry.kind === 'project').map((entry) => entry.title);
    expect(routed).toEqual(['Project Quasar', 'Project Nebula', 'Project Pulsar']);

    const gated = list.filter((entry) => entry.kind === 'gated');
    expect(gated.map((entry) => entry.id).sort()).toEqual([...gatedIds].sort());
    for (const entry of gated) {
      expect(entry.status.label).toBe('Release preparation');
      expect(entry.yearLabel).toBe(String(gatedProjects[entry.id].year));
      // A placeholder never precedes a routed project that started the same year.
      const sameYearRouted = list.findIndex(
        (other) => other.kind === 'project' && other.yearStart === entry.yearStart,
      );
      if (sameYearRouted >= 0) expect(list.indexOf(entry)).toBeGreaterThan(sameYearRouted);
    }
  });

  it('drops the placeholder once the gated project resolves', () => {
    const id = gatedIds[0];
    const list = buildProjectList([resolved({ id, slug: id, title: 'Resolved gate' })]);
    expect(list.filter((entry) => entry.kind === 'gated').map((entry) => entry.id)).not.toContain(id);
    expect(list.some((entry) => entry.kind === 'project' && entry.id === id)).toBe(true);
  });

  it('carries the year label, subtitle, and status chip of a routed project', () => {
    const entry = buildProjectList([
      resolved({ yearStart: 2025, yearEnd: 2026, tagline: 'Terse line.', lifecycle: 'archived', evidenceLevel: 'negative-result' }),
    ]).find((candidate) => candidate.kind === 'project');
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entry.yearLabel).toBe('2025 \u2013 2026');
    expect(entry.status.label).toBe('Archived');
    if (entry.kind === 'project') {
      expect(entry.subtitle).toBe('Terse line.');
      expect(entry.href).toBe('/projects/project-nebula/');
    }
  });
});

describe('buildProjectLinks', () => {
  it('lists staged documents first, then authored links in authored order', () => {
    const project = resolved(
      {
        links: [
          { label: 'Website', href: 'https://example.org/nebula/', kind: 'site' },
          { label: 'Technical report', href: 'https://example.org/nebula/report/', kind: 'docs' },
          { label: 'Repository', href: 'https://example.org/git/nebula', kind: 'source' },
          { label: 'Package', href: 'https://example.org/pkg/nebula', kind: 'package' },
          { label: 'Video', href: 'https://example.org/nebula.mp4', kind: 'video' },
          { label: 'Report', href: 'https://example.org/nebula.pdf', kind: 'report', pages: 16, sizeMb: 0.7 },
          { label: 'Dataset', href: 'https://example.org/nebula-data/', kind: 'data' },
        ],
      },
      [
        artifact(),
        artifact({
          id: 'nebula-slides',
          kind: 'slides',
          academicStatus: 'historical-presentation',
          file: 'Nebula_Slides.pdf',
          bytes: 7118826,
          pages: 54,
        }),
        artifact({ id: 'nebula-report', kind: 'report', publication: 'draft', file: undefined, bytes: undefined }),
      ],
    );
    const links = buildProjectLinks(project);
    expect(links.map((link) => link.label)).toEqual([
      'Thesis',
      'Defense slides',
      'Website',
      'Technical report',
      'Repository',
      'Package',
      'Video',
      'Report',
      'Dataset',
    ]);
    expect(links[0]).toEqual({
      label: 'Thesis',
      href: '/documents/thesis/Nebula_Thesis.pdf',
      icon: 'file-pdf',
      meta: '37p, 5.4 MB',
      external: false,
    });
    expect(links[1].meta).toBe('6.8 MB');
    expect(links.map((link) => link.icon)).toEqual([
      'file-pdf',
      'file-pdf',
      'globe',
      'globe',
      'github',
      'package',
      'play',
      'file-pdf',
      'globe',
    ]);
    expect(links[7].meta).toBe('16p, 0.7 MB');
    expect(links[2].meta).toBeUndefined();
    expect(links.slice(2).every((link) => link.external)).toBe(true);
  });

  it('picks the marker from the file type first and the kind second', () => {
    expect(linkIcon('site', 'https://example.org/paper.pdf')).toBe('file-pdf');
    expect(linkIcon('source', 'https://example.org/git')).toBe('github');
    expect(linkIcon(undefined, 'https://example.org/')).toBe('globe');
  });
});
