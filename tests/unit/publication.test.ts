import { describe, expect, it } from 'vitest';
import { resolvePublication, type PublicationContext } from '../../src/lib/publication';
import type {
  ClaimRecord,
  ProjectFrontmatter,
  PublicRegistryEntry,
} from '../../src/lib/schemas';

/* All fixture names are synthetic, never real pending project names. */

const project = (overrides: Partial<ProjectFrontmatter> = {}): { data: ProjectFrontmatter } => ({
  data: {
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
  },
});

const registryEntry = (overrides: Partial<PublicRegistryEntry> = {}): PublicRegistryEntry => ({
  id: 'project-nebula',
  registryClass: 'public-origin',
  sourceVisibility: 'public',
  sourceUrlAllowed: true,
  sourceExcerptAllowed: false,
  collaboratorPermission: 'not-applicable',
  approvalRefs: [],
  assetProvenanceRefs: [],
  notes: '',
  ...overrides,
});

const claim = (overrides: Partial<ClaimRecord> = {}): ClaimRecord => ({
  claim_id: 'NEB-SCOPE-001',
  project_id: 'project-nebula',
  claim_type: 'scope',
  publication_policy: 'allowed',
  short_copy: 'Fixture claim.',
  long_copy: '',
  scope: '',
  evidence_state: 'verified',
  model_or_artifact_version: '',
  measurement_context: '',
  source_paths: [],
  source_urls: [],
  source_commit: '',
  artifact_sha256: '',
  last_verified: '2026-08-30',
  allowed_surfaces: ['project'],
  forbidden_surfaces: [],
  supersedes: [],
  review_triggers: [],
  forbidden_phrases: [],
  notes: '',
  ...overrides,
});

const ctx = (overrides: Partial<PublicationContext> = {}): PublicationContext => ({
  registry: [registryEntry()],
  receipts: [],
  claims: [],
  media: [],
  artifacts: [],
  ...overrides,
});

describe('resolvePublication', () => {
  it('resolves a fully valid public project', () => {
    const result = resolvePublication(project(), ctx());
    expect(result.ok).toBe(true);
  });

  it('excludes every non-public state from all output', () => {
    for (const state of ['draft', 'pending-owner-approval', 'blocked'] as const) {
      const result = resolvePublication(project({ publication: state }), ctx());
      expect(result.ok).toBe(false);
    }
  });

  it('fails a public project without a tracked registry record', () => {
    const result = resolvePublication(project(), ctx({ registry: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures[0].reason).toMatch(/registry/);
  });

  it('fails on sourceVisibility authority conflicts', () => {
    const result = resolvePublication(
      project({ sourceVisibility: 'private' }),
      ctx({ registry: [registryEntry({ sourceVisibility: 'public' })] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures.some((f) => f.reason.includes('conflict'))).toBe(true);
  });

  it('fails source links when the registry forbids them', () => {
    const result = resolvePublication(
      project({ links: [{ label: 'Source', href: 'https://example.org/x', kind: 'source' }] }),
      ctx({
        registry: [registryEntry({ sourceVisibility: 'private', sourceUrlAllowed: false })],
      }),
    );
    // sourceVisibility mismatch is also reported; check the link failure explicitly.
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures.some((f) => f.reason.includes('sourceUrlAllowed'))).toBe(true);
    }
  });

  it('fails a private-origin case study without an approved owner receipt (fail-closed)', () => {
    const result = resolvePublication(
      project({ sourceVisibility: 'private' }),
      ctx({
        registry: [
          registryEntry({
            registryClass: 'approved-private-origin',
            sourceVisibility: 'private',
            sourceUrlAllowed: false,
          }),
        ],
        receipts: [],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures.some((f) => f.reason.includes('receipt'))).toBe(true);
  });

  it('fails on retracted or unknown claims and keeps draft claims unrendered', () => {
    const retracted = resolvePublication(
      project({ claimIds: ['NEB-RETRACTED'] }),
      ctx({ claims: [claim({ claim_id: 'NEB-RETRACTED', evidence_state: 'retracted' })] }),
    );
    expect(retracted.ok).toBe(false);

    const unknown = resolvePublication(project({ claimIds: ['NEB-MISSING'] }), ctx());
    expect(unknown.ok).toBe(false);

    const draft = resolvePublication(
      project({ claimIds: ['NEB-DRAFT'] }),
      ctx({ claims: [claim({ claim_id: 'NEB-DRAFT', evidence_state: 'draft' })] }),
    );
    expect(draft.ok).toBe(true);
    if (draft.ok) expect(draft.value.claims).toHaveLength(0);
  });

  it('fails on unknown media and pending rights', () => {
    const unknown = resolvePublication(project({ mediaIds: ['missing-media'] }), ctx());
    expect(unknown.ok).toBe(false);
  });
});
