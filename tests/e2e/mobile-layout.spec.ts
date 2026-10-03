import { expect, test } from '@playwright/test';
import { sitemapPaths } from '../helpers/sitemap';

/**
 * Card-level layout, which the document-level overflow sweep cannot see: a
 * card clips its own overflow, so a child that escapes its column is hidden
 * from `scrollWidth` while still being painted underneath the text beside it.
 * That is exactly how the thumbnail frame came to sit under the title on every
 * phone, so this asserts the containment the cards depend on directly.
 */
const NARROW = [
  { width: 320, height: 568 },
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
];

/** Every card on the site, by the attribute that marks it as one. */
const CARDS = '[data-project-id], [data-project-card]';

test('nothing inside a card escapes the box it was given', { tag: '@sweep' }, async ({ browser, request }) => {
  test.setTimeout(180_000);
  const paths = await sitemapPaths(request);
  const failures: string[] = [];

  for (const viewport of NARROW) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const path of paths) {
      await page.goto(path);
      const escapes = await page.evaluate((selector) => {
        const out: string[] = [];
        const name = (el: Element) =>
          `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}`;
        for (const card of document.querySelectorAll(selector)) {
          const id = card.getAttribute('data-project-id') ?? card.getAttribute('data-project-card');
          for (const child of card.querySelectorAll('*')) {
            const parent = child.parentElement;
            if (!parent) continue;
            const style = getComputedStyle(parent);
            // `display: contents` generates no box of its own, so its children
            // are laid out by the grandparent and have nothing here to escape.
            if (style.display === 'contents') continue;
            // A scroller is allowed to hold something wider than itself; a
            // grid or flex track is not, whether it clips the spill or shows it.
            if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue;
            if (getComputedStyle(child).position === 'absolute') continue;
            // A drawing's content is clipped by its own SVG viewport, not laid out.
            if (child instanceof SVGElement && !(child instanceof SVGSVGElement)) continue;
            const box = parent.getBoundingClientRect();
            const rect = child.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            // Horizontal only: a thumbnail deliberately bleeds past its row's
            // vertical padding, but nothing may reach past the side of its column.
            const over = Math.max(box.left - rect.left, rect.right - box.right);
            if (over > 1) {
              out.push(`${id}: ${name(child)} out of ${name(parent)} by ${Math.round(over)}px`);
            }
          }
        }
        return out;
      }, CARDS);
      for (const escape of escapes) failures.push(`${path} @ ${viewport.width}px: ${escape}`);
    }
    await context.close();
  }

  expect(failures).toEqual([]);
});

test('no card paints its text over another part of itself', { tag: '@sweep' }, async ({ browser, request }) => {
  test.setTimeout(180_000);
  const paths = await sitemapPaths(request);
  const failures: string[] = [];

  for (const viewport of NARROW) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const path of paths) {
      await page.goto(path);
      const overlaps = await page.evaluate((selector) => {
        const out: string[] = [];
        for (const card of document.querySelectorAll(selector)) {
          const id = card.getAttribute('data-project-id') ?? card.getAttribute('data-project-card');
          // The card's own regions, not their contents: siblings that share a
          // grid may never occupy the same pixels.
          const parts = [...card.children]
            .map((el) => ({ el, rect: el.getBoundingClientRect() }))
            .filter((p) => p.rect.width > 0 && p.rect.height > 0);
          for (let i = 0; i < parts.length; i += 1) {
            for (let j = i + 1; j < parts.length; j += 1) {
              const a = parts[i].rect;
              const b = parts[j].rect;
              const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
              if (overlapX > 1 && overlapY > 1) {
                out.push(
                  `${id}: .${parts[i].el.className} over .${parts[j].el.className} ` +
                    `(${Math.round(overlapX)}x${Math.round(overlapY)}px)`,
                );
              }
            }
          }
        }
        return out;
      }, CARDS);
      for (const overlap of overlaps) failures.push(`${path} @ ${viewport.width}px: ${overlap}`);
    }
    await context.close();
  }

  expect(failures).toEqual([]);
});

test.describe('touch', () => {
  test.skip(({ isMobile }) => !isMobile, 'the 44px guideline applies to a coarse pointer');

  // A text link is not a button: the row is opened up for touch as far as the
  // page's density allows, and the gap between wrapped rows carries the rest of
  // the target. What matters here is that the row is never left at its bare
  // 18 px line height on a finger.
  test('every link in a link row is opened up for touch', async ({ page, request }) => {
    const paths = await sitemapPaths(request);
    for (const path of paths) {
      await page.goto(path);
      const links = page.locator('.link-row a');
      const count = await links.count();
      for (let i = 0; i < count; i += 1) {
        const box = await links.nth(i).boundingBox();
        expect(box?.height ?? 0, `${path}: link-row link ${i}`).toBeGreaterThanOrEqual(27);
      }
    }
  });

  // A touch screen has no hover: a tap opens a mark's card, a second tap on the
  // same mark closes it, and so does a scroll.
  test('a tap opens a mark’s card and a second tap or a scroll closes it', async ({ page }) => {
    await page.goto('/');
    const stripe = page.locator('[data-project-list] li[data-project-id="recover-in-real-time"]');
    const mark = stripe.locator('.kind-mark[data-kind="learning"]');
    const tip = mark.locator('.kind-tip');
    await mark.tap();
    await expect(tip).toBeVisible();
    await mark.tap();
    await expect(tip).toBeHidden();
    await mark.tap();
    await expect(tip).toBeVisible();
    await page.evaluate(() => window.scrollBy(0, 120));
    await expect(tip).toBeHidden();

    // The activity marker beside it answers the same way.
    const activity = stripe.locator('.activity');
    await activity.tap();
    await expect(activity.locator('.tip')).toHaveCSS('opacity', '1');
    await activity.tap();
    await expect(activity.locator('.tip')).toHaveCSS('opacity', '0');

    // In the projects rail a mark sits inside a link: a tap opens its card
    // rather than jumping to the project.
    await page.goto('/projects/');
    const railMark = page.locator(
      '[data-project-rail] a[data-rail-link="blaze2d"] .kind-mark[data-kind="theory"]',
    );
    await railMark.tap();
    await expect(railMark.locator('.kind-tip')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('');
    await railMark.tap();
    await expect(railMark.locator('.kind-tip')).toBeHidden();
  });

  // The whole introduction on the first screen: the portrait (under the
  // greeting, while that is shown), the fields, the statement, and the two
  // buttons. The portrait gives way on a shorter screen (664 px is a phone
  // browser with its bars showing).
  test('the phone hero holds the whole introduction on the first screen', async ({ page }) => {
    for (const height of [664, 844]) {
      await page.setViewportSize({ width: 390, height });
      await page.goto('/');
      const box = async (selector: string) => {
        const found = await page.locator(selector).first().boundingBox();
        if (!found) throw new Error(`${selector} has no box`);
        return found;
      };
      const lab = await box('.portrait-lab');
      const fields = await box('.hero-band .fields');
      const actions = await box('.hero-band .actions');
      if ((await page.locator('.greeting').count()) > 0) {
        const greeting = await box('.greeting');
        expect(lab.y).toBeGreaterThan(greeting.y + greeting.height);
      }
      expect(fields.y).toBeGreaterThan(lab.y + lab.height);
      expect(lab.width, `portrait at ${height}px`).toBeGreaterThanOrEqual(160);
      expect(actions.y + actions.height, `buttons at ${height}px`).toBeLessThanOrEqual(height);
    }

    // The background badge sits in the middle of its own line.
    const strip = await page.locator('.evidence-strip').boundingBox();
    const badge = await page.locator('.evidence-strip .item--background').boundingBox();
    expect(Math.abs(badge!.x + badge!.width / 2 - (strip!.x + strip!.width / 2))).toBeLessThan(2);
  });

  // On a phone or a tablet each card's picture keeps the shape it has on a
  // desktop, so it shows the same part of the image: a landing thumbnail about
  // 16:9, or 4:3 where a label adds a line; a card's media about as tall as wide.
  test('card images keep their desktop proportions on a phone and a tablet', async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      for (const stripe of await page.locator('[data-project-list] > li').all()) {
        const thumb = await stripe.locator('.stripe-thumb').boundingBox();
        const labelled = (await stripe.locator('.stripe-label').count()) > 0;
        expect(thumb!.width / thumb!.height).toBeCloseTo(labelled ? 4 / 3 : 16 / 9, 1);
      }
      await page.goto('/projects/');
      for (const media of await page.locator('.pcard-media:not(.pcard-media--captioned)').all()) {
        const box = await media.boundingBox();
        expect(box!.width / box!.height).toBeCloseTo(20 / 21, 1);
      }
    }
  });
});
