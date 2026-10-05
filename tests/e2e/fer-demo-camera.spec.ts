import { expect, test } from '@playwright/test';

/**
 * The facial emotion demo with a camera: Chromium's stand-in camera (a moving test
 * pattern, no prompt) runs through the seven networks in real time.
 */

test.use({
  permissions: ['camera'],
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

test('the camera runs the networks in real time, frame after frame', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/projects/facial-emotion-recognition/');
  await page.locator('.fer-demo').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island:not([ssr]) .fer-demo')).toHaveCount(1);
  await page.getByRole('button', { name: 'Camera' }).click();
  const live = page.getByRole('button', { name: 'Real-time' });
  await live.click();
  await expect(live).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fer-demo-status')).toContainText('frames/s', { timeout: 60_000 });
  await live.click();
  await expect(page.locator('.fer-demo-status')).not.toContainText('frames/s');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('.fer-demo-face img')).toBeVisible();
  expect(errors).toEqual([]);
});
