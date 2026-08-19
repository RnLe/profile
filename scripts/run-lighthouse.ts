/**
 * Lighthouse CI wrapper. Two WSL2 problems, both fixed here rather than in the
 * rc file, because both are about the process rather than the audit:
 *
 * 1. `lhci` otherwise picks up whatever Chrome it finds first, and under WSL that
 *    is the Windows install, which cannot open a devtools port from the Linux
 *    side ("Unable to connect to Chrome"). Pin it to the same Chromium the
 *    Playwright suites use.
 * 2. `chrome-launcher` reports the platform as `wsl` and builds its temporary
 *    profile path as a literal Windows string, so it creates a directory called
 *    `C:\Users\...\lighthouse.NNNN` *relative to the current directory*. Run it
 *    from a scratch directory so that junk never lands in the repository, and
 *    remove it afterwards.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { repoRoot } from './lib/report';

const executable = chromium.executablePath();
if (!existsSync(executable)) {
  console.error(
    `Playwright Chromium not found at ${executable}. Run: pnpm exec playwright install chromium`,
  );
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), 'lhci-'));
try {
  const result = spawnSync(
    'lhci',
    ['autorun', `--config=${join(repoRoot, 'lighthouserc.cjs')}`, ...process.argv.slice(2)],
    {
      cwd: scratch,
      stdio: 'inherit',
      env: { ...process.env, CHROME_PATH: executable },
    },
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
