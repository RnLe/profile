/**
 * Lighthouse CI over the built static artifact. Chrome comes from Playwright's
 * Chromium: `scripts/run-lighthouse.ts` pins CHROME_PATH to it, so lhci cannot
 * fall through to a Windows install under WSL2. --no-sandbox is required in the
 * WSL2/CI container context.
 */
const { join } = require('node:path');

module.exports = {
  ci: {
    collect: {
      // Absolute: the wrapper runs lhci from a scratch working directory.
      staticDistDir: join(__dirname, 'dist'),
      url: [
        'http://localhost/index.html',
        'http://localhost/projects/index.html',
        // The case-study modal: the site's main reading surface.
        'http://localhost/projects/blaze2d/index.html',
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.98 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: { target: 'filesystem', outputDir: join(__dirname, '.lighthouseci') },
  },
};
