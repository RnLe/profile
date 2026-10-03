/**
 * The GeoNeural terrain viewer and its bytes-against-quality chart, linked by one
 * selection. The modules are the project's own browser code (src/components/geo-neural/lib,
 * see SOURCE.md there); this island only mounts them and releases everything they hold
 * when it unmounts, which the project overlay triggers on close.
 */
import { useEffect, useRef, useState } from 'react';
import { withBase } from '../../lib/routes';

type Disposable = { dispose(): void };

export default function GeoExplorer() {
  const viewerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const mounted: Disposable[] = [];
    setState('loading');
    (async () => {
      try {
        const lib = await import('../geo-neural/lib/index');
        const bundle = await lib.loadBundle(withBase('/geo-neural/bundle/'), { signal: controller.signal });
        if (cancelled || !viewerRef.current || !chartRef.current) return;
        const first = bundle.manifest.candidates[0]?.id ?? '';
        const store = lib.createSelectionStore({ candidateId: first, overlay: 'elevation' });
        mounted.push(lib.mountViewer(viewerRef.current, { bundle, store }));
        mounted.push(lib.mountChart(chartRef.current, { bundle, store }));
        setState('ready');
      } catch (error) {
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      for (const module of mounted.splice(0)) module.dispose();
    };
  }, []);

  return (
    <div className="geo-island">
      {state !== 'ready' && (
        <p className="geo-status" role="status">
          {state === 'failed'
            ? 'The terrain viewer could not load here. The figures below show the same results.'
            : 'Loading the terrain viewer (about 1.5 MB of terrain data)…'}
        </p>
      )}
      <div ref={viewerRef} />
      <div ref={chartRef} />
    </div>
  );
}
