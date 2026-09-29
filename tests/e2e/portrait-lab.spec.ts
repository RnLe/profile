import { expect, test } from '@playwright/test';

/**
 * The hero portrait's Fourier view runs a real transform. These tests assert
 * the physics, not just the pixels: suppressing the low-frequency centre must
 * collapse the reconstruction's mean luminance, and Reset must return it
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

/** Position in the document, not the viewport: clicking may scroll the page. */
const pageTop = (page: import('@playwright/test').Page, selector: string) =>
  page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) throw new Error(`${sel} not found`);
    return element.getBoundingClientRect().top + window.scrollY;
  }, selector);

test('switching to Fourier moves nothing else on the page', async ({ page }) => {
  await page.goto('/');
  const before = await pageTop(page, '[data-project-list]');

  await page.getByRole('button', { name: 'Fourier' }).click();
  await expect(page.locator('[data-spectrum]')).toBeVisible();
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeGreaterThan(20);

  // The instrument is one fixed frame with its buttons inside it, so the
  // content that follows the hero must not move by a single pixel.
  expect(await pageTop(page, '[data-project-list]')).toBe(before);
});

test('Fourier mode transforms, paints, and resets losslessly', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fourier' }).click();

  const spectrum = page.locator('[data-spectrum]');
  const reset = page.getByRole('button', { name: 'Reset' });
  await expect(spectrum).toBeVisible();
  await expect(page.locator('[data-recon]')).toBeVisible();

  // No tool rail: the brush is fixed, and the reset waits for an edit.
  await expect(page.locator('[data-portrait-lab] input')).toHaveCount(0);
  await expect(reset).toBeHidden();

  // Wait for the forward transform to land a real reconstruction.
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeGreaterThan(20);
  const original = await meanLuminance(page);

  // Remove the low-frequency centre: the image must lose its broad structure.
  const box = await spectrum.boundingBox();
  if (!box) throw new Error('spectrum has no layout box');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeLessThan(original / 4);

  // Reset returns the exact original reconstruction, and leaves with the edits.
  // Pressed from the keyboard, its focus lands on a control that opens nothing.
  await expect(reset).toBeVisible();
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => meanLuminance(page), { timeout: 5000 }).toBeCloseTo(original, 5);
  await expect(reset).toBeHidden();
  await expect(page.getByRole('button', { name: 'Fourier' })).toBeFocused();
  await expect(page.locator('[data-info] p')).toBeHidden();
});

test('the reconstruction sits above the spectrum, both squares inside the frame', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fourier' }).click();

  const stage = await page.locator('[data-portrait-lab] .stage').boundingBox();
  const recon = await page.locator('[data-recon]').boundingBox();
  const spectrum = await page.locator('[data-spectrum]').boundingBox();
  if (!stage || !recon || !spectrum) throw new Error('missing layout box');

  expect(recon.y + recon.height).toBeLessThanOrEqual(spectrum.y);
  expect(recon.width).toBeCloseTo(spectrum.width, 1);
  expect(recon.width).toBeCloseTo(recon.height, 1);
  expect(recon.y).toBeGreaterThanOrEqual(stage.y - 1);
  expect(spectrum.y + spectrum.height).toBeLessThanOrEqual(stage.y + stage.height + 1);
});

test.describe('the info button', () => {
  test('hovering it explains the view, and Escape dismisses it', async ({ page }) => {
    test.skip(!!test.info().project.use.hasTouch, 'a touch screen has no hover');
    await page.goto('/');
    await page.getByRole('button', { name: 'Fourier' }).click();

    const note = page.locator('[data-info] p');
    await expect(note).toBeHidden();

    await page.getByRole('button', { name: 'About this view' }).hover();
    await expect(note).toBeVisible();
    await expect(note).toContainText('JPEG compression');

    await page.keyboard.press('Escape');
    await expect(note).toBeHidden();
  });

  test('a click or tap opens the explanation and a second one closes it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Fourier' }).click();

    const button = page.getByRole('button', { name: 'About this view' });
    const note = page.locator('[data-info] p');

    // The pointer leaves at once, so on a desktop hover cannot be what shows it.
    await button.click();
    await page.mouse.move(0, 0);
    await expect(page.locator('[data-info]')).toHaveAttribute('data-open', '');
    await expect(note).toBeVisible();
    await expect(button).toHaveAccessibleDescription(/Fourier transform.*JPEG compression/);

    // Away from the button, so a desktop pointer's hover does not hold it open.
    await page.mouse.move(0, 0);
    await button.click();
    await page.mouse.move(0, 0);
    await expect(note).toBeHidden();
  });
});
