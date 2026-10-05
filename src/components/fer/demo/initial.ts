// Build-time only: the face the demo shows before it runs, read from the staged sample
// pack, with every network's precomputed probabilities, so the figure is complete
// without JavaScript. The browser then picks faces at random from the same pack.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import type { DemoFace, DemoSamples } from './types';

const DIR = join(process.cwd(), 'static-public-source/fer/demo');
// A clear smile that all seven networks read as happy, at 72 to 99%.
const FIRST = 123;

function crc32(bytes: Uint8Array): number {
  let c = ~0;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

/** A grayscale PNG, as a data URL. */
export function pngUrl(pixels: Uint8Array, size: number): string {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 0, 0, 0, 0], 8); // 8-bit grayscale
  const rows = Buffer.alloc(size * (size + 1));
  for (let y = 0; y < size; y++) rows.set(pixels.subarray(y * size, (y + 1) * size), y * (size + 1) + 1);
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', new Uint8Array()),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

export function demoInitial(): { face: DemoFace; classes: string[]; models: string[] } {
  const samples = JSON.parse(readFileSync(join(DIR, 'samples.json'), 'utf8')) as DemoSamples;
  const pixels = readFileSync(join(DIR, 'samples.u8'));
  const n = samples.size * samples.size;
  const face = new Uint8Array(pixels.subarray(FIRST * n, (FIRST + 1) * n));
  return {
    face: {
      src: pngUrl(face, samples.size),
      label: samples.label[FIRST],
      votes: samples.votes[FIRST],
      probs: samples.probs[FIRST].map((row) => row.map((v) => v / 1000)),
    },
    classes: samples.classes,
    models: samples.models,
  };
}
