/**
 * Content validation: project entries against schemas, ID/slug discipline,
 * referential integrity, and full publication resolution for every public
 * entry.
 */
import { basename } from 'node:path';
import { knownProjectIds } from '../src/data/gated-projects';
import { resolvePublication } from '../src/lib/publication';
import { loadProjects, loadRegistries } from '../src/lib/registry-io';
import { Report, repoRoot } from './lib/report';

const report = new Report('check:content');

/** Link kinds that describe a document, the only links allowed to state pages or size. */
const DOCUMENT_LINK_KINDS = new Set(['thesis', 'manuscript', 'report', 'slides']);

try {
  const projects = loadProjects(repoRoot);
  const registries = loadRegistries(repoRoot);
  const known = new Set(knownProjectIds);
  const claimIds = new Set(registries.claims.map((c) => c.claim_id));
  const mediaIds = new Set(registries.media.map((m) => m.id));

  const seenProjectIds = new Set<string>();
  for (const { file, data, body } of projects) {
    const tag = `project ${data.id}`;
    if (seenProjectIds.has(data.id)) report.fail(`${tag}: duplicate id`);
    seenProjectIds.add(data.id);

    if (data.id !== data.slug) report.fail(`${tag}: id and slug must match`);
    if (basename(file, '.md') !== data.slug) {
      report.fail(`${tag}: filename must equal slug (${basename(file)})`);
    }
    if (!known.has(data.id)) {
      report.fail(`${tag}: not in the known project id list (src/data/gated-projects.ts)`);
    }
    for (const related of data.related) {
      if (!known.has(related)) report.fail(`${tag}: unknown related id '${related}'`);
      if (related === data.id) report.fail(`${tag}: related must not self-reference`);
    }
    if (data.yearEnd !== undefined && data.yearEnd < data.yearStart) {
      report.fail(`${tag}: yearEnd precedes yearStart`);
    }
    for (const link of data.links) {
      const isDocument =
        DOCUMENT_LINK_KINDS.has(link.kind ?? '') || /\.pdf($|[?#])/i.test(link.href);
      if ((link.pages !== undefined || link.sizeMb !== undefined) && !isDocument) {
        report.fail(`${tag}: link '${link.label}' states pages or size but is not a document`);
      }
    }
    for (const claimId of data.claimIds) {
      if (!claimIds.has(claimId)) report.fail(`${tag}: unknown claim '${claimId}'`);
    }
    for (const mediaId of data.mediaIds) {
      if (!mediaIds.has(mediaId)) report.fail(`${tag}: unknown media '${mediaId}'`);
    }
    if (body.trim().length < 200) {
      report.fail(`${tag}: body too short for the project-page contract`);
    }

    if (data.publication === 'public') {
      const result = resolvePublication({ data }, { ...registries });
      if (!result.ok) {
        for (const failure of result.failures) report.fail(`${tag}: ${failure.reason}`);
      }
    }
  }

} catch (error) {
  report.fail((error as Error).message);
}

report.finish();
