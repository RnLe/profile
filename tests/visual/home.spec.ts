import { expect, test } from '@playwright/test';

/**
 * Minimal deterministic visual set. Baselines are machine-local for
 * now (gitignored): WSL2 and CI render fonts differently, and committed
 * baselines arrive with the pinned CI environment. Never mass-accept updates.
 */
test.use({ viewport: { width: 1440, height: 900 } });

const settle = async (page: import('@playwright/test').Page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
};

test('academic home hero band', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await expect(page.locator('.hero-band')).toHaveScreenshot('home-hero.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});

test('curriculum vitae, opening on Education', async ({ page }) => {
  await page.goto('/cv/');
  await settle(page);
  await expect(page.locator('main')).toHaveScreenshot('cv-page.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});
