/**
 * Artifact-registry rules, including the thesis taxonomy: publication/file
 * discipline, presentation-corrected constraints, official-submission
 * uniqueness, and checksum verification for public files.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { knownProjectIds } from '../src/data/gated-projects';
import { loadArtifacts } from '../src/lib/registry-io';
import { Report, repoRoot } from './lib/report';

const report = new Report('check:documents');

try {
  const records = loadArtifacts(repoRoot);
  const known = new Set(knownProjectIds);
  const ids = new Set<string>();
  const versions = new Set<string>();
  const officials = new Set<string>();

  for (const record of records) {
    const tag = `artifact ${record.id}`;
    if (ids.has(record.id)) report.fail(`${tag}: duplicate id`);
    ids.add(record.id);

    const versionKey = `${record.projectId ?? '-'}/${record.kind}/${record.version}`;
    if (versions.has(versionKey)) report.fail(`${tag}: duplicate kind/version (${versionKey})`);
    versions.add(versionKey);

    if (record.projectId && !known.has(record.projectId)) {
      report.fail(`${tag}: unknown projectId '${record.projectId}'`);
    }
    if (record.sourceArtifactId && !records.some((r) => r.id === record.sourceArtifactId)) {
      report.fail(`${tag}: unknown sourceArtifactId '${record.sourceArtifactId}'`);
    }

    if (record.academicStatus === 'official-submission') {
      const key = `${record.projectId ?? '-'}/${record.kind}`;
      if (officials.has(key)) {
        report.fail(`${tag}: second official-submission for ${key}; the archive is immutable`);
      }
      officials.add(key);
      if (record.resultChanges) report.fail(`${tag}: official submission cannot have resultChanges`);
      if (record.sourceArtifactId) {
        report.fail(`${tag}: official submission cannot derive from another artifact`);
      }
    }

    if (record.academicStatus === 'presentation-corrected') {
      if (record.resultChanges) {
        report.fail(
          `${tag}: presentation-corrected editions must not change results; that belongs to the research continuation`,
        );
      }
      if (!record.sourceArtifactId) {
        report.fail(`${tag}: presentation-corrected requires sourceArtifactId`);
      }
      if (record.publication !== 'draft' && !(record.scientificDiffReceipt && record.scientificDiffReviewedAt)) {
        report.fail(
          `${tag}: publishing a presentation-corrected edition requires a human-reviewed scientific-diff receipt`,
        );
      }
    }

    if (record.academicStatus === 'research-continuation' && record.kind === 'thesis') {
      report.fail(`${tag}: the research continuation must not be labeled as a thesis artifact`);
    }

    if (record.publication === 'public') {
      if (!record.file || !record.sha256 || record.bytes === undefined) {
        report.fail(`${tag}: public artifacts require file, sha256, and bytes`);
        continue;
      }
      const source = join(repoRoot, 'material/publication-source', record.file);
      if (!existsSync(source)) {
        report.fail(`${tag}: public file missing at ${source}`);
        continue;
      }
      if (statSync(source).size !== record.bytes) {
        report.fail(`${tag}: byte-size mismatch for ${record.file}`);
      }
      const actual = createHash('sha256').update(readFileSync(source)).digest('hex');
      if (actual !== record.sha256) report.fail(`${tag}: sha256 mismatch for ${record.file}`);
    }
  }
} catch (error) {
  report.fail((error as Error).message);
}

report.finish();
