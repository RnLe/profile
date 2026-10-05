// A photo or camera frame turned into what the networks were trained on: a square crop of
// the face, 48x48 pixels, grayscale. The crop is scaled down in halving steps before the
// last step to 48 px, which averages pixels much like the area resize used to build the
// dataset; gray is the usual luma mix (0.299 R + 0.587 G + 0.114 B, as in OpenCV).

export const SIZE = 48;

export interface Crop {
  /** Centre and side of the square, in source pixels. */
  cx: number;
  cy: number;
  side: number;
}

export function luma(rgba: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(rgba.length / 4);
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.round(0.299 * rgba[4 * i] + 0.587 * rgba[4 * i + 1] + 0.114 * rgba[4 * i + 2]);
  }
  return out;
}

/** The largest centred square of a w x h source. */
export function centreCrop(w: number, h: number): Crop {
  return { cx: w / 2, cy: h / 2, side: Math.min(w, h) };
}

/** Keeps a crop inside its source, at most as large as the source's shorter side. */
export function clampCrop(crop: Crop, w: number, h: number): Crop {
  const side = Math.max(8, Math.min(crop.side, w, h));
  const half = side / 2;
  return { side, cx: Math.min(Math.max(crop.cx, half), w - half), cy: Math.min(Math.max(crop.cy, half), h - half) };
}

// canvases kept between calls, one per size and use: the live camera reads a frame many
// times a second
const pool = new Map<string, HTMLCanvasElement>();

function canvas(w: number, h: number, use = 'step'): HTMLCanvasElement {
  const key = `${use}:${w}x${h}`;
  let c = pool.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    pool.set(key, c);
  }
  return c;
}

function context(c: HTMLCanvasElement, settings?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D {
  const ctx = c.getContext('2d', settings)!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

/** 48x48 grayscale pixels from a square crop of an image, a bitmap or a video frame. */
export function facePixels(source: CanvasImageSource, crop: Crop, mirror = false): Uint8Array {
  let side = Math.max(SIZE, Math.round(crop.side));
  let current = canvas(side, side, 'crop');
  let ctx = context(current);
  if (mirror) {
    ctx.translate(side, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, crop.cx - crop.side / 2, crop.cy - crop.side / 2, crop.side, crop.side, 0, 0, side, side);
  while (side / 2 >= SIZE * 2) {
    const next = canvas(Math.round(side / 2), Math.round(side / 2));
    context(next).drawImage(current, 0, 0, next.width, next.height);
    current = next;
    side = next.width;
  }
  const out = canvas(SIZE, SIZE, 'out');
  ctx = context(out, { willReadFrequently: true });
  ctx.drawImage(current, 0, 0, SIZE, SIZE);
  return luma(ctx.getImageData(0, 0, SIZE, SIZE).data);
}

/** A 48x48 face as a PNG data URL, for an <img>. */
export function faceUrl(pixels: Uint8Array): string {
  const c = canvas(SIZE, SIZE, 'url');
  const ctx = context(c);
  const img = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < pixels.length; i++) {
    img.data[4 * i] = img.data[4 * i + 1] = img.data[4 * i + 2] = pixels[i];
    img.data[4 * i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}
