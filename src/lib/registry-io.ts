/**
 * Node-side registry and content loaders, shared by validators, prepare:public,
 * inspect:dist, and unit tests. Astro pages load the same data through
 * collections; the Zod schemas in `schemas.ts` are the single contract.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import {
  artifactsRegistrySchema,
  claimsRegistrySchema,
  mediaRegistrySchema,
  ownerReceiptSchema,
  projectFrontmatterSchema,
  publicProjectRegistrySchema,
  type ArtifactRecord,
  type ClaimRecord,
  type MediaEntry,
  type OwnerReceipt,
  type ProjectFrontmatter,
  type PublicRegistryEntry,
} from './schemas';

export class RegistryError extends Error {
  constructor(
    public readonly file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
  }
}

const parseYamlFile = <T>(path: string): T => {
  if (!existsSync(path)) throw new RegistryError(path, 'file missing');
  try {
    return parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    throw new RegistryError(path, `YAML parse error: ${(error as Error).message}`);
  }
};

const validateWith = <T>(path: string, schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } } }, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = (result.error?.issues ?? [])
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new RegistryError(path, `schema violation\n${issues}`);
  }
  return result.data as T;
};

/** Split `---` frontmatter from a Markdown file; returns [frontmatter, body]. */
export const splitFrontmatter = (raw: string, path: string): [unknown, string] => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new RegistryError(path, 'missing --- frontmatter block');
  return [parse(match[1]), match[2]];
};

export interface LoadedProjectEntry {
  file: string;
  data: ProjectFrontmatter;
  body: string;
}

export interface Registries {
  claims: ClaimRecord[];
  artifacts: ArtifactRecord[];
  media: MediaEntry[];
  registry: PublicRegistryEntry[];
  receipts: OwnerReceipt[];
}

const listMarkdown = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out.sort();
};

export const loadProjects = (root: string): LoadedProjectEntry[] =>
  listMarkdown(join(root, 'src/content/projects')).map((file) => {
    const [front, body] = splitFrontmatter(readFileSync(file, 'utf8'), file);
    return { file, data: validateWith(file, projectFrontmatterSchema, front), body };
  });

export const loadClaims = (root: string): ClaimRecord[] => {
  const path = join(root, 'src/data/claims.yaml');
  return validateWith(path, claimsRegistrySchema, parseYamlFile(path)).claims;
};

export const loadArtifacts = (root: string): ArtifactRecord[] => {
  const path = join(root, 'src/data/artifacts.yaml');
  return validateWith(path, artifactsRegistrySchema, parseYamlFile(path)).records;
};

export const loadMedia = (root: string): MediaEntry[] => {
  const path = join(root, 'src/data/media.yaml');
  return validateWith(path, mediaRegistrySchema, parseYamlFile(path)).entries;
};

export const loadPublicRegistry = (root: string): PublicRegistryEntry[] => {
  const path = join(root, 'src/data/public-project-registry.yaml');
  return validateWith(path, publicProjectRegistrySchema, parseYamlFile(path)).projects;
};

/**
 * Owner receipts live in ignored owner-only material. Production builds MUST
 * succeed when the directory is absent: the receipt set is then empty and
 * every private-origin item fails closed.
 */
export const loadOwnerReceipts = (root: string): OwnerReceipt[] => {
  const dir = join(root, 'material/private-case-studies/receipts');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .sort()
    .map((name) => {
      const path = join(dir, name);
      return validateWith(path, ownerReceiptSchema, parseYamlFile(path));
    });
};

export const loadRegistries = (root: string): Registries => ({
  claims: loadClaims(root),
  artifacts: loadArtifacts(root),
  media: loadMedia(root),
  registry: loadPublicRegistry(root),
  receipts: loadOwnerReceipts(root),
});
