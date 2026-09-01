import { describe, expect, it } from 'vitest';
import { FFT2D, shiftTable } from '../../src/lib/fft';

const fill = (n: number, f: (x: number, y: number) => number) => {
  const re = new Float64Array(n * n);
  const im = new Float64Array(n * n);
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) re[y * n + x] = f(x, y);
  }
  return { re, im };
};

describe('FFT2D', () => {
  it('rejects non-power-of-two sizes', () => {
    expect(() => new FFT2D(48)).toThrow(/power of two/);
  });

  it('puts the mean of a constant field in the DC bin and nothing else', () => {
    const n = 16;
    const fft = new FFT2D(n);
    const { re, im } = fill(n, () => 0.5);
    fft.forward(re, im);
    expect(re[0]).toBeCloseTo(0.5 * n * n, 9);
    for (let i = 1; i < n * n; i += 1) {
      expect(Math.hypot(re[i], im[i])).toBeLessThan(1e-9);
    }
  });

  it('places a single cosine in exactly its two conjugate bins', () => {
    const n = 16;
    const k = 3;
    const fft = new FFT2D(n);
    const { re, im } = fill(n, (x) => Math.cos((2 * Math.PI * k * x) / n));
    fft.forward(re, im);
    // Energy sits at (kx, ky) = (±3, 0), i.e. columns 3 and n-3 of row 0.
    expect(Math.hypot(re[k], im[k])).toBeCloseTo((n * n) / 2, 6);
    expect(Math.hypot(re[n - k], im[n - k])).toBeCloseTo((n * n) / 2, 6);
    expect(Math.hypot(re[1], im[1])).toBeLessThan(1e-9);
  });

  it('round-trips an arbitrary field through forward and inverse', () => {
    const n = 32;
    const fft = new FFT2D(n);
    const source = fill(n, (x, y) => Math.sin(x * 0.7) * Math.cos(y * 0.3) + (x * y) % 5);
    const re = Float64Array.from(source.re);
    const im = Float64Array.from(source.im);

    fft.forward(re, im);
    fft.inverse(re, im);

    for (let i = 0; i < n * n; i += 1) {
      expect(re[i]).toBeCloseTo(source.re[i], 9);
      expect(Math.abs(im[i])).toBeLessThan(1e-9);
    }
  });

  it('keeps a real reconstruction when the mask is Hermitian-symmetric', () => {
    const n = 16;
    const fft = new FFT2D(n);
    const { re, im } = fill(n, (x, y) => Math.sin(x * 0.4) + Math.cos(y * 0.9));
    fft.forward(re, im);

    // Suppress one conjugate pair, as the portrait's mirrored painting does.
    const suppress = (u: number, v: number) => {
      re[v * n + u] = 0;
      im[v * n + u] = 0;
    };
    suppress(2, 3);
    suppress((n - 2) % n, (n - 3) % n);

    fft.inverse(re, im);
    for (let i = 0; i < n * n; i += 1) {
      expect(Math.abs(im[i])).toBeLessThan(1e-9);
    }
  });
});

describe('shiftTable', () => {
  it('centres DC and is its own inverse', () => {
    const table = shiftTable(8);
    expect(table[4]).toBe(0);
    for (let i = 0; i < 8; i += 1) expect(table[table[i]]).toBe(i);
  });
});
