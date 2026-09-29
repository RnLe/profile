// Shared by the ported Grounded Recovery components (budget-sketch.ts,
// comic-reader.ts): visibility, reduced motion, and SVG/colour helpers, from
// site/src/anim/helpers.ts of RnLe/recovery-policy-learning. One change: a
// token is read from the element the component is mounted in, since this
// site scopes the study's palette to that element (grounded.css).

const SVG_NS = "http://www.w3.org/2000/svg";

/** Absent matchMedia (test environments) counts as reduced motion, so the
 *  static rendering path is the one exercised everywhere by default. */
export function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type VisibleOptions = {
  enter: () => void;
  exit?: () => void;
  threshold?: number;
  rootMargin?: string;
};

/** Run callbacks as an element enters/leaves the viewport; returns a dispose
 *  function. Without IntersectionObserver the element counts as visible. */
export function whenVisible(el: Element, opts: VisibleOptions): () => void {
  if (typeof IntersectionObserver === "undefined") {
    opts.enter();
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) opts.enter();
        else opts.exit?.();
      }
    },
    { threshold: opts.threshold ?? 0.3, rootMargin: opts.rootMargin ?? "0px" },
  );
  observer.observe(el);
  return () => observer.disconnect();
}

/** Typed createElementNS with attributes. */
export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, String(value));
  }
  return el;
}

/** Resolve a design token to its value, as seen from the given element. */
export function tokenColor(name: string, from: Element = document.documentElement): string {
  const value = getComputedStyle(from).getPropertyValue(name).trim();
  return value || "#4f5f6b";
}
