/**
 * The GeoNeural terrain map: the reference surface of the first development region in 3D,
 * with height, streams or geology draped on it. The modules are the project's own browser
 * code (src/components/geo-neural/lib, see SOURCE.md there); this island mounts the viewer
 * in its map mode, which loads only the reference, its streams and the geology, and
 * releases everything it holds when it unmounts, which the project overlay triggers on close.
 */
import { useEffect, useRef, useState } from 'react';
import { withBase } from '../../lib/routes';

export default function GeoExplorer() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let map: { dispose(): void } | null = null;
    setState('loading');
    (async () => {
      try {
        const [{ loadBundle }, { mountViewer }] = await Promise.all([
          import('../geo-neural/lib/data/bundle'),
          import('../geo-neural/lib/viewer/index'),
        ]);
        const bundle = await loadBundle(withBase('/geo-neural/bundle/'), { signal: controller.signal });
        if (cancelled || !ref.current) return;
        map = mountViewer(ref.current, { bundle, mode: 'map' });
        setState('ready');
      } catch {
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      map?.dispose();
      map = null;
    };
  }, []);

  return (
    <div className="geo-island">
      {state !== 'ready' && (
        <p className="geo-status" role="status">
          {state === 'failed' ? 'The terrain map could not load here.' : 'Loading the terrain map (about 0.5 MB)…'}
        </p>
      )}
      <div ref={ref} />
    </div>
  );
}
