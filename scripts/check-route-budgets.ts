/**
 * Route performance budgets, measured as cold-navigation gzip bytes.
 * Per route: HTML + referenced CSS + eagerly referenced JS (script[src] and
 * modulepreload hints, which Astro emits for the static import graph) + font
 * files referenced from that CSS. Lazy/activated chunks are excluded.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { Report, repoRoot } from './lib/report';

const report = new Report('budget');
const distDir = join(repoRoot, 'dist');

const KIB = 1024;
const budgets = (route: string): { js: number; transfer: number } => {
  if (route === '/') return { js: 100 * KIB, transfer: 1.2 * 1024 * KIB };
  return { js: 130 * KIB, transfer: 1.5 * 1024 * KIB };
};

const listHtml = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHtml(full));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
};

const gzipSize = (path: string): number => gzipSync(readFileSync(path)).length;

if (!existsSync(distDir)) {
  report.fail('dist/ does not exist; run pnpm build first');
  report.finish();
}

const rows: string[] = [];

for (const file of listHtml(distDir)) {
  const route = `/${relative(distDir, file).slice(0, -'index.html'.length)}`;
  const html = readFileSync(file, 'utf8');

  const jsRefs = new Set<string>();
  for (const match of html.matchAll(/<script[^>]+src="(\/_astro\/[^"]+)"/g)) jsRefs.add(match[1]);
  for (const match of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="(\/_astro\/[^"]+)"/g)) {
    jsRefs.add(match[1]);
  }

  const cssRefs = new Set<string>();
  for (const match of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(\/_astro\/[^"]+)"/g)) {
    cssRefs.add(match[1]);
  }

  let jsBytes = 0;
  for (const ref of jsRefs) {
    const path = join(distDir, ref.replace(/^\//, ''));
    if (existsSync(path)) jsBytes += gzipSize(path);
  }

  let cssBytes = 0;
  const fontRefs = new Set<string>();
  for (const ref of cssRefs) {
    const path = join(distDir, ref.replace(/^\//, ''));
    if (!existsSync(path)) continue;
    cssBytes += gzipSize(path);
    const css = readFileSync(path, 'utf8');
    for (const match of css.matchAll(/url\((\/_astro\/[^)]+\.woff2?)\)/g)) fontRefs.add(match[1]);
  }

  let fontBytes = 0;
  for (const ref of fontRefs) {
    const path = join(distDir, ref.replace(/^\//, ''));
    if (existsSync(path)) fontBytes += gzipSize(path);
  }

  const htmlBytes = gzipSync(html).length;
  const transfer = htmlBytes + cssBytes + jsBytes + fontBytes;
  const budget = budgets(route);

  rows.push(
    `${route.padEnd(40)} html ${(htmlBytes / KIB).toFixed(1).padStart(6)} KiB · css ${(cssBytes / KIB)
      .toFixed(1)
      .padStart(6)} KiB · js ${(jsBytes / KIB).toFixed(1).padStart(6)} KiB · fonts ${(fontBytes / KIB)
      .toFixed(1)
      .padStart(6)} KiB · total ${(transfer / KIB).toFixed(1).padStart(7)} KiB`,
  );

  if (jsBytes > budget.js) {
    report.fail(
      `${route}: eager JS ${(jsBytes / KIB).toFixed(1)} KiB exceeds budget ${(budget.js / KIB).toFixed(0)} KiB`,
    );
  }
  if (transfer > budget.transfer) {
    report.fail(
      `${route}: initial transfer ${(transfer / KIB).toFixed(1)} KiB exceeds budget ${(
        budget.transfer / KIB
      ).toFixed(0)} KiB`,
    );
  }
}

console.log(rows.sort().join('\n'));
report.finish();
