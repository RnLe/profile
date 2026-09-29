// Ported unchanged, except for its imports and the strip passed in by the page,
// from site/src/components/comic-reader.ts of RnLe/recovery-policy-learning (c4fc791).
// The comic read one scene at a time: the stage keeps its height, each frame
// takes only the width its drawing needs, and the whole page waits at the end
// as the last slide. Scenes travel the full width of the stage as they change,
// and a strip of previews under it doubles as the position indicator.

import { whenVisible } from "./helpers";
import {
  type ComicStrip,
  buildComicStrip,
  comicArt,
} from "./comic-strip";

const SWIPE_THRESHOLD = 48; // px of horizontal travel that counts as a flick

/** Somewhere the arrow keys already mean something else. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function arrow(direction: -1 | 1): string {
  const path = direction < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
  return (
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"` +
    ` stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"` +
    ` aria-hidden="true" focusable="false"><path d="${path}"/></svg>`
  );
}

/** The whole page as a mark: three rows of panels, the shape of the finale. */
const PAGE_MARK =
  `<svg class="comic-reader__mark" viewBox="0 0 24 18" fill="none"` +
  ` stroke="currentColor" stroke-width="1.6" aria-hidden="true"` +
  ` focusable="false"><rect x="1" y="1" width="9" height="6"/>` +
  `<rect x="12" y="1" width="11" height="6"/><rect x="1" y="9" width="6" height="8"/>` +
  `<rect x="9" y="9" width="6" height="8"/><rect x="17" y="9" width="6" height="8"/></svg>`;

export function renderComicReader(
  mount: HTMLElement,
  strip: ComicStrip,
): void {
  const reader = document.createElement("div");
  reader.className = "comic-reader";
  reader.setAttribute("role", "group");
  reader.setAttribute("aria-roledescription", "carousel");
  reader.setAttribute("aria-label", strip.label);

  const stage = document.createElement("div");
  stage.className = "comic-reader__stage";

  // One slide per scene, then the assembled page.
  const slides: HTMLElement[] = strip.panels.map((panel, index) => {
    const slide = document.createElement("figure");
    slide.className = "comic-reader__slide";
    const frame = document.createElement("div");
    frame.className = "comic-reader__frame comic__panel";
    frame.style.setProperty(
      "--comic-aspect",
      (panel.width / panel.height).toFixed(4),
    );
    frame.style.setProperty("--comic-scale", String(panel.scale ?? 1));
    frame.append(comicArt(panel, index === 0));
    slide.append(frame);
    return slide;
  });
  const finale = document.createElement("figure");
  finale.className = "comic-reader__slide comic-reader__slide--page";
  finale.append(buildComicStrip(strip));
  slides.push(finale);
  stage.append(...slides);

  const isFinale = (index: number) => index === strip.panels.length;
  const labelFor = (index: number) =>
    isFinale(index)
      ? "The whole page"
      : `Scene ${index + 1} of ${strip.panels.length}`;

  // The previews: each keeps its own drawing's proportions, so the strip
  // reads as a filmstrip of the story rather than a row of equal chips.
  const previews = document.createElement("div");
  previews.className = "comic-reader__previews";
  const thumbs = slides.map((_, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "comic-reader__thumb";
    thumb.setAttribute("aria-label", labelFor(index));
    if (isFinale(index)) {
      thumb.classList.add("comic-reader__thumb--page");
      thumb.innerHTML = PAGE_MARK;
    } else {
      const panel = strip.panels[index]!;
      thumb.style.setProperty(
        "--comic-aspect",
        (panel.width / panel.height).toFixed(4),
      );
      const art = comicArt(panel);
      art.alt = "";
      thumb.append(art);
    }
    previews.append(thumb);
    return thumb;
  });

  const controls = (["prev", "next"] as const).map((which) => {
    const step = which === "prev" ? -1 : 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `comic-reader__nav comic-reader__nav--${which}`;
    button.setAttribute(
      "aria-label",
      which === "prev" ? "Previous scene" : "Next scene",
    );
    button.innerHTML = arrow(step as -1 | 1);
    button.addEventListener("click", () => show(current + step));
    return button;
  });

  let current = 0;
  const show = (next: number) => {
    const from = current;
    current = Math.min(Math.max(next, 0), slides.length - 1);
    slides.forEach((slide, index) => {
      // Only the two slides changing places travel; the rest are parked on
      // whichever side they now belong to, without sweeping across the stage.
      if (index !== from && index !== current) slide.style.transition = "none";
      const state =
        index === current ? "active" : index < current ? "before" : "after";
      slide.dataset.state = state;
      slide.inert = index !== current;
      slide.setAttribute("aria-hidden", String(index !== current));
    });
    void stage.offsetWidth; // commit the parked positions before re-arming
    for (const slide of slides) slide.style.transition = "";

    thumbs.forEach((thumb, index) => {
      thumb.setAttribute("aria-current", String(index === current));
    });
    // keep the current preview in view when the strip has to scroll
    const active = thumbs[current]!;
    if (typeof previews.scrollTo === "function") {
      previews.scrollTo({
        left: active.offsetLeft - (previews.clientWidth - active.clientWidth) / 2,
        behavior: "smooth",
      });
    }
    controls[0]!.disabled = current === 0;
    controls[1]!.disabled = current === slides.length - 1;
  };
  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => show(index));
  });

  // While the reader is on screen the arrow keys page it, wherever the focus
  // happens to be; off screen they go back to meaning what they always did.
  let onScreen = false;
  whenVisible(reader, {
    threshold: 0.2,
    enter: () => {
      onScreen = true;
    },
    exit: () => {
      onScreen = false;
    },
  });
  const onKey = (event: KeyboardEvent) => {
    if (!reader.isConnected) {
      document.removeEventListener("keydown", onKey);
      return;
    }
    if (!onScreen || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isTyping(event.target)) return;
    if (event.key === "ArrowRight") show(current + 1);
    else if (event.key === "ArrowLeft") show(current - 1);
    else return;
    event.preventDefault();
  };
  document.addEventListener("keydown", onKey);

  let swipeFrom: number | null = null;
  stage.addEventListener("pointerdown", (event) => {
    swipeFrom = event.pointerType === "mouse" ? null : event.clientX;
  });
  stage.addEventListener("pointerup", (event) => {
    if (swipeFrom === null) return;
    const travelled = event.clientX - swipeFrom;
    swipeFrom = null;
    if (Math.abs(travelled) > SWIPE_THRESHOLD) {
      show(current + (travelled < 0 ? 1 : -1));
    }
  });

  reader.append(stage, ...controls, previews);
  show(0);
  mount.replaceChildren(reader);
}
