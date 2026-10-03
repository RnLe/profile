/** Colours, labels and number formats shared by the GeoNeural figures. */
export const GEO_COLORS: Record<string, string> = {
  full: '#2f6db0',
  coarse: '#7d8790',
  corrected: '#2e8a5f',
  neural: '#b4503a',
  hybrid: '#6a46a8',
  control: '#52606b',
};

export interface Candidate {
  id: string;
  label: string;
  family: string;
  experiment: string;
  package: string;
  bytes: number | null;
  maeM: number | null;
  maxM: number | null;
  streamJaccard: number | null;
  boundGuaranteed: boolean;
  dominatedBy?: string | null;
}

export const kB = (bytes: number) => bytes / 1000;
export const fmtBytes = (bytes: number) =>
  bytes >= 1e6 ? `${(bytes / 1e6).toFixed(2)} MB` : bytes >= 1e3 ? `${(bytes / 1e3).toFixed(1)} kB` : `${bytes} B`;
export const tip = (r: Candidate) =>
  [
    r.label,
    fmtBytes(r.bytes ?? 0),
    r.maeM != null ? `mean error ${r.maeM.toFixed(3)} m` : null,
    r.maxM != null ? `max error ${r.maxM.toFixed(2)} m${r.boundGuaranteed ? ' (bound)' : ''}` : null,
    r.streamJaccard != null ? `stream overlap ${r.streamJaccard.toFixed(3)}` : null,
  ]
    .filter(Boolean)
    .join(', ');
