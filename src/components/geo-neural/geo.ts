/**
 * Colours, names and small helpers shared by the GeoNeural figures. Every
 * number they draw is read at build time from src/data/geo-neural/v2.json,
 * the study's exported results (results/v2/case-study.json in the project).
 */
import v2 from '../../data/geo-neural/v2.json';

export const data = v2;

/** One colour per coder, kept across every figure. */
export const CODER_COLORS: Record<string, string> = {
  learned: '#b4503a',
  'learned-corpus': '#b4503a',
  'cubic-ctx': '#6a46a8',
  'cubic-order0': '#9a86c4',
  best: '#2f6db0',
  'sz3-best': '#2f6db0',
  sz3: '#6f8fb8',
  sperr: '#2e8a5f',
  zfp: '#8a939b',
  lerc: '#a9b1b8',
  q32dz: '#b7791f',
  qz: '#c9a25e',
};

export const CODER_NAMES: Record<string, string> = {
  learned: 'Neural predictor',
  'learned-corpus': 'Neural predictor, model shared',
  'cubic-ctx': 'Fixed predictor',
  'cubic-order0': 'Fixed predictor, no context',
  best: 'Best standard codec',
  'sz3-best': 'SZ3, best setting',
  sz3: 'SZ3',
  sperr: 'SPERR',
  zfp: 'zfp',
  lerc: 'LERC',
  q32dz: 'q32',
  qz: 'q + zstd',
};

/**
 * Neutral and signal tones that are not coders. The relief strata are grays
 * (darkest for flat ground, where the drainage drops are largest), so they
 * never read as a coder.
 */
export const TONE = {
  pass: '#2e8a5f',
  fail: '#b4503a',
  muted: '#7d8790',
  confirmation: '#b4503a',
  development: '#52606b',
  flat: '#26313b',
  moderate: '#6f7a84',
  rough: '#a7b0b8',
};

/** Line dash per relief stratum, so the strata differ by more than lightness. */
export const STRATUM_DASH: Record<'flat' | 'moderate' | 'rough', string | undefined> = {
  flat: undefined,
  moderate: undefined,
  rough: '4 3',
};

export const CONVENTIONAL = ['sz3', 'sz3-best', 'sperr', 'zfp', 'lerc', 'q32dz'] as const;
export const DECISION_BOUNDS = ['0.05', '0.1', '0.25', '0.5', '1.0'] as const;
export const ALL_BOUNDS = ['0.0005', '0.01', '0.025', '0.05', '0.1', '0.25', '0.5', '1.0', '2.0'] as const;

export const DEV_REGIONS = ['essen-ruhr', 'muensterland-plain', 'lower-rhine', 'teutoburg-forest', 'bergisches-land', 'rothaar-sauerland'];
export const CONF_REGIONS = ['nrw-313-5659', 'nrw-324-5648', 'nrw-368-5747', 'nrw-390-5780', 'nrw-401-5791', 'nrw-412-5769', 'nrw-445-5703'];

/** Relief stratum of each confirmation tile, from the frozen selection rule. */
export const STRATUM: Record<string, 'flat' | 'moderate' | 'rough'> = {
  'nrw-313-5659': 'rough',
  'nrw-324-5648': 'moderate',
  'nrw-368-5747': 'moderate',
  'nrw-390-5780': 'flat',
  'nrw-401-5791': 'moderate',
  'nrw-412-5769': 'flat',
  'nrw-445-5703': 'rough',
};

const DEV_NAMES: Record<string, string> = {
  'essen-ruhr': 'Essen-Ruhr',
  'muensterland-plain': 'Münsterland',
  'lower-rhine': 'Lower Rhine',
  'teutoburg-forest': 'Teutoburg Forest',
  'bergisches-land': 'Bergisches Land',
  'rothaar-sauerland': 'Rothaar',
};

/**
 * A short label: the development name, or "new 1" to "new 7" for the
 * confirmation tiles, numbered west to east (the order of CONF_REGIONS); a
 * tile's origin in km means nothing to a reader.
 */
export const regionName = (id: string) => DEV_NAMES[id] ?? (CONF_REGIONS.includes(id) ? `new ${CONF_REGIONS.indexOf(id) + 1}` : id);

export interface CoderResult {
  bytes: number;
  rmseM: number;
  maxM: number;
  jaccard: number;
  tolerantF1: number;
  seeds: number;
}

type Cohort = 'development' | 'confirmation';
type Table = Record<string, Record<string, Record<string, CoderResult>>>;
export const table = (cohort: Cohort) => data.h1[cohort] as unknown as Table;

/** The smallest conventional product that keeps the bound on every node. */
export function bestConventional(cohort: Cohort, region: string, bound: string): { coder: string; result: CoderResult } {
  const row = table(cohort)[region][bound];
  const b = Number(bound);
  let pick: { coder: string; result: CoderResult } | null = null;
  for (const coder of CONVENTIONAL) {
    const r = row[coder];
    if (!r || r.maxM > b * (1 + 1e-6) + 1e-7) continue;
    if (!pick || r.bytes < pick.result.bytes) pick = { coder, result: r };
  }
  if (!pick) throw new Error(`no conventional product keeps ${bound} m in ${region}`);
  return pick;
}

export const geoMean = (values: number[]) => Math.exp(values.reduce((a, v) => a + Math.log(v), 0) / values.length);
export const mean = (values: number[]) => values.reduce((a, v) => a + v, 0) / values.length;
export const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const kB = (bytes: number) => bytes / 1000;
export const fmtBytes = (bytes: number) =>
  bytes >= 1e6 ? `${(bytes / 1e6).toFixed(2)} MB` : bytes >= 1e3 ? `${(bytes / 1e3).toFixed(1)} kB` : `${bytes} B`;
export const fmtBound = (bound: string | number) => {
  const b = Number(bound);
  return b < 0.001 ? 'lossless' : b < 1 ? `${+(b * 100).toFixed(1)} cm` : `${b} m`;
};
export const pct = (ratio: number) => `${Math.round((1 - ratio) * 100)}%`;
