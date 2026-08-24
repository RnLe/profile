/**
 * Staged-document links, shared by the CV and the project link rows.
 *
 * A document this site stages takes its address and size from its artifact
 * record, so the registry stays the single source of truth and the gate:
 * without a public, checksummed file there is no href at all. Paths are
 * root-relative; callers apply withBase.
 */
import type { ArtifactRecord } from './schemas';

/** Root-relative path of a staged document. */
export const documentPath = (record: Pick<ArtifactRecord, 'kind' | 'file'>): string =>
  `/documents/${record.kind}/${record.file}`;

/** File size in MB with one decimal, the unit the CV has always shown. */
export const bytesToMb = (bytes: number): number => Math.round((bytes / 1024 / 1024) * 10) / 10;

export interface DocumentFacts {
  path: string;
  /** Left off slide decks: counting slides says nothing about how much there is to read. */
  pages?: number;
  sizeMb: number;
}

/** Where a staged document lives and how large it is, or nothing while it is not public. */
export function resolveDocument(record: ArtifactRecord | undefined): DocumentFacts | undefined {
  if (!record || record.publication !== 'public' || !record.file || record.bytes === undefined) {
    return undefined;
  }
  return {
    path: documentPath(record),
    pages: record.kind === 'slides' ? undefined : record.pages,
    sizeMb: bytesToMb(record.bytes),
  };
}

/** The parenthesised run after a document link: "37p, 5.4 MB", "12.4 MB", or nothing. */
export const documentMeta = (pages?: number, sizeMb?: number): string =>
  [pages && `${pages}p`, sizeMb && `${sizeMb} MB`].filter(Boolean).join(', ');
