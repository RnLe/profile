import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allEntries, type ArtifactLink } from '../../src/data/about';
import { loadArtifacts } from '../../src/lib/registry-io';

const root = join(__dirname, '../..');

/**
 * The CV renders `state: 'live'` links only. That gate is what lets an artifact
 * sitting in a private repository be recorded now and published later, so the
 * two halves of the contract are worth pinning: a live link must actually be
 * followable, and a withheld one must say why it is withheld.
 */
const links: ArtifactLink[] = allEntries.flatMap((entry) => entry.links ?? []);

describe('CV artifact links', () => {
  it('gives every live link a destination', () => {
    const broken = links.filter((link) => link.state === 'live' && !link.href && !link.artifactId);
    expect(broken.map((l) => l.label)).toEqual([]);
  });

  it('names a real artifact record for every staged document', () => {
    const known = new Set(loadArtifacts(root).map((record) => record.id));
    const unknown = links.filter((link) => link.artifactId && !known.has(link.artifactId));
    expect(unknown.map((l) => l.artifactId)).toEqual([]);
  });

  it('never states a staged document twice', () => {
    // Address, size, and length come from the artifact record; repeating them
    // here is the one way the page and the registry could disagree about the
    // same file.
    const duplicated = links.filter(
      (link) => link.artifactId && (link.href || link.sizeMb || link.pages),
    );
    expect(duplicated.map((l) => l.label)).toEqual([]);
  });

  it('records why every pending link is withheld', () => {
    const unexplained = links.filter((link) => link.state === 'pending' && !link.note);
    expect(unexplained.map((l) => l.label)).toEqual([]);
  });

  it('only points external links at absolute https destinations', () => {
    // Staged documents are excluded: their address is site-internal and comes
    // from the artifact record, not from here.
    const bad = links
      .filter((link) => link.state === 'live' && !link.artifactId)
      .filter((link) => !link.href?.startsWith('https://'));
    expect(bad.map((l) => l.href)).toEqual([]);
  });

  it('never repeats a destination within one entry', () => {
    for (const entry of allEntries) {
      const hrefs = (entry.links ?? []).map((l) => l.href).filter(Boolean);
      expect(new Set(hrefs).size, entry.title).toBe(hrefs.length);
    }
  });

  it('declares a marker kind for every link', () => {
    const kinds = new Set(['web', 'pdf', 'repo']);
    const untyped = links.filter((link) => !kinds.has(link.kind));
    expect(untyped.map((l) => l.label)).toEqual([]);
  });

  it('emphasises at most one artifact per entry', () => {
    for (const entry of allEntries) {
      const primary = (entry.links ?? []).filter((l) => l.emphasis);
      expect(primary.length, entry.title).toBeLessThanOrEqual(1);
    }
  });

  it('only puts a file size on a document link', () => {
    const wrong = links.filter((link) => link.sizeMb !== undefined && link.kind !== 'pdf');
    expect(wrong.map((l) => l.label)).toEqual([]);
  });

  it('keeps a staged document link in step with its record', () => {
    // The pending state is what let the thesis be recorded before it was
    // published. A staged link is live exactly when its record is public with
    // a checksummed file, and pending otherwise; nothing is quietly deleted
    // instead of being published.
    const records = new Map(loadArtifacts(root).map((record) => [record.id, record]));
    const outOfStep = links
      .filter((link) => link.artifactId)
      .filter((link) => {
        const record = records.get(link.artifactId as string);
        const published = record?.publication === 'public' && Boolean(record.file && record.sha256);
        return published !== (link.state === 'live');
      });
    expect(outOfStep.map((l) => l.label)).toEqual([]);
  });
});
