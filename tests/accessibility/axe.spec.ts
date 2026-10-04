import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { eachPart } from '../helpers/parts';
import { sitemapPaths } from '../helpers/sitemap';

/** Serious and critical violations on the page as it is now, one line each. */
async function serious(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
    .map(
      (v) =>
        `${v.id}: ${v.nodes
          .map((n) => `${n.target.join(' ')} [${n.failureSummary?.split('\n')[1]?.trim() ?? ''}]`)
          .join(' | ')}`,
    );
}

/**
 * Every canonical route, and every part of a case study told in parts (only
 * one part shows at a time), on a laptop and on a phone, where charts can
 * become boxes that scroll sideways.
 */
test('no serious or critical axe violations on any canonical route', async ({ browser, request }) => {
  test.setTimeout(240_000);
  const paths = await sitemapPaths(request);
  const failures: Record<string, string[]> = {};
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const path of paths) {
      await page.goto(path);
      await eachPart(page, async (part) => {
        const found = await serious(page);
        if (found.length > 0) failures[`${path}${part ? `#${part}` : ''} @ ${viewport.width}px`] = found;
      });
    }
    await context.close();
  }
  expect(failures).toEqual({});
});
