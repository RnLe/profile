/**
 * resolvePublication: the single authority deciding what may render.
 *
 * Every output surface (routes, cards, navigation, sitemap, structured data,
 * search payloads, staging, dist inspection) consumes resolved records only.
 * The default is exclusion: a project renders only when every gate passes.
 * Owner receipts can only come from ignored owner-only material; when absent,
 * the receipt set is empty and every private-origin item fails closed.
 */
import type {
  ArtifactRecord,
  ClaimRecord,
  MediaEntry,
  OwnerReceipt,
  ProjectFrontmatter,
  PublicRegistryEntry,
} from './schemas';

export interface PublicationContext {
  registry: PublicRegistryEntry[];
  receipts: OwnerReceipt[];
  claims: ClaimRecord[];
  media: MediaEntry[];
  artifacts: ArtifactRecord[];
}

export interface PublicationFailure {
  id: string;
  reason: string;
}

export interface SurfacePermissions {
  route: boolean;
  navigation: boolean;
  sitemap: boolean;
  structuredData: boolean;
  search: boolean;
}

export interface ResolvedProject {
  data: ProjectFrontmatter;
  registry: PublicRegistryEntry;
  /** Repository/source URL may be emitted only when this is true. */
  sourceUrlAllowed: boolean;
  surfaces: SurfacePermissions;
  claims: ClaimRecord[];
  media: MediaEntry[];
  artifacts: ArtifactRecord[];
}

export type Resolution<T> =
  | { ok: true; value: T }
  | { ok: false; failures: PublicationFailure[] };

const RENDERABLE_CLAIM_STATES = new Set(['prospective', 'provisional', 'verified', 'released']);

const approvedReceiptItems = (receipts: OwnerReceipt[], auditId: string) =>
  receipts
    .filter((r) => r.projectAuditId === auditId && r.decision === 'approved')
    .flatMap((r) => r.approvedItems);

export function resolvePublication(
  project: { data: ProjectFrontmatter },
  ctx: PublicationContext,
): Resolution<ResolvedProject> {
  const failures: PublicationFailure[] = [];
  const { data } = project;
  const fail = (reason: string) => failures.push({ id: data.id, reason });

  if (data.publication !== 'public') {
    fail(`publication state is '${data.publication}', so it is excluded from every output`);
    return { ok: false, failures };
  }

  const registry = ctx.registry.find((entry) => entry.id === data.id);
  if (!registry) {
    fail('no tracked public-registry record; public content requires a registry entry');
    return { ok: false, failures };
  }

  if (data.placement === 'hidden') {
    fail('placement is hidden, so it cannot be public');
  }

  // Authority-conflict check: source visibility lives in both records and must agree.
  if (registry.sourceVisibility !== data.sourceVisibility) {
    fail(
      `sourceVisibility conflict: content says '${data.sourceVisibility}', registry says '${registry.sourceVisibility}'`,
    );
  }

  // Source links require explicit registry permission.
  if (!registry.sourceUrlAllowed) {
    const sourceLinks = data.links.filter((l) => l.kind === 'source' || l.kind === 'package');
    if (sourceLinks.length > 0) {
      fail(
        `source links present (${sourceLinks.map((l) => l.label).join(', ')}) but registry sourceUrlAllowed=false`,
      );
    }
  }

  // Private-origin case studies require verified owner receipts.
  if (registry.registryClass === 'approved-private-origin') {
    const items = approvedReceiptItems(ctx.receipts, data.id);
    if (items.length === 0) {
      fail('private-origin case study without an approved owner receipt (fails closed)');
    }
  }

  // Claims: must exist, must not be retracted/superseded, must allow rendering.
  const claims: ClaimRecord[] = [];
  for (const claimId of data.claimIds) {
    const claim = ctx.claims.find((c) => c.claim_id === claimId);
    if (!claim) {
      fail(`references unknown claim '${claimId}'`);
      continue;
    }
    if (claim.evidence_state === 'retracted' || claim.evidence_state === 'superseded') {
      fail(`references ${claim.evidence_state} claim '${claimId}'`);
      continue;
    }
    if (!RENDERABLE_CLAIM_STATES.has(claim.evidence_state)) {
      // draft claims may be listed for tracking but never render; keep them out
      // of the resolved set without failing the project.
      continue;
    }
    claims.push(claim);
  }

  // Media: must exist with cleared rights.
  const media: MediaEntry[] = [];
  for (const mediaId of data.mediaIds) {
    const entry = ctx.media.find((m) => m.id === mediaId);
    if (!entry) {
      fail(`references unknown media '${mediaId}'`);
      continue;
    }
    if (entry.rights === 'pending') {
      fail(`media '${mediaId}' has pending rights`);
      continue;
    }
    media.push(entry);
  }

  const artifacts = ctx.artifacts.filter(
    (record) => record.projectId === data.id && record.publication === 'public',
  );

  if (failures.length > 0) return { ok: false, failures };

  return {
    ok: true,
    value: {
      data,
      registry,
      sourceUrlAllowed: registry.sourceUrlAllowed,
      surfaces: {
        route: true,
        navigation: true,
        sitemap: true,
        structuredData: true,
        search: true,
      },
      claims,
      media,
      artifacts,
    },
  };
}

export interface ResolvedSets {
  projects: ResolvedProject[];
  excludedProjects: PublicationFailure[][];
}

export function resolveAll(
  projects: Array<{ data: ProjectFrontmatter }>,
  ctx: PublicationContext,
): ResolvedSets {
  const resolvedProjects: ResolvedProject[] = [];
  const excludedProjects: PublicationFailure[][] = [];
  for (const project of projects) {
    const result = resolvePublication(project, ctx);
    if (result.ok) resolvedProjects.push(result.value);
    else excludedProjects.push(result.failures);
  }

  return { projects: resolvedProjects, excludedProjects };
}
