// Preset 3: linear diffusion on the Essen lab terrain with a per-class
// diffusivity: D0 on rock, D0 x factor on loose ground. The factor is an
// assumption, not a measurement; one choice replaces a factor per map unit.

import type { LabData, LegendEntry } from "../data/bundle";
import { h } from "../data/dom";
import { formatYears } from "../data/format";
import { cssGradient, DIVERGING_STOPS, ELEVATION_STOPS } from "../data/palette";
import type { RunFrame, RunSpec } from "./protocol";
import { drawClasses, drawDiverging, drawHeight, niceRange } from "./render";
import { controlStrip, diagnosticsList, logSlider, minMax, rampLegend, selectField, type Preset, type RunnerApi } from "./ui";

const FRAMES = 50;
/** Map units that are loose ground rather than rock. */
const LOOSE = new Set(["anthropogenic unconsolidated material", "pebble gravel size sediment", "sand", "silt"]);
const LOOSE_COLOR = "#e6d29a";
const ROCK_COLOR = "#8a7f9e";

export function materialPreset(api: RunnerApi, lab: Promise<LabData>, legend: LegendEntry[]): Preset {
  let data: LabData | null = null;
  let loadError: string | null = null;
  const loose = new Set(legend.filter((e) => LOOSE.has(e.label)).map((e) => e.code));

  const d0 = logSlider("Creep rate of rock", 0.001, 0.1, 0.01, "m²/yr", 2);
  const years = selectField(
    "Run length",
    [
      ["10000", "10,000 years"],
      ["100000", "100,000 years"],
      ["1000000", "1,000,000 years"],
    ],
    "100000",
  );
  const factor = selectField(
    "Loose ground creeps",
    [
      ["1", "as fast as rock"],
      ["3", "3 times faster"],
      ["10", "10 times faster"],
    ],
    "3",
  );
  d0.input.addEventListener("change", () => api.paramsChanged());
  years.select.addEventListener("change", () => api.paramsChanged());
  factor.select.addEventListener("change", () => api.paramsChanged());
  const strip = controlStrip(api);
  const ratio = (code: number) => (loose.has(code) ? Number(factor.value()) : 1);

  const classCanvas = h("canvas", { class: "gn-lab-canvas", role: "img", "aria-label": "Loose ground and rock on the lab terrain" });
  const heightCanvas = h("canvas", { class: "gn-lab-canvas", role: "img", "aria-label": "Lab terrain height now" });
  const changeCanvas = h("canvas", { class: "gn-lab-canvas", role: "img", "aria-label": "Change in height since the start" });
  const heightLegend = h("div", {});
  const changeLegend = h("div", {});
  const diag = h("div", { class: "gn-lab-diag" });

  const el = h(
    "div",
    { class: "gn-lab-preset gn-lab-material" },
    h(
      "p",
      { class: "gn-lab-intro" },
      "Soil creep on the real Essen terrain (80 m grid), where loose ground (sand, silt, gravel, made ground) creeps faster than rock. The factor is an assumption, not a measurement: this shows what a contrast would do, not how the Ruhr valley erodes.",
    ),
    h("div", { class: "gn-controls" }, factor.el, d0.el, years.el, strip.el),
    h(
      "div",
      { class: "gn-lab-grid gn-lab-grid-3" },
      h(
        "figure",
        { class: "gn-lab-card" },
        h("figcaption", { class: "gn-legend-title" }, "Loose ground and rock"),
        classCanvas,
        h(
          "ul",
          { class: "gn-legend-list gn-legend-inline", "aria-label": "Ground" },
          h("li", {}, h("span", { class: "gn-swatch", style: `background:${LOOSE_COLOR}`, "aria-hidden": "true" }), "loose ground"),
          h("li", {}, h("span", { class: "gn-swatch", style: `background:${ROCK_COLOR}`, "aria-hidden": "true" }), "rock"),
        ),
      ),
      h("figure", { class: "gn-lab-card" }, h("figcaption", { class: "gn-legend-title" }, "Height now"), heightCanvas, heightLegend, diag),
      h("figure", { class: "gn-lab-card" }, h("figcaption", { class: "gn-legend-title" }, "Change since the start"), changeCanvas, changeLegend),
    ),
  );

  let frames: RunFrame[] = [];
  let current: Float32Array | null = null;
  let time = 0;
  let range: [number, number] = [0, 1];

  lab.then(
    (d) => {
      data = d;
      const t = d.terrain;
      range = minMax(t.height);
      // Unmapped cells (code 0) stay neutral; every other unit is loose ground or rock.
      drawClasses(classCanvas, t.classes, t.side, new Map(legend.filter((e) => e.code !== 0).map((e) => [e.code, loose.has(e.code) ? LOOSE_COLOR : ROCK_COLOR])));
      // Nothing can have run before the terrain arrived.
      initial();
      strip.update(false, true, false, false);
    },
    (err: unknown) => {
      loadError = `The terrain could not load: ${err instanceof Error ? err.message : String(err)}`;
      show();
    },
  );

  const N = () => Number(years.value());

  function initial(): void {
    frames = [];
    current = null;
    time = 0;
    show();
    if (data && !loadError) strip.status.textContent = `Ready: ${FRAMES} steps of ${formatYears(N() / FRAMES)}.`;
  }

  function show(): void {
    if (loadError) {
      strip.status.textContent = loadError;
      strip.update(false, false, false, false);
      return;
    }
    if (!data) {
      strip.status.textContent = "Loading the terrain…";
      strip.update(false, false, false, false);
      return;
    }
    const t = data.terrain;
    const now = current ?? t.height;
    drawHeight(heightCanvas, now, t.side, t.spacingM, range[0], range[1]);
    heightLegend.replaceChildren(rampLegend(cssGradient(ELEVATION_STOPS), `${range[0].toFixed(0)} m`, "", `${range[1].toFixed(0)} m`));
    const delta = new Float32Array(now.length);
    let rise = 0;
    let fall = 0;
    for (let i = 0; i < now.length; i++) {
      const v = now[i] - t.height[i];
      delta[i] = v;
      rise = Math.max(rise, v);
      fall = Math.min(fall, v);
    }
    // Colour scale from the 99th percentile of |change|, so a few steep banks do not wash out the rest.
    const sorted = Float32Array.from(delta, Math.abs).sort();
    const p99 = sorted[Math.floor(0.99 * (sorted.length - 1))];
    const r = niceRange(Math.max(p99, 1e-3));
    drawDiverging(changeCanvas, delta, t.side, r);
    changeLegend.replaceChildren(
      rampLegend(
        cssGradient(DIVERGING_STOPS),
        `-${r} m`,
        "0",
        `+${r} m`,
        current ? `Blue lowered, red raised. Largest rise +${rise.toFixed(2)} m, largest drop ${fall.toFixed(2)} m.` : "No change yet.",
      ),
    );
    const f = frames[0];
    diag.replaceChildren(diagnosticsList(f?.diagnostics ?? null, f?.stopped ?? null));
  }

  return {
    el,
    key: () => `material|${d0.value()}|${N()}|${factor.value()}`,
    specs(): RunSpec[] | null {
      if (!data) return null;
      const t = data.terrain;
      const base = d0.value();
      const field = new Float64Array(t.side * t.side);
      for (let i = 0; i < field.length; i++) field[i] = base * ratio(t.classes[i]);
      return [
        {
          key: "terrain",
          side: t.side,
          spacingM: t.spacingM,
          initial: Float64Array.from(t.height),
          model: "linear",
          boundary: "closed",
          params: {},
          diffusivity: field,
        },
      ];
    },
    dtYears: () => N() / FRAMES,
    untilYears: N,
    stepsPerMessage: () => 1,
    showInitial: initial,
    onFrame(next) {
      frames = next;
      const f = next[0];
      if (f?.surface) current = f.surface;
      time = f?.diagnostics?.timeYears ?? time;
      show();
      strip.status.textContent = `${formatYears(time)} of ${formatYears(N())}`;
    },
    finished: () => time >= N() - 1e-6 || frames.some((f) => f.stopped !== null),
    timeYears: () => time,
    setStatus: (text) => {
      strip.status.textContent = text;
    },
    setRunning(running) {
      strip.update(running, !!data && !loadError, time > 0, time >= N() - 1e-6);
    },
  };
}
