import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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

  it('nothing in src imports pixi or three (deferred phases)', () => {
    const offenders: string[] = [];
    for (const file of listFiles(join(root, 'src'), ['.astro', '.ts', '.tsx'])) {
      const content = readFileSync(file, 'utf8');
      if (/from ['"](pixi\.js|three)['"]/.test(content)) offenders.push(file);
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
