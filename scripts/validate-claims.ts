/** Claim-registry rules: see src/data/claims.yaml header for the list. */
import { knownProjectIds } from '../src/data/gated-projects';
import { loadClaims } from '../src/lib/registry-io';
import { Report, repoRoot } from './lib/report';

const report = new Report('check:claims');

try {
  const claims = loadClaims(repoRoot);
  const ids = new Set<string>();
  const known = new Set(knownProjectIds);

  for (const claim of claims) {
    const tag = `claim ${claim.claim_id}`;
    if (ids.has(claim.claim_id)) report.fail(`${tag}: duplicate claim_id`);
    ids.add(claim.claim_id);

    if (!known.has(claim.project_id)) {
      report.fail(`${tag}: unknown project_id '${claim.project_id}'`);
    }

    if (claim.evidence_state === 'retracted') {
      if (claim.publication_policy !== 'forbidden') {
        report.fail(`${tag}: retracted claims must have publication_policy 'forbidden'`);
      }
      if (claim.allowed_surfaces.length > 0) {
        report.fail(`${tag}: retracted claims must have empty allowed_surfaces`);
      }
    }

    if (claim.publication_policy === 'forbidden' && claim.allowed_surfaces.length > 0) {
      report.fail(`${tag}: policy 'forbidden' conflicts with non-empty allowed_surfaces`);
    }

    const isResultShaped = claim.claim_type === 'result' || claim.claim_type === 'comparison';

    if (
      isResultShaped &&
      claim.allowed_surfaces.includes('home') &&
      !['verified', 'released'].includes(claim.evidence_state)
    ) {
      report.fail(
        `${tag}: homepage result copy requires evidence_state verified|released (is '${claim.evidence_state}')`,
      );
    }

    if (
      isResultShaped &&
      claim.publication_policy !== 'forbidden' &&
      !['draft', 'prospective'].includes(claim.evidence_state) &&
      claim.measurement_context.trim() === ''
    ) {
      report.fail(`${tag}: result/comparison claims require measurement_context`);
    }

    for (const superseded of claim.supersedes) {
      if (!claims.some((c) => c.claim_id === superseded)) {
        report.fail(`${tag}: supersedes unknown claim '${superseded}'`);
      }
    }
  }
} catch (error) {
  report.fail((error as Error).message);
}

report.finish();
