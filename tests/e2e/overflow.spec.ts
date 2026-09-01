import { expect, test } from '@playwright/test';
import { sitemapPaths } from '../helpers/sitemap';

/** No horizontal overflow at any required viewport; 4K is a smoke test. */
const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
];

test('no route scrolls horizontally at any required viewport', async ({ browser, request }) => {
  test.setTimeout(240_000);
  const paths = await sitemapPaths(request);
  const failures: string[] = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const path of paths) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) {
        failures.push(`${path} @ ${viewport.width}px: +${overflow}px`);
      }
    }
    await context.close();
  }

  expect(failures).toEqual([]);
});
