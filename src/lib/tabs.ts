/**
 * Tabs of a case study (ProjectTabs): one panel at a time, the arrow keys,
 * Home and End move between tabs, and links marked data-tab-link (the
 * overview's cards) open a tab. On the page the open tab follows the URL's
 * hash; in the landing page's overlay the URL is left alone. Delegated from
 * the document, so it also serves an article injected into the overlay, and
 * set up again on every astro:page-load.
 */
type TabsWindow = Window & { __caseTabsBound?: boolean };
const w = window as TabsWindow;

function tabsOf(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLButtonElement>(':scope > [role="tablist"] > [role="tab"]'));
}

function activate(root: HTMLElement, id: string, focus = false): boolean {
  const tabs = tabsOf(root);
  if (!tabs.some((tab) => tab.dataset.tab === id)) return false;
  for (const tab of tabs) {
    const on = tab.dataset.tab === id;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  }
  for (const panel of Array.from(root.querySelectorAll<HTMLElement>(':scope > [role="tabpanel"]'))) {
    panel.hidden = panel.dataset.panel !== id;
  }
  return true;
}

function inOverlay(root: HTMLElement) {
  return root.closest('dialog') !== null;
}

function init() {
  for (const root of Array.from(document.querySelectorAll<HTMLElement>('[data-tabs]:not(.tabs--ready)'))) {
    const hash = inOverlay(root) ? '' : decodeURIComponent(location.hash.slice(1));
    if (!(hash && activate(root, hash))) activate(root, tabsOf(root)[0]?.dataset.tab ?? '');
    root.classList.add('tabs--ready');
  }
}

function open(root: HTMLElement, id: string, scroll: boolean) {
  if (!activate(root, id)) return;
  if (!inOverlay(root)) history.replaceState(history.state, '', `#${id}`);
  if (scroll) root.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

if (!w.__caseTabsBound) {
  w.__caseTabsBound = true;
  document.addEventListener('click', (event) => {
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-tabs] [role="tab"], [data-tabs] [data-tab-link]');
    if (!target) return;
    const root = target.closest<HTMLElement>('[data-tabs]')!;
    event.preventDefault();
    const link = target.dataset.tabLink;
    open(root, link ?? target.dataset.tab ?? '', link !== undefined);
  });
  document.addEventListener('keydown', (event) => {
    const tab = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-tabs] [role="tab"]');
    if (!tab) return;
    const root = tab.closest<HTMLElement>('[data-tabs]')!;
    const tabs = tabsOf(root);
    const i = tabs.indexOf(tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const to = tabs[(next + tabs.length) % tabs.length];
    activate(root, to.dataset.tab ?? '', true);
    if (!inOverlay(root)) history.replaceState(history.state, '', `#${to.dataset.tab}`);
  });
  window.addEventListener('hashchange', () => {
    for (const root of Array.from(document.querySelectorAll<HTMLElement>('[data-tabs]'))) {
      if (!inOverlay(root)) activate(root, decodeURIComponent(location.hash.slice(1)));
    }
  });
  document.addEventListener('astro:page-load', init);
}

init();

export {};
