import { expect, test } from '@playwright/test';

/**
 * The hero portrait's Fourier view runs a real transform. These tests assert
 * the physics, not just the pixels: suppressing the low-frequency centre must
 * collapse the reconstruction's mean luminance, and Restore must return it
 * exactly: a lossless mask, not a redraw.
 */

const meanLuminance = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-recon]');
    const context = canvas?.getContext('2d');
    if (!context) throw new Error('reconstruction canvas unavailable');
    const { data } = context.getImageData(0, 0, 256, 256);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += data[i];
    return sum / (data.length / 4);
  });

test('the portrait starts in Real mode with the photograph visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-layer="real"] img')).toBeVisible();
  await expect(page.locator('[data-layer="fourier"]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Real' })).toHaveAttribute('aria-pressed', 'true');
});

test('switching to Fourier moves nothing else on the page', async ({ page }) => {
  await page.goto('/');
  const below = page.locator('[data-project-list]');
  const before = (await below.boundingBox())?.y;

  await page.getByRole('button', { name: 'Fourier' }).click();
  await expect(page.locator('[data-spectrum]')).toBeVisible();
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeGreaterThan(20);

  // The instrument is a fixed square with the tools inside it, so the content
  // that follows the hero must not move by a single pixel.
  expect((await below.boundingBox())?.y).toBe(before);
});

test('Fourier mode transforms, paints, and restores losslessly', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fourier' }).click();

  const spectrum = page.locator('[data-spectrum]');
  await expect(spectrum).toBeVisible();
  await expect(page.locator('[data-recon]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible();

  // Wait for the forward transform to land a real reconstruction.
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeGreaterThan(20);
  const original = await meanLuminance(page);

  // Suppress the low-frequency centre: the image must lose its broad structure.
  await page.locator('[data-size]').fill('40');
  const box = await spectrum.boundingBox();
  if (!box) throw new Error('spectrum has no layout box');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeLessThan(original / 4);

  // Restore returns the exact original reconstruction.
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeCloseTo(original, 5);
});

test('the eraser restores painted frequencies', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fourier' }).click();
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeGreaterThan(20);
  const original = await meanLuminance(page);

  const box = await page.locator('[data-spectrum]').boundingBox();
  if (!box) throw new Error('spectrum has no layout box');
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await page.locator('[data-size]').fill('40');
  await page.mouse.click(centre.x, centre.y);
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeLessThan(original / 4);

  await page.getByRole('button', { name: 'Eraser' }).click();
  await page.locator('[data-size]').fill('56');
  await page.mouse.click(centre.x, centre.y);
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeGreaterThan(original / 2);
});
