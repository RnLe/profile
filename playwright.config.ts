import { defineConfig, devices } from '@playwright/test';

/**
 * E2E/a11y/visual tests run against the true production artifact: `astro
 * preview` serving `dist`. Run `pnpm build` first (both verify scripts do).
 * PW_PORT picks the preview port (default 4321). A server already listening
 * there is reused only with PW_REUSE=1, so a preview of another checkout is
 * never tested by accident. PW_WORKERS caps the number of workers.
 */
const port = Number(process.env.PW_PORT ?? 4321);
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  fullyParallel: true,
  ...(process.env.PW_WORKERS ? { workers: Number(process.env.PW_WORKERS) } : {}),
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: origin,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm exec astro preview --host 127.0.0.1 --port ${port}`,
    url: origin,
    reuseExistingServer: process.env.PW_REUSE === '1',
    timeout: 30_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: ['**/no-js.spec.ts', '**/reduced-motion.spec.ts'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
      testDir: 'tests/e2e',
      testIgnore: ['**/no-js.spec.ts', '**/reduced-motion.spec.ts'],
    },
    {
      name: 'no-js',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        javaScriptEnabled: false,
      },
      testMatch: ['**/no-js.spec.ts'],
    },
    {
      name: 'reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        contextOptions: { reducedMotion: 'reduce' },
      },
      testMatch: ['**/reduced-motion.spec.ts'],
    },
  ],
});
