import { describe, expect, it } from 'vitest';
import {
  bytesToMb,
  documentMeta,
  documentPath,
  resolveDocument,
} from '../../src/lib/artifact-links';
import type { ArtifactRecord } from '../../src/lib/schemas';

/* All fixture names are synthetic, never real pending artifact names. */

const record = (overrides: Partial<ArtifactRecord> = {}): ArtifactRecord => ({
  id: 'nebula-thesis',
  title: 'Project Nebula: thesis',
  kind: 'thesis',
  projectId: 'project-nebula',
  version: '2026',
  publication: 'public',
  academicStatus: 'official-submission',
  resultChanges: false,
  date: '2026-08-30',
  file: 'Nebula_Thesis.pdf',
  sha256: 'a'.repeat(64),
  bytes: 5634577,
  pages: 37,
  description: 'Synthetic fixture.',
  ...overrides,
});

describe('artifact links', () => {
  it('formats sizes the way the CV always has', () => {
    expect(bytesToMb(13039516)).toBe(12.4);
    expect(bytesToMb(5634577)).toBe(5.4);
  });

  it('writes length before size and drops whatever is missing', () => {
    expect(documentMeta(80, 38.5)).toBe('80p, 38.5 MB');
    expect(documentMeta(undefined, 12.4)).toBe('12.4 MB');
    expect(documentMeta(16, undefined)).toBe('16p');
    expect(documentMeta()).toBe('');
  });

  it('resolves a public, checksummed document to its staged path', () => {
    expect(documentPath(record())).toBe('/documents/thesis/Nebula_Thesis.pdf');
    expect(resolveDocument(record())).toEqual({
      path: '/documents/thesis/Nebula_Thesis.pdf',
      pages: 37,
      sizeMb: 5.4,
    });
  });

  it('drops the page count of a slide deck', () => {
    const slides = resolveDocument(
      record({ kind: 'slides', file: 'Nebula_Slides.pdf', bytes: 7118826, pages: 54 }),
    );
    expect(slides).toEqual({ path: '/documents/slides/Nebula_Slides.pdf', sizeMb: 6.8 });
  });

  it('withholds anything that is not public with a measured file', () => {
    expect(resolveDocument(undefined)).toBeUndefined();
    expect(resolveDocument(record({ publication: 'draft' }))).toBeUndefined();
    expect(resolveDocument(record({ file: undefined }))).toBeUndefined();
    expect(resolveDocument(record({ bytes: undefined }))).toBeUndefined();
  });
});
