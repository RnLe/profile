/**
 * Astro-side content access. Pages import from HERE, never from
 * `astro:content` directly, so that every rendered surface passes through
 * resolvePublication. (A unit test greps src/pages to enforce this.)
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { resolveAll, type ResolvedProject, type ResolvedSets } from './publication';
import { loadRegistries } from './registry-io';

// Bundled prerender chunks relocate import.meta.url into dist/, so the repo
// root is anchored to the build's working directory instead.
const root = process.cwd();

let cache:
  | (ResolvedSets & {
      projectEntries: Map<string, CollectionEntry<'projects'>>;
    })
  | undefined;

export async function getResolvedContent() {
  if (cache) return cache;

  const projectCollection = await getCollection('projects');
  const registries = loadRegistries(root);

  const resolved = resolveAll(projectCollection, registries);

  cache = {
    ...resolved,
    projectEntries: new Map(projectCollection.map((entry) => [entry.data.id, entry])),
  };
  return cache;
}

export async function getPublishedProjects(): Promise<ResolvedProject[]> {
  return (await getResolvedContent()).projects;
}

export async function getPublishedProject(slug: string): Promise<ResolvedProject | undefined> {
  return (await getResolvedContent()).projects.find((p) => p.data.slug === slug);
}

export async function getProjectEntry(id: string): Promise<CollectionEntry<'projects'>> {
  const entry = (await getResolvedContent()).projectEntries.get(id);
  if (!entry) throw new Error(`No collection entry for resolved project '${id}'`);
  return entry;
}

/** Registries for non-project surfaces (the CV page, footer, metadata). */
export function getRegistries() {
  return loadRegistries(root);
}
