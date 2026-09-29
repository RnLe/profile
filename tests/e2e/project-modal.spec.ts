import { expect, test, type Page } from '@playwright/test';

/**
 * A case study is a full page at /projects/<slug>/ and, from the landing
 * page, the same article inside an overlay modal. What matters: the page is a
 * plain page; the modal shows the fetched article without changing the URL or
 * the scroll position behind it; and every way out works and returns focus.
 */

const entry = (page: Page, slug: string) =>
  page.locator(`a[data-project-link][href$="/projects/${slug}/"]`);
const modal = (page: Page) => page.locator('dialog[data-project-modal]');
const rootOverflow = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).overflow);

test.describe('project page', () => {
  test('is a normal page: breadcrumb, footer, one h1, and it scrolls', async ({ page }) => {
    await page.goto('/projects/recover-in-real-time/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Recover in Real Time');

    const pageScrolls = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 1,
    );
    expect(pageScrolls).toBe(true);
    await expect(page.locator('body > footer')).toHaveCount(1);
    await expect(modal(page)).toHaveCount(0);

    await page.locator('nav[aria-label="Breadcrumb"] a[href$="/projects/"]').click();
    await page.waitForURL('**/projects/');
  });

  test('the master thesis case study has its builder and its two operator cards', async ({ page }) => {
    await page.goto('/projects/envelope-approximation/');
    await expect(page.locator('h1')).toHaveText('Envelope Approximation for Photonic Moiré Crystals');
    await expect(page.locator('[data-project-article]')).not.toHaveAttribute('data-project-parked', '');
    await expect(page.locator('.project-body')).toHaveCount(1);

    // The builder draws the moiré period for the angle it is given.
    const builder = page.locator('.moire-builder');
    await builder.scrollIntoViewIfNeeded();
    // Islands hydrate when seen; interact only once this one has.
    await expect(page.locator('astro-island:not([ssr]) .moire-builder')).toHaveCount(1);
    await builder.locator('input[type="range"]').fill('2');
    await expect(builder.locator('.moire-readout dd').nth(1)).toHaveText('28.65');

    // A card opens its equation in a dialog, and Escape closes it.
    const cards = page.locator('.poster-card');
    await expect(cards).toHaveCount(2);
    await cards.first().scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:not([ssr]) .operator-posters')).toHaveCount(1);
    await cards.first().click();
    const dialog = page.locator('dialog.poster-dialog[open]');
    await expect(dialog.locator('h2')).toHaveText('Full TE effective Hamiltonian');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});

test.describe('landing overlay', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 768, 'phones get the full page instead');

  test('opens the case study over the list without moving the page or the URL', async ({ page }) => {
    await page.goto('/');
    const link = entry(page, 'recover-in-real-time');
    await link.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);

    await link.click();
    const dialog = modal(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-project-article] h1')).toHaveText('Recover in Real Time');
    expect(new URL(page.url()).pathname).toBe('/');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    expect(await rootOverflow(page)).toBe('hidden');
    await expect(dialog.locator('[data-project-full]')).toHaveAttribute(
      'href',
      /\/projects\/recover-in-real-time\/$/,
    );

    // The article's own stylesheet came with it: the hero keeps its wash.
    const heroBackground = await dialog
      .locator('.project-hero')
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(heroBackground).toContain('gradient');
  });

  test('Escape, the close control, and the scrim all close it and return focus', async ({ page }) => {
    await page.goto('/');
    const link = entry(page, 'recover-in-real-time');
    const dialog = modal(page);

    await link.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.getAttribute('href'))).toMatch(
      /\/projects\/recover-in-real-time\/$/,
    );
    expect(await rootOverflow(page)).not.toBe('hidden');

    await link.click();
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-project-close]').click();
    await expect(dialog).not.toBeVisible();

    await link.click();
    await expect(dialog).toBeVisible();
    // Outside the 80% panel: the scrim.
    await page.mouse.click(4, 450);
    await expect(dialog).not.toBeVisible();
  });

  test('the full-page link leaves the modal for the route', async ({ page }) => {
    await page.goto('/');
    await entry(page, 'recover-in-real-time').click();
    const dialog = modal(page);
    await expect(dialog.locator('[data-project-article] h1')).toHaveText('Recover in Real Time');

    await dialog.locator('[data-project-full]').click();
    await page.waitForURL('**/projects/recover-in-real-time/');
    await expect(modal(page)).toHaveCount(0);
  });
});

test.describe('phones', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) >= 768, 'mobile only');

  test('an entry navigates to the full page instead of opening the modal', async ({ page }) => {
    await page.goto('/');
    await entry(page, 'recover-in-real-time').click();
    await page.waitForURL('**/projects/recover-in-real-time/');
    await expect(page.locator('h1')).toHaveText('Recover in Real Time');
  });
});
