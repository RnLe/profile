/**
 * Single Zod source of truth for content collections and all four registries
 * (claims, artifacts, media, public project registry) plus owner receipts.
 * Imported by `src/content.config.ts` (Astro) and by the node-side validators
 * through `registry-io.ts`; schemas must never fork.
 */
import { z } from 'astro/zod';

/* ---------------------------------------------------------------- enums --- */

export const lifecycleEnum = z.enum([
  'released',
  'active-research',
  'research-continuation',
  'prototype',
  'hardware-qualified',
  'archived',
  'planned',
]);

export const evidenceLevelEnum = z.enum([
  'validated-result',
  'empirical-study',
  'implementation',
  'hardware-bring-up',
  'method-preview',
  'protocol',
  'negative-result',
  'archive',
]);

export const placementEnum = z.enum([
  'research-flagship',
  'research-selected',
  'research-current',
  'research-support',
  'academic-archive',
  'prototype-shelf',
  'hidden',
]);

export const publicationStateEnum = z.enum([
  'draft',
  'pending-owner-approval',
  'public',
  'blocked',
]);

export const sourceVisibilityEnum = z.enum(['public', 'private', 'mixed']);

/** Surfaces a claim may be rendered on. */
export const claimSurfaceEnum = z.enum([
  'home',
  'research-index',
  'project',
  'cv',
  'metadata',
]);

export const claimEvidenceStateEnum = z.enum([
  'draft',
  'prospective',
  'provisional',
  'verified',
  'released',
  'superseded',
  'retracted',
]);

export const claimTypeEnum = z.enum([
  'scope',
  'status',
  'result',
  'comparison',
  'limitation',
  'novelty',
  'restriction',
  'negative-result',
]);

export const claimPolicyEnum = z.enum(['allowed', 'scoped', 'project-only', 'forbidden']);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'expected kebab-case slug');
const sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'expected lowercase sha256 hex');

/* ------------------------------------------------------- project entries --- */

export const citationSchema = z.object({
  label: z.string().min(1),
  href: z.url().optional(),
  note: z.string().optional(),
});

export const projectLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  kind: z
    .enum([
      'site',
      'source',
      'report',
      'manuscript',
      'thesis',
      'slides',
      'data',
      'video',
      'reproduction',
      'package',
      'docs',
    ])
    .optional(),
  /** Page count of a document link, shown before its size. */
  pages: z.number().int().positive().optional(),
  /** File size in MB with one decimal, shown after a document link. */
  sizeMb: z.number().positive().optional(),
});

export type ProjectLink = z.infer<typeof projectLinkSchema>;

/** What a project is, for the index rail's type columns. */
export const projectKindEnum = z.enum(['academic', 'software', 'hardware']);
export type ProjectKind = z.infer<typeof projectKindEnum>;

export const projectFrontmatterSchema = z.object({
  id: slug,
  slug,
  title: z.string().min(1),
  /** One-line research question or contribution (card + hero). */
  oneLine: z.string().min(1).max(180),
  /** Terse list subtitle: one clause, no hedging room. */
  tagline: z.string().min(1).max(110).optional(),
  /** First calendar year of the work; drives sorting and the year label. */
  yearStart: z.number().int().min(2000).max(2100),
  /** Last calendar year; omitted while the work continues. */
  yearEnd: z.number().int().min(2000).max(2100).optional(),
  /** Academic, software, hardware: any combination, shown as icons on the index. */
  kinds: z.array(projectKindEnum).default([]),
  summary: z.string().min(1),
  placement: placementEnum,
  lifecycle: lifecycleEnum,
  evidenceLevel: evidenceLevelEnum,
  statusDate: isoDate,
  statusNote: z.string().min(1),
  publication: publicationStateEnum,
  sourceVisibility: sourceVisibilityEnum,
  /** First-person contribution statement. */
  role: z.string().min(1),
  collaborators: z.array(z.string()).default([]),
  domain: z.string().min(1),
  dateRange: z.string().min(1),
  methods: z.array(z.string()).default([]),
  applicationThemes: z.array(z.string()).default([]),
  citations: z.array(citationSchema).default([]),
  noveltyNote: z.string().min(1),
  claimIds: z.array(z.string()).default([]),
  mediaIds: z.array(z.string()).default([]),
  figureIds: z.array(z.string()).default([]),
  links: z.array(projectLinkSchema).default([]),
  related: z.array(slug).default([]),
  /** Current-research card fields (in-progress projects only). */
  currentState: z
    .object({
      exists: z.string().min(1),
      remains: z.string().min(1),
      nextGate: z.string().min(1),
    })
    .optional(),
});

export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;

/* ---------------------------------------------------------------- claims --- */

export const claimSchema = z.object({
  claim_id: z.string().regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/),
  project_id: slug,
  claim_type: claimTypeEnum,
  publication_policy: claimPolicyEnum,
  short_copy: z.string(),
  long_copy: z.string().default(''),
  scope: z.string().default(''),
  evidence_state: claimEvidenceStateEnum,
  model_or_artifact_version: z.string().default(''),
  measurement_context: z.string().default(''),
  source_paths: z.array(z.string()).default([]),
  source_urls: z.array(z.string()).default([]),
  source_commit: z.string().default(''),
  artifact_sha256: z.string().default(''),
  last_verified: isoDate,
  allowed_surfaces: z.array(claimSurfaceEnum).default([]),
  forbidden_surfaces: z.array(claimSurfaceEnum).default([]),
  supersedes: z.array(z.string()).default([]),
  review_triggers: z.array(z.string()).default([]),
  /** Exact phrases the production artifact must never contain (retractions). */
  forbidden_phrases: z.array(z.string()).default([]),
  notes: z.string().default(''),
});

export type ClaimRecord = z.infer<typeof claimSchema>;
export const claimsRegistrySchema = z.object({ claims: z.array(claimSchema) });

/* ------------------------------------------------------------- artifacts --- */

export const artifactKindEnum = z.enum([
  'cv',
  'thesis',
  'manuscript',
  'report',
  'slides',
  'certificate',
]);

export const academicStatusEnum = z.enum([
  'official-submission',
  'presentation-corrected',
  'research-continuation',
  'independent-manuscript',
  'historical-presentation',
  'not-applicable',
]);

export const artifactRecordSchema = z.object({
  id: slug,
  title: z.string().min(1),
  kind: artifactKindEnum,
  projectId: slug.optional(),
  version: z.string().min(1),
  publication: z.enum(['draft', 'public', 'on-request']),
  academicStatus: academicStatusEnum,
  resultChanges: z.boolean(),
  sourceArtifactId: slug.optional(),
  changeClasses: z.array(z.enum(['typography', 'layout', 'plot-style', 'editorial'])).optional(),
  scientificDiffReceipt: z.string().optional(),
  scientificDiffReviewedAt: isoDate.optional(),
  sourceDataChecksums: z.array(sha256).optional(),
  date: isoDate,
  file: z.string().optional(),
  sha256: sha256.optional(),
  pages: z.number().int().positive().optional(),
  bytes: z.number().int().positive().optional(),
  description: z.string().min(1),
  changelogHref: z.string().optional(),
});

export type ArtifactRecord = z.infer<typeof artifactRecordSchema>;
export const artifactsRegistrySchema = z.object({ records: z.array(artifactRecordSchema) });

/* ----------------------------------------------------------------- media --- */

export const mediaKindEnum = z.enum([
  'image',
  'poster',
  'video-loop',
  'evidence-video',
  'diagram',
  'sprite-atlas',
]);

export const mediaFileSchema = z.object({
  url: z.string().min(1),
  mimeType: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive(),
  sha256,
});

export const mediaEntrySchema = z.object({
  id: z.string().min(1),
  projectId: slug,
  kind: mediaKindEnum,
  files: z.array(mediaFileSchema).min(1),
  posterUrl: z.string().optional(),
  durationSeconds: z.number().positive().optional(),
  altText: z.string().min(1),
  caption: z.string().min(1),
  credit: z.string().optional(),
  evidenceType: z.string().min(1),
  supportsClaimIds: z.array(z.string()).default([]),
  sourceCommit: z.string().optional(),
  rights: z.enum(['owned', 'permitted', 'attributed', 'pending']),
  rightsReceipt: z.string().min(1),
  approvalRef: z.string().optional(),
  manifestSha256: sha256.optional(),
  toolchain: z.object({
    ffmpegVersion: z.string().optional(),
    sharpVersion: z.string().optional(),
    command: z.string().min(1),
  }),
  autoplayAllowed: z.boolean(),
});

export type MediaEntry = z.infer<typeof mediaEntrySchema>;
export const mediaRegistrySchema = z.object({ entries: z.array(mediaEntrySchema) });

/* --------------------------------------------- public project registry --- */

export const publicRegistryEntrySchema = z.object({
  id: slug,
  registryClass: z.enum(['public-origin', 'approved-private-origin']),
  repository: z
    .object({
      owner: z.string().min(1),
      name: z.string().min(1),
      visibilityAtAudit: z.enum(['public', 'private', 'unverified']),
      auditedCommit: z.string().optional(),
      auditedAt: isoDate.optional(),
    })
    .optional(),
  sourceVisibility: sourceVisibilityEnum,
  /** Whether a repository/source URL may be emitted for this project. */
  sourceUrlAllowed: z.boolean(),
  sourceExcerptAllowed: z.boolean().default(false),
  collaboratorPermission: z.enum(['not-applicable', 'pending', 'granted']),
  /** Owner-approval receipt IDs backing private-origin items. */
  approvalRefs: z.array(z.string()).default([]),
  /** Per-asset provenance references (media registry IDs audited for this project). */
  assetProvenanceRefs: z.array(z.string()).default([]),
  notes: z.string().default(''),
});

export type PublicRegistryEntry = z.infer<typeof publicRegistryEntrySchema>;
export const publicProjectRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  projects: z.array(publicRegistryEntrySchema),
});

/* -------------------------------------------------------- owner receipts --- */

export const ownerReceiptSchema = z.object({
  schemaVersion: z.literal(1),
  projectAuditId: z.string().min(1),
  decision: z.enum(['pending', 'approved', 'revoked', 'rejected']),
  approvedBy: z.literal('owner'),
  ownerApprovalRef: z.string().min(1),
  sourceCommit: z.string().regex(/^[0-9a-f]{40}$/),
  approvedAt: isoDate.nullable(),
  approvedItems: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum([
          'project-name',
          'route',
          'copy',
          'claim',
          'metric',
          'diagram',
          'screenshot',
          'video',
          'source-excerpt',
          'source-link',
          'academic-trace',
        ]),
        contentSha256: sha256,
        allowedSurfaces: z.array(z.string().min(1)).min(1),
      }),
    )
    .default([]),
});

export type OwnerReceipt = z.infer<typeof ownerReceiptSchema>;
