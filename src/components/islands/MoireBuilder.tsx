/**
 * The moiré crystal builder of the Blaze2D thesis page
 * (web/components/thesis-page/BilayerExplorer.tsx), in this site's light
 * palette. Two lattices, one fixed (blue) and one rotated (orange); the
 * dashed cell and the arrows L₁, L₂ are the moiré pattern, and the enlarged
 * monolayer cells keep their size while it changes. Pure geometry in units
 * of the monolayer spacing a; no solver data.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';

type Lattice = 'triangular' | 'square';
type Point = readonly [number, number];

const BLUE = '#317cb8';
const ORANGE = '#eb7929';

const rotate = ([x, y]: Point, radians: number): Point => [
  x * Math.cos(radians) - y * Math.sin(radians),
  x * Math.sin(radians) + y * Math.cos(radians),
];

const latticeBasis = (lattice: Lattice): readonly [Point, Point] => [
  [1, 0],
  lattice === 'triangular' ? [0.5, Math.sqrt(3) / 2] : [0, 1],
];

/** The moiré beat vectors L_i = (I - R(-θ))⁻¹ a_i, for the twist nearest alignment. */
function moireGeometry(lattice: Lattice, angle: number) {
  const symmetry = lattice === 'triangular' ? 60 : 90;
  const reduced = angle <= symmetry / 2 ? angle : angle - symmetry;
  const radians = (reduced * Math.PI) / 180;
  const aligned = Math.abs(reduced) < 1e-8;
  const eta = aligned ? 0 : 2 * Math.sin(Math.abs(radians) / 2);
  const basis = latticeBasis(lattice);
  const cot = aligned ? 0 : 1 / Math.tan(radians / 2);
  const vectors = aligned
    ? null
    : (basis.map(([x, y]) => [(x + cot * y) / 2, (y - cot * x) / 2] as Point) as [Point, Point]);
  return { symmetry, eta, period: aligned ? Infinity : 1 / eta, vectors, basis };
}

/** Lattice sites within a radius, enough to fill the view after any rotation. */
function latticePoints(lattice: Lattice, radius: number): Point[] {
  const [a1, a2] = latticeBasis(lattice);
  const reach = Math.ceil(radius / a2[1]) + 1;
  const points: Point[] = [];
  for (let j = -reach; j <= reach; j++) {
    for (let i = -reach; i <= reach; i++) {
      const point: Point = [i * a1[0] + j * a2[0], j * a2[1]];
      if (Math.hypot(...point) <= radius) points.push(point);
    }
  }
  return points;
}

/** A React id made valid for HTML: it has to start with a letter. */
const useDomId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

function UnitCell({ lattice, angle, layer }: { lattice: Lattice; angle: number; layer: 'fixed' | 'rotated' }) {
  const id = useDomId('moire-unit');
  const radians = (angle * Math.PI) / 180;
  const basis = latticeBasis(lattice).map((point) => rotate(point, radians));
  const project = ([x, y]: Point): Point => [100 + 52 * x, 94 - 52 * y];
  const corners: Point[] = [[0, 0], basis[0], [basis[0][0] + basis[1][0], basis[0][1] + basis[1][1]], basis[1]];
  return (
    <div className={`moire-unit moire-unit-${layer}`}>
      <svg viewBox="0 0 220 168" aria-hidden="true">
        <defs>
          <marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6Z" fill="currentColor" />
          </marker>
        </defs>
        {latticePoints(lattice, 2.7).map((point, index) => {
          const [x, y] = project(rotate(point, radians));
          return <circle key={index} cx={x} cy={y} r="3" fill="currentColor" opacity="0.45" />;
        })}
        <polygon
          points={corners.map((point) => project(point).join(',')).join(' ')}
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {basis.map((point, index) => {
          const [x, y] = project(point);
          return (
            <g key={index}>
              <line x1="100" y1="94" x2={x} y2={y} stroke="currentColor" strokeWidth="2" markerEnd={`url(#${id})`} />
              <text x={x + 10} y={y - 8}>
                a{index === 0 ? '₁' : '₂'}
                {layer === 'rotated' ? '′' : ''}
              </text>
            </g>
          );
        })}
      </svg>
      <span>{layer === 'fixed' ? 'Layer 1 · fixed' : `Layer 2 · ${angle.toFixed(1)}°`}</span>
    </div>
  );
}

const VIEWS = [
  { width: 24, label: 'Closer' },
  { width: 40, label: 'Overview' },
  { width: 64, label: 'Wider' },
];

export default function MoireBuilder() {
  const [lattice, setLattice] = useState<Lattice>('triangular');
  const [angle, setAngle] = useState(5);
  const [viewWidth, setViewWidth] = useState(40);
  const [size, setSize] = useState({ width: 1000, height: 560 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const id = useDomId('moire');
  const { width, height } = size;
  const geometry = moireGeometry(lattice, angle);
  const points = useMemo(
    () => latticePoints(lattice, Math.hypot(viewWidth / 2, (viewWidth * height) / width / 2) + 1),
    [lattice, viewWidth, width, height],
  );
  const scale = width / viewWidth;
  const project = ([x, y]: Point): Point => [width / 2 + x * scale, height / 2 - y * scale];
  const periodLabel = Number.isFinite(geometry.period) ? geometry.period.toFixed(2) : '∞';

  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) };
      if (next.width && next.height) {
        setSize((previous) => (previous.width === next.width && previous.height === next.height ? previous : next));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    const frame = requestAnimationFrame(() => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(element.width / width, 0, 0, element.height / height, 0, 0);
      context.clearRect(0, 0, width, height);
      const radius = Math.max(1.25, 0.145 * scale);
      for (const layer of [0, 1]) {
        const radians = (layer * angle * Math.PI) / 180;
        context.beginPath();
        for (const point of points) {
          const [x, y] = rotate(point, radians);
          const px = width / 2 + x * scale;
          const py = height / 2 - y * scale;
          if (px < -radius || px > width + radius || py < -radius || py > height + radius) continue;
          context.moveTo(px + radius, py);
          context.arc(px, py, radius, 0, Math.PI * 2);
        }
        // On a light ground the rotated layer multiplies, so overlapping sites darken.
        context.globalCompositeOperation = layer === 0 ? 'source-over' : 'multiply';
        context.fillStyle = layer === 0 ? BLUE : ORANGE;
        context.fill();
      }
      context.globalCompositeOperation = 'source-over';
    });
    return () => cancelAnimationFrame(frame);
  }, [angle, points, scale, width, height]);

  const vectors = geometry.vectors;
  const corners: Point[] | null = vectors
    ? [[0, 0], vectors[0], [vectors[0][0] + vectors[1][0], vectors[0][1] + vectors[1][1]], vectors[1]]
    : null;
  const narrow = width < 440;
  const scaleBar = { x: narrow ? 14 : 24, y: height - (narrow ? 22 : 28) };

  return (
    <div className="moire-builder">
      <div className="moire-controls">
        <fieldset className="moire-lattice">
          <legend>Lattice</legend>
          {(['triangular', 'square'] as const).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name={`${id}-lattice`}
                value={value}
                checked={lattice === value}
                onChange={() => {
                  setLattice(value);
                  setAngle(Math.min(angle, value === 'triangular' ? 60 : 90));
                }}
              />
              <span>{value === 'triangular' ? 'Triangular' : 'Square'}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="moire-view">
          <legend>View width</legend>
          {VIEWS.map((view) => (
            <button type="button" key={view.width} aria-pressed={viewWidth === view.width} onClick={() => setViewWidth(view.width)}>
              <strong>{view.width}a</strong>
              <span>{view.label}</span>
            </button>
          ))}
        </fieldset>
        <div className="moire-angle">
          <div className="moire-angle-head">
            <label htmlFor={`${id}-angle`}>Twist angle</label>
            <output htmlFor={`${id}-angle`}>{angle.toFixed(1)}°</output>
          </div>
          <input
            id={`${id}-angle`}
            type="range"
            min="0"
            max={geometry.symmetry}
            step="0.1"
            value={angle}
            aria-valuetext={`${angle.toFixed(1)} degrees. ${vectors ? `Moiré period ${periodLabel} lattice constants.` : 'Layers aligned; no finite moiré period.'}`}
            onChange={(event) => setAngle(Number(event.target.value))}
          />
          <span className="moire-range-ends" aria-hidden="true">
            <span>0°</span>
            <span>{geometry.symmetry}°</span>
          </span>
        </div>
        <div className="moire-readout">
          <span className="moire-kicker">Two scales</span>
          <dl>
            <div>
              <dt>Spacing a</dt>
              <dd>1</dd>
            </div>
            <div>
              <dt>Period L/a</dt>
              <dd>{periodLabel}</dd>
            </div>
            <div>
              <dt>Ratio η</dt>
              <dd>{geometry.eta.toFixed(3)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="moire-scene" ref={scene}>
        <canvas ref={canvas} aria-hidden="true" />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${lattice === 'triangular' ? 'Triangular' : 'Square'} bilayer at ${angle.toFixed(1)} degrees. Blue sites are fixed; orange sites are rotated. ${vectors ? `The arrows are the moiré vectors, each ${periodLabel} times the monolayer spacing.` : 'Both layers coincide.'}`}
        >
          <defs>
            <marker id={`${id}-arrow`} markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8Z" className="moire-ink-fill" />
            </marker>
          </defs>
          {corners && (
            <polygon
              className="moire-cell"
              points={corners.map((point) => project(point).join(',')).join(' ')}
            />
          )}
          {[0, 1].map((layer) => {
            const [a, b] = geometry.basis.map((point) => rotate(point, (layer * angle * Math.PI) / 180));
            const cell: Point[] = [[0, 0], a, [a[0] + b[0], a[1] + b[1]], b];
            return (
              <polygon
                key={layer}
                points={cell.map((point) => project(point).join(',')).join(' ')}
                fill="none"
                stroke={layer === 0 ? BLUE : ORANGE}
                strokeWidth="2"
              />
            );
          })}
          {vectors?.map((vector, index) => {
            const dx = vector[0] * scale;
            const dy = -vector[1] * scale;
            const fraction = Math.min(1, (width / 2 - 45) / Math.abs(dx || 1e-12), (height / 2 - 45) / Math.abs(dy || 1e-12));
            const x = width / 2 + fraction * dx;
            const y = height / 2 + fraction * dy;
            return (
              <g key={index}>
                <line
                  className="moire-vector"
                  x1={width / 2}
                  y1={height / 2}
                  x2={x}
                  y2={y}
                  strokeDasharray={fraction < 1 ? '7 5' : undefined}
                  markerEnd={`url(#${id}-arrow)`}
                />
                <text
                  className="moire-label"
                  x={x + (dx < 0 ? 12 : -12)}
                  y={y + (dy > 0 ? -14 : 24)}
                  textAnchor={dx < 0 ? 'start' : 'end'}
                >
                  L{index === 0 ? '₁' : '₂'}
                  {fraction < 1 ? ' ↗' : ''}
                </text>
              </g>
            );
          })}
          <line className="moire-vector" x1={scaleBar.x} y1={scaleBar.y} x2={scaleBar.x + scale * 5} y2={scaleBar.y} />
          <text className="moire-label moire-label--small" x={scaleBar.x} y={scaleBar.y - 12}>
            5a
          </text>
        </svg>
        <span className="moire-scene-label">
          Two layers<span> · real space</span>
        </span>
        <div className="moire-cells" aria-hidden="true">
          <span className="moire-cells-note">Monolayer cells · enlarged</span>
          <UnitCell lattice={lattice} angle={0} layer="fixed" />
          <UnitCell lattice={lattice} angle={angle} layer="rotated" />
        </div>
      </div>
    </div>
  );
}
