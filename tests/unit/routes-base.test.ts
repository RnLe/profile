import { describe, expect, it } from 'vitest';
import { applyBase, legacyAliases } from '../../src/lib/routes';

describe('applyBase', () => {
  it('leaves paths root-relative at root deployment', () => {
    expect(applyBase('/', '/research/')).toBe('/research/');
    expect(applyBase('/', '/')).toBe('/');
    expect(applyBase('/', 'favicon.svg')).toBe('/favicon.svg');
  });

  it('prefixes a project base', () => {
    expect(applyBase('/subpath/', '/research/')).toBe('/subpath/research/');
    expect(applyBase('/subpath', '/research/')).toBe('/subpath/research/');
    expect(applyBase('/subpath/', 'favicon.svg')).toBe('/subpath/favicon.svg');
  });

  it('never doubles slashes', () => {
    expect(applyBase('//', '/x/')).toBe('/x/');
    expect(applyBase('/base//', '/x/')).toBe('/base/x/');
  });
});

describe('legacyAliases', () => {
  it('maps every retired route to a canonical target with trailing slash or anchor', () => {
    for (const [from, to] of Object.entries(legacyAliases)) {
      expect(from.endsWith('/')).toBe(true);
      expect(to.startsWith('/')).toBe(true);
      expect(/\/$|#[a-z-]+$/.test(to)).toBe(true);
    }
  });
});
