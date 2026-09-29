// Ported from site/src/components/comic-strip.ts of RnLe/recovery-policy-learning
// (c4fc791); the strip itself now comes from the page instead of a constant.
// A comic page: hand-drawn panels laid out on a column grid instead of being
// stacked edge to edge. The layout owns the panel sizes, so a wide beat and a
// quiet one read differently; each drawing is then scaled to fit the frame it
// was given. Pass a different strip to reuse the component elsewhere.


export interface ComicPanel {
  /** URL of the drawing (this site passes its own copies). */
  src: string;
  alt: string;
  /** Intrinsic size of the trimmed drawing, in source pixels. */
  width: number;
  height: number;
  /** Columns this panel covers, out of the strip's column count. */
  columns: number;
  /** Rows it covers; one unless a beat is worth the extra height. */
  rows?: number;
  /** Share of the reader's stage height. Talky scenes claim all of it. */
  scale?: number;
  /** How the drawing meets its frame. Contain never crops a speech bubble. */
  fit?: "contain" | "cover";
  /** Where the drawing sits in the frame, as an object-position value. */
  position?: string;
}

export interface ComicStrip {
  /** Accessible name for the whole page of panels. */
  label: string;
  /** Column count the panel spans are expressed in. */
  columns: number;
  /** Row track sizes, e.g. ["1fr", "1fr", "1.15fr"]. */
  rows: string[];
  panels: ComicPanel[];
}


/** The drawing on its own, framed, at the size the caller asks for. */
export function comicArt(panel: ComicPanel, eager = false): HTMLImageElement {
  const image = document.createElement("img");
  image.className = "comic__art";
  image.src = panel.src;
  image.alt = panel.alt;
  image.width = panel.width;
  image.height = panel.height;
  image.loading = eager ? "eager" : "lazy";
  image.decoding = "async";
  if (panel.fit) image.style.objectFit = panel.fit;
  if (panel.position) image.style.objectPosition = panel.position;
  return image;
}

export function renderComicStrip(
  mount: HTMLElement,
  strip: ComicStrip,
): void {
  mount.replaceChildren(buildComicStrip(strip));
}

export function buildComicStrip(
  strip: ComicStrip,
): HTMLElement {
  const page = document.createElement("div");
  page.className = "comic";
  page.setAttribute("role", "group");
  page.setAttribute("aria-label", strip.label);
  page.style.setProperty("--comic-columns", String(strip.columns));
  page.style.setProperty("--comic-rows", strip.rows.join(" "));

  for (const panel of strip.panels) {
    const frame = document.createElement("figure");
    frame.className = "comic__panel";
    frame.style.setProperty("--comic-span", String(panel.columns));
    if (panel.rows && panel.rows > 1) {
      frame.style.setProperty("--comic-row-span", String(panel.rows));
    }
    frame.append(comicArt(panel));
    page.append(frame);
  }
  return page;
}
