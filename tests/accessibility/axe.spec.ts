import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { sitemapPaths } from '../helpers/sitemap';

test('no serious or critical axe violations on any canonical route', async ({
  page,
  request,
}) => {
  const paths = await sitemapPaths(request);
  const failures: Record<string, string[]> = {};
  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    if (serious.length > 0) {
      failures[path] = serious.map(
        (v) =>
          `${v.id}: ${v.nodes
            .map((n) => `${n.target.join(' ')} [${n.failureSummary?.split('\n')[1]?.trim() ?? ''}]`)
            .join(' | ')}`,
      );
    }
  }
  expect(failures).toEqual({});
});
