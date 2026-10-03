import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { breakpoints } from '../../src/lib/breakpoints';

const root = join(__dirname, '../..');

const listFiles = (dir: string, exts: string[]): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
};

describe('source discipline', () => {
  it('pages never consume collections directly, only via the resolver (src/lib/content)', () => {
    const offenders: string[] = [];
    for (const file of listFiles(join(root, 'src/pages'), ['.astro', '.ts'])) {
      const content = readFileSync(file, 'utf8');
      if (/from ['"]astro:content['"]/.test(content) && /getCollection/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  // three is allowed in exactly one place: the GeoNeural terrain viewer, which
  // loads it in its own lazily hydrated island chunk.
  it('only the GeoNeural viewer imports three, and nothing imports pixi', () => {
    const offenders: string[] = [];
    const viewer = join(root, 'src', 'components', 'geo-neural');
    for (const file of listFiles(join(root, 'src'), ['.astro', '.ts', '.tsx'])) {
      const content = readFileSync(file, 'utf8');
      if (/from ['"]pixi\.js['"]/.test(content)) offenders.push(file);
      if (/from ['"]three(\/[^'"]*)?['"]/.test(content) && !file.startsWith(viewer)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  // Only @media preludes: an image `sizes` attribute describes the layout
  // rather than deciding it, and a @container query is measured against its
  // own container, so neither is bound to the viewport ladder.
  it('every viewport media query uses a value from the breakpoint ladder', () => {
    const offenders: string[] = [];
    for (const file of listFiles(join(root, 'src'), ['.astro', '.css'])) {
      const content = readFileSync(file, 'utf8');
      for (const query of content.matchAll(/@media([^{]+)\{/g)) {
        for (const match of query[1].matchAll(/\((?:min|max)-width:\s*([^)]+)\)/g)) {
          const value = match[1].trim();
          if (!(breakpoints as readonly string[]).includes(value)) {
            offenders.push(`${relative(root, file)}: ${match[0]}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no width media query uses the range syntax older browsers discard whole', () => {
    const offenders: string[] = [];
    for (const file of listFiles(join(root, 'src'), ['.astro', '.css'])) {
      const content = readFileSync(file, 'utf8');
      if (/@media[^{]*\(\s*width\s*[<>]=?/.test(content)) offenders.push(relative(root, file));
    }
    expect(offenders).toEqual([]);
  });

  it('layout components never hard-code result-shaped numbers (claims come from the registry)', () => {
    const offenders: string[] = [];
    const numberish = /\b\d+(\.\d+)?\s*(×|x)\s*(faster|speedup)|order-of-magnitude/i;
    for (const file of listFiles(join(root, 'src/components'), ['.astro', '.tsx'])) {
      const content = readFileSync(file, 'utf8');
      if (numberish.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
