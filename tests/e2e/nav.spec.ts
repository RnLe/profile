import { expect, test } from '@playwright/test';

/** Mobile navigation: dialog enhancement with focus/Escape/return. */

test.describe('mobile navigation', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) > 767, 'mobile viewport only');

  test('opens as a dialog, closes on Escape, and returns focus', async ({ page }) => {
    await page.goto('/');
    const summary = page.locator('.mobile-nav summary');
    await expect(summary).toBeVisible();

    await summary.click();
    const dialog = page.locator('#mobile-nav-dialog');
    await expect(dialog).toBeVisible();

    // Focus is inside the dialog (close button autofocuses).
    const focusInDialog = await page.evaluate(() =>
      document.getElementById('mobile-nav-dialog')?.contains(document.activeElement),
    );
    expect(focusInDialog).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    const focusReturned = await page.evaluate(() =>
      document.querySelector('.mobile-nav summary')?.contains(document.activeElement),
    );
    expect(focusReturned).toBe(true);
  });

  test('touch targets meet 44px and links navigate', async ({ page }) => {
    await page.goto('/');
    await page.locator('.mobile-nav summary').click();
    const links = page.locator('#mobile-nav-dialog a');
    const count = await links.count();
    // Projects and Curriculum Vitae; the CV PDF button joins them once a public
    // CV artifact exists.
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i += 1) {
      const box = await links.nth(i).boundingBox();
      expect(box?.height ?? 0, `link ${i} height`).toBeGreaterThanOrEqual(43);
    }
    await links.first().click();
    await page.waitForURL('**/projects/');
  });
});
