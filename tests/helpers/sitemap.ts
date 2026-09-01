import type { APIRequestContext } from '@playwright/test';

/** Collect all canonical route paths from the served sitemap. */
export async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const index = await request.get('/sitemap-index.xml');
  if (!index.ok()) throw new Error(`sitemap-index.xml: HTTP ${index.status()}`);
  const indexBody = await index.text();
  const sitemapUrls = [...indexBody.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const paths = new Set<string>();
  for (const url of sitemapUrls) {
    const res = await request.get(new URL(url).pathname);
    if (!res.ok()) throw new Error(`${url}: HTTP ${res.status()}`);
    const body = await res.text();
    for (const match of body.matchAll(/<loc>(.*?)<\/loc>/g)) {
      paths.add(new URL(match[1]).pathname);
    }
  }
  return [...paths].sort();
}
