/**
 * Production-artifact inspection: walks every file in dist, names and
 * bytes alike, and fails on anything that must never ship:
 *
 *   - nonpublic schema states, stale base paths, local paths, localhost,
 *     .env references, token patterns, source maps
 *   - institution names (the public site is institution-neutral)
 *   - retracted-claim phrases (from claims.yaml forbidden_phrases) and the
 *     quarantined stale-copy phrases
 *   - addressable files that no staging-manifest record accounts for
 *   - sitemap drift: the sitemap must equal the canonical route set
 *     (all dist routes minus legacy aliases minus 404)
 *   - oversized files (> 3 MiB for page assets, > 64 MiB for staged documents,
 *     which are downloads and carry their own registered byte count)
 *
 * `--release` additionally fails on placeholder markers (data-asset-id)
 * and TODO markers: pre-release builds keep placeholders, a release may not.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { legacyAliases } from '../src/lib/routes';
import { stripBase } from './lib/base';
import { loadClaims } from '../src/lib/registry-io';
import { Report, repoRoot } from './lib/report';

const releaseMode = process.argv.includes('--release');
const report = new Report(releaseMode ? 'inspect:dist --release' : 'inspect:dist');
const distDir = join(repoRoot, 'dist');

const TEXT_EXTENSIONS = new Set([
  '.html', '.js', '.mjs', '.css', '.json', '.xml', '.svg', '.txt', '.webmanifest', '.map',
]);

const listFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
};

interface Pattern {
  name: string;
  regex: RegExp;
}

const buildPatterns = (): Pattern[] => {
  const patterns: Pattern[] = [
    { name: 'nonpublic schema state', regex: /pending-owner-approval|DO_NOT_PUBLISH/ },
    { name: 'stale project base path', regex: /renemarcellehner/ },
    { name: 'localhost reference', regex: /localhost|127\.0\.0\.1/ },
    { name: 'local filesystem path', regex: /\/home\/renlephy/ },
    { name: 'confidential planning material', regex: /Implementation_Guide/ },
    { name: 'credential-shaped token', regex: /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/ },
    { name: 'quarantined grade wording', regex: /with distinction|GPA\b|JLPT/ },
    { name: 'quarantined comparator-free superlative', regex: /outperforms MPB|order-of-magnitude faster|state of the art|state-of-the-art/i },
  ];
  // Owner-only forbidden patterns (institution names, pending project names)
  // live in ignored material/ so the tracked scanner reveals nothing.
  const ownerPatternsPath = join(repoRoot, 'material/private-case-studies/forbidden-patterns.yaml');
  if (existsSync(ownerPatternsPath)) {
    try {
      const parsed = parseYaml(readFileSync(ownerPatternsPath, 'utf8')) as {
        patterns?: Array<{ name: string; pattern: string }>;
      };
      for (const entry of parsed.patterns ?? []) {
        patterns.push({ name: `owner pattern: ${entry.name}`, regex: new RegExp(entry.pattern, 'i') });
      }
    } catch (error) {
      report.fail(`could not parse owner forbidden-patterns file: ${(error as Error).message}`);
    }
  }
  try {
    for (const claim of loadClaims(repoRoot)) {
      if (claim.evidence_state !== 'retracted') continue;
      for (const phrase of claim.forbidden_phrases) {
        patterns.push({
          name: `retracted claim ${claim.claim_id} phrase "${phrase}"`,
          regex: new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        });
      }
    }
  } catch (error) {
    report.fail(`could not load claim registry for phrase scanning: ${(error as Error).message}`);
  }
  return patterns;
};

const scrubEnvFalsePositives = (content: string): string =>
  content.replaceAll('import.meta.env', '').replaceAll('process.env', '');

if (!existsSync(distDir)) {
  report.fail('dist/ does not exist; run pnpm build first');
  report.finish();
}

const files = listFiles(distDir);
const relFiles = files.map((f) => relative(distDir, f));
const patterns = buildPatterns();

// Staging cross-check: everything addressable that Astro did not generate must
// be accounted for by the staging manifest.
const stagingManifestPath = join(repoRoot, '.staging-manifest.json');
const stagedPaths = new Set<string>();
if (existsSync(stagingManifestPath)) {
  const manifest = JSON.parse(readFileSync(stagingManifestPath, 'utf8')) as {
    files: Array<{ path: string }>;
  };
  for (const file of manifest.files) stagedPaths.add(file.path);
} else {
  report.fail('.staging-manifest.json missing; prepare:public did not run for this build');
}

for (const rel of relFiles) {
  const isAstroGenerated =
    rel.endsWith('.html') || rel.startsWith('_astro/') || /^sitemap-[^/]*\.xml$/.test(rel);
  if (!isAstroGenerated && !stagedPaths.has(rel)) {
    report.fail(`unregistered addressable file in dist: ${rel}`);
  }
}

for (const file of files) {
  const rel = relative(distDir, file);
  const size = statSync(file).size;

  if (rel.endsWith('.map')) report.fail(`source map emitted: ${rel}`);

  // The 3 MiB cap guards page weight: nothing a reader downloads by merely
  // opening a route may be that large. A staged document is the opposite case,
  // deliberately registered with its own sha256 and byte count and fetched only
  // on a click, so it gets a much higher ceiling that still catches an absurd
  // file reaching the deploy.
  const sizeCap = rel.startsWith('documents/') ? 64 * 1024 * 1024 : 3 * 1024 * 1024;
  if (size > sizeCap) {
    report.fail(
      `oversized file (${(size / 1024 / 1024).toFixed(1)} MiB, cap ${sizeCap / 1024 / 1024} MiB): ${rel}`,
    );
  }

  const ext = rel.slice(rel.lastIndexOf('.'));
  if (!TEXT_EXTENSIONS.has(ext)) continue;

  const raw = readFileSync(file, 'utf8');
  const content = scrubEnvFalsePositives(raw);

  for (const pattern of patterns) {
    const match = content.match(pattern.regex);
    if (match) report.fail(`${rel}: ${pattern.name} ("…${match[0]}…")`);
  }
  if (/(?<![\w.])\.env(?:\.\w+)?\b/.test(content)) {
    report.fail(`${rel}: .env reference`);
  }

  if (releaseMode && rel.endsWith('.html')) {
    if (content.includes('data-asset-id')) {
      report.fail(`${rel}: placeholder still present (data-asset-id), release-blocking`);
    }
    if (/\bTODO\b/.test(content)) report.fail(`${rel}: TODO marker, release-blocking`);
  }
}

// Sitemap drift: sitemap URL set must equal canonical routes.
const sitemapFile = files.find((f) => /sitemap-\d+\.xml$/.test(f));
if (!sitemapFile) {
  report.fail('no sitemap-N.xml emitted');
} else {
  const sitemapPaths = new Set(
    [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(
      (m) => stripBase(new URL(m[1]).pathname),
    ),
  );
  const aliasPaths = new Set(Object.keys(legacyAliases));
  const canonical = new Set<string>();
  for (const rel of relFiles) {
    if (!rel.endsWith('index.html')) continue;
    const route = `/${rel.slice(0, -'index.html'.length)}`;
    if (aliasPaths.has(route)) continue;
    canonical.add(route);
  }
  for (const route of canonical) {
    if (!sitemapPaths.has(route)) report.fail(`sitemap missing canonical route ${route}`);
  }
  for (const path of sitemapPaths) {
    if (aliasPaths.has(path)) report.fail(`sitemap contains legacy alias ${path}`);
    if (path.includes('404')) report.fail(`sitemap contains 404 route ${path}`);
    if (!canonical.has(path)) report.fail(`sitemap lists ${path} but dist has no such route`);
  }
}

report.finish();
