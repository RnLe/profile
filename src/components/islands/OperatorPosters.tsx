/**
 * The two operator cards of the Blaze2D thesis page
 * (web/components/thesis-page/ImageViewer.tsx), in this site's palette: one
 * card per polarization, each opening the full annotated effective
 * Hamiltonian in a native dialog, with zoom, a fit control, and a link to
 * the original SVG. Without JavaScript the cards are links to the SVGs.
 */
import { useEffect, useId, useRef, useState } from 'react';

export interface Poster {
  polarization: 'TE' | 'TM';
  field: string;
  src: string;
  title: string;
  alt: string;
  caption: string;
}

function PosterCard({ poster }: { poster: Poster }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  // A React id made valid for HTML: it has to start with a letter.
  const id = `poster-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <a
        className="poster-card"
        href={poster.src}
        target="_blank"
        rel="noopener"
        aria-haspopup="dialog"
        onClick={(event) => {
          event.preventDefault();
          setZoom(1);
          setOpen(true);
        }}
      >
        <span className="poster-polarization">{poster.polarization}</span>
        <span className="poster-text">
          <strong>Full {poster.polarization} Hamiltonian</strong>
          <small>{poster.field}</small>
          <span className="poster-action">Explore the annotated equation</span>
        </span>
      </a>
      <dialog
        ref={dialog}
        className="poster-dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-caption`}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const outside =
            event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
          if (outside) setOpen(false);
        }}
      >
        {open && (
          <>
            <div className="poster-dialog-header">
              <div>
                <span className="poster-kicker">Second edition · full operator</span>
                <h2 id={`${id}-title`}>{poster.title}</h2>
              </div>
              <button type="button" className="poster-button" onClick={() => setOpen(false)} aria-label="Close" autoFocus>
                ×
              </button>
            </div>
            <div className="poster-dialog-toolbar">
              <div className="poster-zoom">
                <button
                  type="button"
                  className="poster-button"
                  aria-label="Zoom out"
                  disabled={zoom === 1}
                  onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                >
                  −
                </button>
                <output aria-live="polite">{zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}</output>
                <button
                  type="button"
                  className="poster-button"
                  aria-label="Zoom in"
                  disabled={zoom === 4}
                  onClick={() => setZoom(Math.min(4, zoom + 0.5))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="poster-fit"
                  onClick={() => {
                    setZoom(1);
                    viewport.current?.scrollTo(0, 0);
                  }}
                >
                  Fit to view
                </button>
              </div>
              <a href={poster.src} target="_blank" rel="noopener">
                Open the SVG
              </a>
            </div>
            <div
              ref={viewport}
              className={`poster-viewport${zoom > 1 ? ' is-zoomed' : ''}`}
              tabIndex={0}
              role="region"
              aria-label="The equation; scroll to explore when zoomed"
            >
              <img src={poster.src} alt={poster.alt} style={zoom > 1 ? { width: `${zoom * 100}%` } : undefined} />
            </div>
            <p id={`${id}-caption`} className="poster-caption">
              {poster.caption}
            </p>
          </>
        )}
      </dialog>
    </>
  );
}

export default function OperatorPosters({ posters }: { posters: Poster[] }) {
  return (
    <div className="operator-posters">
      {posters.map((poster) => (
        <PosterCard key={poster.polarization} poster={poster} />
      ))}
    </div>
  );
}
