import { expect, test } from '@playwright/test';
import { sitemapPaths } from '../helpers/sitemap';

test('sitemap exists and lists at least the unconditional shells', async ({ request }) => {
  const paths = await sitemapPaths(request);
  expect(paths).toContain('/');
  expect(paths).toContain('/projects/');
  expect(paths.length).toBeGreaterThanOrEqual(3);
});

test('every canonical route responds 200 with exactly one h1', async ({ page, request }) => {
  const paths = await sitemapPaths(request);
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status(), `status of ${path}`).toBe(200);
    await expect(page.locator('h1'), `h1 count on ${path}`).toHaveCount(1);
  }
});

test('an unknown path is handled by the 404 page', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist/');
  expect(response?.status()).toBe(404);
});
