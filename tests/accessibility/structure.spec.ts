import { expect, test } from '@playwright/test';
import { sitemapPaths } from '../helpers/sitemap';

test('every canonical route has ordered headings, landmarks, and named links', async ({
  page,
  request,
}) => {
  const paths = await sitemapPaths(request);
  for (const path of paths) {
    await page.goto(path);

    await expect(page.locator('h1'), `single h1 on ${path}`).toHaveCount(1);
    await expect(page.locator('main'), `main landmark on ${path}`).toHaveCount(1);
    // Site-level banner; article-scoped <header> elements are legitimate extras.
    await expect(page.locator('body > header'), `site header on ${path}`).toHaveCount(1);

    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((el) => Number(el.tagName.slice(1))));
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1], `heading jump on ${path} at index ${i}`).toBeLessThanOrEqual(1);
    }

    const unnamed = await page
      .locator('a')
      .evaluateAll((els) =>
        els
          .filter((el) => {
            const text = (el.textContent ?? '').trim();
            const label = el.getAttribute('aria-label');
            return text.length === 0 && !label;
          })
          .map((el) => el.outerHTML.slice(0, 100)),
      );
    expect(unnamed, `unnamed links on ${path}`).toEqual([]);
  }
});
