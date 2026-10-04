import { describe, expect, it } from 'vitest';
import { panelId, slugify, stepIds } from '../../src/lib/case-nav';

describe('case-study navigation ids', () => {
  it('gives every step heading a stable id, unique within its part', () => {
    expect(stepIds('data', ['Cleaning', 'Label noise', 'Cleaning'])).toEqual([
      'data-cleaning',
      'data-label-noise',
      'data-cleaning-2',
    ]);
    expect(slugify('Moiré: twist & shift')).toBe('moire-twist-shift');
    expect(panelId('geo-neural', 'physics')).toBe('geo-neural-panel-physics');
  });
});
