import { expect, test } from '@playwright/test';

test('the CV opens on Education, with the page heading kept for the outline only', async ({
  page,
}) => {
  await page.goto('/cv/');

  // Exactly one h1, and it is not what the reader sees first.
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText('Curriculum Vitae');
  // visually-hidden: present for the outline, occupying no layout.
  const box = await h1.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(1);
  expect(box?.height ?? 0).toBeLessThanOrEqual(1);

  // One label per section, and it is the heading: no eyebrow-plus-title pair.
  const sections = await page.locator('h2').allTextContents();
  expect(sections).toEqual([
    'Education',
    'Teaching',
    'Programs',
    'Academic leadership & service',
    'Awards',
    'Languages',
  ]);
});

test('entries put the location on the period row and the organisation on the title row', async ({
  page,
}) => {
  await page.goto('/cv/');
  const tohoku = page.locator('.entries li', { hasText: 'International Program' }).first();
  await expect(tohoku.locator('.where')).toContainText('Sendai, Japan');
  // One row, not two: the place shares the period's line.
  const sameRow = await tohoku.evaluate((li) => {
    const when = li.querySelector('.period > span')!.getBoundingClientRect();
    const where = li.querySelector('.where')!.getBoundingClientRect();
    return Math.abs(when.top - where.top) < 4;
  });
  expect(sameRow).toBe(true);

  const msc = page.locator('.entries li', { hasText: 'M.Sc. Physics' }).first();
  await expect(msc.locator('h3 .org')).toHaveText('TU Dortmund University');
});

test('artifacts are links or placeholders, and a placeholder is never clickable', async ({
  page,
}) => {
  await page.goto('/cv/');

  const msc = page.locator('.entries li', { hasText: 'M.Sc. Physics' }).first();
  const bsc = page.locator('.entries li', { hasText: 'B.Sc. Physics' }).first();

  // Every M.Sc. artifact is now staged or public, so nothing is withheld.
  await expect(msc.locator('.artifacts a')).not.toHaveCount(0);
  // The thesis leads the list and is the emphasised item.
  await expect(msc.locator('.artifacts span').first()).toHaveText(/Thesis/);
  await expect(msc.locator('.artifacts .is-primary')).toHaveCount(1);

  // Should an artifact become unreachable again, it says so to assistive
  // technology rather than looking clickable.
  await expect(page.locator('.artifacts .pending a')).toHaveCount(0);

  // The bachelor repository is public, so all four of its artifacts link out.
  await expect(bsc.locator('.artifacts a')).toHaveCount(4);
  await expect(bsc.locator('.artifacts .pending')).toHaveCount(0);

  const origin = new URL(page.url()).origin;
  const hrefs = await page.locator('.artifacts a').evaluateAll((links) =>
    links.map((a) => (a as HTMLAnchorElement).href),
  );
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    // Either an external artifact over https, or a document this site stages
    // itself. Nothing else is a legitimate target.
    const allowed = href.startsWith('https://') || href.startsWith(`${origin}/documents/`);
    expect(allowed, `unexpected CV link target: ${href}`).toBe(true);
  }
});

test('staged documents are served from the site itself, as PDFs', async ({ page, request }) => {
  await page.goto('/cv/');

  // Everything under /documents/ is a file this site stages and serves. It must
  // arrive as a PDF, not as a download: the point of hosting these rather than
  // linking a repository is that they open in the browser.
  const hrefs = await page
    .locator('.artifacts a')
    .evaluateAll((links) =>
      links.map((a) => a.getAttribute('href')).filter((h): h is string => !!h?.startsWith('/documents/')),
    );
  expect(hrefs.length, 'staged documents on the CV').toBe(6);

  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
    expect(response.headers()['content-type'], href).toContain('pdf');
  }
});

test('every artifact carries a marker for what it is', async ({ page }) => {
  await page.goto('/cv/');
  // The rule and the line break are decoration, not artifacts.
  const items = page.locator('.artifacts > span:not(.rule):not(.break)');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    await expect(items.nth(i).locator('svg'), `marker on artifact ${i}`).toHaveCount(1);
  }

  // Repositories are marked as repositories, not as generic web pages.
  const repo = page.locator('.artifacts > span', { hasText: 'Repository' }).first();
  await expect(repo.locator('svg')).toHaveCount(1);
});

test("a second project's artifacts are set off by a rule and its mark", async ({ page }) => {
  await page.goto('/cv/');
  const msc = page.locator('.entries li', { hasText: 'M.Sc. Physics' }).first();

  // One rule, between the thesis artifacts and the Blaze2D ones, and it names
  // the project it introduces.
  const rule = msc.locator('.artifacts .rule');
  await expect(rule).toHaveCount(1);
  await expect(rule.locator('img')).toHaveCount(1);
  await expect(rule.locator('.group-name')).toHaveText('Blaze2D');

  // The thesis comes first, everything after the rule belongs to Blaze2D.
  const labels = await msc.locator('.artifacts > span').allTextContents();
  const ruleIndex = labels.findIndex((t) => t.includes('Blaze2D'));
  // Thesis, manuscript, defense slides, then the line break, then the rule.
  expect(ruleIndex).toBe(4);
  expect(labels[0]).toContain('Thesis');
});

test('document links state their length and file size', async ({ page }) => {
  await page.goto('/cv/');
  const msc = page.locator('.entries li', { hasText: 'M.Sc. Physics' }).first();
  const thesis = msc.locator('.artifacts > span', { hasText: 'Thesis' }).first();
  await expect(thesis.locator('.size')).toHaveText('(92p, 28.1 MB)');

  // A slide deck states its size but not a page count: counting slides says
  // nothing about how much there is to read.
  const slides = msc.locator('.artifacts > span', { hasText: 'Defense slides' }).first();
  await expect(slides.locator('.size')).toHaveText('(12.4 MB)');

  // A web page has no file size to state.
  const website = page.locator('.artifacts > span', { hasText: 'Website' }).first();
  await expect(website.locator('.size')).toHaveCount(0);
});

test('places and languages carry a flag', async ({ page }) => {
  await page.goto('/cv/');
  // Programs show the flag after the country, on the period row.
  await expect(page.locator('.where svg')).not.toHaveCount(0);
  // Languages stack vertically, flag first.
  const languages = page.locator('.languages li');
  await expect(languages).toHaveCount(3);
  await expect(languages.first()).toContainText('German');
  const stacked = await page.locator('.languages').evaluate(
    (ul) => getComputedStyle(ul).flexDirection,
  );
  expect(stacked).toBe('column');
});

test('programs share one date column and one place column', async ({ page }) => {
  await page.goto('/cv/');
  const rails = page.locator('.period--split');
  const boxes = await rails.evaluateAll((els) =>
    els.map((el) => {
      const when = el.firstElementChild!.getBoundingClientRect();
      const where = el.lastElementChild!.getBoundingClientRect();
      return { left: Math.round(when.left), right: Math.round(where.right) };
    }),
  );
  expect(boxes.length).toBeGreaterThan(3);
  // Every date starts at the same x, every place ends at the same x.
  expect(new Set(boxes.map((b) => b.left)).size).toBe(1);
  expect(new Set(boxes.map((b) => b.right)).size).toBe(1);
});

test('the B.Sc. entry shows the corrected start year', async ({ page }) => {
  await page.goto('/cv/');
  const bsc = page.locator('.entries li', { hasText: 'B.Sc. Physics' }).first();
  await expect(bsc.locator('.period')).toContainText('2019');
});
