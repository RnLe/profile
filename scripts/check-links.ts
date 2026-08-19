/**
 * Internal link check over dist: every internal href/src must resolve to a
 * built file, and internal page links must use trailing slashes
 * (trailingSlash: 'always'). External links are checked only in the manual
 * release pipeline (check:links:external).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { stripBase } from './lib/base';
import { Report, repoRoot } from './lib/report';

const report = new Report('check:links');
const distDir = join(repoRoot, 'dist');

const listHtml = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHtml(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
};

if (!existsSync(distDir)) {
  report.fail('dist/ does not exist; run pnpm build first');
  report.finish();
}

const resolveTarget = (href: string): boolean => {
  // dist is the site root, so a project-site prefix comes off first.
  const clean = stripBase(href).replace(/^\//, '');
  if (clean === '') return existsSync(join(distDir, 'index.html'));
  return (
    existsSync(join(distDir, clean)) ||
    existsSync(join(distDir, clean, 'index.html')) ||
    existsSync(join(distDir, `${clean.replace(/\/$/, '')}.html`))
  );
};

for (const file of listHtml(distDir)) {
  const rel = relative(distDir, file);
  const html = readFileSync(file, 'utf8');
  const attrs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

  for (const target of attrs) {
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('#') ||
      target.startsWith('data:')
    ) {
      continue;
    }
    const [path] = target.split('#');
    if (path === '') continue;
    if (!path.startsWith('/')) {
      report.fail(`${rel}: non-root-relative internal link "${target}"`);
      continue;
    }
    if (!resolveTarget(path)) {
      report.fail(`${rel}: broken internal link "${target}"`);
    }
    const isFile = /\.[a-z0-9]+$/i.test(path);
    if (!isFile && !path.endsWith('/')) {
      report.fail(`${rel}: internal page link missing trailing slash "${target}"`);
    }
  }
}

report.finish();
