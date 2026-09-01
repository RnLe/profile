import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { preparePublic, StagingError } from '../../scripts/prepare-public';

const sha = (content: string) => createHash('sha256').update(content).digest('hex');

let root: string;

const writeStaticLane = (files: Record<string, string>, manifest?: string) => {
  const staticDir = join(root, 'static-public-source');
  mkdirSync(staticDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const full = join(staticDir, name);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  const manifestBody =
    manifest ??
    `files:\n${Object.entries(files)
      .map(([name, content]) => `  - path: ${name}\n    sha256: ${sha(content)}`)
      .join('\n')}\n`;
  writeFileSync(join(staticDir, 'manifest.yaml'), manifestBody);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'staging-test-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('preparePublic', () => {
  it('stages manifest-listed files and writes robots + staging manifest', () => {
    writeStaticLane({ 'favicon.svg': '<svg/>', '.nojekyll': '' });
    const staged = preparePublic({ rootDir: root, siteUrl: 'https://example.org' });
    const out = join(root, '.generated-public');
    expect(readFileSync(join(out, 'favicon.svg'), 'utf8')).toBe('<svg/>');
    expect(readFileSync(join(out, 'robots.txt'), 'utf8')).toContain(
      'Sitemap: https://example.org/sitemap-index.xml',
    );
    const manifest = JSON.parse(readFileSync(join(root, '.staging-manifest.json'), 'utf8'));
    expect(manifest.files.map((f: { path: string }) => f.path)).toEqual(
      expect.arrayContaining(['favicon.svg', '.nojekyll', 'robots.txt']),
    );
    expect(staged.length).toBe(3);
    expect(existsSync(join(out, 'DRAFT-PREVIEW.txt'))).toBe(false);
  });

  it('rejects an unregistered file in the static lane (sentinel)', () => {
    writeStaticLane({ 'favicon.svg': '<svg/>' });
    writeFileSync(join(root, 'static-public-source', 'SENTINEL.pdf'), 'leak');
    expect(() => preparePublic({ rootDir: root })).toThrow(StagingError);
    expect(() => preparePublic({ rootDir: root })).toThrow(/Unregistered file/);
  });

  it('rejects a checksum mismatch', () => {
    writeStaticLane(
      { 'favicon.svg': '<svg/>' },
      `files:\n  - path: favicon.svg\n    sha256: ${'0'.repeat(64)}\n`,
    );
    expect(() => preparePublic({ rootDir: root })).toThrow(/Checksum mismatch/);
  });

  it('stages a public artifact from owner material only when checksum and bytes match', () => {
    writeStaticLane({ 'favicon.svg': '<svg/>' });
    const pdf = '%PDF-fake';
    mkdirSync(join(root, 'material/publication-source'), { recursive: true });
    writeFileSync(join(root, 'material/publication-source/cv.pdf'), pdf);
    mkdirSync(join(root, 'src/data'), { recursive: true });
    writeFileSync(
      join(root, 'src/data/artifacts.yaml'),
      `records:\n  - id: cv\n    kind: cv\n    publication: public\n    file: cv.pdf\n    sha256: ${sha(pdf)}\n    bytes: ${pdf.length}\n`,
    );
    preparePublic({ rootDir: root });
    expect(existsSync(join(root, '.generated-public/documents/cv/cv.pdf'))).toBe(true);
  });

  it('fails a public artifact whose file is missing from owner material', () => {
    writeStaticLane({ 'favicon.svg': '<svg/>' });
    mkdirSync(join(root, 'src/data'), { recursive: true });
    writeFileSync(
      join(root, 'src/data/artifacts.yaml'),
      `records:\n  - id: cv\n    kind: cv\n    publication: public\n    file: cv.pdf\n    sha256: ${'a'.repeat(64)}\n    bytes: 10\n`,
    );
    expect(() => preparePublic({ rootDir: root })).toThrow(/missing/);
  });

  it('ignores draft artifacts entirely', () => {
    writeStaticLane({ 'favicon.svg': '<svg/>' });
    mkdirSync(join(root, 'src/data'), { recursive: true });
    writeFileSync(
      join(root, 'src/data/artifacts.yaml'),
      'records:\n  - id: cv\n    kind: cv\n    publication: draft\n',
    );
    const staged = preparePublic({ rootDir: root });
    expect(staged.some((f) => f.path.startsWith('documents/'))).toBe(false);
  });
});
