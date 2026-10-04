import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * A case study told in parts shows one part at a time however it is reached.
 * The client router replaces <html>'s attributes on every navigation, which
 * once dropped the has-js mark: after a client-side navigation every part
 * showed at once and a rail click scrolled back to the top of the study.
 */

async function showsOnly(scope: Locator, part: string) {
  await expect(scope.locator('[data-case].tabs--ready')).toHaveCount(1);
  await expect(scope.locator('[data-panel]').filter({ visible: true })).toHaveCount(1);
  await expect(scope.locator(`[data-panel="${part}"]`)).toBeVisible();
}

async function openPart(page: Page, scope: Locator, part: string) {
  await scope.locator(`.case-rail a[data-part-link="${part}"]`).click();
  await showsOnly(scope, part);
  await expect(scope.locator(`[data-panel="${part}"] .panel-title`)).toBeInViewport();
  await expect(page.locator('html')).toHaveClass(/\bhas-js\b/);
}

test('a study in parts keeps its parts after client-side navigation', async ({ page }) => {
  await page.goto('/projects/');
  await page.locator('main a[href$="/projects/facial-emotion-recognition/"]').first().click();
  await page.waitForURL('**/projects/facial-emotion-recognition/');
  const main = page.locator('main');
  await showsOnly(main, 'overview');
  await page.evaluate(() => window.scrollTo(0, 1500));
  await openPart(page, main, 'architectures');

  // From the landing page an entry opens the full page (the overlay is parked).
  await page.locator('nav[aria-label="Breadcrumb"] a[href="/"]').click();
  await page.waitForURL((url) => url.pathname === '/');
  await page.locator('a[data-project-link][href$="/projects/geo-neural/"]').first().click();
  await page.waitForURL('**/projects/geo-neural/');
  await showsOnly(main, 'overview');
  await main.locator('.case-rail a[data-part-link="drainage"]').click();
  await showsOnly(main, 'drainage');
});
