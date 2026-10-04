/**
 * A case study's parts (ProjectTabs) and its rail (CaseRail).
 *
 * In a study told in parts, one part shows at a time. Any in-page link of the
 * case study opens what it points at: a part (a rail row, a pager link, or a
 * link marked data-tab-link, like the overview's cards) or a step inside one,
 * which also opens its part. On the page the URL's hash follows (#<part> or
 * #<step>); in the landing page's overlay the URL is left alone. The rail
 * marks the open part and, as the reader scrolls, the step in view.
 *
 * Delegated from the document (clicks in the capture phase, ahead of the
 * client router), so it also serves an article injected into the overlay,
 * and set up again on every astro:page-load.
 */
type CaseWindow = Window & { __caseNavBound?: boolean };
const w = window as CaseWindow;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const roots = () => Array.from(document.querySelectorAll<HTMLElement>('[data-case]'));
const panelsOf = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
const inOverlay = (root: HTMLElement) => root.closest('dialog') !== null;
const byId = (root: HTMLElement, id: string) => (id ? root.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`) : null);

/** The part a key names: its own id, its panel's id, or anything inside it. */
function partFor(root: HTMLElement, key: string): HTMLElement | undefined {
  if (!key) return undefined;
  const panels = panelsOf(root);
  return panels.find((p) => p.dataset.panel === key || p.id === key) ?? byId(root, key)?.closest<HTMLElement>('[data-panel]') ?? undefined;
}

function activate(root: HTMLElement, panel: HTMLElement) {
  for (const p of panelsOf(root)) p.hidden = p !== panel;
  for (const link of Array.from(root.querySelectorAll<HTMLElement>('[data-part-link]'))) {
    if (link.dataset.partLink === panel.dataset.panel) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  spy(root);
}

/** The scrolling box a case study sits in, and the line under its top edge. */
function viewport(root: HTMLElement) {
  const box = root.closest<HTMLElement>('[data-project-body]');
  if (box) {
    const rect = box.getBoundingClientRect();
    const end = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
    return { top: rect.top, height: rect.height, end };
  }
  const html = document.documentElement;
  const top = parseFloat(getComputedStyle(html).scrollPaddingBlockStart) || 0;
  return { top, height: window.innerHeight - top, end: window.scrollY + window.innerHeight >= html.scrollHeight - 2 };
}

/** Marks the rail's step whose heading has passed the reading line. */
function spy(root: HTMLElement) {
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[data-spy]'));
  if (links.length === 0) return;
  const view = viewport(root);
  const line = view.top + Math.min(160, view.height * 0.3);
  let current = -1;
  links.forEach((link, i) => {
    const target = byId(root, decodeURIComponent(link.hash.slice(1)));
    if (!target || target.getClientRects().length === 0) return;
    const top = target.getBoundingClientRect().top;
    if (top <= line || (view.end && top < view.top + view.height)) current = i;
  });
  links.forEach((link, i) => {
    if (i === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function reveal(target: HTMLElement, onlyIfAbove: boolean) {
  const root = target.closest<HTMLElement>('[data-case]');
  if (onlyIfAbove && root && target.getBoundingClientRect().top >= viewport(root).top) return;
  target.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
}

function focusQuietly(el: HTMLElement | null) {
  if (!el) return;
  if (!el.hasAttribute('tabindex')) el.tabIndex = -1;
  el.focus({ preventScroll: true });
}

/**
 * Opens what a key names. A part is shown and the case study scrolled back to
 * its start when that lies above the view; a step also opens its part and is
 * scrolled to. Returns false when the key names nothing here.
 */
function go(root: HTMLElement, key: string, scroll: boolean, focus: boolean): boolean {
  const panel = partFor(root, key);
  const target = byId(root, key);
  const isPart = panel !== undefined && (panel.dataset.panel === key || panel.id === key);
  if (panel) activate(root, panel);
  if (!panel && !target) return false;
  if (!inOverlay(root) && (panel || target)) {
    const hash = isPart ? panel!.dataset.panel : key;
    if (location.hash.slice(1) !== hash) history.replaceState(history.state, '', `#${hash}`);
  }
  if (isPart) {
    if (scroll) reveal(root, true);
    if (focus) focusQuietly(panel!.querySelector<HTMLElement>('.panel-title'));
  } else if (target) {
    if (scroll) reveal(target, false);
    if (focus) focusQuietly(target);
  }
  return true;
}

function init() {
  for (const root of roots()) {
    if (root.classList.contains('tabs--ready')) continue;
    const hash = inOverlay(root) ? '' : decodeURIComponent(location.hash.slice(1));
    const panels = panelsOf(root);
    if (panels.length > 0) {
      const panel = (hash && partFor(root, hash)) || panels[0];
      activate(root, panel);
    }
    root.classList.add('tabs--ready');
    // A step named in the URL sat in a hidden part when the browser looked for it.
    const target = hash ? byId(root, hash) : null;
    if (target && !partFor(root, hash)?.isSameNode(target)) {
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
    spy(root);
  }
}

if (!w.__caseNavBound) {
  w.__caseNavBound = true;
  document.addEventListener(
    'click',
    (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('[data-case] a[href^="#"]');
      if (!link) return;
      const root = link.closest<HTMLElement>('[data-case]')!;
      const key = link.dataset.tabLink ?? decodeURIComponent(link.getAttribute('href')!.slice(1));
      const keyboard = event.detail === 0;
      if (go(root, key, true, keyboard || link.closest('.case-rail') === null)) event.preventDefault();
    },
    true,
  );
  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      for (const root of roots()) spy(root);
    });
  };
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('hashchange', () => {
    const hash = decodeURIComponent(location.hash.slice(1));
    for (const root of roots()) if (!inOverlay(root)) go(root, hash, true, false);
  });
  document.addEventListener('astro:page-load', init);
}

init();

export {};
