import { describe, expect, it } from 'vitest';
import { centreCrop, clampCrop, luma } from '../../src/components/fer/demo/image';
import { softmax } from '../../src/components/fer/demo/engine';

describe('fer demo image', () => {
  it('turns color into gray with the OpenCV weights', () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 200, 200, 200, 255]);
    expect(Array.from(luma(rgba))).toEqual([76, 150, 29, 200]);
  });

  it('crops the largest centred square', () => {
    expect(centreCrop(640, 480)).toEqual({ cx: 320, cy: 240, side: 480 });
  });

  it('keeps a moved or zoomed crop inside the photo', () => {
    expect(clampCrop({ cx: 10, cy: 470, side: 200 }, 640, 480)).toEqual({ cx: 100, cy: 380, side: 200 });
    expect(clampCrop({ cx: 320, cy: 240, side: 900 }, 640, 480).side).toBe(480);
  });
});

describe('fer demo softmax', () => {
  it('gives probabilities that sum to one, largest logit largest', () => {
    const p = softmax([2, 1, 0, -1, 5, 0, 0]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    expect(p.indexOf(Math.max(...p))).toBe(4);
  });

  it('stays finite for large logits', () => {
    expect(softmax([1000, 999]).every(Number.isFinite)).toBe(true);
  });
});
