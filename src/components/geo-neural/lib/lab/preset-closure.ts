// Preset 2: the nonlinear teacher (shown as "Simulation"), the selected
// conductance closure and one rejected early design (the flux network) from
// the same start, stepped in lockstep. Shows the volume balance and the
// distance to the teacher.

import type { ClosureMeta, LabData } from "../data/bundle";
import { h } from "../data/dom";
import { formatYears } from "../data/format";
import { cssGradient, ELEVATION_STOPS } from "../data/palette";
import { floorNote, linePlot, type Marker } from "./plot";
import type { RunFrame, RunSpec } from "./protocol";
import { drawHeight } from "./render";
import { controlStrip, diagnosticsList, minMax, plotHeight, plotWidth, rampLegend, selectField, type Preset, type RunnerApi } from "./ui";

const STEPS = 64;
const FLOOR = 1e-16;
const FLAT = "flat";

interface Arm {
  key: string;
  model: "nonlinear" | "flux" | "conductance";
  title: string;
  /** Short name for the chart labels. */
  label: string;
  text: string;
  className: string;
  marker: Marker;
  dash?: string;
}

const ARMS: Arm[] = [
  { key: "teacher", model: "nonlinear", title: "Simulation", label: "Simulation", text: "The simulation the networks learned from.", className: "gn-s1", marker: "circle" },
  {
    key: "conductance",
    model: "conductance",
    title: "Selected network: edge rate with floor",
    label: "Selected network",
    text: "Sets one creep rate per cell edge, never below the simple creep law. Flat ground stays flat, and no soil is lost.",
    className: "gn-s3",
    marker: "triangle",
  },
  {
    key: "flux",
    model: "flux",
    title: "Flux network (early design, rejected)",
    label: "Flux network",
    text: "Moves soil across cell edges, so none is lost, but it also moves flat ground.",
    className: "gn-s2",
    marker: "square",
    dash: "6 3",
  },
];

/** The narrowest training range over the shown networks: every panel accepts a state inside it. */
function shownRange(meta: ClosureMeta): ClosureMeta["validated"] {
  const ranges = [meta.validated, ...ARMS.map((arm) => meta.arms[arm.model]?.validated).filter((v) => v !== undefined)];
  return {
    maxSlope: Math.min(...ranges.map((v) => v.maxSlope)),
    minHeightM: Math.max(...ranges.map((v) => v.minHeightM)),
    maxHeightM: Math.min(...ranges.map((v) => v.maxHeightM)),
  };
}

export function closurePreset(api: RunnerApi, lab: Promise<LabData>): Preset {
  let data: LabData | null = null;
  let loadError: string | null = null;

  const strip = controlStrip(api);
  const surfaceSel = selectField<string>("Start surface", [["0", "surface 1"]], "0");
  const boundarySel = selectField<"closed" | "fixed">(
    "Boundary",
    [
      ["closed", "closed (nothing leaves)"],
      ["fixed", "edge heights fixed"],
    ],
    "closed",
  );
  surfaceSel.select.addEventListener("change", () => api.paramsChanged());
  boundarySel.select.addEventListener("change", () => api.paramsChanged());

  const cards = new Map<string, { canvas: HTMLCanvasElement; diag: HTMLElement }>();
  const grid = h("div", { class: "gn-lab-grid gn-lab-grid-3" });
  let flat: Float32Array | null = null;
  for (const arm of ARMS) {
    const canvas = h("canvas", { class: "gn-lab-canvas", role: "img", "aria-label": `${arm.title} surface` });
    const diag = h("div", { class: "gn-lab-diag" });
    cards.set(arm.key, { canvas, diag });
    grid.append(
      h(
        "figure",
        { class: "gn-lab-card" },
        h("figcaption", { class: "gn-legend-title" }, h("span", { class: `gn-series-key ${arm.className}`, "aria-hidden": "true" }), arm.title),
        canvas,
        diag,
        h("p", { class: "gn-note" }, arm.text),
      ),
    );
  }
  const legendHost = h("div", {});
  const balanceHost = h("div", { class: "gn-lab-plot" });
  const errorHost = h("div", { class: "gn-lab-plot" });
  const rangeNote = h("p", { class: "gn-note" });

  // On a wide column the three surfaces and the two charts share one row.
  const el = h(
    "div",
    { class: "gn-lab-preset gn-lab-closure" },
    h(
      "p",
      { class: "gn-lab-intro" },
      "The selected network, one rejected early design and the simulation start from the same surface and run 64 steps of 200 years. Start from flat ground to see which one keeps it flat.",
    ),
    h("div", { class: "gn-controls" }, surfaceSel.el, boundarySel.el, strip.el),
    h(
      "div",
      { class: "gn-lab-split" },
      h("div", { class: "gn-lab-surfaces" }, legendHost, grid),
      h(
        "div",
        { class: "gn-lab-charts" },
        h("figure", { class: "gn-lab-card" }, h("figcaption", { class: "gn-legend-title" }, "Soil gained or lost, relative"), balanceHost),
        h("figure", { class: "gn-lab-card" }, h("figcaption", { class: "gn-legend-title" }, "Difference from the simulation"), errorHost),
      ),
    ),
    rangeNote,
    h("p", { class: "gn-note" }, `${floorNote(FLOOR)} Start surfaces are synthetic ones the networks never saw in training, or flat ground at 0 m.`),
  );

  let balance = new Map<string, [number, number][]>();
  let distance = new Map<string, [number, number][]>();
  let frames: RunFrame[] = [];
  let time = 0;
  let range: [number, number] = [0, 1];

  lab.then(
    (d) => {
      data = d;
      if (!d.closure || !d.closureText || !d.surfaces.length) {
        loadError = "This bundle has no learned networks.";
      } else {
        surfaceSel.select.replaceChildren(
          ...d.surfaces.map((_, i) => h("option", { value: String(i) }, `surface ${i + 1} of ${d.surfaces.length}`)),
          h("option", { value: FLAT }, "flat ground"),
        );
        const v = shownRange(d.closure);
        rangeNote.textContent = `The networks only accept heights from ${v.minHeightM.toFixed(0)} to ${v.maxHeightM.toFixed(0)} m and slopes up to ${v.maxSlope.toFixed(2)}; outside that, a run stops.`;
      }
      // Nothing can have run before the inputs arrived.
      initial();
      if (!loadError) strip.update(false, true, false, false);
    },
    (err: unknown) => {
      loadError = `The networks could not load: ${err instanceof Error ? err.message : String(err)}`;
      show();
    },
  );

  function start(): Float32Array | null {
    if (!data || !data.surfaces.length) return null;
    if (surfaceSel.value() === FLAT) return (flat ??= new Float32Array(data.surfaceSide * data.surfaceSide));
    return data.surfaces[Number(surfaceSel.value()) || 0];
  }

  function drawCharts(): void {
    const T = STEPS * 200;
    const bal = ARMS.map((arm) => ({
      label: arm.label,
      points: (balance.get(arm.key) ?? []).filter(([t]) => t > 0),
      className: arm.className,
      marker: arm.marker,
      dash: arm.dash,
    }));
    let top = 1e-12;
    for (const s of bal) for (const [, v] of s.points) top = Math.max(top, v);
    balanceHost.replaceChildren(
      linePlot({
        title: "Soil gained or lost over time, relative, log axis",
        width: plotWidth(balanceHost),
        height: plotHeight(balanceHost),
        x: { min: 0, max: T, label: "time (thousand years)", format: (v) => String(v / 1000) },
        y: {
          min: FLOOR,
          max: Math.pow(10, Math.ceil(Math.log10(top * 3))),
          log: true,
          floor: FLOOR,
          label: "relative (log)",
        },
        series: bal,
      }),
    );
    const err = ARMS.filter((a) => a.key !== "teacher").map((arm) => ({
      label: arm.label,
      points: distance.get(arm.key) ?? [],
      className: arm.className,
      marker: arm.marker,
      dash: arm.dash,
    }));
    let errTop = 1;
    for (const s of err) for (const [, v] of s.points) errTop = Math.max(errTop, v);
    errorHost.replaceChildren(
      linePlot({
        title: "Difference from the simulation over time",
        width: plotWidth(errorHost),
        height: plotHeight(errorHost),
        x: { min: 0, max: T, label: "time (thousand years)", format: (v) => String(v / 1000) },
        y: { min: 0, max: Math.ceil(errTop * 1.1), label: "RMS difference (m)" },
        series: err,
      }),
    );
  }

  function initial(): void {
    balance = new Map();
    distance = new Map();
    frames = [];
    time = 0;
    const s0 = start();
    if (s0) {
      const [lo, hi] = minMax(s0);
      // Flat ground gets a few meters either side, so any movement shows.
      range = hi > lo ? [lo, hi] : [lo - 2, hi + 2];
    }
    show();
    if (data && s0 && !loadError) strip.status.textContent = `Ready: ${STEPS} steps of 200 years.`;
  }

  function show(): void {
    const s0 = start();
    if (loadError) {
      strip.status.textContent = loadError;
      strip.update(false, false, false, false);
      return;
    }
    if (!data || !s0) {
      strip.status.textContent = "Loading the networks and test surfaces (about 320 kB)…";
      strip.update(false, false, false, false);
      return;
    }
    const side = data.surfaceSide;
    for (const arm of ARMS) {
      const card = cards.get(arm.key);
      if (!card) continue;
      const f = frames.find((x) => x.key === arm.key);
      drawHeight(card.canvas, f?.surface ?? s0, side, data.surfaceSpacingM, range[0], range[1]);
      card.diag.replaceChildren(diagnosticsList(f?.diagnostics ?? null, f?.stopped ?? null));
    }
    legendHost.replaceChildren(
      rampLegend(cssGradient(ELEVATION_STOPS), `${range[0].toFixed(0)} m`, "", `${range[1].toFixed(0)} m`, "Height, same scale in all three panels."),
    );
    drawCharts();
  }

  return {
    el,
    key: () => `closure|${surfaceSel.value()}|${boundarySel.value()}`,
    specs(): RunSpec[] | null {
      const s0 = start();
      if (!data || !s0 || !data.closure || !data.closureText) return null;
      const initial = Float64Array.from(s0);
      const { teacher } = data.closure;
      const meta = data.closureText;
      const weights = data.weights;
      return ARMS.map((arm): RunSpec => {
        const spec: RunSpec = {
          key: arm.key,
          side: data!.surfaceSide,
          spacingM: data!.surfaceSpacingM,
          initial,
          model: arm.model,
          boundary: boundarySel.value(),
          params: {},
        };
        if (arm.model === "nonlinear") spec.params = { diffusivity: teacher.diffusivity, criticalSlope: teacher.criticalSlope };
        else {
          spec.weights = weights[arm.model];
          spec.weightsMeta = meta;
        }
        return spec;
      });
    },
    dtYears: () => 200,
    untilYears: () => STEPS * 200,
    stepsPerMessage: () => 1,
    showInitial: initial,
    onFrame(next) {
      frames = next;
      const teacher = next.find((f) => f.key === "teacher");
      for (const f of next) {
        const d = f.diagnostics;
        if (!d) continue;
        const list = balance.get(f.key) ?? [];
        // Exact zero is drawn on the floor line, never at an invented value.
        if (!list.length || list[list.length - 1][0] !== d.timeYears) list.push([d.timeYears, Math.abs(d.residualRelative)]);
        balance.set(f.key, list);
        if (f.key !== "teacher" && f.surface && teacher?.surface && teacher.diagnostics) {
          let sum = 0;
          for (let i = 0; i < f.surface.length; i++) sum += (f.surface[i] - teacher.surface[i]) ** 2;
          const dl = distance.get(f.key) ?? [];
          if (!dl.length || dl[dl.length - 1][0] !== d.timeYears) dl.push([d.timeYears, Math.sqrt(sum / f.surface.length)]);
          distance.set(f.key, dl);
        }
      }
      time = Math.min(...next.filter((f) => f.diagnostics && !f.stopped).map((f) => f.diagnostics!.timeYears), STEPS * 200);
      if (!Number.isFinite(time)) time = STEPS * 200;
      show();
      strip.status.textContent = `Step ${Math.round(time / 200)} of ${STEPS} (${formatYears(time)}).`;
    },
    finished: () => time >= STEPS * 200 - 1e-6 || (frames.length > 0 && frames.every((f) => f.stopped !== null)),
    timeYears: () => time,
    setStatus: (text) => {
      strip.status.textContent = text;
    },
    setRunning(running) {
      const ready = !!data && !loadError;
      strip.update(running, ready, time > 0, time >= STEPS * 200 - 1e-6);
    },
    redraw() {
      if (data && !loadError) drawCharts();
    },
  };
}
