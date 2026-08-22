/**
 * Minimal in-place radix-2 FFT for square power-of-two images.
 *
 * Written locally rather than pulled in as a dependency: the hero portrait's
 * Fourier view is the only consumer, and it has to stay small enough to ship
 * on the academic homepage without breaking its JavaScript budget.
 *
 * Data layout is row-major `re[y * n + x]` / `im[y * n + x]`; both transforms
 * work in place, so no per-frame allocation is needed.
 */
export class FFT2D {
  readonly n: number;
  private readonly cos: Float64Array;
  private readonly sin: Float64Array;

  constructor(n: number) {
    if (n < 2 || (n & (n - 1)) !== 0) {
      throw new Error(`FFT2D size must be a power of two, got ${n}`);
    }
    this.n = n;
    const half = n >> 1;
    this.cos = new Float64Array(half);
    this.sin = new Float64Array(half);
    for (let i = 0; i < half; i += 1) {
      this.cos[i] = Math.cos((2 * Math.PI * i) / n);
      this.sin[i] = Math.sin((2 * Math.PI * i) / n);
    }
  }

  /** Decimation-in-time transform of one strided line (row or column). */
  private line(re: Float64Array, im: Float64Array, offset: number, stride: number): void {
    const n = this.n;

    for (let i = 1, j = 0; i < n; i += 1) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        const a = offset + i * stride;
        const b = offset + j * stride;
        let swap = re[a];
        re[a] = re[b];
        re[b] = swap;
        swap = im[a];
        im[a] = im[b];
        im[b] = swap;
      }
    }

    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let start = 0; start < n; start += size) {
        for (let i = start, k = 0; i < start + half; i += 1, k += step) {
          const a = offset + i * stride;
          const b = offset + (i + half) * stride;
          const c = this.cos[k];
          const s = this.sin[k];
          const tre = re[b] * c + im[b] * s;
          const tim = -re[b] * s + im[b] * c;
          re[b] = re[a] - tre;
          im[b] = im[a] - tim;
          re[a] += tre;
          im[a] += tim;
        }
      }
    }
  }

  /** Forward 2D transform, in place. */
  forward(re: Float64Array, im: Float64Array): void {
    const n = this.n;
    for (let y = 0; y < n; y += 1) this.line(re, im, y * n, 1);
    for (let x = 0; x < n; x += 1) this.line(re, im, x, n);
  }

  /** Inverse 2D transform, in place, normalized by n². */
  inverse(re: Float64Array, im: Float64Array): void {
    const total = this.n * this.n;
    for (let i = 0; i < total; i += 1) im[i] = -im[i];
    this.forward(re, im);
    const scale = 1 / total;
    for (let i = 0; i < total; i += 1) {
      re[i] *= scale;
      im[i] = -im[i] * scale;
    }
  }
}

/**
 * Index of the frequency that lands at display position `i` once the spectrum
 * is shifted so DC sits at the centre. The map is its own inverse for even n,
 * so the same table converts in both directions.
 */
export const shiftTable = (n: number): Uint32Array => {
  const table = new Uint32Array(n);
  const half = n >> 1;
  for (let i = 0; i < n; i += 1) table[i] = (i + half) % n;
  return table;
};
