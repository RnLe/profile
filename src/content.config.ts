import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectFrontmatterSchema } from './lib/schemas';

/**
 * Content collections share their Zod contracts with the node-side validators
 * (src/lib/schemas.ts). Pages never consume these collections directly; they
 * go through src/lib/content.ts, which applies resolvePublication.
 */
export const collections = {
  projects: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
    schema: projectFrontmatterSchema,
  }),
};
