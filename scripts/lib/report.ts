/** Shared reporting for validator scripts: collect failures, exit non-zero. */
export class Report {
  private failures: string[] = [];

  constructor(private readonly name: string) {}

  fail(message: string): void {
    this.failures.push(message);
  }

  finish(): never {
    if (this.failures.length > 0) {
      console.error(`${this.name} FAILED (${this.failures.length} issue(s)):`);
      for (const failure of this.failures) console.error(`  ✗ ${failure}`);
      process.exit(1);
    }
    console.log(`${this.name} passed.`);
    process.exit(0);
  }
}

/** Overridable for validator integration tests (poisoned temp copies). */
export const repoRoot =
  process.env.VALIDATE_ROOT ?? new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
