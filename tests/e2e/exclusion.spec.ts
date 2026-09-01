import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Fail-closed proofs against the real production artifact:
 * gated/draft content is absent from routes, bytes, and the sitemap.
 */
const distDir = join(import.meta.dirname, '../../dist');

const listFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
};

test('the route-gated project has no route, old or new', async ({ request }) => {
  for (const path of ['/projects/grounded-recovery/', '/research/grounded-recovery/']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test('the removed Workshop leaves no route and no bytes behind', async ({ request }) => {
  for (const path of [
    '/workshop/',
    '/workshop/making/',
    '/workshop/making/apartment-build/',
    '/workshop/visual-lab/',
    '/workshop/notes/',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }

  // Its draft slugs, placeholder asset IDs, and dark theme must be gone from
  // the artifact entirely, not merely unrouted.
  const needles = [
    'apartment-build',
    'solar-and-battery',
    'electronics-and-repair',
    'signal-portrait',
    'WORK-PORTRAIT-01',
    'WORK-POSTER-01',
    'data-theme="workshop"',
  ];
  const files = listFiles(distDir).filter((f) => /\.(html|js|json|xml|css|txt)$/.test(f));
  const hits: string[] = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const needle of needles) {
      if (content.includes(needle)) hits.push(`${file}: ${needle}`);
    }
  }
  expect(hits).toEqual([]);
});

test('the retired Documents page redirects to the CV instead of 404ing', async ({ page }) => {
  await page.goto('/documents/');
  await page.waitForURL('**/cv/');
});
