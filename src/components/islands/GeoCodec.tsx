/**
 * The GeoNeural compression microscope: one region at one bound, SZ3, the fixed predictor and
 * the neural predictor side by side (file sizes, error maps, stream maps), and the neural file
 * decoded again in a Web Worker by the project's Rust decoder compiled to WebAssembly.
 * Unmounting terminates the worker.
 */
import { useEffect, useRef, useState } from 'react';
import { withBase } from '../../lib/routes';
import wasmUrl from '../geo-neural/lib/wasm/gnc_wasm_bg.wasm?url';

export default function GeoCodec() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let view: { dispose(): void } | null = null;
    setState('loading');
    (async () => {
      try {
        const lib = await import('../geo-neural/lib/codec/index');
        const bundle = await lib.loadCodecBundle(new URL(withBase('/geo-neural/codec/'), document.baseURI).href, controller.signal);
        if (cancelled || !ref.current) return;
        view = lib.mountMicroscope(ref.current, { bundle, wasmUrl });
        setState('ready');
      } catch {
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      view?.dispose();
      view = null;
    };
  }, []);

  return (
    <div className="geo-island">
      {state !== 'ready' && (
        <p className="geo-status" role="status">
          {state === 'failed'
            ? 'The compression microscope could not load here.'
            : 'Loading the compression microscope (about 1.5 MB)…'}
        </p>
      )}
      <div ref={ref} />
    </div>
  );
}
