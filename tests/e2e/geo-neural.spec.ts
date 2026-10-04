import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * GeoNeural is the one wide case study: it runs to the window's gutters with
 * its rail beside it, marks unfinished work with a colored band, sets
 * questions between its steps, and opens on a lean terrain map that loads the
 * reference surface only. Its compression microscope decodes the neural file
 * in the browser and checks it bit for bit, and its lab runs the selected
 * network.
 */

const page_ = '/projects/geo-neural/';

/** Opens the part that holds an island and scrolls the island into view. */
async function openIsland(page: Page, component: string) {
  await page.goto(page_);
  const island = page.locator(`astro-island[component-url*="${component}"]`).first();
  const part = await page.locator('[data-panel]', { has: island }).first().getAttribute('data-panel');
  await page.goto(`${page_}#${part}`);
  await island.scrollIntoViewIfNeeded();
  return island;
}

/** From the top of a block to the bottom of its lowest control, map, chart or readout. */
async function interactiveHeight(block: Locator): Promise<number> {
  return block.evaluate((root) => {
    const top = root.getBoundingClientRect().top;
    let bottom = top;
    for (const el of root.querySelectorAll('button, select, input, summary, canvas, svg, dl')) {
      const box = el.getBoundingClientRect();
      if (box.height > 0) bottom = Math.max(bottom, box.bottom);
    }
    return bottom - top;
  });
}

async function serious(page: Page, selector: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).include(selector).analyze();
  return results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => v.id);
}

test.describe('wide layout', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 1024, 'the rail is a sidebar only beside the article');

  test('runs to the gutters with the rail beside it, from 1024 px up', async ({ page }) => {
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(page_);
      const main = await page.locator('.case-main').boundingBox();
      const view = await page.evaluate(() => document.documentElement.clientWidth);
      // Only the gutter (at most 3.25 rem) is left on the right.
      expect(main!.x + main!.width, `right edge at ${width} px`).toBeGreaterThan(view - 53);
      expect(await page.locator('nav.case-rail').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(view);
    }
  });

  test('side charts sit beside their text, with chart text of 11.5 px or more', async ({ page }) => {
    for (const [width, height] of [[1024, 768], [1280, 800], [1366, 768], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${page_}#compression`);
      const steps = page.locator('[data-panel="compression"] .step--side');
      expect(await steps.count()).toBeGreaterThan(2);
      const found = await steps.evaluateAll((list) =>
        list.map((step) => {
          const columns = getComputedStyle(step).gridTemplateColumns.split(' ').length;
          let smallest = Infinity;
          for (const svg of step.querySelectorAll<SVGSVGElement>('svg[viewBox]')) {
            const box = svg.getBoundingClientRect();
            if (box.width === 0 || svg.viewBox.baseVal.width === 0) continue;
            const scale = box.width / svg.viewBox.baseVal.width;
            for (const text of svg.querySelectorAll('text')) {
              if (text.textContent?.trim()) smallest = Math.min(smallest, parseFloat(getComputedStyle(text).fontSize) * scale);
            }
          }
          return { columns, smallest };
        }),
      );
      for (const step of found) {
        expect(step.columns, `beside at ${width} px`).toBe(2);
        expect(step.smallest, `chart text at ${width} px`).toBeGreaterThanOrEqual(11.5);
      }
    }
  });

  test('the terrain map starts on the first screen of a laptop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(page_);
    const map = await page.locator('[data-panel="overview"] .lead-figure').boundingBox();
    expect(map!.y).toBeLessThan(900 * 0.75);
  });

  test('other case studies keep a capped page, the content rail plus their own', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/projects/facial-emotion-recognition/');
    const wrap = await page.locator('.case-tabs .wrap').boundingBox();
    expect(wrap!.width).toBeLessThanOrEqual(89 * 16);
  });
});

test('work to come is a band, and questions between steps stay out of the rail', async ({ page }) => {
  await page.goto(page_);
  const band = page.locator('[data-panel]:visible .continued[role="note"]').first();
  await expect(band).toBeVisible();
  await expect(band.locator('.continued-label')).toHaveText('To be continued');
  await expect(band.locator('svg')).toHaveCount(1);

  const questions = page.locator('.question--small');
  expect(await questions.count()).toBeGreaterThan(0);
  const first = (await questions.first().innerText()).trim();
  const rail = await page.locator('nav.case-rail').innerText();
  expect(rail).not.toContain(first);
});

test('the terrain map loads the reference only, starts at 5x and responds', async ({ page }) => {
  const loaded: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/geo-neural/bundle/')) loaded.push(request.url().split('/').pop() ?? '');
  });
  await openIsland(page, 'GeoExplorer');
  const map = page.locator('.gn-map');
  await expect(map.locator('.gn-viewer-stage canvas')).toBeVisible({ timeout: 20_000 });

  const layers = map.locator('.gn-segmented').first().locator('button');
  await expect(layers).toHaveText(['Height', 'Streams', 'Geology']);
  await expect(map.locator('button[aria-pressed="true"]')).toHaveText(['Height', '5x']);
  await expect(map.locator('select')).toHaveCount(0);
  await expect(map.locator('.gn-inline[role="group"] button')).toHaveText(['Reset view', 'Top-down']);

  await layers.nth(1).click();
  await expect(layers.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(map.locator('.gn-map-legend')).toContainText('Stream');
  await map.locator('button', { hasText: '10x' }).click();
  await map.locator('button', { hasText: 'Reset view' }).click();
  await expect(map.locator('button[aria-pressed="true"]')).toHaveText(['Streams', '5x']);

  // A turn of the view turns the north arrow (WebGL draws, the controls answer).
  await map.locator('button', { hasText: 'Top-down' }).click();
  const box = await map.locator('.gn-viewer-stage').boundingBox();
  const north = map.locator('.gn-viewer-north');
  const before = await north.getAttribute('style');
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
  }
  await expect.poll(() => north.getAttribute('style')).not.toBe(before);

  expect(loaded.sort()).toEqual(['geology.classes.bin', 'manifest.json', 'reference.height.bin', 'reference.streams.bin']);
  expect(await serious(page, '.gn-map')).toEqual([]);
});

test('every interactive block fits in 90% of a 1080p browser window', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) < 1024, 'a phone may scroll through a block');
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 960 });
  const limit = 0.9 * 960;

  const map = (await openIsland(page, 'GeoExplorer')).locator('.gn-map');
  await expect(map.locator('.gn-viewer-stage canvas')).toBeVisible({ timeout: 20_000 });
  expect(await interactiveHeight(map), 'terrain map').toBeLessThanOrEqual(limit);

  const codec = (await openIsland(page, 'GeoCodec')).locator('.gn-codec');
  await expect(codec.locator('.gn-codec-card')).toHaveCount(3, { timeout: 20_000 });
  expect(await interactiveHeight(codec), 'microscope').toBeLessThanOrEqual(limit);

  const lab = (await openIsland(page, 'GeoLab')).locator('.gn-lab');
  const tabs = lab.getByRole('tab');
  await expect(tabs).toHaveCount(3, { timeout: 20_000 });
  for (let i = 0; i < 3; i++) {
    await tabs.nth(i).click();
    const run = lab.locator('.gn-lab-preset:visible').getByRole('button', { name: 'Run', exact: true });
    await expect(run).toBeEnabled({ timeout: 20_000 });
    expect(await interactiveHeight(lab), `lab, ${await tabs.nth(i).innerText()}`).toBeLessThanOrEqual(limit);
  }
});

test('the microscope decodes the neural file bit for bit', async ({ page }) => {
  await openIsland(page, 'GeoCodec');
  const codec = page.locator('.gn-codec');
  await expect(codec.locator('.gn-codec-card')).toHaveCount(3, { timeout: 20_000 });
  await codec.scrollIntoViewIfNeeded();
  await expect(codec.locator('.gn-codec-live')).toContainText('Matches the stored result bit for bit.', { timeout: 30_000 });
  expect(await serious(page, '.gn-codec')).toEqual([]);
});

test('the lab runs the selected network, which keeps flat ground flat', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) < 1024, 'one run is enough; the phone layout is the same preset');
  test.setTimeout(90_000);
  const island = await openIsland(page, 'GeoLab');
  const lab = island.locator('.gn-lab');
  await lab.getByRole('tab', { name: 'Learned networks' }).click();
  const preset = lab.locator('.gn-lab-preset:visible');
  await expect(preset.locator('select').first().locator('option[value="flat"]')).toHaveCount(1, { timeout: 20_000 });
  await preset.locator('select').first().selectOption('flat');
  await preset.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(preset.getByRole('button', { name: 'Run again' })).toBeVisible({ timeout: 60_000 });

  const slope = (title: string) =>
    preset.locator('.gn-lab-card', { hasText: title }).locator('dt', { hasText: 'Steepest slope' }).locator('xpath=following-sibling::dd[1]');
  await expect(slope('Selected network')).toHaveText('0.000');
  await expect(slope('Flux network')).not.toHaveText('0.000');
  await expect(preset.locator('.gn-lab-stopped')).toHaveCount(0);
});
