import { expect, test } from '@playwright/test';

/**
 * The projects index: cards in the landing page's order, a rail that lists
 * them, and, on wide viewports, a sticky rail whose bar follows the cards in
 * view.
 */

const order = [
  'blaze2d',
  'envelope-approximation',
  'geo-neural',
  'recover-in-real-time',
  'residual-worlds',
  'facial-emotion-recognition',
  'grounded-recovery',
  'hard-spheres',
  'swarm-dynamics',
];

const trimmed = (texts: string[]) => texts.map((text) => text.trim());

test('the rail lists every card in order, title left and start year right', async ({ page }) => {
  await page.goto('/projects/');
  const rows = page.locator('[data-project-rail] a[data-rail-link]');
  const cards = page.locator('[data-project-card]');
  await expect(rows).toHaveCount(order.length);
  await expect(cards).toHaveCount(order.length);

  expect(await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-rail-link')))).toEqual(order);
  expect(await cards.evaluateAll((els) => els.map((el) => el.id))).toEqual(order);
  // The rail uses a short name where a title is long; otherwise the card's title.
  expect(trimmed(await rows.locator('.rail-title').allTextContents())).toEqual(
    trimmed(await cards.locator('h2').allTextContents()).map((title) =>
      title.startsWith('Envelope Approximation')
        ? 'Master Thesis'
        : title === 'Hard Sphere Simulations'
          ? 'Hard Spheres'
          : title === 'Facial Emotion Recognition'
            ? 'Facial Emotions'
            : title,
    ),
  );
  expect(trimmed(await rows.locator('.rail-year').allTextContents())).toEqual([
    '2025',
    '2025',
    '2026',
    '2026',
    '2026',
    '2026',
    '2026',
    '2024',
    '2023',
  ]);
  for (const id of order) {
    await expect(page.locator(`[data-project-rail] a[data-rail-link="${id}"]`)).toHaveAttribute(
      'href',
      `#${id}`,
    );
  }
});

test('the rail marks each project as robotics, machine learning, or theory', async ({
  page,
  viewport,
}) => {
  await page.goto('/projects/');

  // Three fixed slots per row, so the marks read down the rail as three columns.
  const slots = page.locator('[data-project-rail] .kind-marks');
  await expect(slots).toHaveCount(order.length);
  for (const row of await slots.all()) {
    await expect(row.locator('.kind-mark')).toHaveCount(3);
  }

  const kinds: Record<string, string[]> = {
    blaze2d: ['theory'],
    'envelope-approximation': ['theory'],
    'geo-neural': ['learning', 'theory'],
    'recover-in-real-time': ['robotics', 'learning'],
    'residual-worlds': ['robotics', 'learning'],
    'facial-emotion-recognition': ['learning'],
    'grounded-recovery': ['learning'],
    'hard-spheres': ['theory'],
    'swarm-dynamics': ['learning', 'theory'],
  };
  for (const id of order) {
    const row = page.locator(`[data-project-rail] a[data-rail-link="${id}"]`);
    for (const kind of ['robotics', 'learning', 'theory']) {
      await expect(row.locator(`.kind-mark[data-kind="${kind}"] > svg`)).toHaveCount(kinds[id].includes(kind) ? 1 : 0);
    }
  }

  // The legend names the three marks in one row above the list.
  await expect(page.locator('.legend li')).toHaveText(['Robotics', 'Machine learning', 'Theory']);

  // A column keeps the same x for every row: only meaningful while the rail is
  // a column, not the wrapping pill list it becomes on a narrow screen.
  if ((viewport?.width ?? 1440) < 1024) return;

  // A mark opens its quick card at once on hover: the kind, and its keywords.
  const mark = page.locator('[data-project-rail] a[data-rail-link="blaze2d"] .kind-mark[data-kind="theory"]');
  await expect(mark.locator('.kind-tip')).toBeHidden();
  await mark.hover();
  await expect(mark.locator('.kind-tip')).toBeVisible();
  await expect(mark.locator('.kind-tip')).toContainText('Theory');
  await expect(mark.locator('.kind-tip')).toContainText('LOBPCG');
  const columnLefts = await page
    .locator('[data-project-rail] .kind-marks')
    .evaluateAll((rows) =>
      rows.map((row) =>
        Array.from(row.children, (cell) => Math.round(cell.getBoundingClientRect().left)),
      ),
    );
  for (const lefts of columnLefts) expect(lefts).toEqual(columnLefts[0]);
});

test('cards lead to their case study, here or on the project’s own site', async ({ page }) => {
  await page.goto('/projects/');
  for (const slug of order.filter((id) => id !== 'grounded-recovery')) {
    const card = page.locator(`[data-project-card="${slug}"]`);
    await expect(card.locator(`h2 a[href$="/projects/${slug}/"]`)).toHaveCount(1);
    await expect(card.locator(`.pcard-read a[href$="/projects/${slug}/"]`)).toHaveCount(1);
  }

  // A project whose own website is its case study opens it in a new tab.
  const site = 'https://rnle.github.io/recovery-policy-learning/';
  const external = page.locator('[data-project-card="grounded-recovery"]');
  await expect(external.locator(`h2 a[href="${site}"]`)).toHaveAttribute('target', '_blank');
  await expect(external.locator(`.pcard-read a[href="${site}"]`)).toHaveAttribute('target', '_blank');
  // No route of its own, so nothing may point at one.
  await expect(page.locator('a[href$="/projects/grounded-recovery/"]')).toHaveCount(0);

  // No status pills on the cards, and no placeholder left.
  await expect(page.locator('[data-project-card] .chip')).toHaveCount(0);
  await expect(page.locator('[data-project-card][data-gated]')).toHaveCount(0);

  // The whole card is the way in, not only its title: a click on its image.
  await page.locator('[data-project-card="residual-worlds"]').click({ position: { x: 40, y: 40 } });
  await page.waitForURL('**/projects/residual-worlds/');
});

test('the showcase buttons open each figure in a floating panel', async ({ page }) => {
  await page.goto('/projects/');
  const showcase = page.locator('[data-project-card="grounded-recovery"] [data-showcase]');
  const triggers = showcase.locator('[data-trigger]');
  await expect(triggers).toHaveText(['The idea', 'Results', 'Comic']);
  // The study's own live sketch and comic reader replace their still pictures.
  await expect(showcase.locator('svg.budget-sketch__svg')).toHaveCount(1);
  await expect(showcase.locator('.comic-reader')).toHaveCount(1);

  // The idea opens beside the study's own legend; the comic needs no title.
  await expect(showcase.locator('[data-sheet="idea"] .sketch-steps li')).toHaveCount(4);
  await expect(showcase.locator('[data-sheet="comic"] .sheet-title')).toHaveCount(0);

  const results = showcase.locator('[data-sheet="results"]');
  await expect(results).toBeHidden();
  await triggers.nth(1).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await triggers.nth(1).click();
  await expect(results).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await page.keyboard.press('Escape');
  await expect(results).toBeHidden();

  // The comic panel is the study's reader: its next control turns the scene.
  await triggers.nth(2).click();
  const reader = showcase.locator('[data-sheet="comic"] .comic-reader');
  await expect(reader).toBeVisible();
  await reader.locator('.comic-reader__nav--next').click();
  await expect(reader.locator('.comic-reader__thumb').nth(1)).toHaveAttribute('aria-current', 'true');
});

test.describe('wide viewports', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 1024, 'the rail sticks only beside the cards');

  test('the rail sticks, follows the scroll, and jumps to a card on click', async ({ page }) => {
    await page.goto('/projects/');
    const rail = page.locator('[data-project-rail]');
    expect(await rail.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

    const first = page.locator('[data-project-rail] a[data-rail-link="blaze2d"]');
    const last = page.locator('[data-project-rail] a[data-rail-link="swarm-dynamics"]');
    await expect(first).toHaveAttribute('aria-current', 'true');
    await expect(last).not.toHaveAttribute('aria-current', 'true');

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(last).toHaveAttribute('aria-current', 'true');
    await expect(first).not.toHaveAttribute('aria-current', 'true');

    // The bar is shown and spans from the first active row down.
    const indicator = page.locator('[data-rail-indicator]');
    await expect.poll(() => indicator.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect
      .poll(async () => {
        const bar = await indicator.boundingBox();
        const active = await page
          .locator('[data-project-rail] a[aria-current="true"]')
          .first()
          .boundingBox();
        if (!bar || !active) return Number.NaN;
        return Math.abs(bar.y - active.y);
      })
      .toBeLessThanOrEqual(2);
    expect((await indicator.boundingBox())?.height ?? 0).toBeGreaterThan(0);

    // A row is a plain anchor: the card lands just below the sticky header.
    await page.locator('[data-project-rail] a[data-rail-link="recover-in-real-time"]').click();
    await expect(page).toHaveURL(/#recover-in-real-time$/);
    await expect
      .poll(async () => {
        const box = await page.locator('#recover-in-real-time').boundingBox();
        return box ? box.y >= 56 && box.y < 120 : false;
      })
      .toBe(true);
  });
});

test.describe('narrow viewports', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) >= 1024, 'mobile only');

  test('the rail is a static jump list without the bar', async ({ page }) => {
    await page.goto('/projects/');
    expect(
      await page.locator('[data-project-rail]').evaluate((el) => getComputedStyle(el).position),
    ).toBe('static');
    await expect(page.locator('[data-rail-indicator]')).toBeHidden();
  });
});
