// Ported unchanged, except for the helper import and the token lookup, from
// site/src/components/budget-sketch.ts of RnLe/recovery-policy-learning (c4fc791).
// The landing page's argument in one looping picture. The expert's
// demonstrations cover a band of states, and extra demonstrations spend the
// label budget inside that band. At deployment the learner leaves it, and
// corrections spend the same labels on the states it actually reached.
// Every frame is a pure function of the loop time, and the scene is laid out
// afresh for the stage's real size, so strokes and type keep their pixel size
// on every screen and a resize never disturbs the loop.

import { prefersReducedMotion, svgEl, tokenColor } from "./helpers";

type Point = { x: number; y: number };
type Cubic = readonly [Point, Point, Point, Point];

const pt = (x: number, y: number): Point => ({ x, y });

// The scene is authored in a 1000 × 800 design space and mapped onto the
// stage, each axis stretching at most STRETCH times past a uniform fit. Only
// the window below DESIGN_TOP is drawn: nothing lives above it.
const DESIGN_W = 1000;
const DESIGN_TOP = 40;
const DESIGN_H = 800 - DESIGN_TOP;
const STRETCH = 1.3;

// The expert's route from start to goal, two cubics joined smoothly.
const EXPERT: Cubic[] = [
  [pt(40, 470), pt(190, 515), pt(300, 490), pt(470, 410)],
  [pt(470, 410), pt(640, 330), pt(760, 115), pt(960, 95)],
];
/** Where the deployed learner leaves the route, as a share of its length. */
const BRANCH = 0.26;
/** The drift after that, as waypoints of a smooth curve whose first handle
 *  lies on the route's own tangent: the learner peels away, never turns. */
const DRIFT_WAYPOINTS: Point[] = [
  pt(450, 590),
  pt(590, 650),
  pt(735, 665),
  pt(860, 715),
  pt(965, 700),
];

// The budget, spent once as blue labels and once, instead, as green ones.
const EXTRA_AT = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92];
/** Offsets across the route, so the blue labels read as samples of the
 *  band rather than beads on a string. Scaled with the stage. */
const EXTRA_JITTER = [-7, 8, -9, 6, -8, 7, -6, 8];
const CORRECTION_AT = [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.94];

// The loop, in seconds.
const ROUTE_START = 0.2;
const ROUTE_DRAW = 1.8;
const EXTRA_START = 3.2;
const EXTRA_STAGGER = 0.16;
const POP = 0.45;
const DEPLOY_START = 6.4;
const TO_BRANCH = [6.7, 1.3] as const;
const MARKER_AT = 8.0;
const DRIFT = [8.2, 2.3] as const;
const CORRECTION_START = 11.2;
const FLIGHT = 0.95;
const FLIGHT_STAGGER = 0.15;
const ARROW_GROW = 0.35;
const FADE_OUT = [17.0, 0.8] as const;
export const LOOP_SECONDS = 18.2;
/** The finished picture, which is all that reduced motion shows. */
export const FINAL_SECONDS = FADE_OUT[0] - 0.05;
/** How much of the sketch must be on screen before it plays. */
export const REVEALED = 0.75;

// easing and timing -----------------------------------------------------------

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const progress = (t: number, start: number, duration: number) =>
  clamp01((t - start) / duration);
const easeOut = (v: number) => 1 - (1 - v) ** 3;
const easeInOut = (v: number) =>
  v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2;
const backOut = (v: number) => {
  const c = 1.9;
  return v <= 0 ? 0 : 1 + (c + 1) * (v - 1) ** 3 + c * (v - 1) ** 2;
};

// geometry --------------------------------------------------------------------

function bezier(c: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x,
    y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y,
  };
}

function sample(curves: readonly Cubic[], perCurve = 90): Point[] {
  const points: Point[] = [curves[0]![0]];
  for (const curve of curves) {
    for (let i = 1; i <= perCurve; i++) {
      points.push(bezier(curve, i / perCurve));
    }
  }
  return points;
}

/** Catmull-Rom through the waypoints, as cubics, leaving the first point
 *  along a given heading so the join to the route stays smooth. */
function smoothThrough(
  points: Point[],
  heading: Point,
  handle: number,
): Cubic[] {
  const curves: Cubic[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1 =
      i === 0
        ? pt(p1.x + heading.x * handle, p1.y + heading.y * handle)
        : pt(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6);
    const c2 = pt(p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6);
    curves.push([p1, c1, c2, p2]);
  }
  return curves;
}

const unit = (v: Point): Point => {
  const length = Math.hypot(v.x, v.y) || 1;
  return pt(v.x / length, v.y / length);
};

const along = (p: Point, direction: Point, distance: number) =>
  pt(p.x + direction.x * distance, p.y + direction.y * distance);

const lerp = (a: Point, b: Point, share: number) =>
  pt(a.x + (b.x - a.x) * share, a.y + (b.y - a.y) * share);

const fmt = (p: Point) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

/** A sampled curve, measured by arc length in whatever space it lives in. */
class Track {
  readonly lengths: number[] = [0];
  readonly total: number;
  constructor(readonly points: Point[]) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!;
      const b = points[i]!;
      this.lengths.push(
        this.lengths[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y),
      );
    }
    this.total = this.lengths.at(-1)!;
  }

  /** Index of the segment holding arc-length fraction f, and the share of
   *  that segment already covered. */
  private locate(f: number): [number, number] {
    const target = clamp01(f) * this.total;
    let lo = 0;
    let hi = this.lengths.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.lengths[mid]! < target) lo = mid;
      else hi = mid;
    }
    const span = this.lengths[hi]! - this.lengths[lo]! || 1;
    return [lo, (target - this.lengths[lo]!) / span];
  }

  at(f: number): Point {
    const [i, s] = this.locate(f);
    const a = this.points[i]!;
    return lerp(a, this.points[i + 1] ?? a, s);
  }

  tangent(f: number): Point {
    const [i] = this.locate(f);
    const a = this.points[Math.max(0, i - 1)]!;
    const b = this.points[Math.min(this.points.length - 1, i + 2)]!;
    return unit(pt(b.x - a.x, b.y - a.y));
  }

  /** Polyline path data for the first fraction f of the curve. Drawing a
   *  prefix this way keeps a dash pattern anchored at the start. */
  upTo(f: number): string {
    if (f <= 0) return "";
    const [i] = this.locate(f);
    const parts = [`M${fmt(this.points[0]!)}`];
    for (let k = 1; k <= i; k++) parts.push(`L${fmt(this.points[k]!)}`);
    parts.push(`L${fmt(this.at(f))}`);
    return parts.join("");
  }

  /** Arc-length fraction of the sample closest to p. */
  nearest(p: Point): number {
    let best = 0;
    let bestDistance = Infinity;
    this.points.forEach((q, i) => {
      const distance = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return this.lengths[best]! / this.total;
  }
}

function mixColor(from: string, to: string, share: number): string {
  const parse = (hex: string) => {
    const clean = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) || 0);
  };
  const a = parse(from);
  const b = parse(to);
  const channel = (i: number) => Math.round(a[i]! + (b[i]! - a[i]!) * share);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

/** Path data for an arrow from `from` along `direction`, `length` long. */
function arrow(
  from: Point,
  direction: Point,
  length: number,
  head: number,
): string {
  if (length < 0.5) return "";
  const tip = along(from, direction, length);
  const size = Math.min(head, length * 0.6);
  const wing = (sign: number) => {
    const angle = Math.atan2(direction.y, direction.x) + Math.PI + sign * 0.52;
    return pt(tip.x + Math.cos(angle) * size, tip.y + Math.sin(angle) * size);
  };
  return `M${fmt(from)}L${fmt(tip)}M${fmt(wing(1))}L${fmt(tip)}L${fmt(wing(-1))}`;
}

/** The learner, a small triangle pointing where it is heading. */
function triangle(at: Point, heading: Point, size: number): string {
  const side = pt(-heading.y, heading.x);
  const nose = along(at, heading, size * 0.75);
  const back = along(at, heading, -size * 0.5);
  const left = along(back, side, size * 0.55);
  const right = along(back, side, -size * 0.55);
  return `M${fmt(nose)}L${fmt(left)}L${fmt(right)}Z`;
}

/** Report how much of the element is on screen: a share of the element, or
 *  of the window when the element is the taller of the two, so a stage that
 *  overflows the window still counts as fully shown. Reports every 5% step,
 *  and 0 once the element has left the screen entirely. */
function watchShare(el: Element, report: (share: number) => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    report(1);
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          report(0);
          continue;
        }
        const screen = entry.rootBounds?.height ?? window.innerHeight;
        const whole = Math.min(entry.boundingClientRect.height, screen);
        report(whole > 0 ? entry.intersectionRect.height / whole : 0);
      }
    },
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
  );
  observer.observe(el);
  return () => observer.disconnect();
}

/** Write an attribute only when it changes: most of the loop is a hold, and
 *  an unchanged frame should cost the page nothing. */
function set(el: Element, name: string, value: string): void {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

// the scene -------------------------------------------------------------------

type Layout = {
  k: number; // px per design-space unit at the reference size, clamped
  expert: Track;
  drift: Track;
  start: Point;
  goal: Point;
  branch: Point;
  extra: { at: Point; heading: Point }[];
  corrections: { at: Point; heading: Point }[];
};

type Placement = {
  el: SVGTextElement;
  place: (layout: Layout) => {
    at: Point;
    anchor: "start" | "middle" | "end";
  };
};

export type BudgetSketchHandle = {
  seek(seconds: number): void;
  play(): void;
  pause(): void;
  destroy(): void;
};

export function mountBudgetSketch(mount: HTMLElement): BudgetSketchHandle {
  const reduced = prefersReducedMotion();
  mount.classList.add("budget-sketch");

  const svg = svgEl("svg", {
    class: "budget-sketch__svg",
    role: "img",
    "aria-labelledby": "budget-sketch-title budget-sketch-desc",
  });
  const title = svgEl("title", { id: "budget-sketch-title" });
  title.textContent = "The same label budget, spent in two places";
  const desc = svgEl("desc", { id: "budget-sketch-desc" });
  desc.textContent =
    "A curved route from start to goal stands for the expert’s " +
    "demonstrations, inside a soft band of the states they cover. Eight " +
    "blue labels, the extra demonstrations, land on the route. At " +
    "deployment a learner follows the route, leaves it at a marked point, " +
    "and drifts into states no demonstration covers. The same eight labels " +
    "then move onto the drifted path and turn green: corrections, each " +
    "with an arrow pointing back towards the route.";
  const scene = svgEl("g");
  svg.append(title, desc, scene);

  const layer = (name: string) => {
    const g = svgEl("g", { class: `budget-sketch__${name}` });
    scene.append(g);
    return g;
  };
  const bandLayer = layer("band-layer");
  const routeLayer = layer("route-layer");
  const ghostLayer = layer("ghosts");
  const learnerLayer = layer("learner-layer");
  const labelLayer = layer("labels");
  const captionLayer = layer("captions");

  // the band is two strokes over the same path, so its core reads denser
  const band = svgEl("path", { class: "budget-sketch__band" });
  const bandCore = svgEl("path", { class: "budget-sketch__band" });
  bandLayer.append(band, bandCore);
  const route = svgEl("path", { class: "budget-sketch__route" });
  const start = svgEl("circle", { class: "budget-sketch__start" });
  const goal = svgEl("circle", { class: "budget-sketch__goal" });
  const goalRing = svgEl("circle", { class: "budget-sketch__goal-ring" });
  routeLayer.append(route, start, goalRing, goal);

  const trail = svgEl("path", { class: "budget-sketch__drift" });
  const pulse = svgEl("circle", { class: "budget-sketch__pulse" });
  const marker = svgEl("circle", { class: "budget-sketch__marker" });
  const learner = svgEl("path", { class: "budget-sketch__learner" });
  learnerLayer.append(trail, pulse, marker, learner);

  // one mark per label in the budget: a dot for the state, an arrow for the
  // expert's action there, and the ring it leaves behind when it moves
  const ghosts = EXTRA_AT.map(() => {
    const ring = svgEl("circle", { class: "budget-sketch__ghost" });
    ghostLayer.append(ring);
    return ring;
  });
  const labels = EXTRA_AT.map(() => {
    const g = svgEl("g");
    const pointer = svgEl("path", { class: "budget-sketch__pointer" });
    const dot = svgEl("circle", { class: "budget-sketch__dot" });
    g.append(pointer, dot);
    labelLayer.append(g);
    return { pointer, dot };
  });

  const caption = (modifier: string, lines: string[]) => {
    const el = svgEl("text", {
      class: `budget-sketch__caption budget-sketch__caption--${modifier}`,
    });
    lines.forEach((line, i) => {
      const span = svgEl("tspan", i === 0 ? {} : { dy: "1.25em" });
      if (i > 0) span.classList.add("budget-sketch__sub");
      span.textContent = line;
      el.append(span);
    });
    captionLayer.append(el);
    return el;
  };
  const captions = {
    start: caption("small", ["Start"]),
    goal: caption("small", ["Goal"]),
    expert: caption("expert", ["Expert demonstrations"]),
    extra: caption("extra", ["Extra demonstrations", "8 labels"]),
    deployment: caption("deployment", ["Deployment"]),
    corrections: caption("corrections", ["Corrections", "the same 8 labels"]),
  };
  // offsets are in reference pixels from a point of the drawing
  const near = (l: Layout, base: Point, dx: number, dy: number) =>
    pt(base.x + dx * l.k, base.y + dy * l.k);
  const placements: Placement[] = [
    {
      el: captions.start,
      place: (l) => ({ at: near(l, l.start, 0, 42), anchor: "middle" }),
    },
    {
      el: captions.goal,
      place: (l) => ({ at: near(l, l.goal, 0, -32), anchor: "middle" }),
    },
    {
      el: captions.expert,
      place: (l) => ({
        at: near(l, l.expert.at(0.05), -10, -66),
        anchor: "start",
      }),
    },
    {
      el: captions.extra,
      place: (l) => ({
        at: near(l, l.expert.at(0.72), -34, -62),
        anchor: "end",
      }),
    },
    {
      el: captions.deployment,
      place: (l) => ({ at: near(l, l.branch, -18, 58), anchor: "end" }),
    },
    {
      el: captions.corrections,
      place: (l) => ({
        at: near(l, l.drift.at(0.6), 0, 88),
        anchor: "middle",
      }),
    },
  ];

  const blue = tokenColor("--extra", mount);
  const green = tokenColor("--recovery-vivid", mount);

  let layout: Layout | null = null;
  let size = { width: 0, height: 0 };

  const relayout = (width: number, height: number) => {
    size = { width, height };
    svg.setAttribute(
      "viewBox",
      `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`,
    );
    // a slim inner margin; the captions at the edges sit inside the design
    const box = {
      left: width * 0.04,
      top: height * 0.035,
      width: width * 0.92,
      height: height * 0.93,
    };
    const fit = Math.min(box.width / DESIGN_W, box.height / DESIGN_H);
    const sx = Math.min(box.width / DESIGN_W, fit * STRETCH);
    const sy = Math.min(box.height / DESIGN_H, fit * STRETCH);
    const ox = box.left + (box.width - DESIGN_W * sx) / 2;
    const oy = box.top + (box.height - DESIGN_H * sy) / 2;
    const map = (p: Point) => pt(ox + p.x * sx, oy + (p.y - DESIGN_TOP) * sy);
    const k = Math.min(1.5, Math.max(0.55, fit / 0.9));

    const expert = new Track(sample(EXPERT).map(map));
    // the drift is built in design space, where its first handle can follow
    // the route's own heading, and only then mapped
    const designRoute = new Track(sample(EXPERT));
    const drift = new Track(
      sample(
        smoothThrough(
          [designRoute.at(BRANCH), ...DRIFT_WAYPOINTS],
          designRoute.tangent(BRANCH),
          70,
        ),
        40,
      ).map(map),
    );

    const extra = EXTRA_AT.map((f, i) => {
      const heading = expert.tangent(f);
      const across = pt(-heading.y, heading.x); // towards the lower side
      const at = along(expert.at(f), across, EXTRA_JITTER[i]! * k);
      return { at, heading };
    });
    const corrections = CORRECTION_AT.map((f) => {
      const at = drift.at(f);
      // the expert's action here leads back to the route, a little ahead
      const back = expert.at(Math.min(1, expert.nearest(at) + 0.06));
      return { at, heading: unit(pt(back.x - at.x, back.y - at.y)) };
    });
    layout = {
      k,
      expert,
      drift,
      start: expert.at(0),
      goal: expert.at(1),
      branch: expert.at(BRANCH),
      extra,
      corrections,
    };

    // everything that does not move with time is set once per layout
    band.setAttribute("stroke-width", (92 * k).toFixed(1));
    bandCore.setAttribute("stroke-width", (46 * k).toFixed(1));
    route.setAttribute("stroke-width", (3.4 * k).toFixed(2));
    trail.setAttribute("stroke-width", (4 * k).toFixed(2));
    trail.setAttribute("stroke-dasharray", `0.1 ${(10 * k).toFixed(1)}`);
    for (const { pointer } of labels) {
      pointer.setAttribute("stroke-width", (2.4 * k).toFixed(2));
    }
    const dash = (3 * k).toFixed(1);
    for (const ring of ghosts) {
      ring.setAttribute("stroke-width", (1.8 * k).toFixed(2));
      ring.setAttribute("stroke-dasharray", `${dash} ${dash}`);
    }
    const fontSize = Math.max(13.5, 22 * k);
    captionLayer.setAttribute("font-size", fontSize.toFixed(1));
    // a phone-sized stage has no room for the two small words at the ends;
    // the start dot and the goal ring still mark them
    const compact = width < 520;
    captions.start.style.display = compact ? "none" : "";
    captions.goal.style.display = compact ? "none" : "";
    for (const { el, place } of placements) {
      const { at, anchor } = place(layout);
      el.setAttribute("text-anchor", anchor);
      el.setAttribute("y", at.y.toFixed(1));
      for (const span of el.querySelectorAll("tspan")) {
        span.setAttribute("x", at.x.toFixed(1));
      }
    }
  };

  // one frame -----------------------------------------------------------------

  const circle = (el: SVGCircleElement, at: Point, radius: number) => {
    set(el, "cx", at.x.toFixed(1));
    set(el, "cy", at.y.toFixed(1));
    set(el, "r", Math.max(0, radius).toFixed(2));
  };
  // captions rise into place as they fade in
  const reveal = (el: SVGTextElement, share: number, dim = 1) => {
    const eased = easeOut(share);
    set(el, "opacity", (eased * dim).toFixed(3));
    set(el, "transform", `translate(0 ${((1 - eased) * 8).toFixed(1)})`);
  };

  let now = reduced ? FINAL_SECONDS : 0;
  const render = (t: number) => {
    now = t;
    const l = layout;
    if (!l) return;
    const k = l.k;
    const fading = easeOut(progress(t, ...FADE_OUT));
    set(scene, "opacity", (1 - fading).toFixed(3));

    // 1. the expert's demonstrations: the route, and the band it covers
    const drawn = easeInOut(progress(t, ROUTE_START, ROUTE_DRAW));
    const spread = easeInOut(progress(t, 0, ROUTE_START + ROUTE_DRAW));
    set(band, "d", l.expert.upTo(spread));
    set(bandCore, "d", l.expert.upTo(spread));
    set(route, "d", l.expert.upTo(drawn));
    circle(start, l.start, 6.5 * k * backOut(progress(t, 0.05, POP)));
    const end = ROUTE_START + ROUTE_DRAW;
    const arrived = backOut(progress(t, end - 0.15, POP));
    circle(goal, l.goal, 7 * k * arrived);
    circle(goalRing, l.goal, 15 * k * arrived);
    reveal(captions.start, progress(t, 0.15, 0.4));
    reveal(captions.goal, progress(t, end - 0.1, 0.4));
    reveal(captions.expert, progress(t, 1.2, 0.5));

    // 2. extra demonstrations: the budget lands on the route, and
    // 4. corrections: the same labels move to where the learner drifted
    const r = 7.5 * k;
    const length = 30 * k;
    labels.forEach(({ pointer, dot }, i) => {
      const landed = EXTRA_START + i * EXTRA_STAGGER;
      const leaves = CORRECTION_START + i * FLIGHT_STAGGER;
      const from = l.extra[i]!;
      const to = l.corrections[i]!;
      const flight = easeInOut(progress(t, leaves, FLIGHT));
      const color = mixColor(blue, green, clamp01((flight - 0.3) / 0.4));
      // a straight move: the same label, taken from one place to the other
      circle(
        dot,
        lerp(from.at, to.at, flight),
        r * backOut(progress(t, landed, POP)),
      );
      set(dot, "fill", color);
      set(pointer, "stroke", color);
      // before the move the arrow follows the route; after it, it points home
      const outgoing =
        easeOut(progress(t, landed + 0.2, ARROW_GROW)) *
        (1 - easeOut(progress(t, leaves, 0.2)));
      const homing = easeOut(progress(t, leaves + FLIGHT - 0.05, ARROW_GROW));
      const gap = r + 3 * k;
      set(
        pointer,
        "d",
        homing > 0
          ? arrow(
              along(to.at, to.heading, gap),
              to.heading,
              length * homing,
              8 * k,
            )
          : arrow(
              along(from.at, from.heading, gap),
              from.heading,
              length * 0.8 * outgoing,
              7 * k,
            ),
      );
      const ghost = ghosts[i]!;
      circle(ghost, from.at, r + 1.5 * k);
      const left = easeOut(progress(t, leaves, 0.4));
      set(ghost, "opacity", (0.7 * left).toFixed(3));
    });
    const dimmed = 1 - 0.45 * easeOut(progress(t, CORRECTION_START, 0.8));
    reveal(captions.extra, progress(t, EXTRA_START + 0.4, 0.5), dimmed);
    reveal(captions.corrections, progress(t, CORRECTION_START + 1.1, 0.5));

    // 3. deployment: the learner follows the route, then drifts off it
    const walking = easeInOut(progress(t, ...TO_BRANCH));
    const drifting = easeInOut(progress(t, ...DRIFT));
    const onDrift = t >= DRIFT[0];
    const position = onDrift
      ? l.drift.at(drifting)
      : l.expert.at(BRANCH * walking);
    const heading = onDrift
      ? l.drift.tangent(drifting)
      : l.expert.tangent(BRANCH * walking);
    const present =
      easeOut(progress(t, DEPLOY_START, 0.3)) *
      (1 - easeOut(progress(t, CORRECTION_START - 0.3, 0.4)));
    set(learner, "d", triangle(position, heading, 17 * k));
    set(learner, "opacity", present.toFixed(3));
    set(trail, "d", l.drift.upTo(onDrift ? drifting : 0));
    circle(marker, l.branch, 8 * k * backOut(progress(t, MARKER_AT, POP)));
    const ping = progress(t, MARKER_AT, 0.9);
    circle(pulse, l.branch, (8 + 26 * easeOut(ping)) * k);
    const pinging = ping > 0 && ping < 1;
    set(pulse, "opacity", pinging ? (0.6 * (1 - ping)).toFixed(3) : "0");
    reveal(captions.deployment, progress(t, MARKER_AT, 0.45));
  };

  // playback ------------------------------------------------------------------

  let playing = false;
  let userPaused = false;
  let onScreen = false;
  let frame = 0;
  let last: number | null = null;
  const tick = (stamp: number) => {
    if (!svg.isConnected) return destroy();
    // a long gap (a background tab, a debugger) resumes rather than jumps
    const step = last === null ? 0 : Math.min(0.1, (stamp - last) / 1000);
    last = stamp;
    render((now + step) % LOOP_SECONDS);
    frame = requestAnimationFrame(tick);
  };
  const run = () => {
    const should = !reduced && !userPaused && onScreen && !document.hidden;
    if (should === playing) return;
    playing = should;
    if (playing) {
      last = null;
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
    }
  };

  // the same quiet pill the videos use, for anyone who wants it to hold still
  const controls = document.createElement("div");
  controls.className = "player__controls";
  const toggle = document.createElement("button");
  toggle.type = "button";
  controls.append(toggle);
  const showToggle = () => {
    toggle.textContent = userPaused ? "▶" : "❚❚";
    toggle.setAttribute(
      "aria-label",
      userPaused ? "play the sketch" : "pause the sketch",
    );
  };
  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    showToggle();
    run();
  });
  showToggle();

  mount.replaceChildren(svg);
  if (!reduced) mount.append(controls);

  const measure = () => {
    const box = svg.getBoundingClientRect();
    // test environments report no layout; any sane stage size will do there
    relayout(box.width || 960, box.height || 720);
    render(now);
  };
  measure();
  const resize =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          const box = svg.getBoundingClientRect();
          const moved =
            Math.abs(box.width - size.width) > 0.5 ||
            Math.abs(box.height - size.height) > 0.5;
          if (moved) measure();
        })
      : null;
  resize?.observe(svg);

  // Play only while the sketch is mostly on screen. Once it has been
  // scrolled out of sight entirely it starts over, so every visit begins at
  // the beginning; a sketch the reader paused keeps their frame instead.
  const stopWatching = reduced
    ? () => {}
    : watchShare(mount, (share) => {
        if (share === 0 && !userPaused) render(0);
        onScreen = share >= REVEALED;
        run();
      });
  const onVisibility = () => run();
  document.addEventListener("visibilitychange", onVisibility);

  function destroy() {
    cancelAnimationFrame(frame);
    playing = false;
    resize?.disconnect();
    stopWatching();
    document.removeEventListener("visibilitychange", onVisibility);
  }

  return {
    seek(seconds: number) {
      render(((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS);
    },
    play() {
      userPaused = false;
      showToggle();
      run();
    },
    pause() {
      userPaused = true;
      showToggle();
      run();
    },
    destroy,
  };
}
