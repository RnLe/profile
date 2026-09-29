/**
 * Plays a figure's CSS animation whenever it comes into view, and resets it
 * once it has left the view entirely, so it plays again on the way back. The
 * finished figure is the markup's own state: arming it (class `armed`) sets
 * the start of the animation, and `play` runs it. Nothing is armed under
 * reduced motion, or without JavaScript, so the figure simply stays finished.
 */
const init = (): void => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const figures = document.querySelectorAll<HTMLElement>('[data-animate]:not(.armed)');
  if (figures.length === 0) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= 0.35) entry.target.classList.add('play');
        else if (!entry.isIntersecting) entry.target.classList.remove('play');
      }
    },
    { threshold: [0, 0.35] },
  );
  figures.forEach((figure) => {
    figure.classList.add('armed');
    observer.observe(figure);
  });
};

document.addEventListener('astro:page-load', init);
