/**
 * prepare-public: fail-closed staging of Astro's public directory.
 *
 * Astro copies EVERY file in `publicDir` into `dist`, linked or not. This
 * script therefore rebuilds `.generated-public/` from scratch on every run and
 * copies only allowlisted, checksum-verified files:
 *
 *   1. `static-public-source/**`: unconditional audited files, allowlisted in
 *      `static-public-source/manifest.yaml`. A file on disk that is not in the
 *      manifest, a manifest entry missing on disk, or a checksum mismatch all
 *      abort staging (exit 1).
 *   2. `robots.txt`: generated from SITE_URL (never hand-maintained).
 *   3. Artifact records (`src/data/artifacts.yaml`) with `publication: public`
 *      staged from the ignored owner directory `material/publication-source/`
 *      after sha256 + byte-size verification.
 *   4. Media manifest entries (`src/data/media.yaml`) whose files live under
 *      `/media/`: staged from `material/media-masters/derived/` the same way.
 *
 * build can never pass verification or be deployed.
 *
 * Every staged file is recorded in `.generated-public/staging-manifest.json`
 * so `inspect:dist` can prove that nothing unregistered became addressable.
 */
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';

export interface StaticManifest {
  files: Array<{ path: string; sha256: string }>;
}

export interface PreparePublicOptions {
  /** Repo root; all other defaults derive from it. */
  rootDir: string;
  staticSourceDir?: string;
  outDir?: string;
  artifactsRegistryPath?: string;
  mediaRegistryPath?: string;
  publicationSourceDir?: string;
  mediaMastersDir?: string;
  siteUrl?: string;
}

export interface StagedFileRecord {
  path: string;
  source: string;
  recordId?: string;
  sha256: string;
}

export class StagingError extends Error {}

const sha256Of = (filePath: string): string =>
  createHash('sha256').update(readFileSync(filePath)).digest('hex');

const listFilesRecursive = (dir: string, base = dir): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, base));
    else out.push(relative(base, full));
  }
  return out;
};

const loadYamlIfExists = <T>(path: string): T | undefined => {
  if (!existsSync(path)) return undefined;
  return parse(readFileSync(path, 'utf8')) as T;
};

const stageFile = (
  sourcePath: string,
  targetPath: string,
  expectedSha: string,
  staged: StagedFileRecord[],
  outDir: string,
  recordId?: string,
): void => {
  if (!existsSync(sourcePath)) {
    throw new StagingError(`Staging source missing: ${sourcePath}`);
  }
  const actual = sha256Of(sourcePath);
  if (actual !== expectedSha) {
    throw new StagingError(
      `Checksum mismatch for ${sourcePath}: expected ${expectedSha}, got ${actual}`,
    );
  }
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath);
  staged.push({
    path: relative(outDir, targetPath),
    source: sourcePath,
    recordId,
    sha256: actual,
  });
};

export function preparePublic(options: PreparePublicOptions): StagedFileRecord[] {
  const root = resolve(options.rootDir);
  const staticDir = options.staticSourceDir ?? join(root, 'static-public-source');
  const outDir = options.outDir ?? join(root, '.generated-public');
  const artifactsPath =
    options.artifactsRegistryPath ?? join(root, 'src/data/artifacts.yaml');
  const mediaPath = options.mediaRegistryPath ?? join(root, 'src/data/media.yaml');
  const publicationSourceDir =
    options.publicationSourceDir ?? join(root, 'material/publication-source');
  const mediaMastersDir =
    options.mediaMastersDir ?? join(root, 'material/media-masters/derived');
  const siteUrl = (options.siteUrl ?? process.env.SITE_URL ?? 'https://rnle.github.io').replace(
    /\/+$/,
    '',
  );

  const staged: StagedFileRecord[] = [];

  // 1. Unconditional audited lane, manifest-allowlisted.
  const manifestPath = join(staticDir, 'manifest.yaml');
  if (!existsSync(manifestPath)) {
    throw new StagingError(`Static manifest missing: ${manifestPath}`);
  }
  const manifest = parse(readFileSync(manifestPath, 'utf8')) as StaticManifest;
  if (!manifest || !Array.isArray(manifest.files)) {
    throw new StagingError(`Static manifest malformed: ${manifestPath}`);
  }
  const allowed = new Map(manifest.files.map((f) => [f.path, f.sha256]));
  const onDisk = listFilesRecursive(staticDir).filter((p) => p !== 'manifest.yaml');
  for (const file of onDisk) {
    if (!allowed.has(file)) {
      throw new StagingError(
        `Unregistered file in static-public-source: ${file}. Audit it and add it to manifest.yaml, or remove it.`,
      );
    }
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  for (const [path, sha] of allowed) {
    stageFile(join(staticDir, path), join(outDir, path), sha, staged, outDir);
  }

  // 2. Generated robots.txt (canonical origin is the single source of truth).
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap-index.xml\n`;
  writeFileSync(join(outDir, 'robots.txt'), robots);
  staged.push({
    path: 'robots.txt',
    source: 'generated:robots',
    sha256: createHash('sha256').update(robots).digest('hex'),
  });

  // 3. Public artifact records, staged from ignored owner material.
  const artifacts = loadYamlIfExists<{ records?: Array<Record<string, unknown>> }>(artifactsPath);
  for (const record of artifacts?.records ?? []) {
    if (record.publication !== 'public') continue;
    const id = String(record.id ?? '<missing-id>');
    const file = record.file as string | undefined;
    const sha = record.sha256 as string | undefined;
    const bytes = record.bytes as number | undefined;
    if (!file || !sha || bytes === undefined) {
      throw new StagingError(
        `Artifact ${id} is public but lacks file/sha256/bytes metadata required for staging.`,
      );
    }
    const source = join(publicationSourceDir, file);
    if (existsSync(source) && statSync(source).size !== bytes) {
      throw new StagingError(
        `Artifact ${id}: byte size mismatch for ${source} (expected ${bytes}).`,
      );
    }
    const kind = String(record.kind ?? 'misc');
    stageFile(source, join(outDir, 'documents', kind, file), sha, staged, outDir, id);
  }

  // 4. Public media staged through the manifest (only /media/-addressed files;
  //    src/assets imports flow through Vite instead and are not staged here).
  const media = loadYamlIfExists<{ entries?: Array<Record<string, unknown>> }>(mediaPath);
  for (const entry of media?.entries ?? []) {
    const id = String(entry.id ?? '<missing-id>');
    const files = (entry.files ?? []) as Array<Record<string, unknown>>;
    for (const f of files) {
      const url = String(f.url ?? '');
      if (!url.startsWith('/media/')) continue;
      const sha = f.sha256 as string | undefined;
      if (!sha) {
        throw new StagingError(`Media ${id}: staged file ${url} lacks sha256.`);
      }
      const rel = url.replace(/^\//, '');
      stageFile(join(mediaMastersDir, rel), join(outDir, rel), sha, staged, outDir, id);
    }
  }

  // The staging manifest records provenance (including local source paths), so
  // it must never enter the deployable public directory; it lives at the repo
  // root (gitignored) where inspect:dist reads it.
  writeFileSync(
    join(root, '.staging-manifest.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), siteUrl, files: staged }, null, 2)}\n`,
  );

  return staged;
}

const isDirectRun = process.argv[1]?.endsWith('prepare-public.ts');
if (isDirectRun) {
  try {
    const staged = preparePublic({ rootDir: resolve(import.meta.dirname, '..') });
    console.log(`prepare:public: staged ${staged.length} file(s) into .generated-public/`);
  } catch (error) {
    if (error instanceof StagingError) {
      console.error(`prepare:public FAILED: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}
