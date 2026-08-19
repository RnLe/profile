/** Media-manifest rules: rights, posters, claim linkage, provenance. */
import { knownProjectIds } from '../src/data/gated-projects';
import { loadClaims, loadMedia } from '../src/lib/registry-io';
import { Report, repoRoot } from './lib/report';

const report = new Report('check:media');

try {
  const media = loadMedia(repoRoot);
  const claims = new Set(loadClaims(repoRoot).map((c) => c.claim_id));
  const known = new Set(knownProjectIds);
  const ids = new Set<string>();

  for (const entry of media) {
    const tag = `media ${entry.id}`;
    if (ids.has(entry.id)) report.fail(`${tag}: duplicate id`);
    ids.add(entry.id);

    if (!known.has(entry.projectId)) {
      report.fail(`${tag}: unknown projectId '${entry.projectId}'`);
    }
    if (entry.kind === 'video-loop' || entry.kind === 'evidence-video') {
      if (!entry.posterUrl) report.fail(`${tag}: video entries require posterUrl`);
      if (!entry.durationSeconds) report.fail(`${tag}: video entries require durationSeconds`);
      if (entry.kind === 'evidence-video' && entry.autoplayAllowed) {
        report.fail(`${tag}: evidence videos must not autoplay`);
      }
    }
    for (const claimId of entry.supportsClaimIds) {
      if (!claims.has(claimId)) report.fail(`${tag}: unknown claim '${claimId}'`);
    }
  }
} catch (error) {
  report.fail((error as Error).message);
}

report.finish();
