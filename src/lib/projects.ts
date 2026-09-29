/**
 * The project lists: ordering, year labels, the route-gated placeholder, and
 * the CV-style link row of every project. Pure and Astro-free so the rules are
 * unit-tested; components apply withBase to the root-relative paths returned
 * here.
 */
import { plain } from './marks';
import { gatedProjects, type GatedProject } from '../data/gated-projects';
import { documentMeta, resolveDocument } from './artifact-links';
import type { IconName } from './icons';
import type { ResolvedProject } from './publication';
import type { ArtifactRecord, ProjectKind, ProjectLink } from './schemas';
import { releasePreparationChip, statusChip, type Activity, type StatusChipModel } from './status';

/** Root-relative case-study route. */
export const projectRoute = (slug: string): string => `/projects/${slug}/`;

/** "2023", "2025 – 2026", or "2026 – present" (an en dash, never an em dash). */
export function yearLabel(yearStart: number, yearEnd?: number): string {
  if (yearEnd === undefined) return `${yearStart} \u2013 present`;
  if (yearEnd === yearStart) return String(yearStart);
  return `${yearStart} \u2013 ${yearEnd}`;
}

export interface ProjectLinkItem {
  label: string;
  /** Absolute URL for an external target, root-relative path for a staged document. */
  href: string;
  icon: IconName;
  /** Root-relative path of a project's own mark, drawn in place of the icon. */
  mark?: string;
  /** "16p, 0.7 MB": length before size, documents only. */
  meta?: string;
  external: boolean;
  /** Set in bold: a thesis, the document a reader of the row looks for first. */
  emphasis?: boolean;
  /** Source code or a package: the case-study header gives these a row of their own. */
  code?: boolean;
  /** A project's own website, opened in a new tab. */
  newTab?: boolean;
}

/** Project marks an authored link may carry, as served from the static lane. */
const MARKS = { blaze2d: '/icons/blaze.svg' } as const;

interface EntryBase {
  id: string;
  title: string;
  /** The rail's name for it, when the title is long. */
  shortTitle?: string;
  yearStart: number;
  yearEnd?: number;
  yearLabel: string;
  status: StatusChipModel;
  /** Robotics, learning, theory: rendered as the index rail's type columns. */
  kinds: ProjectKind[];
  /** Per kind, keywords on what the project covered there. */
  focus: Partial<Record<ProjectKind, string>>;
}

export interface RoutedEntry extends EntryBase {
  kind: 'project';
  slug: string;
  /** Root-relative route, or the absolute URL of a case study hosted elsewhere. */
  href: string;
  /** The case study lives on the project's own site: link out, never open the modal. */
  external: boolean;
  /** A short label over the title, e.g. 'Master Thesis'. */
  label?: string;
  /** The marker at the top right: in active research, or archived. */
  activity?: Activity;
  /**
   * Registered claims the card shows, in order: the short copy, and for a
   * scoped result its registered scope, which must stand beside it.
   */
  cardClaims: { id: string; type: string; text: string; scope?: string }[];
  subtitle: string;
  summary: string;
  role?: string;
  links: ProjectLinkItem[];
  project: ResolvedProject;
}

/** A route-gated project: sanctioned name, question, status, and public links. */
export interface GatedEntry extends EntryBase {
  kind: 'gated';
  question: string;
  statusText: string;
  links: ProjectLinkItem[];
}

export type ProjectListEntry = RoutedEntry | GatedEntry;

export interface SortKey {
  yearStart: number;
  yearEnd?: number;
  title: string;
  gated: boolean;
}

/** Latest start first; within a year the ongoing before the ended, routed before gated, then by title. */
export function compareEntries(a: SortKey, b: SortKey): number {
  if (a.yearStart !== b.yearStart) return b.yearStart - a.yearStart;
  const aOpen = a.yearEnd === undefined;
  const bOpen = b.yearEnd === undefined;
  if (aOpen !== bOpen) return aOpen ? -1 : 1;
  if (a.gated !== b.gated) return a.gated ? 1 : -1;
  return a.title.localeCompare(b.title, 'en');
}

const sortKey = (entry: ProjectListEntry): SortKey => ({
  yearStart: entry.yearStart,
  yearEnd: entry.yearEnd,
  title: entry.title,
  gated: entry.kind === 'gated',
});

/** Short labels for staged documents, the vocabulary the CV uses. */
const documentLabel = (record: ArtifactRecord): string => {
  switch (record.kind) {
    case 'thesis':
      return 'Thesis';
    case 'manuscript':
      return 'Manuscript';
    case 'report':
      // The post-submission edition is the thesis a reader is looking for, and
      // the CV names it the same way. Its own record and page state plainly
      // that it is not the examined submission.
      return record.academicStatus === 'research-continuation' ? 'Thesis' : 'Report';
    case 'slides':
      return record.academicStatus === 'historical-presentation' ? 'Defense slides' : 'Slides';
    default:
      return record.title;
  }
};

const PDF_HREF = /\.pdf($|[?#])/i;
const PYPI_HREF = /^https?:\/\/(www\.)?pypi\.org\//i;
const EXTERNAL_HREF = /^https?:\/\//;

/** The marker in front of an authored link. */
export function linkIcon(kind: ProjectLink['kind'], href: string): IconName {
  if (PDF_HREF.test(href)) return 'file-pdf';
  switch (kind) {
    case 'source':
      return 'github';
    case 'package':
      // A Python package is marked with the Python logo; any other registry
      // keeps the generic package glyph.
      return PYPI_HREF.test(href) ? 'pypi' : 'package';
    case 'video':
      return 'play';
    default:
      return 'globe';
  }
}

/** Authored links, in authored order, as the row renders them. */
export function authoredLinks(links: ProjectLink[]): ProjectLinkItem[] {
  return links.map((link): ProjectLinkItem => {
    const meta = documentMeta(link.pages, link.sizeMb);
    return {
      label: link.label,
      href: link.href,
      icon: linkIcon(link.kind, link.href),
      ...(link.mark ? { mark: MARKS[link.mark] } : {}),
      ...(meta ? { meta } : {}),
      external: EXTERNAL_HREF.test(link.href),
      ...(link.kind === 'thesis' ? { emphasis: true } : {}),
      ...(link.kind === 'source' || link.kind === 'package' ? { code: true } : {}),
      ...(link.kind === 'site' ? { newTab: true } : {}),
    };
  });
}

/**
 * The link row of a project: its staged public documents first (the registry
 * is the gate: no public, checksummed file, no link), then the authored links
 * in authored order. Source links of projects without registry permission
 * never reach here; the publication resolver rejects them earlier.
 */
export function buildProjectLinks(project: ResolvedProject): ProjectLinkItem[] {
  const documents = project.artifacts.flatMap((record): ProjectLinkItem[] => {
    const facts = resolveDocument(record);
    if (!facts) return [];
    const label = documentLabel(record);
    return [
      {
        label,
        href: facts.path,
        icon: 'file-pdf',
        meta: documentMeta(facts.pages, facts.sizeMb),
        external: false,
        ...(label === 'Thesis' ? { emphasis: true } : {}),
      },
    ];
  });
  const listed = new Set(documents.map((item) => item.href));
  const authored = authoredLinks(project.data.links.filter((link) => !listed.has(link.href)));
  return [...documents, ...authored];
}

const toRoutedEntry = (project: ResolvedProject): RoutedEntry => {
  const { data } = project;
  return {
    kind: 'project',
    id: data.id,
    slug: data.slug,
    href: data.caseStudyUrl ?? projectRoute(data.slug),
    external: data.caseStudyUrl !== undefined,
    ...(data.listLabel ? { label: data.listLabel } : {}),
    ...(data.activity ? { activity: data.activity } : {}),
    cardClaims: data.cardClaimIds.flatMap((id) => {
      const claim = project.claims.find((c) => c.claim_id === id);
      if (!claim) return [];
      const scoped = claim.publication_policy === 'scoped' && claim.scope.trim() !== '';
      return [
        {
          id,
          type: claim.claim_type,
          text: claim.short_copy,
          ...(scoped ? { scope: claim.scope.trim() } : {}),
        },
      ];
    }),
    title: data.title,
    ...(data.shortTitle ? { shortTitle: data.shortTitle } : {}),
    subtitle: data.tagline ?? plain(data.oneLine),
    yearStart: data.yearStart,
    yearEnd: data.yearEnd,
    yearLabel: yearLabel(data.yearStart, data.yearEnd),
    status: statusChip(data.lifecycle, data.evidenceLevel),
    kinds: data.kinds,
    focus: data.focus,
    summary: data.summary,
    role: data.role,
    links: buildProjectLinks(project),
    project,
  };
};

/**
 * Every project in list order: the resolved projects plus a placeholder for
 * each route-gated id that has not resolved yet. Once a gated project's
 * content file and registry record exist, its resolved entry replaces the
 * placeholder without any further change. A placeholder shows the bare start
 * year: nothing about its timeline is claimed.
 */
export function buildProjectList(
  resolved: ResolvedProject[],
  gates: Record<string, GatedProject> = gatedProjects,
): ProjectListEntry[] {
  const resolvedIds = new Set(resolved.map((project) => project.data.id));
  const routed = resolved.map(toRoutedEntry);
  const gated = Object.entries(gates)
    .filter(([id]) => !resolvedIds.has(id))
    .map(
      ([id, gate]): GatedEntry => ({
        kind: 'gated',
        id,
        title: gate.title,
        question: gate.question,
        statusText: gate.statusText,
        yearStart: gate.year,
        yearLabel: String(gate.year),
        status: releasePreparationChip,
        kinds: gate.kinds,
        focus: {},
        links: authoredLinks(gate.links),
      }),
    );
  return [...routed, ...gated].sort((a, b) => compareEntries(sortKey(a), sortKey(b)));
}

/**
 * The same entries with the given ids moved to the front, in the order given;
 * everything else keeps its place. The landing page leads with its picks.
 */
export function pinFirst(entries: ProjectListEntry[], ids: readonly string[]): ProjectListEntry[] {
  const pinned = ids.flatMap((id) => entries.filter((entry) => entry.id === id));
  return [...pinned, ...entries.filter((entry) => !ids.includes(entry.id))];
}
