/**
 * The GeoNeural landscape lab: hillslope experiments run in a Web Worker by the project's
 * Rust kernel compiled to WebAssembly. Runs start only on an explicit Run; unmounting
 * terminates the worker and frees the kernel's memory.
 */
import { useEffect, useRef, useState } from 'react';
import { withBase } from '../../lib/routes';
import wasmUrl from '../geo-neural/lib/wasm/landscape_wasm_bg.wasm?url';

export default function GeoLab() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let lab: { dispose(): void } | null = null;
    setState('loading');
    (async () => {
      try {
        const lib = await import('../geo-neural/lib/index');
        const bundle = await lib.loadBundle(withBase('/geo-neural/bundle/'), { signal: controller.signal });
        if (cancelled || !ref.current) return;
        lab = lib.mountLab(ref.current, { bundle, wasmUrl });
        setState('ready');
      } catch (error) {
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      lab?.dispose();
      lab = null;
    };
  }, []);

  return (
    <div className="geo-island">
      {state !== 'ready' && (
        <p className="geo-status" role="status">
          {state === 'failed' ? 'The lab needs WebAssembly and Web Workers, which this browser did not provide.' : 'Loading the lab…'}
        </p>
      )}
      <div ref={ref} />
    </div>
  );
}
