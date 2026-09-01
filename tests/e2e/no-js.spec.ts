import { expect, test } from '@playwright/test';
import { sitemapPaths } from '../helpers/sitemap';

/**
 * Academic content, links, and navigation must remain usable with
 * JavaScript disabled (390×844 project `no-js`). Reveal-style entrances must
 * never leave content hidden.
 */
test('every canonical route is readable and navigable without JavaScript', async ({
  page,
  request,
}) => {
  const paths = await sitemapPaths(request);
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator('h1'), `h1 visible on ${path}`).toBeVisible();
    await expect(page.locator('main'), `main content on ${path}`).toBeVisible();
    const navLinks = page.locator('header a, nav a');
    expect(await navLinks.count(), `nav links on ${path}`).toBeGreaterThan(0);
  }
});

test('a project entry is a plain link to its page without JavaScript', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[data-project-link]').first().click();
  await page.waitForURL(/\/projects\/[a-z0-9-]+\/$/);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('no reveal target stays hidden without JavaScript', async ({ page, request }) => {
  const paths = await sitemapPaths(request);
  for (const path of paths) {
    await page.goto(path);
    const hidden = await page
      .locator('[data-reveal]')
      .evaluateAll((els) =>
        els.filter((el) => getComputedStyle(el).opacity === '0').map((el) => el.outerHTML.slice(0, 80)),
      );
    expect(hidden, `hidden reveals on ${path}`).toEqual([]);
  }
});
