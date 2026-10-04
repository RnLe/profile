// Map mode of the terrain viewer: the reference surface only, one layer
// choice (height, streams, geology), vertical exaggeration and two camera
// presets (the tilted start view and top-down), with a north arrow, a scale
// bar and a compact legend. Reads the reference height, its streams and the
// geology classes; no candidate field.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Bundle, LegendEntry } from "../data/bundle";
import { h, Listeners, uid } from "../data/dom";
import { cssGradient, ELEVATION_STOPS, STREAM_COLORS } from "../data/palette";
import type { Overlay } from "../data/store";
import { bilinear, makeFrame, toLocal } from "./field";
import { STREAM_BOTH, Terrain } from "./terrain";

export interface MapOptions {
  bundle: Bundle;
  /** Starting vertical exaggeration; Reset view returns to it. Default 5. */
  exaggeration?: number;
}

export interface MapHandle {
  dispose(): void;
}

type Layer = Extract<Overlay, "elevation" | "streams" | "geology">;

const LAYERS: [Layer, string][] = [
  ["elevation", "Height"],
  ["streams", "Streams"],
  ["geology", "Geology"],
];
const EXAGGERATIONS = [1, 2, 5, 10];
const TILT_POLAR = THREE.MathUtils.degToRad(54);
const LINE_LIFT_M = 3;

/** The names the case study uses for its regions; others keep their title. */
const PLACE_NAMES: Record<string, string> = { "essen-ruhr": "Essen-Ruhr" };

/** Shorter names for the longest map units; the rest read as they are. */
const PLAIN_UNITS: Record<string, string> = {
  "anthropogenic unconsolidated material": "man-made ground",
  "pebble gravel size sediment": "gravel",
};

function webglAvailable(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export function mountMap(el: HTMLElement, options: MapOptions): MapHandle {
  const { bundle } = options;
  const m = bundle.manifest;
  const side = bundle.side;
  const start = options.exaggeration ?? 5;
  const h0 = Math.floor(m.reference.minM);
  const frame = makeFrame(side, m.grid.spacingM, m.region.bounds, h0);
  const listeners = new Listeners();
  const placeName = PLACE_NAMES[m.region.id] ?? m.region.title;
  const root = h("section", { class: "gn-root gn-viewer gn-map", "aria-label": "Terrain map" });
  el.append(root);

  if (!webglAvailable()) {
    root.append(h("p", { class: "gn-message" }, "This browser cannot show the 3D map (it needs WebGL 2)."));
    return { dispose: () => root.remove() };
  }

  // ---- controls -------------------------------------------------------------
  function group(label: string, items: [string, string][], pressed: string): { el: HTMLElement; buttons: Map<string, HTMLButtonElement> } {
    const buttons = new Map<string, HTMLButtonElement>();
    const id = uid("gn-map-label");
    const row = h("div", { class: "gn-segmented", role: "group", "aria-labelledby": id });
    for (const [value, text] of items) {
      const b = h("button", { type: "button", class: "gn-button", "aria-pressed": String(value === pressed) }, text);
      buttons.set(value, b);
      row.append(b);
    }
    return { el: h("div", { class: "gn-field" }, h("span", { class: "gn-label", id }, label), row), buttons };
  }
  const press = (buttons: Map<string, HTMLButtonElement>, value: string) => {
    for (const [k, b] of buttons) b.setAttribute("aria-pressed", String(k === value));
  };

  const layers = group("Layer", LAYERS, "elevation");
  const exags = group("Vertical exaggeration", EXAGGERATIONS.map((v) => [String(v), `${v}x`]), String(start));
  const btn = (label: string) => h("button", { type: "button", class: "gn-button" }, label);
  const resetBtn = btn("Reset view");
  const topBtn = btn("Top-down");
  const viewId = uid("gn-map-label");
  const view = h(
    "div",
    { class: "gn-field" },
    h("span", { class: "gn-label", id: viewId }, "View"),
    h("div", { class: "gn-inline", role: "group", "aria-labelledby": viewId }, resetBtn, topBtn),
  );

  // ---- stage ----------------------------------------------------------------
  const canvas = h("canvas", { class: "gn-viewer-canvas" });
  const hintId = uid("gn-hint");
  const stage = h(
    "div",
    { class: "gn-viewer-stage", tabindex: "0", role: "application", "aria-roledescription": "3D terrain map", "aria-label": placeName, "aria-describedby": hintId },
    canvas,
  );
  const place = h("div", { class: "gn-viewer-badge" }, placeName);
  const northArrow = h("div", { class: "gn-viewer-north", "aria-hidden": "true" });
  northArrow.innerHTML =
    '<svg viewBox="-16 -22 32 44" width="28" height="38"><path d="M0,-18 L8,6 L0,1 L-8,6 Z" class="gn-north-fill"/><path d="M0,-18 L-8,6 L0,1 Z" class="gn-north-half"/><text x="0" y="19" text-anchor="middle">N</text></svg>';
  const scaleBar = h("div", { class: "gn-viewer-scale", "aria-hidden": "true" }, h("div", { class: "gn-viewer-scale-bar" }), h("div", { class: "gn-viewer-scale-label" }));
  const status = h("div", { class: "gn-viewer-status", role: "status" });
  stage.append(place, northArrow, scaleBar, status);

  const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const hint = h(
    "p",
    { class: "gn-note gn-map-hint", id: hintId },
    touch ? "Drag to turn, pinch to zoom, two fingers to move." : "Drag to turn, right-drag to move, scroll to zoom.",
  );
  const legend = h("div", { class: "gn-map-legend" });
  root.append(
    h("div", { class: "gn-controls" }, layers.el, exags.el, view),
    stage,
    h("div", { class: "gn-map-foot" }, legend, hint),
    h("p", { class: "gn-map-credit" }, m.attribution.join(". ") + "."),
  );

  // ---- three.js -------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 20, 200000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(86);
  controls.minDistance = 300;
  controls.maxDistance = 60000;
  controls.listenToKeyEvents(stage);

  const terrain = new Terrain({
    side,
    spacingM: m.grid.spacingM,
    h0,
    hMin: m.reference.minM,
    hMax: m.reference.maxM,
    errRangeM: 1,
    reference: bundle.reference.height,
    referenceStreams: bundle.reference.streams,
    geology: bundle.geology,
    legend: m.geology.legend,
  });
  // The reference stands in for the candidate too, so every stream cell is
  // drawn as one class.
  terrain.setCandidate(bundle.reference.height, bundle.reference.streams);
  terrain.setShowReference(true);
  terrain.setStreamFilter(STREAM_BOTH);
  terrain.setPixelRatio(pixelRatio);
  scene.add(terrain.mesh);

  const faultMaterial = new THREE.LineDashedMaterial({ color: 0x1b1b1b, dashSize: 90, gapSize: 50 });
  const faultGeometry = new THREE.BufferGeometry();
  const faults = new THREE.LineSegments(faultGeometry, faultMaterial);
  faults.frustumCulled = false;
  faults.visible = false;
  scene.add(faults);

  // ---- state ----------------------------------------------------------------
  let layer: Layer = "elevation";
  let exag = 1;
  let disposed = false;
  let raf = 0;
  let visible = true;
  let dirty = true;

  function requestRender(): void {
    dirty = true;
    if (!visible || raf || disposed) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (disposed) return;
      dirty = false;
      renderer.render(scene, camera);
      updateOverlays();
    });
  }

  function updateOverlays(): void {
    // North arrow: screen direction of -z at the view center.
    const az = controls.getAzimuthalAngle();
    const polar = controls.getPolarAngle();
    northArrow.style.transform = `rotate(${Math.atan2(Math.sin(az), Math.cos(az) * Math.cos(polar)).toFixed(4)}rad)`;
    // Scale bar at the orbit target.
    const d = camera.position.distanceTo(controls.target);
    const mpp = (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / (stage.clientHeight || 1);
    let len = 50;
    for (const c of [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000]) if (c / mpp <= 120) len = c;
    (scaleBar.firstElementChild as HTMLElement).style.width = `${Math.max(1, len / mpp).toFixed(1)}px`;
    (scaleBar.lastElementChild as HTMLElement).textContent = len >= 1000 ? `${len / 1000} km` : `${len} m`;
  }

  // Fault traces draped on the surface; their vertices are meters east and
  // north of the south-west node.
  function updateFaults(): void {
    const field = bundle.reference.height;
    const out: number[] = [];
    for (const line of m.geology.faults) {
      const pts = line.map(([fx, fy]) => ({ col: fx / frame.spacingM, row: (frame.north - (frame.south + fy)) / frame.spacingM }));
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const n = Math.max(1, Math.ceil(Math.hypot(b.col - a.col, b.row - a.row)));
        for (let k = 0; k < n; k++) {
          for (const t of [k / n, (k + 1) / n]) {
            const col = a.col + (b.col - a.col) * t;
            const row = a.row + (b.row - a.row) * t;
            const { x, z } = toLocal(frame, col, row);
            out.push(x, bilinear(field, side, col, row) - h0 + LINE_LIFT_M, z);
          }
        }
      }
    }
    faultGeometry.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
    faults.computeLineDistances();
  }

  // ---- legend ---------------------------------------------------------------
  const geologyShare = new Map<number, number>();
  for (let i = 0; i < bundle.geology.length; i++) geologyShare.set(bundle.geology[i], (geologyShare.get(bundle.geology[i]) ?? 0) + 1);
  const unitName = (entry: LegendEntry) => PLAIN_UNITS[entry.label] ?? entry.label;
  const swatch = (style: string, extra = "") => h("span", { class: `gn-swatch ${extra}`.trim(), style, "aria-hidden": "true" });

  function renderLegend(): void {
    if (layer === "elevation") {
      legend.replaceChildren(
        h("span", { class: "gn-map-key" }, "Height"),
        h("span", { class: "gn-map-end" }, `${Math.round(m.reference.minM)} m`),
        h("span", { class: "gn-map-ramp", style: `background:${cssGradient(ELEVATION_STOPS)}`, "aria-hidden": "true" }),
        h("span", { class: "gn-map-end" }, `${Math.round(m.reference.maxM)} m`),
      );
    } else if (layer === "streams") {
      const ha = (m.streamThresholdCells * m.region.referenceSpacingM ** 2) / 1e4;
      // One item, so the swatch never wraps away from its text.
      legend.replaceChildren(
        h(
          "ul",
          { class: "gn-legend-list gn-legend-inline", "aria-label": "Streams" },
          h("li", {}, swatch(`background:${STREAM_COLORS.both}`), `Stream: water from at least ${ha} ha drains through here`),
        ),
      );
    } else {
      const units = m.geology.legend
        .filter((entry) => entry.code !== 0 && (geologyShare.get(entry.code) ?? 0) > 0)
        .sort((a, b) => (geologyShare.get(b.code) ?? 0) - (geologyShare.get(a.code) ?? 0));
      legend.replaceChildren(
        h(
          "ul",
          { class: "gn-legend-list gn-legend-inline", "aria-label": "Rock and soil at the surface" },
          ...units.map((entry) => h("li", {}, swatch(`background:${entry.color}`), unitName(entry))),
          h("li", {}, h("span", { class: "gn-swatch-line gn-swatch-line-fault", "aria-hidden": "true" }), "fault"),
        ),
      );
    }
  }

  // ---- camera ---------------------------------------------------------------
  function setView(kind: "tilted" | "top"): void {
    const midH = (m.reference.minM + m.reference.maxM) / 2;
    // The tilted view looks at a point a little south of the center, so the
    // near edge, drawn widest, does not leave the top of the frame empty.
    const target = new THREE.Vector3(0, (midH - h0) * exag, kind === "top" ? 0 : terrain.half * 0.07);
    // The tilted view is wider than tall on screen: on a frame narrower than
    // 16:10 it backs off so the near corners stay in view.
    const across = kind === "top" ? camera.aspect : camera.aspect / 1.6;
    // From above, the square keeps about 42 px clear at the top and bottom,
    // where the place badge and the scale bar sit, and 3% for the relief.
    const margin = kind === "top" ? 1.03 / (1 - Math.min(0.4, 84 / (stage.clientHeight || 400))) : 1.12;
    const fit = (terrain.half * margin) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / Math.min(1, across);
    const polar = kind === "top" ? 0.0005 : TILT_POLAR;
    const dist = kind === "top" ? fit : fit * 0.8;
    camera.position.set(target.x, target.y + dist * Math.cos(polar), target.z + dist * Math.sin(polar));
    controls.target.copy(target);
    controls.update();
    requestRender();
  }

  function setExaggeration(v: number): void {
    const ratio = v / exag;
    exag = v;
    terrain.setExaggeration(v);
    // Keep the view on the same terrain point as heights stretch.
    const dy = controls.target.y * (ratio - 1);
    controls.target.y += dy;
    camera.position.y += dy;
    controls.update();
    faults.scale.y = v;
    press(exags.buttons, String(v));
    requestRender();
  }

  function setLayer(next: Layer): void {
    layer = next;
    terrain.setOverlay(next);
    faults.visible = next === "geology";
    press(layers.buttons, next);
    renderLegend();
    requestRender();
  }

  // ---- wiring ---------------------------------------------------------------
  for (const [value, b] of layers.buttons) listeners.on(b, "click", () => setLayer(value as Layer));
  for (const [value, b] of exags.buttons) listeners.on(b, "click", () => setExaggeration(Number(value)));
  listeners.on(resetBtn, "click", () => {
    if (exag !== start) setExaggeration(start);
    setView("tilted");
  });
  listeners.on(topBtn, "click", () => setView("top"));
  controls.addEventListener("change", requestRender);
  listeners.add(() => controls.removeEventListener("change", requestRender));
  listeners.on(canvas, "webglcontextlost", (e: Event) => {
    e.preventDefault();
    if (!disposed) status.textContent = "The graphics context was lost. Reload the page to see the map again.";
  });

  const resizeObserver = new ResizeObserver(() => {
    const w = Math.max(1, stage.clientWidth);
    const hgt = Math.max(1, stage.clientHeight);
    renderer.setSize(w, hgt, false);
    camera.aspect = w / hgt;
    camera.updateProjectionMatrix();
    requestRender();
  });
  resizeObserver.observe(stage);

  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible && dirty) requestRender();
  });
  intersectionObserver.observe(stage);

  // ---- start ----------------------------------------------------------------
  const w0 = Math.max(1, stage.clientWidth);
  const h0px = Math.max(1, stage.clientHeight);
  renderer.setSize(w0, h0px, false);
  camera.aspect = w0 / h0px;
  camera.updateProjectionMatrix();
  updateFaults();
  setLayer("elevation");
  setExaggeration(start);
  setView("tilted");

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      listeners.clear();
      controls.dispose();
      terrain.dispose();
      faultGeometry.dispose();
      faultMaterial.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      root.remove();
    },
  };
}
