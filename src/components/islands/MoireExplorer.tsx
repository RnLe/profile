/**
 * Moiré geometry explorer: pure mathematics, no owner data. Two triangular
 * point lattices; the second is rotated by θ, and the moiré superlattice
 * emerges visually. The moiré period L = a / (2 sin(θ/2)) is computed live.
 *
 * Educational geometry only: deterministic start, keyboard-accessible
 * range control, Reset, no timers; motion happens only on user input, so
 * reduced-motion needs no special mode. Server-rendered first frame doubles
 * as the no-JS fallback.
 */
import { useMemo, useState } from 'react';

const WIDTH = 720;
const HEIGHT = 420;
const SPACING = 17;
const INITIAL_THETA = 5;

interface Point {
  x: number;
  y: number;
}

function triangularLattice(): Point[] {
  const points: Point[] = [];
  const rowHeight = SPACING * Math.sqrt(3) / 2;
  // Overscan beyond the viewBox so rotation never exposes an empty corner.
  const cols = Math.ceil(WIDTH / SPACING) + 14;
  const rows = Math.ceil(HEIGHT / rowHeight) + 14;
  for (let row = -7; row < rows; row += 1) {
    for (let col = -7; col < cols; col += 1) {
      points.push({
        x: col * SPACING + (row % 2 === 0 ? 0 : SPACING / 2),
        y: row * rowHeight,
      });
    }
  }
  return points;
}

export default function MoireExplorer() {
  const [theta, setTheta] = useState(INITIAL_THETA);
  const points = useMemo(triangularLattice, []);

  const moirePeriod = SPACING / (2 * Math.sin(((theta / 2) * Math.PI) / 180));
  const periodRatio = moirePeriod / SPACING;
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const scaleBar = Math.min(moirePeriod, WIDTH * 0.45);

  const dots = useMemo(
    () =>
      points
        .map((p) => `M${p.x.toFixed(1)} ${p.y.toFixed(1)}h0.01`)
        .join(''),
    [points],
  );

  return (
    <div className="moire-explorer">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Two triangular lattices twisted by ${theta.toFixed(1)} degrees; the emergent moiré period is about ${periodRatio.toFixed(1)} lattice constants`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <rect width={WIDTH} height={HEIGHT} fill="var(--surface)" />
        <path
          d={dots}
          stroke="var(--signal-model)"
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={0.55}
        />
        <path
          d={dots}
          stroke="var(--signal-learn)"
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={0.55}
          transform={`rotate(${theta} ${cx} ${cy})`}
        />
        {/* Computed moiré scale bar (hidden once the period outgrows the view) */}
        {moirePeriod < WIDTH * 0.45 && (
          <g>
            <line
              x1={cx - scaleBar / 2}
              x2={cx + scaleBar / 2}
              y1={HEIGHT - 26}
              y2={HEIGHT - 26}
              stroke="var(--ink)"
              strokeWidth={2}
            />
            <line x1={cx - scaleBar / 2} x2={cx - scaleBar / 2} y1={HEIGHT - 32} y2={HEIGHT - 20} stroke="var(--ink)" strokeWidth={2} />
            <line x1={cx + scaleBar / 2} x2={cx + scaleBar / 2} y1={HEIGHT - 32} y2={HEIGHT - 20} stroke="var(--ink)" strokeWidth={2} />
            <text
              x={cx}
              y={HEIGHT - 36}
              textAnchor="middle"
              fill="var(--ink)"
              fontSize={14}
              fontFamily="var(--font-mono)"
            >
              moiré period ≈ {periodRatio.toFixed(1)} a
            </text>
          </g>
        )}
      </svg>

      <div className="controls">
        <label>
          <span className="control-label">
            Twist angle θ = {theta.toFixed(1)}°
          </span>
          <input
            type="range"
            min={1}
            max={15}
            step={0.1}
            value={theta}
            onChange={(event) => setTheta(Number(event.target.value))}
          />
        </label>
        <button type="button" onClick={() => setTheta(INITIAL_THETA)}>
          Reset
        </button>
        <p className="readout">
          L = a / (2 sin(θ/2)) ≈ {periodRatio.toFixed(1)} × a, so the superlattice grows as 1/θ.
        </p>
      </div>
    </div>
  );
}
