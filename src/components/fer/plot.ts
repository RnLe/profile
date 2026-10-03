/**
 * Scales, ticks and formats shared by the drawn figures of the facial emotion
 * study (Plot, Bars, Heatmap). Every figure is plain SVG rendered at build
 * time from the study's exported data in src/data/fer.
 */

export type Scale = ((v: number) => number) & { ticks: number[]; log: boolean };

export interface AxisSpec {
  label?: string;
  log?: boolean;
  min?: number;
  max?: number;
  /** Explicit ticks; otherwise chosen to fit the range. */
  ticks?: number[];
  /** Tick labels in place of the formatted values (a categorical axis). */
  tickLabels?: { at: number; label: string }[];
  /** Values in 0..1 shown as percent. */
  percent?: boolean;
  /** Digits after the point; otherwise from the tick spacing. */
  digits?: number;
  /** Text after every tick label, such as ' MB'. */
  unit?: string;
  /** Grid lines at the ticks, but no labels (rows named inside the plot). */
  hideLabels?: boolean;
}

const NICE = [1, 2, 2.5, 5, 10];

/** About `count` round ticks covering [lo, hi]. */
export function linearTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo || Math.abs(hi) || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = NICE.find((n) => n * mag >= raw)! * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toPrecision(12));
  return out;
}

/** Decades, with 2 and 5 between them when the range spans less than three. */
export function logTicks(lo: number, hi: number): number[] {
  const a = Math.floor(Math.log10(lo));
  const b = Math.ceil(Math.log10(hi));
  const steps = b - a < 3 ? [1, 2, 5] : [1];
  const out: number[] = [];
  for (let e = a; e <= b; e++) for (const s of steps) {
    const v = s * 10 ** e;
    if (v >= lo * 0.999 && v <= hi * 1.001) out.push(+v.toPrecision(12));
  }
  return out;
}

/** A scale from data to pixels over [p0, p1], with its ticks. */
export function scale(values: number[], spec: AxisSpec, p0: number, p1: number, pad = 0.04): Scale {
  const finite = values.filter((v) => Number.isFinite(v) && (!spec.log || v > 0));
  let lo = spec.min ?? Math.min(...finite);
  let hi = spec.max ?? Math.max(...finite);
  if (lo === hi) [lo, hi] = [lo - 1, hi + 1];
  if (spec.log) {
    const [l, h] = [Math.log10(lo), Math.log10(hi)];
    const span = h - l;
    const L = spec.min == null ? l - span * pad : l;
    const H = spec.max == null ? h + span * pad : h;
    const f = ((v: number) => p0 + ((Math.log10(Math.max(v, 1e-300)) - L) / (H - L)) * (p1 - p0)) as Scale;
    f.ticks = spec.ticks ?? logTicks(10 ** L, 10 ** H);
    f.log = true;
    return f;
  }
  const span = hi - lo;
  const L = spec.min == null ? lo - span * pad : lo;
  const H = spec.max == null ? hi + span * pad : hi;
  const f = ((v: number) => p0 + ((v - L) / (H - L)) * (p1 - p0)) as Scale;
  f.ticks = spec.ticks ?? linearTicks(L, H);
  f.log = false;
  return f;
}

export function format(v: number, spec: AxisSpec, ticks: number[] = []): string {
  const value = spec.percent ? v * 100 : v;
  let digits = spec.digits;
  if (digits == null) {
    const scaled = (spec.percent ? ticks.map((t) => t * 100) : ticks).filter((t) => t !== 0);
    const step = scaled.length > 1 ? Math.min(...scaled.slice(1).map((t, i) => Math.abs(t - scaled[i]))) : Math.abs(value);
    digits = step === 0 ? 0 : decimals(step);
    if (spec.log) digits = Math.abs(value) >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(Math.abs(value))));
  }
  const text =
    Math.abs(value) >= 1e5 || (Math.abs(value) < 1e-3 && value !== 0)
      ? compact(value)
      : value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return text + (spec.unit ?? '');
}

/** Decimals needed to write a tick spacing exactly (2.5 needs one, 20 none). */
function decimals(step: number): number {
  for (let d = 0; d < 4; d++) if (Math.abs(step * 10 ** d - Math.round(step * 10 ** d)) < 1e-6) return d;
  return 3;
}

/** 1.2k, 3M, 1e-4: short labels for wide ranges. */
export function compact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) return `${+(v / 1e6).toPrecision(2)}M`;
  if (a >= 1e3) return `${+(v / 1e3).toPrecision(2)}k`;
  if (a < 1e-3 && a > 0) return `1e${Math.round(Math.log10(a))}`;
  return String(+v.toPrecision(2));
}

export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

/** An SVG path through points, skipping gaps (non-finite values). */
export function path(points: [number, number][], x: (v: number) => number, y: (v: number) => number): string {
  let d = '';
  let pen = false;
  for (const [a, b] of points) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${x(a).toFixed(1)},${y(b).toFixed(1)}`;
    pen = true;
  }
  return d;
}

/** The study's colours, one per architecture, and for the compression methods. */
export const MODEL_COLORS: Record<string, string> = {
  cnn: '#7d8790',
  vgg: '#b7791f',
  resnet: '#2f6db0',
  densenet: '#2e8a5f',
  vit: '#b4503a',
  convnext: '#6a46a8',
  cct: '#b8558a',
  resnet_pretrained: '#1d3557',
};

export const MODEL_NAMES: Record<string, string> = {
  cnn: 'Simple CNN',
  vgg: 'VGG',
  resnet: 'ResNet-18',
  densenet: 'DenseNet',
  vit: 'ViT',
  convnext: 'ConvNeXt',
  cct: 'CCT',
  resnet_pretrained: 'ResNet-18, ImageNet',
};

export const METHOD_COLORS: Record<string, string> = {
  low_rank: '#2f6db0',
  tucker2: '#b4503a',
  spatial: '#2e8a5f',
  int8: '#52606b',
  scratch: '#6a46a8',
};

export const METHOD_NAMES: Record<string, string> = {
  low_rank: 'Output-based low rank',
  tucker2: 'Tucker-2',
  spatial: 'Spatial split',
  int8: 'int8',
  scratch: 'Same size, from scratch',
};

export const CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];
