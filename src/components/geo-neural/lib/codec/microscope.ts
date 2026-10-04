// Compression microscope: one region and one bound, the standard codec (SZ3), the fixed multilevel coder
// (cubic-ctx) and the learned coder side by side. Each card gives the file size and how much smaller it is
// than SZ3, then its signed-error map and its stream map; the learned file is decoded again
// live in a worker and checked bit for bit. The bytes by component sit in one small disclosure.

import { h, Listeners, uid } from "../data/dom";
import { formatBytes, formatInt } from "../data/format";
import { cssGradient, DIVERGING_STOPS, STREAM_COLORS } from "../data/palette";
import { standaloneBreakdown } from "./accounting";
import type { CodecBundle, CodecProduct, CodecRegion, CoderId, ComponentKind, ProductRasters, RegionRasters } from "./bundle";
import { modelOf, productsAt } from "./bundle";
import { createDecoder, supported, type DecoderClient } from "./decoder";
import { drawErrorCodes, drawStreams, hillshade } from "./maps";
import type { DecodedMessage } from "./protocol";

export interface MicroscopeOptions {
  bundle: CodecBundle;
  /** URL of gnc_wasm_bg.wasm; a host site may serve its own copy. */
  wasmUrl: string | URL;
}

export interface MicroscopeHandle {
  dispose(): void;
}

const CODERS: CoderId[] = ["sz3", "cubic-ctx", "learned"];
const TITLES: Record<CoderId, string> = {
  sz3: "SZ3",
  "cubic-ctx": "Fixed predictor",
  learned: "Neural predictor",
};
const KICKERS: Record<CoderId, string> = {
  sz3: "Standard codec",
  "cubic-ctx": "This project",
  learned: "This project",
};

/** The parts of a file, in table order, in plain words. */
const PARTS: [ComponentKind, string][] = [
  ["stream", "coded prediction errors"],
  ["raw", "bits stored as is"],
  ["coarse", "coarse grid"],
  ["params", "parameters"],
  ["model", "neural model"],
  ["context", "context"],
  ["foreign", "SZ3 data"],
  ["container", "header"],
];

interface Card {
  coder: CoderId;
  root: HTMLElement;
  size: HTMLElement;
  line: HTMLElement;
  bar: HTMLElement;
  error: HTMLCanvasElement;
  streams: HTMLCanvasElement;
  streamsLabel: HTMLElement;
}

interface Live {
  productId: string;
  result: DecodedMessage;
  checksumMatch: boolean;
  breakdownMatch: boolean;
}

function boundsOf(region: CodecRegion, order: number[]): number[] {
  const have = new Set(region.products.map((p) => p.boundM));
  return order.filter((b) => have.has(b));
}

function boundLabel(b: number): string {
  return b >= 1 ? `${b} m` : `${Number((b * 100).toFixed(1))} cm`;
}

/** The names the case study uses for its regions. */
const REGION_NAMES: Record<string, string> = {
  "essen-ruhr": "Essen-Ruhr",
  "muensterland-plain": "Münsterland",
};

/** Short region name: the case study's name, else the title up to its first comma or bracket. */
function shortTitle(region: CodecRegion): string {
  return REGION_NAMES[region.id] ?? region.title.split(/[,(]/)[0].trim();
}

function seconds(ms: number): string {
  return ms < 100 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function mountMicroscope(el: HTMLElement, options: MicroscopeOptions): MicroscopeHandle {
  const { bundle } = options;
  const m = bundle.manifest;
  const listeners = new Listeners();
  const wasmHref = new URL(String(options.wasmUrl), document.baseURI).href;
  let disposed = false;
  let region = m.regions[0];
  let bound = boundsOf(region, m.bounds)[0];
  let refData: RegionRasters | null = null;
  let shade: Uint8Array | null = null;
  let live: Live | null = null;
  let loadSeq = 0;
  let started = false;
  let decoding = false;
  let decoder: DecoderClient | null = null;

  const root = h("section", { class: "gn-root gn-codec", "aria-label": "Compression microscope" });
  el.append(root);

  // ---- controls -------------------------------------------------------------
  const regionLabel = uid("gn-codec-label");
  const regionButtons = new Map<string, HTMLButtonElement>();
  const regionGroup = h("div", { class: "gn-segmented", role: "group", "aria-labelledby": regionLabel });
  for (const r of m.regions) {
    const b = h("button", { type: "button", class: "gn-button", "aria-pressed": String(r.id === region.id) }, shortTitle(r));
    regionButtons.set(r.id, b);
    regionGroup.append(b);
  }
  const boundId = uid("gn-codec-bound");
  const boundSelect = h("select", { id: boundId, class: "gn-select" });
  const boundField = h("div", { class: "gn-field" }, h("label", { for: boundId }, "Error limit"), boundSelect);
  const boundValue = h("span", { class: "gn-codec-limit" });
  const boundText = h("div", { class: "gn-field" }, h("span", { class: "gn-label" }, "Error limit"), boundValue);
  root.append(
    h(
      "div",
      { class: "gn-controls" },
      h("div", { class: "gn-field" }, h("span", { class: "gn-label", id: regionLabel }, "Region"), regionGroup),
      boundField,
      boundText,
    ),
  );

  // ---- cards ----------------------------------------------------------------
  const cardHost = h("div", { class: "gn-codec-cards" });
  const cards = new Map<CoderId, Card>();
  for (const coder of CODERS) {
    const size = h("p", { class: "gn-codec-size" });
    const line = h("p", { class: "gn-codec-line-text" });
    const bar = h("div", { class: "gn-codec-sizebar", "aria-hidden": "true" });
    const error = h("canvas", { class: "gn-codec-map", role: "img", "aria-label": `${TITLES[coder]}: map of the signed error` });
    const streams = h("canvas", { class: "gn-codec-map", role: "img", "aria-label": `${TITLES[coder]}: map of the streams` });
    const streamsLabel = h("figcaption", {});
    const card = h(
      "article",
      { class: `gn-codec-card gn-codec-${coder}` },
      h(
        "div",
        { class: "gn-codec-head" },
        h("p", { class: "gn-codec-kicker" }, KICKERS[coder]),
        h("h3", { class: "gn-codec-title" }, TITLES[coder]),
        size,
        line,
      ),
      bar,
      h("figure", { class: "gn-codec-mapfig" }, error, h("figcaption", {}, "Error")),
      h("figure", { class: "gn-codec-mapfig" }, streams, streamsLabel),
    );
    cards.set(coder, { coder, root: card, size, line, bar, error, streams, streamsLabel });
    cardHost.append(card);
  }
  const legend = h("div", { class: "gn-codec-legend" });
  const live_ = h("div", { class: "gn-codec-live", "aria-live": "polite" });
  const tableHost = h("div", { class: "gn-table-wrap" });
  root.append(
    cardHost,
    legend,
    live_,
    h("details", { class: "gn-chart-table" }, h("summary", {}, "What is inside each file"), tableHost),
  );

  // ---- cards: sizes and lines ---------------------------------------------------
  const products = () => productsAt(region, bound);
  /** The file a reader would need: the learned product with its model inside. */
  const fileBytes = (p: CodecProduct) => p.standaloneBytes;

  function renderCards(): void {
    const at = products();
    const sz3 = at.sz3 ? fileBytes(at.sz3) : null;
    const scale = Math.max(...CODERS.map((c) => (at[c] ? fileBytes(at[c] as CodecProduct) : 0)), 1);
    for (const card of cards.values()) {
      const p = at[card.coder];
      card.root.hidden = !p;
      if (!p) continue;
      const bytes = fileBytes(p);
      card.size.replaceChildren(h("span", { class: "gn-codec-big", title: `${formatInt(bytes)} bytes` }, formatBytes(bytes)));
      // The error limit is said once above the cards; every file keeps it.
      if (card.coder === "sz3" || sz3 === null) {
        card.line.textContent = "";
      } else {
        const saving = Math.round(100 * (1 - bytes / sz3));
        const model = modelOf(m, p) ? ", model included" : "";
        card.line.textContent = `${saving}% smaller than SZ3${model}.`;
      }
      card.bar.replaceChildren(h("span", { style: `width:${((100 * bytes) / scale).toFixed(1)}%` }));
      const f1 = p.metrics.streamTolerantF1;
      card.streamsLabel.textContent = f1 === null ? "Streams" : `Streams, ${Math.round(100 * f1)}% found again`;
    }
    renderTable(at);
  }

  function renderTable(at: Partial<Record<CoderId, CodecProduct>>): void {
    const cols = CODERS.filter((c) => at[c]).map((c) => {
      const p = at[c] as CodecProduct;
      return { title: TITLES[c], parts: standaloneBreakdown(p, modelOf(m, p)?.bytes ?? null), total: fileBytes(p) };
    });
    const rows = PARTS.filter(([kind]) => cols.some((c) => c.parts[kind] > 0));
    tableHost.replaceChildren(
      h(
        "table",
        { class: "gn-table" },
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Bytes"), ...cols.map((c) => h("th", { scope: "col" }, c.title)))),
        h(
          "tbody",
          {},
          ...rows.map(([kind, label]) =>
            h("tr", {}, h("th", { scope: "row" }, label), ...cols.map((c) => h("td", { class: "gn-num" }, c.parts[kind] ? formatInt(c.parts[kind]) : ""))),
          ),
          h("tr", {}, h("th", { scope: "row" }, "total"), ...cols.map((c) => h("td", { class: "gn-num" }, h("strong", {}, formatInt(c.total))))),
        ),
      ),
    );
  }

  // ---- legend -----------------------------------------------------------------
  function renderLegend(): void {
    const b = boundLabel(bound);
    const key = (color: string, text: string) => h("li", {}, h("span", { class: "gn-swatch", style: `background:${color}`, "aria-hidden": "true" }), text);
    legend.replaceChildren(
      h(
        "div",
        { class: "gn-codec-key" },
        h("span", { class: "gn-map-key" }, "Error"),
        h("span", { class: "gn-map-end" }, `-${b}`),
        h("span", { class: "gn-map-ramp", style: `background:${cssGradient(DIVERGING_STOPS)}`, "aria-hidden": "true" }),
        h("span", { class: "gn-map-end" }, `+${b}`),
        h("span", { class: "gn-codec-keynote" }, "blue too low, red too high"),
      ),
      h(
        "ul",
        { class: "gn-legend-list gn-legend-inline", "aria-label": "Streams" },
        key(STREAM_COLORS.both, "stream kept"),
        key(STREAM_COLORS.lost, "stream lost"),
        key(STREAM_COLORS.spurious, "new stream"),
      ),
    );
  }

  // ---- maps ---------------------------------------------------------------------
  async function loadRasters(): Promise<void> {
    const seq = ++loadSeq;
    const at = products();
    const reg = region;
    try {
      const [ref, ...rs] = await Promise.all([
        bundle.reference(reg),
        ...CODERS.map((c) => (at[c] ? bundle.rasters(reg, at[c] as CodecProduct) : Promise.resolve(null))),
      ]);
      if (disposed || seq !== loadSeq) return;
      if (refData !== ref) shade = hillshade(ref.height, reg.display.side, reg.spacingM * reg.display.stride);
      refData = ref;
      const side = reg.display.side;
      CODERS.forEach((c, i) => {
        const r = rs[i] as ProductRasters | null;
        const card = cards.get(c);
        if (!r || !card || !shade) return;
        drawErrorCodes(card.error, r.error, side);
        drawStreams(card.streams, shade, ref.streams, r.streams, side);
      });
    } catch (err) {
      if (disposed || seq !== loadSeq) return;
      legend.replaceChildren(h("p", { class: "gn-message" }, `The maps could not load: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  // ---- live decode ----------------------------------------------------------------
  function renderLive(state: string | null): void {
    const p = products().learned;
    if (!p) {
      live_.replaceChildren();
      return;
    }
    const l = live && live.productId === p.id ? live : null;
    let text = state ?? "";
    let cls = "gn-codec-status";
    if (!state && l) {
      const time = seconds(l.result.decodeMs);
      if (l.checksumMatch) {
        text = `Decoded in your browser in ${time}. Matches the stored result bit for bit.`;
        cls = "gn-codec-ok";
      } else {
        text = `Decoded in your browser in ${time}, but the result does NOT match the stored one.`;
        cls = "gn-codec-bad";
      }
      if (!l.breakdownMatch) text += " The parts of the file differ from the listed sizes.";
    }
    const again = h("button", { type: "button", class: "gn-button", disabled: decoding || !supported() }, l ? "Decode again" : "Decode now");
    again.addEventListener("click", () => void decodeLive());
    live_.replaceChildren(h("p", { class: cls }, text), again);
  }

  async function decodeLive(): Promise<void> {
    const p = products().learned;
    if (!p || disposed) return;
    if (!supported()) {
      renderLive("Decoding in the browser needs WebAssembly and Web Workers.");
      return;
    }
    const model = modelOf(m, p);
    if (!p.product || !model) {
      renderLive("The neural file is not part of this bundle.");
      return;
    }
    decoding = true;
    renderLive("Decoding the neural file in your browser…");
    try {
      const [productBytes, modelBytes] = await Promise.all([bundle.file(p.product), bundle.file(model.file)]);
      if (disposed) return;
      decoder ??= createDecoder(wasmHref);
      const result = await decoder.decode(productBytes, modelBytes);
      if (disposed || products().learned?.id !== p.id) return;
      const info = JSON.parse(result.describe) as { breakdown: [string, number][] };
      const read = Object.fromEntries(info.breakdown);
      const keys = new Set([...Object.keys(read), ...Object.keys(p.breakdown).filter((k) => (p.breakdown[k as ComponentKind] ?? 0) > 0)]);
      const breakdownMatch = [...keys].every((k) => (read[k] ?? 0) === (p.breakdown[k as ComponentKind] ?? 0));
      live = { productId: p.id, result, checksumMatch: result.latticeSha256 === p.latticeSha256, breakdownMatch };
      decoding = false;
      renderLive(null);
    } catch (err) {
      if (disposed) return;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "superseded") return;
      decoding = false;
      renderLive(`The live decode failed: ${msg}`);
    }
  }

  // ---- selection ----------------------------------------------------------------
  function fillBounds(): void {
    const bs = boundsOf(region, m.bounds);
    if (!bs.includes(bound)) bound = bs[0];
    boundSelect.replaceChildren(...bs.map((b) => h("option", { value: String(b) }, boundLabel(b))));
    boundSelect.value = String(bound);
    // One bound needs no choice: say it instead.
    boundField.hidden = bs.length < 2;
    boundText.hidden = bs.length > 1;
    boundValue.textContent = boundLabel(bound);
  }

  function selectionChanged(): void {
    renderCards();
    renderLegend();
    renderLive(started ? null : "The neural file is decoded in your browser when this comes into view.");
    void loadRasters();
    if (started) void decodeLive();
  }

  for (const [id, b] of regionButtons) {
    listeners.on(b, "click", () => {
      if (id === region.id) return;
      region = m.regions.find((r) => r.id === id) ?? region;
      for (const [k, other] of regionButtons) other.setAttribute("aria-pressed", String(k === region.id));
      refData = null;
      fillBounds();
      selectionChanged();
    });
  }
  listeners.on(boundSelect, "change", () => {
    bound = Number(boundSelect.value);
    selectionChanged();
  });

  const start = () => {
    if (started || disposed) return;
    started = true;
    void decodeLive();
  };
  let seen: IntersectionObserver | null = null;
  if (typeof IntersectionObserver === "function") {
    seen = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        seen?.disconnect();
        start();
      }
    }, { rootMargin: "200px" });
    seen.observe(root);
  } else {
    start();
  }

  fillBounds();
  selectionChanged();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      seen?.disconnect();
      listeners.clear();
      decoder?.dispose();
      decoder = null;
      root.remove();
    },
  };
}
