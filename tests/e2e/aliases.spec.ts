import { expect, test } from '@playwright/test';
import { legacyAliases } from '../../src/lib/routes';
import { sitemapPaths } from '../helpers/sitemap';

/** Legacy alias stubs: reachable, canonical + noindex + refresh, never in the sitemap. */

test('alias stubs carry canonical, noindex, meta refresh, and a visible link', async ({
  request,
}) => {
  for (const [from, to] of Object.entries(legacyAliases)) {
    const response = await request.get(from);
    expect(response.status(), `status of ${from}`).toBe(200);
    const html = await response.text();
    const targetPath = to.split('#')[0];
    expect(html, `${from} canonical`).toContain(`rel="canonical" href="https://rnle.github.io${targetPath}"`);
    expect(html, `${from} noindex`).toContain('name="robots" content="noindex"');
    expect(html, `${from} meta refresh`).toMatch(/http-equiv="refresh" content="0;url=/);
    expect(html, `${from} visible link`).toContain(`href="${to}"`);
  }
});

test('aliases never enter the sitemap', async ({ request }) => {
  const paths = await sitemapPaths(request);
  for (const from of Object.keys(legacyAliases)) {
    expect(paths, `sitemap must exclude ${from}`).not.toContain(from);
  }
});

test('alias redirects land on the canonical route (JS enabled)', async ({ page }) => {
  await page.goto('/blaze2d/');
  await page.waitForURL('**/projects/blaze2d/');
  await expect(page.locator('h1')).toHaveText('Blaze2D');
});
