import { defineConfig, devices } from '@playwright/test';

/**
 * E2E/a11y/visual tests run against the true production artifact: `astro
 * preview` serving `dist`. Run `pnpm build` first (verify:core does).
 */
export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm preview:ci',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true,
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
