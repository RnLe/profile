/**
 * The small marks with an instant tooltip (a project's kind marks, its
 * activity marker) on a touch screen, which has no hover: a tap opens a mark's
 * card, a second tap on the same mark closes it, and a tap anywhere else or
 * any scroll closes it too. A mark inside a link (the projects rail) opens its
 * card on a tap instead of following the link. A mouse changes nothing: hover
 * and focus show the card as before.
 *
 * A mark opts in with `data-tip`; an open one carries `data-open`, which its
 * own styles show the card for.
 */
let bound = false;

export function bindTips(): void {
  if (bound) return;
  bound = true;

  let touch = false;
  const markOf = (target: EventTarget | null): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>('[data-tip]') : null;

  /** Closes every open mark but `keep`; a focused one is let go, so focus
      does not hold its card open. */
  const close = (keep?: HTMLElement | null): void => {
    document.querySelectorAll<HTMLElement>('[data-tip][data-open]').forEach((mark) => {
      if (mark === keep) return;
      mark.removeAttribute('data-open');
      if (mark === document.activeElement) mark.blur();
    });
  };

  document.addEventListener(
    'pointerdown',
    (event) => {
      touch = event.pointerType !== 'mouse';
      if (touch) close(markOf(event.target));
    },
    true,
  );

  // Captured, so it runs before the client router's own click handling, which
  // leaves a click alone once its default is prevented.
  document.addEventListener(
    'click',
    (event) => {
      if (!touch) return;
      const mark = markOf(event.target);
      if (!mark) return;
      event.preventDefault();
      if (mark.hasAttribute('data-open')) {
        mark.removeAttribute('data-open');
        mark.blur();
      } else {
        mark.setAttribute('data-open', '');
      }
    },
    true,
  );

  // Scroll events do not bubble; captured at the window they arrive from the
  // page and from any scroller in it.
  window.addEventListener('scroll', () => close(), { capture: true, passive: true });
}
