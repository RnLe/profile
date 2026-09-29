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

  await expect(page.locator('h1')).toHaveText('Hey, I’m Rene! Welcome to my profile.');
  await expect(page.locator('.hero-band blockquote')).toContainText('mathematical and physical models');

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

test('the project list leads with its picks, then runs latest first', async ({ page }) => {
  await page.goto('/');
  const stripes = page.locator('[data-project-list] > li');
  await expect(stripes).toHaveCount(6);

  // A title that leads off the site says so to a screen reader as well.
  expect(flat(await stripes.locator('.stripe-title').allTextContents())).toEqual([
    'Blaze2D',
    'Envelope Approximation for Photonic Moiré Crystals',
    'Recover in Real Time',
    'Residual Worlds',
    'Grounded Recovery (the project’s own website, opens in a new tab)',
    'Neural Swarm Dynamics',
  ]);
  expect(flat(await stripes.locator('.stripe-year').allTextContents())).toEqual([
    '2025 – present',
    '2025 – present',
    '2026 – present',
    '2026 – present',
    '2026',
    '2023',
  ]);

  // Labels say what a project is; the marker at the top right says whether
  // it is still being worked on, and its tooltip says so in words.
  const label = (id: string) => page.locator(`[data-project-list] li[data-project-id="${id}"] .stripe-label`);
  await expect(label('blaze2d')).toHaveText('Strongest Research Artifact');
  await expect(label('envelope-approximation')).toHaveText('Master Thesis');
  await expect(label('swarm-dynamics')).toHaveText('Bachelor Thesis');
  const mark = (id: string) => page.locator(`[data-project-list] li[data-project-id="${id}"] .activity`);
  for (const id of ['blaze2d', 'envelope-approximation', 'recover-in-real-time', 'residual-worlds']) {
    await expect(mark(id)).toHaveAttribute('aria-label', 'Active Research');
  }
  for (const id of ['grounded-recovery', 'swarm-dynamics']) {
    await expect(mark(id)).toHaveAttribute('aria-label', 'Done, closed and archived.');
  }
  // Hover or focus (a tap focuses it): the tooltip shows at once.
  await mark('blaze2d').focus();
  await expect(mark('blaze2d').locator('.tip')).toHaveCSS('opacity', '1');

  // Left of it, the same kind marks as the projects rail, from the same
  // source, each with the same quick card on hover or focus.
  const kinds = (id: string) =>
    page.locator(`[data-project-list] li[data-project-id="${id}"] .stripe-mark .kind-mark`);
  await expect(kinds('blaze2d')).toHaveCount(1);
  await expect(kinds('recover-in-real-time')).toHaveCount(2);
  await expect(kinds('swarm-dynamics')).toHaveCount(2);
  const theory = kinds('blaze2d').first();
  await expect(theory).toHaveAttribute('aria-label', /^Theory: .*LOBPCG/);
  await expect(theory.locator('.kind-tip')).toBeHidden();
  await theory.focus();
  await expect(theory.locator('.kind-tip')).toBeVisible();
  await expect(theory.locator('.kind-tip')).toContainText('Theory');

  // Every routed project is one stretched link to its page, and nothing nests inside it.
  for (const slug of routedSlugs) {
    await expect(
      page.locator(`[data-project-list] a[data-project-link][href$="/projects/${slug}/"]`),
    ).toHaveCount(1);
  }
  await expect(page.locator('[data-project-list] a[data-project-link] a')).toHaveCount(0);

  // A case study on the project's own site is a plain link out: the modal
  // must not claim it, and there is no route here for it to point at.
  const external = page.locator('[data-project-list] li[data-project-id="grounded-recovery"]');
  const title = external.locator('.stripe-title a');
  await expect(title).toHaveAttribute('href', 'https://rnle.github.io/recovery-policy-learning/');
  await expect(title).toHaveAttribute('target', '_blank');
  await expect(title).not.toHaveAttribute('data-project-link');
  expect(flat(await external.locator('.artifacts .text').allTextContents())).toEqual([
    'Website',
    'Technical report (15p, 0.7 MB)',
    'Repository',
  ]);

  // No status pills on the list.
  await expect(page.locator('[data-project-list] .chip')).toHaveCount(0);
  await expect(page.locator('[data-project-list] [data-gated]')).toHaveCount(0);
});

test('link rows read like the CV: one marker each, documents with length and size', async ({
  page,
}) => {
  await page.goto('/');

  // The row opens with the project's mark and name, which lead to the web
  // edition of its technical report, as on the CV.
  const blaze = page.locator('[data-project-list] li[data-project-id="blaze2d"]');
  expect(flat(await blaze.locator('.artifacts .text').allTextContents())).toEqual([
    'Blaze2D',
    'Website',
    'Technical report (16p, 0.7 MB)',
    'Manuscript (12p, 0.9 MB)',
    'Repository',
    'PyPI',
  ]);
  const mark = blaze.locator('.artifacts a').first();
  await expect(mark).toHaveAttribute('href', 'https://rnle.github.io/blaze2d/blaze/');
  await expect(mark.locator('img')).toHaveCount(1);
  const repository = blaze.locator('.artifacts a[href="https://github.com/RnLe/blaze2d"]');
  await expect(repository).toHaveCount(1);
  await expect(repository.locator('svg')).toHaveCount(1);

  // A thesis is set in bold wherever it appears in a row.
  for (const id of ['envelope-approximation', 'swarm-dynamics']) {
    const thesis = page.locator(`[data-project-list] li[data-project-id="${id}"] .artifacts a`).first();
    await expect(thesis).toContainText('Thesis');
    expect(await thesis.evaluate((el) => Number(getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(600);
  }

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
    'Thesis (92p, 28.1 MB)',
    'Manuscript (25p, 2.7 MB)',
    'Defense slides (12.4 MB)',
    'Thesis page',
    'MSL framework source',
  ]);

  // The two robot-learning repositories are linked; neither has a staged document yet.
  const residual = page.locator('[data-project-list] li[data-project-id="residual-worlds"]');
  expect(flat(await residual.locator('.artifacts .text').allTextContents())).toEqual(['Repository']);
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
