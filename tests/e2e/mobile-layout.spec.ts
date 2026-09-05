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

test('nothing inside a card escapes the box it was given', async ({ browser, request }) => {
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

test('no card paints its text over another part of itself', async ({ browser, request }) => {
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

  test('every link in a link row meets the 44px guideline', async ({ page, request }) => {
    const paths = await sitemapPaths(request);
    for (const path of paths) {
      await page.goto(path);
      const links = page.locator('.link-row a');
      const count = await links.count();
      for (let i = 0; i < count; i += 1) {
        const box = await links.nth(i).boundingBox();
        expect(box?.height ?? 0, `${path}: link-row link ${i}`).toBeGreaterThanOrEqual(43);
      }
    }
  });
});
