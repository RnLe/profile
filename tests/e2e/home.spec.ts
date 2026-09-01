import { expect, test } from '@playwright/test';

/** Collapses the non-breaking space and newlines a link row carries in its markup. */
const flat = (texts: string[]) => texts.map((text) => text.replace(/\s+/g, ' ').trim());

const routedSlugs = [
  'recover-in-real-time',
  'residual-worlds',
  'envelope-approximation',
  'blaze2d',
  'swarm-dynamics',
];

test('the homepage leads with the statement and a single projects band', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText('mathematical and physical models');

  const headings = await page.locator('main h2').allTextContents();
  expect(headings.some((heading) => heading.includes('Projects'))).toBe(true);
  for (const gone of [
    'From models to machines',
    'Strongest completed artifact',
    'Evidenced by work',
    'In short',
  ]) {
    expect(headings.some((heading) => heading.includes(gone)), `band "${gone}" removed`).toBe(false);
  }

  // The header carries a link of the same name; the hero button is the one under test.
  await page.locator('.hero-band').getByRole('link', { name: 'Projects' }).click();
  await page.waitForURL('**/projects/');

  // No dead-end CV download button while no CV artifact exists.
  await page.goto('/');
  await expect(page.locator('header').getByRole('link', { name: 'CV PDF' })).toHaveCount(0);
});

test('the project list runs latest first, the gated placeholder within its year', async ({ page }) => {
  await page.goto('/');
  const stripes = page.locator('[data-project-list] > li');
  await expect(stripes).toHaveCount(6);

  expect(flat(await stripes.locator('.stripe-title').allTextContents())).toEqual([
    'Recover in Real Time',
    'Residual Worlds',
    'Grounded Recovery',
    'Envelope Approximation for Photonic Moiré Crystals',
    'Blaze2D',
    'Neural Swarm Dynamics',
  ]);
  expect(flat(await stripes.locator('.stripe-year').allTextContents())).toEqual([
    '2026 – present',
    '2026 – present',
    '2026',
    '2025 – present',
    '2025 – 2026',
    '2023',
  ]);

  // Every routed project is one stretched link to its page, and nothing nests inside it.
  for (const slug of routedSlugs) {
    await expect(
      page.locator(`[data-project-list] a[data-project-link][href$="/projects/${slug}/"]`),
    ).toHaveCount(1);
  }
  await expect(page.locator('[data-project-list] a[data-project-link] a')).toHaveCount(0);

  // The route-gated project is a placeholder: sanctioned copy, no link, no asset id.
  const gated = page.locator('[data-project-list] [data-gated]');
  await expect(gated).toHaveCount(1);
  await expect(gated).toContainText('Grounded Recovery');
  await expect(gated).toContainText('Release preparation');
  await expect(gated).toContainText('have not yet passed publication review');
  // No case-study link, but the sanctioned public targets do render.
  await expect(gated.locator('a[data-project-link]')).toHaveCount(0);
  await expect(gated.locator('.stripe-title a')).toHaveCount(0);
  expect(flat(await gated.locator('.artifacts .text').allTextContents())).toEqual([
    'Website',
    'Preliminary report (36p, 1.6 MB)',
    'Repository',
  ]);
  await expect(gated.locator('[data-asset-id]')).toHaveCount(0);
});

test('link rows read like the CV: one marker each, documents with length and size', async ({
  page,
}) => {
  await page.goto('/');

  const blaze = page.locator('[data-project-list] li[data-project-id="blaze2d"]');
  expect(flat(await blaze.locator('.artifacts .text').allTextContents())).toEqual([
    'Website',
    'Technical report',
    'Repository',
    'PyPI',
    'Report (16p, 0.7 MB)',
    'Manuscript (12p, 0.9 MB)',
  ]);
  const repository = blaze.locator('.artifacts a[href="https://github.com/RnLe/blaze2d"]');
  await expect(repository).toHaveCount(1);
  await expect(repository.locator('svg')).toHaveCount(1);

  const swarm = page.locator('[data-project-list] li[data-project-id="swarm-dynamics"]');
  await expect(swarm.locator('.artifacts a[href^="/documents/"]')).toHaveCount(3);
  expect(flat(await swarm.locator('.artifacts .text').allTextContents())).toEqual([
    'Thesis (37p, 5.4 MB)',
    'Manuscript (8p, 2.9 MB)',
    'Defense slides (6.8 MB)',
    'Repository',
  ]);

  const envelope = page.locator('[data-project-list] li[data-project-id="envelope-approximation"]');
  expect(flat(await envelope.locator('.artifacts .text').allTextContents())).toEqual([
    'Report (92p, 28.1 MB)',
    'Manuscript (25p, 2.7 MB)',
    'Defense slides (12.4 MB)',
    'MSL framework source',
  ]);

  // The two robot-learning repositories are linked; neither has a staged document yet.
  const residual = page.locator('[data-project-list] li[data-project-id="residual-worlds"]');
  expect(flat(await residual.locator('.artifacts .text').allTextContents())).toEqual([
    'Website',
    'Repository',
  ]);
  const recover = page.locator('[data-project-list] li[data-project-id="recover-in-real-time"]');
  expect(flat(await recover.locator('.artifacts .text').allTextContents())).toEqual(['Repository']);
  for (const id of ['residual-worlds', 'recover-in-real-time']) {
    await expect(
      page.locator(`[data-project-list] li[data-project-id="${id}"] .artifacts a[href^="/documents/"]`),
    ).toHaveCount(0);
  }
});

test('contact lives in the footer alone, and the alias anchor still resolves', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact).toHaveCount(1);
  // The anchor is the footer itself: no separate contact band repeats it.
  expect(await contact.evaluate((el) => el.tagName)).toBe('FOOTER');
  // Displayed with an "at" literal to slow down naive text scrapers, while the
  // mailto: target stays a real address.
  const mail = contact.locator('a[href^="mailto:"]');
  await expect(mail).toHaveText(/rene\.marcel\.lehner \[at\] gmail\.com/);
  await expect(mail).toHaveAttribute('href', 'mailto:rene.marcel.lehner@gmail.com');
});
