import type { Page } from '@playwright/test';

/**
 * Visits each part of a case study told in parts (only one shows at a time),
 * or the page once when it has none, and calls `check` with the part's id.
 * A part is opened through its URL hash, as a rail link would.
 */
export async function eachPart(page: Page, check: (part: string | null) => Promise<void>): Promise<void> {
  const parts = await page.$$eval('[data-panel]', (panels) => panels.map((p) => (p as HTMLElement).dataset.panel ?? ''));
  if (parts.length === 0) {
    await check(null);
    return;
  }
  for (const part of parts) {
    await page.evaluate((p) => {
      location.hash = p;
    }, part);
    await page.locator(`[data-panel="${part}"]`).first().waitFor({ state: 'visible' });
    await check(part);
  }
}
