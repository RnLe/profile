/**
 * Two-link mismatch method preview, labeled "Method preview, not an
 * experimental result" wherever it renders. Pure computed physics, no owner
 * data.
 *
 * The nominal arm follows the reference trajectory exactly. The TARGET arm is
 * integrated live from the target world's dynamics (mass/length perturbations,
 * joint friction) under the SAME feedforward torques the nominal model
 * prescribes, plus a deliberately weak PD tracking assist that keeps the
 * display stable. The tracking error that remains is exactly the kind of
 * mismatch Residual Worlds proposes to learn.
 *
 * Figure contract: deterministic start, Play/Pause + Step (keyboard-accessible),
 * Reset, paused-by-default under prefers-reduced-motion, pause when the tab is
 * hidden, server-rendered deterministic first frame as no-JS fallback.
 */
import { useEffect, useReducer, useRef, useState } from 'react';

const L1 = 1.0;
const L2 = 0.8;
const M1 = 1.2;
const M2 = 0.9;
const G = 9.81;

/** Weak tracking assist (display stability only, far below tracking gains). */
const KP = 14;
const KD = 3.2;

const SUBSTEP = 1 / 240;
const W = 720;
const ARM_H = 320;
const PLOT_H = 140;
const HISTORY = 260;
const ERR_MAX = 1.6;

interface Mismatch {
  mass: boolean;
  length: boolean;
  friction: boolean;
}

interface Params {
  m1: number;
  m2: number;
  l1: number;
  l2: number;
  friction: number;
}

const nominalParams: Params = { m1: M1, m2: M2, l1: L1, l2: L2, friction: 0 };

const targetParams = (mismatch: Mismatch): Params => ({
  m1: M1 * (mismatch.mass ? 1.45 : 1),
  m2: M2 * (mismatch.mass ? 0.7 : 1),
  l1: L1 * (mismatch.length ? 1.12 : 1),
  l2: L2 * (mismatch.length ? 0.88 : 1),
  friction: mismatch.friction ? 1.1 : 0,
});

/** Reference joint trajectory and its analytic derivatives. */
const reference = (t: number) => {
  const q1 = 0.7 * Math.sin(0.9 * t) - 0.3;
  const q2 = 1.1 * Math.sin(1.4 * t + 0.6);
  const dq1 = 0.7 * 0.9 * Math.cos(0.9 * t);
  const dq2 = 1.1 * 1.4 * Math.cos(1.4 * t + 0.6);
  const ddq1 = -0.7 * 0.81 * Math.sin(0.9 * t);
  const ddq2 = -1.1 * 1.96 * Math.sin(1.4 * t + 0.6);
  return { q: [q1, q2], dq: [dq1, dq2], ddq: [ddq1, ddq2] };
};

/** Manipulator terms for a planar two-link arm (point masses at link ends). */
function dynamics(p: Params, q: number[], dq: number[]) {
  const c2 = Math.cos(q[1]);
  const s2 = Math.sin(q[1]);
  const a = p.m1 * p.l1 ** 2 + p.m2 * (p.l1 ** 2 + p.l2 ** 2 + 2 * p.l1 * p.l2 * c2);
  const b = p.m2 * (p.l2 ** 2 + p.l1 * p.l2 * c2);
  const d = p.m2 * p.l2 ** 2;
  const h = p.m2 * p.l1 * p.l2 * s2;
  const c1 = -h * dq[1] * (2 * dq[0] + dq[1]);
  const c2v = h * dq[0] * dq[0];
  const g1 = (p.m1 + p.m2) * G * p.l1 * Math.cos(q[0]) + p.m2 * G * p.l2 * Math.cos(q[0] + q[1]);
  const g2 = p.m2 * G * p.l2 * Math.cos(q[0] + q[1]);
  return { M: [a, b, b, d], C: [c1, c2v], g: [g1, g2] };
}

function inverseDynamics(p: Params, q: number[], dq: number[], ddq: number[]) {
  const { M, C, g } = dynamics(p, q, dq);
  return [
    M[0] * ddq[0] + M[1] * ddq[1] + C[0] + g[0],
    M[2] * ddq[0] + M[3] * ddq[1] + C[1] + g[1],
  ];
}

function forwardDynamics(p: Params, q: number[], dq: number[], tau: number[]) {
  const { M, C, g } = dynamics(p, q, dq);
  const r1 = tau[0] - C[0] - g[0] - p.friction * dq[0];
  const r2 = tau[1] - C[1] - g[1] - p.friction * dq[1];
  const det = M[0] * M[3] - M[1] * M[2];
  return [(M[3] * r1 - M[1] * r2) / det, (-M[2] * r1 + M[0] * r2) / det];
}

interface SimState {
  t: number;
  q: number[];
  dq: number[];
  /** Tracking-error history (‖q_target − q_ref‖), newest last. */
  errors: number[];
}

const initialState = (): SimState => {
  const { q, dq } = reference(0);
  return { t: 0, q: [...q], dq: [...dq], errors: [] };
};

/** Semi-implicit Euler integration of the target world over dt. */
function advance(state: SimState, dt: number, params: Params): void {
  let remaining = dt;
  while (remaining > 1e-9) {
    const h = Math.min(SUBSTEP, remaining);
    const ref = reference(state.t);
    const tauFF = inverseDynamics(nominalParams, ref.q, ref.dq, ref.ddq);
    const tau = [
      tauFF[0] + KP * (ref.q[0] - state.q[0]) + KD * (ref.dq[0] - state.dq[0]),
      tauFF[1] + KP * (ref.q[1] - state.q[1]) + KD * (ref.dq[1] - state.dq[1]),
    ];
    const ddq = forwardDynamics(params, state.q, state.dq, tau);
    state.dq[0] += h * ddq[0];
    state.dq[1] += h * ddq[1];
    state.q[0] += h * state.dq[0];
    state.q[1] += h * state.dq[1];
    state.t += h;
    remaining -= h;
  }
  const ref = reference(state.t);
  const err = Math.hypot(state.q[0] - ref.q[0], state.q[1] - ref.q[1]);
  state.errors.push(Math.min(err, ERR_MAX));
  if (state.errors.length > HISTORY) state.errors.splice(0, state.errors.length - HISTORY);
}

const pose = (q: number[], l1: number, l2: number, ox: number, oy: number, scale: number) => {
  const x1 = ox + scale * l1 * Math.cos(q[0]);
  const y1 = oy - scale * l1 * Math.sin(q[0]);
  return {
    x1,
    y1,
    x2: x1 + scale * l2 * Math.cos(q[0] + q[1]),
    y2: y1 - scale * l2 * Math.sin(q[0] + q[1]),
  };
};

export default function TwoLinkPreview() {
  const [mismatch, setMismatch] = useState<Mismatch>({ mass: true, length: true, friction: true });
  const [running, setRunning] = useState(false);
  const simRef = useRef<SimState>(initialState());
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const resetSim = () => {
    simRef.current = initialState();
    rerender();
  };

  // Autoplay only without a reduced-motion preference.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) {
      lastRef.current = null;
      return undefined;
    }
    const params = targetParams(mismatch);
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        const dt = Math.min((now - lastRef.current) / 1000, 0.05);
        advance(simRef.current, dt, params);
        rerender();
      }
      lastRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const onVisibility = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [running, mismatch]);

  const sim = simRef.current;
  const scale = 92;
  const ox = W * 0.36;
  const oy = ARM_H * 0.44;

  const ref = reference(sim.t);
  const nominal = pose(ref.q, L1, L2, ox, oy, scale);
  const params = targetParams(mismatch);
  const target = pose(sim.q, params.l1, params.l2, ox, oy, scale);
  const errNow = sim.errors.at(-1) ?? 0;

  const plotPath = sim.errors
    .map((value, i) => {
      const x = 60 + ((HISTORY - sim.errors.length + i) / (HISTORY - 1)) * (W - 140);
      const y = PLOT_H - 24 - (value / ERR_MAX) * (PLOT_H - 52);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const toggle = (key: keyof Mismatch) => {
    setMismatch((prev) => ({ ...prev, [key]: !prev[key] }));
    resetSim();
  };

  const step = () => {
    advance(simRef.current, 0.25, targetParams(mismatch));
    rerender();
  };

  return (
    <div className="two-link">
      <svg
        viewBox={`0 0 ${W} ${ARM_H}`}
        role="img"
        aria-label={`Two-link arm: the nominal model follows its reference; the mismatched target world, driven by the same commands, deviates. Current tracking error ${errNow.toFixed(2)} radians at t = ${sim.t.toFixed(1)} seconds.`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <rect width={W} height={ARM_H} fill="var(--surface)" />
        <line
          x1={ox - 46}
          x2={ox + 46}
          y1={oy}
          y2={oy}
          stroke="var(--line-strong)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
        {/* Nominal plan */}
        <g strokeLinecap="round">
          <line x1={ox} y1={oy} x2={nominal.x1} y2={nominal.y1} stroke="var(--signal-model)" strokeWidth={7} opacity={0.55} />
          <line x1={nominal.x1} y1={nominal.y1} x2={nominal.x2} y2={nominal.y2} stroke="var(--signal-model)" strokeWidth={5.5} opacity={0.55} />
          <circle cx={nominal.x1} cy={nominal.y1} r={5} fill="var(--signal-model)" opacity={0.6} />
          <circle cx={nominal.x2} cy={nominal.y2} r={4.5} fill="var(--signal-model)" opacity={0.6} />
        </g>
        {/* Target world under the same commands */}
        <g strokeLinecap="round">
          <line x1={ox} y1={oy} x2={target.x1} y2={target.y1} stroke="var(--signal-robot)" strokeWidth={5} />
          <line x1={target.x1} y1={target.y1} x2={target.x2} y2={target.y2} stroke="var(--signal-robot)" strokeWidth={4} />
          <circle cx={target.x1} cy={target.y1} r={4.5} fill="var(--signal-robot)" />
          <circle cx={target.x2} cy={target.y2} r={4} fill="var(--signal-robot)" />
        </g>
        {/* Tip-gap indicator */}
        <line
          x1={nominal.x2}
          y1={nominal.y2}
          x2={target.x2}
          y2={target.y2}
          stroke="var(--signal-learn)"
          strokeWidth={1.6}
          strokeDasharray="3 4"
        />
        <circle cx={ox} cy={oy} r={7} fill="var(--ink)" />
        <g fontFamily="var(--font-mono)" fontSize={13.5} fill="var(--ink-muted)">
          <text x={W - 52} y={32} textAnchor="end" fill="var(--signal-model)">nominal plan</text>
          <line
            x1={W - 44}
            x2={W - 24}
            y1={27}
            y2={27}
            stroke="var(--signal-model)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text x={W - 52} y={54} textAnchor="end" fill="var(--signal-robot)">
            target world, same commands
          </text>
          <line
            x1={W - 44}
            x2={W - 24}
            y1={49}
            y2={49}
            stroke="var(--signal-robot)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text x={W - 24} y={ARM_H - 22} textAnchor="end">t = {sim.t.toFixed(1)} s</text>
        </g>
      </svg>

      <svg
        viewBox={`0 0 ${W} ${PLOT_H}`}
        role="img"
        aria-label={`Joint-space tracking error over the recent past; currently ${errNow.toFixed(2)} radians.`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <rect width={W} height={PLOT_H} fill="var(--surface)" />
        <line x1={60} x2={W - 80} y1={PLOT_H - 24} y2={PLOT_H - 24} stroke="var(--line-strong)" strokeWidth={1} />
        <text x={16} y={22} fontFamily="var(--font-mono)" fontSize={13} fill="var(--ink-muted)">
          ‖q_target − q_ref‖: the mismatch a residual model would be trained to absorb
        </text>
        {plotPath && <path d={plotPath} fill="none" stroke="var(--signal-learn)" strokeWidth={2.2} />}
        <text x={W - 72} y={PLOT_H - 28} fontFamily="var(--font-mono)" fontSize={13} fill="var(--signal-learn)">
          {errNow.toFixed(2)} rad
        </text>
      </svg>

      <div className="controls">
        <fieldset>
          <legend>Mismatch terms (toggling resets the run)</legend>
          <label>
            <input type="checkbox" checked={mismatch.mass} onChange={() => toggle('mass')} /> Mass
          </label>
          <label>
            <input type="checkbox" checked={mismatch.length} onChange={() => toggle('length')} /> Length
          </label>
          <label>
            <input type="checkbox" checked={mismatch.friction} onChange={() => toggle('friction')} /> Friction
          </label>
        </fieldset>
        <div className="buttons">
          <button type="button" onClick={() => setRunning((r) => !r)} aria-pressed={running}>
            {running ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={step} disabled={running}>
            Step +0.25 s
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              resetSim();
            }}
          >
            Reset
          </button>
        </div>
        <p className="readout">
          The target arm runs the nominal plan's torques plus a deliberately weak tracking
          assist (for display stability); the error that remains is the model mismatch.
        </p>
      </div>
    </div>
  );
}
