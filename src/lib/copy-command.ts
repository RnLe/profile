/**
 * Copies a command to the clipboard when its button (`button[data-copy]`) is
 * clicked, and confirms it for a moment: the button shows a check, and the
 * status line after it tells a screen reader. Delegated from the document,
 * so it also serves a case study shown in the landing page's overlay.
 */
type CopyWindow = Window & { __copyCommandBound?: boolean };
const w = window as CopyWindow;

if (!w.__copyCommandBound) {
  w.__copyCommandBound = true;
  document.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-copy]');
    if (!button) return;
    const status = button.nextElementSibling?.matches('[data-copy-status]')
      ? (button.nextElementSibling as HTMLElement)
      : undefined;
    navigator.clipboard
      .writeText(button.dataset.copy ?? '')
      .then(() => {
        button.classList.add('copied');
        if (status) status.textContent = 'Copied to the clipboard';
        window.setTimeout(() => {
          button.classList.remove('copied');
          if (status) status.textContent = '';
        }, 1600);
      })
      .catch(() => undefined);
  });
}
