import { expect, test } from '@playwright/test';

/** Reduced-motion users get final states immediately, nothing hidden. */

test('all content is visible immediately under reduced motion', async ({ page }) => {
  await page.goto('/');
  const hidden = await page
    .locator('[data-reveal], [data-draw]')
    .evaluateAll((els) =>
      els.filter((el) => getComputedStyle(el).opacity === '0').map((el) => el.tagName),
    );
  expect(hidden).toEqual([]);
});
