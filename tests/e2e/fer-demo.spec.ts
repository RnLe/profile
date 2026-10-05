import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * The facial emotion demo: complete before it runs (a face and every network's bars),
 * then the seven networks load into Web Workers and compute in the browser, for the
 * pack's faces and for a photo of one's own.
 */

const URL = '/projects/facial-emotion-recognition/';

// the island hydrates when seen; a click before that would land on the server's markup
async function ready(page: Page) {
  await page.locator('.fer-demo').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island:not([ssr]) .fer-demo')).toHaveCount(1);
}

async function computed(page: Page) {
  await expect(page.locator('.fer-demo-status')).toContainText('Computed in your browser', { timeout: 60_000 });
}

test('the demo shows a face and seven bars per emotion before anything loads', async ({ page }) => {
  await page.goto(URL);
  const demo = page.locator('.fer-demo');
  await expect(demo).toBeVisible();
  await expect(demo.locator('.fer-demo-face img')).toBeVisible();
  await expect(demo.locator('rect.bar')).toHaveCount(49);
  await expect(demo.locator('.fer-demo-caption .fer-demo-emotion')).toBeVisible();
  await expect(demo.locator('.fer-demo-privacy')).toContainText('nothing is uploaded');
});

test('the networks run in the browser on the next face', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL);
  await ready(page);
  await page.getByRole('button', { name: 'Next face' }).click();
  await computed(page);
  await expect(page.locator('.fer-demo-caption')).toContainText('annotators said');
  // the status keeps to one line
  const status = await page.locator('.fer-demo-status').evaluate((el) => [el.scrollWidth, el.clientWidth, el.getBoundingClientRect().height]);
  expect(status[0]).toBeLessThanOrEqual(status[1]);
  expect(status[2]).toBeLessThan(30);
  expect(errors).toEqual([]);
});

test('a photo of your own is cropped, scaled to 48 px and classified', async ({ page }) => {
  await page.goto(URL);
  await ready(page);
  await page.locator('.fer-demo input[type=file]').setInputFiles({
    name: 'face.png',
    mimeType: 'image/png',
    buffer: readFileSync('src/assets/fer/samples.png'),
  });
  await computed(page);
  await expect(page.locator('.fer-demo-title')).toContainText('Your photo');
  await expect(page.locator('.fer-demo-zoom input')).toBeVisible();
});

test('the privacy note explains itself at once on hover', async ({ page }) => {
  await page.goto(URL);
  await page.locator('.fer-demo-privacy').hover();
  await expect(page.locator('.fer-demo-tip')).toBeVisible();
  await expect(page.locator('.fer-demo-tip')).toContainText('Privacy note');
  await expect(page.locator('.fer-demo-tip')).toContainText('nothing is sent anywhere');
});
