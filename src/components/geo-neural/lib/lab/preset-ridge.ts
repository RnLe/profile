// Preset 1: linear diffusion of a synthetic ridge with small bumps, and a
// sine mode whose amplitude decay is compared with exp(-D k^2 t). One control,
// the creep rate, over a fixed 100,000 years.

import { h } from "../data/dom";
import { formatInt, formatYears } from "../data/format";
import { cssGradient, ELEVATION_STOPS } from "../data/palette";
import { linePlot } from "./plot";
import type { RunFrame, RunSpec } from "./protocol";
import { drawHeight } from "./render";
import { modeAmplitude, ridgeSurface, sineMode } from "./surfaces";
import { controlStrip, diagnosticsList, logSlider, minMax, plotHeight, plotWidth, rampLegend, type Preset, type RunnerApi } from "./ui";

const SIDE = 96;
const SPACING = 50;
const FRAMES = 100;
const MODE = 16;
const MODE_AMPLITUDE = 5;
const YEARS = 100000;

export function ridgePreset(api: RunnerApi): Preset {
  const initial = ridgeSurface(SIDE, SPACING);
  const [lo, hi] = minMax(initial);
  const sine = sineMode(SIDE, SPACING, MODE, MODE_AMPLITUDE);
  const wavelength = (2 * Math.PI) / sine.k;

  const diff = logSlider("Creep rate", 0.01, 1, 0.1, "m²/yr", 2);
  const strip = controlStrip(api);
  diff.input.addEventListener("change", () => api.paramsChanged());

  const canvas = h("canvas", { class: "gn-lab-canvas", width: SIDE, height: SIDE, role: "img", "aria-label": "Ridge surface, colored by height" });
  const diag = h("div", { class: "gn-lab-diag" });
  const profileHost = h("div", { class: "gn-lab-plot" });
  const modeHost = h("div", { class: "gn-lab-plot" });

  const el = h(
    "div",
    { class: "gn-lab-preset gn-lab-ridge" },
    h(
      "p",
      { class: "gn-lab-intro" },
      "Soil creep smooths the land: small bumps fade fast, the ridge itself slowly.",
    ),
    h("div", { class: "gn-controls" }, diff.el, strip.el),
    h(
      "div",
      { class: "gn-lab-grid" },
      h(
        "figure",
        { class: "gn-lab-card" },
        canvas,
        rampLegend(cssGradient(ELEVATION_STOPS), `${lo.toFixed(0)} m`, "", `${hi.toFixed(0)} m`),
        h("figcaption", { class: "gn-legend-title" }, "Ridge surface"),
        diag,
      ),
      h("figure", { class: "gn-lab-card gn-lab-card-wide" }, h("figcaption", { class: "gn-legend-title" }, "Cross-section through the middle"), profileHost),
      h(
        "figure",
        { class: "gn-lab-card gn-lab-card-wide" },
        h("figcaption", { class: "gn-legend-title" }, `One wave, ${formatInt(wavelength)} m long`),
        modeHost,
      ),
    ),
  );

  let times: number[] = [];
  let amps: number[] = [];
  let current: Float32Array | null = null;
  let time = 0;
  let lastFrames: RunFrame[] = [];

  const D = () => diff.value();
  const until = () => YEARS;

  function drawProfile(): void {
    const row = SIDE >> 1;
    const start: [number, number][] = [];
    const now: [number, number][] = [];
    for (let c = 0; c < SIDE; c++) {
      const x = (c + 0.5) * SPACING;
      start.push([x, initial[row * SIDE + c]]);
      if (current) now.push([x, current[row * SIDE + c]]);
    }
    profileHost.replaceChildren(
      linePlot({
        title: "Height through the middle, at the start and now",
        width: plotWidth(profileHost),
        height: plotHeight(profileHost),
        x: { min: 0, max: SIDE * SPACING, label: "distance east (km)", format: (v) => String(v / 1000) },
        y: { min: Math.floor(lo / 10) * 10, max: Math.ceil(hi / 10) * 10, label: "height (m)" },
        series: [
          { label: "start", points: start, className: "gn-s2", dash: "5 4", marker: "none" },
          { label: "now", points: now, className: "gn-s1", marker: "none" },
        ],
      }),
    );
  }

  function drawMode(): void {
    const d = D();
    const k2 = sine.k * sine.k;
    const T = until();
    const analytic: [number, number][] = [];
    for (let i = 0; i <= 100; i++) {
      const t = (T * i) / 100;
      analytic.push([t, Math.exp(-d * k2 * t)]);
    }
    const measured = times.map((t, i) => [t, amps[i] / MODE_AMPLITUDE] as [number, number]);
    const floor = 1e-8;
    modeHost.replaceChildren(
      linePlot({
        title: "How fast one wave fades: simulated and textbook",
        width: plotWidth(modeHost),
        height: plotHeight(modeHost),
        x: { min: 0, max: T, label: "time (thousand years)", format: (v) => String(v / 1000) },
        y: { min: floor, max: 1.5, log: true, floor, label: "height / start (log)" },
        series: [
          { label: "exp(-D k² t)", points: analytic, className: "gn-s2", dash: "6 4", marker: "none" },
          { label: "simulated", points: measured, className: "gn-s1", marker: "circle", markersOnly: true },
        ],
      }),
    );
  }

  function draw(): void {
    drawHeight(canvas, current ?? initial, SIDE, SPACING, lo, hi);
    const ridge = lastFrames.find((f) => f.key === "ridge");
    diag.replaceChildren(diagnosticsList(ridge?.diagnostics ?? null, ridge?.stopped ?? null));
    drawProfile();
    drawMode();
  }

  return {
    el,
    key: () => `ridge|${D()}`,
    specs(): RunSpec[] {
      const params = { diffusivity: D() };
      return [
        { key: "ridge", side: SIDE, spacingM: SPACING, initial, model: "linear", boundary: "closed", params },
        { key: "mode", side: SIDE, spacingM: SPACING, initial: sine.surface, model: "linear", boundary: "closed", params },
      ];
    },
    dtYears: () => until() / FRAMES,
    untilYears: until,
    stepsPerMessage: () => 1,
    showInitial() {
      times = [];
      amps = [];
      current = null;
      time = 0;
      lastFrames = [];
      draw();
      strip.status.textContent = `Ready: ${FRAMES} steps of ${formatYears(until() / FRAMES)}.`;
    },
    onFrame(frames) {
      lastFrames = frames;
      const ridge = frames.find((f) => f.key === "ridge");
      const mode = frames.find((f) => f.key === "mode");
      if (ridge?.surface) current = ridge.surface;
      time = ridge?.diagnostics?.timeYears ?? time;
      if (mode?.surface && mode.diagnostics) {
        times.push(mode.diagnostics.timeYears);
        amps.push(modeAmplitude(mode.surface, SIDE, sine.basis));
      }
      draw();
      strip.status.textContent = `${formatYears(time)} of ${formatYears(until())}`;
    },
    finished: () => time >= until() - 1e-6 || lastFrames.some((f) => f.stopped !== null),
    timeYears: () => time,
    setStatus: (text) => {
      strip.status.textContent = text;
    },
    setRunning(running) {
      strip.update(running, true, time > 0, time >= until() - 1e-6);
    },
    redraw() {
      drawProfile();
      drawMode();
    },
  };
}
