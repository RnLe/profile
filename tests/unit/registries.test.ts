import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { statusChip } from '../../src/lib/status';
import {
  loadArtifacts,
  loadClaims,
  loadMedia,
  loadOwnerReceipts,
  loadPublicRegistry,
} from '../../src/lib/registry-io';

const root = join(__dirname, '../..');

const runValidator = (script: string, validateRoot?: string) => {
  try {
    const stdout = execFileSync('pnpm', ['exec', 'tsx', script], {
      cwd: root,
      encoding: 'utf8',
      env: validateRoot ? { ...process.env, VALIDATE_ROOT: validateRoot } : process.env,
    });
    return { ok: true, output: stdout };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string };
    return { ok: false, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

describe('shipped registries', () => {
  it('claims registry parses and seeds the retraction as forbidden', () => {
    const claims = loadClaims(root);
    expect(claims.length).toBeGreaterThanOrEqual(15);
    const retraction = claims.find((c) => c.claim_id === 'MSL-MAGIC-070');
    expect(retraction?.evidence_state).toBe('retracted');
    expect(retraction?.publication_policy).toBe('forbidden');
    expect(retraction?.allowed_surfaces).toEqual([]);
    expect(retraction?.forbidden_phrases.length).toBeGreaterThan(0);
  });

  it('artifact registry parses with the thesis taxonomy and no public files yet', () => {
    const records = loadArtifacts(root);
    const ids = records.map((r) => r.id);
    for (const required of [
      'msc-submitted-2026',
      'msc-reader-v1-1',
      'msc-research-continuation',
      'msc-manuscript',
      'msc-slides',
      'cv',
    ]) {
      expect(ids).toContain(required);
    }
    expect(records.every((r) => r.publication !== 'public' || r.file)).toBe(true);
  });

  it('media and public registries parse; owner receipts default to empty', () => {
    expect(loadMedia(root)).toEqual([]);
    const registry = loadPublicRegistry(root);
    expect(registry.map((p) => p.id).sort()).toEqual([
      'blaze2d',
      'envelope-approximation',
      'recover-in-real-time',
      'residual-worlds',
      'swarm-dynamics',
    ]);
    expect(Array.isArray(loadOwnerReceipts(root))).toBe(true);
  });
});

describe('validate-claims (integration)', () => {
  it('passes on the shipped registry', () => {
    const result = runValidator('scripts/validate-claims.ts');
    expect(result.output).toContain('check:claims passed');
    expect(result.ok).toBe(true);
  });

  it('fails a poisoned registry that gives the retracted claim a renderable policy', () => {
    const temp = mkdtempSync(join(tmpdir(), 'claims-poison-'));
    try {
      mkdirSync(join(temp, 'src/data'), { recursive: true });
      const poisoned = readFileSync(join(root, 'src/data/claims.yaml'), 'utf8').replace(
        /(claim_id: MSL-MAGIC-070[\s\S]*?publication_policy:) forbidden/,
        '$1 allowed',
      );
      expect(poisoned).not.toBe(readFileSync(join(root, 'src/data/claims.yaml'), 'utf8'));
      writeFileSync(join(temp, 'src/data/claims.yaml'), poisoned);

      const result = runValidator('scripts/validate-claims.ts', temp);
      expect(result.ok).toBe(false);
      expect(result.output).toMatch(/retracted claims must have publication_policy 'forbidden'/);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it('fails a poisoned artifact registry that publishes a result-changing reader edition', () => {
    const temp = mkdtempSync(join(tmpdir(), 'artifacts-poison-'));
    try {
      mkdirSync(join(temp, 'src/data'), { recursive: true });
      cpSync(join(root, 'src/data/claims.yaml'), join(temp, 'src/data/claims.yaml'));
      // Public records are checked against their staged file, so the copy needs
      // the owner material too; without it every public record fails here and
      // the fixture stops isolating the one poisoned rule.
      cpSync(join(root, 'material/publication-source'), join(temp, 'material/publication-source'), {
        recursive: true,
      });
      const poisoned = readFileSync(join(root, 'src/data/artifacts.yaml'), 'utf8').replace(
        /(id: msc-reader-v1-1[\s\S]*?resultChanges:) false/,
        '$1 true',
      );
      writeFileSync(join(temp, 'src/data/artifacts.yaml'), poisoned);

      const result = runValidator('scripts/validate-documents.ts', temp);
      expect(result.ok).toBe(false);
      expect(result.output).toMatch(/must not change results/);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});

describe('statusChip', () => {
  it('maps the shipped lifecycle/evidence pairs to unambiguous labels', () => {
    expect(statusChip('released', 'validated-result').label).toBe('Validated release');
    expect(statusChip('active-research', 'method-preview').label).toBe(
      'Active research, results pending',
    );
    expect(statusChip('research-continuation', 'method-preview').label).toBe(
      'Research continuation',
    );
    expect(statusChip('prototype', 'hardware-bring-up').label).toBe('Hardware assembled');
    expect(statusChip('archived', 'negative-result').label).toBe('Archived');
  });

  it('never produces a prohibited ambiguous label', () => {
    const prohibited =
      /ongoing|almost complete|coming soon|research-grade|successful|finished|ready/i;
    const lifecycles = [
      'released',
      'active-research',
      'research-continuation',
      'prototype',
      'hardware-qualified',
      'archived',
      'planned',
    ] as const;
    const evidences = [
      'validated-result',
      'empirical-study',
      'implementation',
      'hardware-bring-up',
      'method-preview',
      'protocol',
      'negative-result',
      'archive',
    ] as const;
    for (const lifecycle of lifecycles) {
      for (const evidence of evidences) {
        expect(statusChip(lifecycle, evidence).label).not.toMatch(prohibited);
      }
    }
  });
});
