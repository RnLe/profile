import { expect, test } from '@playwright/test';

/**
 * The projects index: cards latest first, a rail that lists them, and, on wide
 * viewports, a sticky rail whose bar follows the cards in view.
 */

const order = [
  'recover-in-real-time',
  'residual-worlds',
  'grounded-recovery',
  'envelope-approximation',
  'blaze2d',
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
  expect(trimmed(await rows.locator('.rail-title').allTextContents())).toEqual(
    trimmed(await cards.locator('h2').allTextContents()),
  );
  expect(trimmed(await rows.locator('.rail-year').allTextContents())).toEqual([
    '2026',
    '2026',
    '2026',
    '2025',
    '2025',
    '2023',
  ]);
  for (const id of order) {
    await expect(page.locator(`[data-project-rail] a[data-rail-link="${id}"]`)).toHaveAttribute(
      'href',
      `#${id}`,
    );
  }
});

test('the rail marks each project as academic, software, or hardware', async ({
  page,
  viewport,
}) => {
  await page.goto('/projects/');

  // Three fixed slots per row, so the marks read down the rail as three columns.
  const slots = page.locator('[data-project-rail] .rail-kinds');
  await expect(slots).toHaveCount(order.length);
  for (const row of await slots.all()) {
    await expect(row.locator('.rail-kind')).toHaveCount(3);
  }

  // Every project here is academic and software; only the robot platform is hardware.
  for (const id of order) {
    const row = page.locator(`[data-project-rail] a[data-rail-link="${id}"]`);
    await expect(row.locator('.kind-academic svg')).toHaveCount(1);
    await expect(row.locator('.kind-software svg')).toHaveCount(1);
    await expect(row.locator('.kind-hardware svg')).toHaveCount(
      id === 'recover-in-real-time' ? 1 : 0,
    );
  }

  // A column keeps the same x for every row: only meaningful while the rail is
  // a column, not the wrapping pill list it becomes on a narrow screen.
  if ((viewport?.width ?? 1440) < 1024) return;
  const columnLefts = await page
    .locator('[data-project-rail] .rail-kinds')
    .evaluateAll((rows) =>
      rows.map((row) =>
        Array.from(row.children, (cell) => Math.round(cell.getBoundingClientRect().left)),
      ),
    );
  for (const lefts of columnLefts) expect(lefts).toEqual(columnLefts[0]);
});

test('cards lead to the full page; the gated placeholder leads nowhere', async ({ page }) => {
  await page.goto('/projects/');
  for (const slug of order.filter((id) => id !== 'grounded-recovery')) {
    const card = page.locator(`[data-project-card="${slug}"]`);
    await expect(card.locator(`h2 a[href$="/projects/${slug}/"]`)).toHaveCount(1);
    await expect(card.locator(`.pcard-read a[href$="/projects/${slug}/"]`)).toHaveCount(1);
  }

  const gated = page.locator('[data-project-card][data-gated]');
  await expect(gated).toHaveCount(1);
  await expect(gated).toHaveId('grounded-recovery');
  // Its public targets render; nothing links to a case-study route it has not got.
  await expect(gated.locator('h2 a')).toHaveCount(0);
  await expect(gated.locator('.pcard-read')).toHaveCount(0);
  await expect(gated.locator('.artifacts a')).toHaveCount(3);
  await expect(gated).toContainText('Release preparation');
  await expect(page.locator('a[href$="/grounded-recovery/"]')).toHaveCount(0);
});

test.describe('wide viewports', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 1024, 'the rail sticks only beside the cards');

  test('the rail sticks, follows the scroll, and jumps to a card on click', async ({ page }) => {
    await page.goto('/projects/');
    const rail = page.locator('[data-project-rail]');
    expect(await rail.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

    const first = page.locator('[data-project-rail] a[data-rail-link="recover-in-real-time"]');
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
    await first.click();
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
