import { describe, expect, it } from 'vitest';
import { plain, runs } from '../../src/lib/marks';

describe('marks', () => {
  it('reads strong, marked, and linked runs, and strips them to plain text', () => {
    const text = 'A **core** claim, a ==marked== phrase, and the [roadmap](https://example.org/r).';
    expect(runs(text)).toEqual([
      { text: 'A ' },
      { text: 'core', kind: 'strong' },
      { text: ' claim, a ' },
      { text: 'marked', kind: 'mark' },
      { text: ' phrase, and the ' },
      { text: 'roadmap', kind: 'link', href: 'https://example.org/r' },
      { text: '.' },
    ]);
    expect(plain(text)).toBe('A core claim, a marked phrase, and the roadmap.');
  });

  it('reads a label in backticks, which plain text keeps without them', () => {
    const text = '`Computer vision:` seven networks.';
    expect(runs(text)).toEqual([{ text: 'Computer vision:', kind: 'label' }, { text: ' seven networks.' }]);
    expect(plain(text)).toBe('Computer vision: seven networks.');
  });
});
