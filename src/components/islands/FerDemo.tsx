/**
 * The study's seven networks reading one face. Left: a FER2013 test face (drawn at random
 * from a pack of 135, 20 per emotion), a photo of your own, or a camera snapshot, shown
 * as the networks see it (48x48, grayscale); or the camera in real time, every network
 * taking the newest frame as soon as it is free. Right: each emotion with one bar per network.
 *
 * The bars of the pack's faces are precomputed, so the figure is complete before anything
 * loads (and without JavaScript). The first click on any control starts the networks in the
 * browser: one Web Worker each, running the study's Rust engine compiled to WebAssembly,
 * about 40 MB of int8 weights fetched from this site. From then on every face is computed
 * here; photos and camera frames never leave the page.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { MODEL_COLORS, MODEL_NAMES } from '../fer/plot';
import { withBase } from '../../lib/routes';
import { Engine, type Progress } from '../fer/demo/engine';
import type { ModelEntry } from '../fer/demo/protocol';
import { centreCrop, clampCrop, faceUrl, facePixels, type Crop } from '../fer/demo/image';
import type { DemoFace, DemoSamples } from '../fer/demo/types';
import wasmUrl from '../fer/demo/wasm/fer_wasm_bg.wasm?url';

interface Props {
  face: DemoFace;
  classes: string[];
  models: string[];
}

type Mode = 'sample' | 'photo' | 'camera';

interface Photo {
  source: ImageBitmap;
  crop: Crop;
  zoom: number;
}

const MB = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;
const fps = (rate: number) => (rate < 1 ? rate.toFixed(1) : String(Math.round(rate)));
const argmax = (v: number[]) => v.reduce((best, x, i) => (x > v[best] ? i : best), 0);
/** The camera's guide: the middle 70% of the square the video fills. */
const GUIDE = 0.7;

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="fer-demo-icon">
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 14.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4.5" />
  </svg>
);

const LiveIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="fer-demo-icon fer-demo-live-icon">
    <circle cx="12" cy="12" r="4.5" className="is-dot" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="fer-demo-icon">
    <path d="M3.5 8.5a2 2 0 0 1 2-2h2.3l1.5-2.2h5.4l1.5 2.2h2.3a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="3.6" />
  </svg>
);

export default function FerDemo({ face: first, classes, models }: Props) {
  const [face, setFace] = useState<DemoFace>(first);
  const [mode, setMode] = useState<Mode>('sample');
  const [live, setLive] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Progress | null>(null);
  const [timing, setTiming] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  // the camera in real time, and how many frames each network reads per second (slowest, fastest)
  const [streaming, setStreaming] = useState(false);
  const [rate, setRate] = useState<[number, number] | null>(null);
  const session = useRef<{ stop: boolean; waiting: (() => void)[] } | null>(null);
  const samples = useRef<{ meta: DemoSamples; pixels: Uint8Array } | null>(null);
  const entries = useRef<Promise<ModelEntry[]> | null>(null);
  const engine = useRef<Engine | null>(null);
  const current = useRef<number>(-1);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const pending = useRef<number>(0);
  const base = useRef('');
  // set by the first use of a control: from then on the pack arriving changes nothing on screen
  const used = useRef(false);

  // the pack (faces and precomputed bars) and the model list, then a face at random
  useEffect(() => {
    const controller = new AbortController();
    base.current = new URL(withBase('/fer/demo/'), document.baseURI).href;
    entries.current = fetch(base.current + 'models.json', { signal: controller.signal })
      .then((r) => r.json() as Promise<{ models: ModelEntry[] }>)
      .then((list) => list.models);
    entries.current.catch(() => {});
    (async () => {
      try {
        const [meta, pixels] = await Promise.all([
          fetch(base.current + 'samples.json', { signal: controller.signal }).then((r) => r.json() as Promise<DemoSamples>),
          fetch(base.current + 'samples.u8', { signal: controller.signal }).then((r) => r.arrayBuffer()),
        ]);
        samples.current = { meta, pixels: new Uint8Array(pixels) };
        if (!used.current) showSample(randomSample());
      } catch {
        /* the first face stays; the controls report the problem when used */
      }
    })();
    return () => {
      controller.abort();
      engine.current?.dispose();
      stopCamera();
    };
  }, []);

  const randomSample = () => {
    const n = samples.current!.meta.count;
    let k = Math.floor(Math.random() * n);
    if (k === current.current) k = (k + 1) % n;
    return k;
  };

  // the engine, started on the first use; it waits for the model list if that is still on its way
  const getEngine = async (): Promise<Engine | null> => {
    if (engine.current) return engine.current;
    if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') {
      setMessage('This browser cannot run the networks here; the bars shown are precomputed.');
      return null;
    }
    let list: ModelEntry[];
    try {
      list = await entries.current!;
    } catch {
      setMessage('The networks could not be loaded from this site just now.');
      return null;
    }
    engine.current ??= new Engine(base.current, wasmUrl, list, setProgress, (name, error) => {
      setMessage(`${MODEL_NAMES[name] ?? name} could not run here (${error}).`);
    });
    engine.current.start();
    return engine.current;
  };

  const run = useCallback(async (pixels: Uint8Array) => {
    const eng = await getEngine();
    if (!eng) return;
    const started = performance.now();
    const seen = new Set<string>();
    setLive(new Set());
    setTiming(null);
    eng.predict(pixels, (name, probs) => {
      seen.add(name);
      setFace((f) => ({ ...f, probs: f.probs.map((p, i) => (models[i] === name ? probs : p)) }));
      setLive((s) => new Set(s).add(name));
      if (seen.size === models.length) setTiming(performance.now() - started);
    });
  }, []);

  /** A face from the pack with its precomputed bars; returns its pixels. */
  const showSample = (k: number): Uint8Array | null => {
    const s = samples.current;
    if (!s) return null;
    current.current = k;
    const n = s.meta.size * s.meta.size;
    const pixels = s.pixels.slice(k * n, (k + 1) * n);
    setFace({
      src: faceUrl(pixels),
      label: s.meta.label[k],
      votes: s.meta.votes[k],
      probs: s.meta.probs[k].map((row) => row.map((v) => v / 1000)),
    });
    setLive(new Set());
    setTiming(null);
    return pixels;
  };

  const next = () => {
    used.current = true;
    stopCamera();
    setMode('sample');
    setPhoto(null);
    setMessage(null);
    const pixels = samples.current ? showSample(randomSample()) : null;
    if (pixels) void run(pixels);
    else void getEngine();
  };

  // a photo of your own: cropped to a square you can move and zoom
  const showPhoto = (p: Photo, predict: boolean) => {
    const pixels = facePixels(p.source, p.crop);
    setFace((f) => ({ src: faceUrl(pixels), label: null, votes: 0, probs: predict ? models.map(() => null) : f.probs }));
    if (predict) void run(pixels);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    used.current = true;
    stopCamera();
    setMessage(null);
    try {
      const source = await createImageBitmap(file);
      const p: Photo = { source, crop: centreCrop(source.width, source.height), zoom: 1 };
      setPhoto(p);
      setMode('photo');
      showPhoto(p, true);
    } catch {
      setMessage('That file could not be read as an image.');
    }
  };

  const reframe = (p: Photo) => {
    setPhoto(p);
    showPhoto(p, false);
    window.clearTimeout(pending.current);
    pending.current = window.setTimeout(() => showPhoto(p, true), 180);
  };

  const zoomTo = (zoom: number) => {
    if (!photo) return;
    const w = photo.source.width;
    const h = photo.source.height;
    reframe({ ...photo, zoom, crop: clampCrop({ ...photo.crop, side: Math.min(w, h) / zoom }, w, h) });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'photo') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || !photo) return;
    const scale = photo.crop.side / e.currentTarget.clientWidth;
    const crop = { ...photo.crop, cx: photo.crop.cx - (e.clientX - drag.current.x) * scale, cy: photo.crop.cy - (e.clientY - drag.current.y) * scale };
    drag.current = { x: e.clientX, y: e.clientY };
    reframe({ ...photo, crop: clampCrop(crop, photo.source.width, photo.source.height) });
  };

  // the camera: a live view with a square to put the face in, then one snapshot
  const startCamera = async () => {
    used.current = true;
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('This browser gives no camera access here.');
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      stream.current = s;
      setPhoto(null);
      setMode('camera');
      void getEngine();
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
      });
    } catch {
      setMessage('No camera, or access to it was declined.');
    }
  };

  function stopCamera() {
    stopLive();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }

  /** The face in the camera's guide, mirrored as on screen, 48x48 gray. */
  const framePixels = (v: HTMLVideoElement) => {
    const side = Math.min(v.videoWidth, v.videoHeight) * GUIDE;
    return facePixels(v, { cx: v.videoWidth / 2, cy: v.videoHeight / 2, side }, true);
  };

  // real-time: each network takes the newest frame as soon as it is free, at most once per
  // frame, so the fast ones read every frame and the slow ones every few; the bars are
  // redrawn at most once per screen refresh
  const startLive = async () => {
    const eng = await getEngine();
    const v = video.current;
    if (!eng || !v || session.current) return;
    const run = { stop: false, waiting: [] as (() => void)[] };
    session.current = run;
    setStreaming(true);
    setRate(null);
    setTiming(null);
    const probs: (number[] | null)[] = models.map(() => null);
    setFace((f) => ({ ...f, label: null, votes: 0, probs: [...probs] }));

    let frame = 0;
    const clock = () => {
      if (run.stop) return;
      frame++;
      run.waiting.splice(0).forEach((wake) => wake());
      if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(clock);
      else requestAnimationFrame(clock);
    };
    clock();
    let grabbed: { frame: number; pixels: Uint8Array } = { frame: -1, pixels: new Uint8Array(0) };
    const grab = () => {
      if (grabbed.frame !== frame) grabbed = { frame, pixels: framePixels(v) };
      return grabbed;
    };

    let drawing = false;
    // each network's last ten results, for its rate
    const times: number[][] = models.map(() => []);
    const draw = () => {
      drawing = false;
      if (!run.stop) setFace((f) => ({ ...f, probs: [...probs] }));
    };
    const loop = async (name: string, i: number) => {
      let seen = -1;
      while (!run.stop) {
        if (frame === seen || !v.videoWidth) {
          await new Promise<void>((wake) => run.waiting.push(wake));
          continue;
        }
        const { frame: at, pixels } = grab();
        seen = at;
        probs[i] = await new Promise<number[]>((done) => eng.predictOne(name, pixels, (_, p) => done(p)));
        times[i].push(performance.now());
        if (times[i].length > 10) times[i].shift();
        if (!drawing && !run.stop) {
          drawing = true;
          requestAnimationFrame(draw);
        }
      }
    };
    models.forEach((name, i) => void loop(name, i));
    const measure = () => {
      if (run.stop) return;
      if (times.every((t) => t.length >= 2)) {
        const rates = times.map((t) => ((t.length - 1) * 1000) / (t[t.length - 1] - t[0]));
        setRate([Math.min(...rates), Math.max(...rates)]);
      }
      window.setTimeout(measure, 1000);
    };
    window.setTimeout(measure, 1000);
  };

  function stopLive() {
    const run = session.current;
    if (!run) return;
    run.stop = true;
    run.waiting.splice(0).forEach((wake) => wake());
    session.current = null;
    setStreaming(false);
    setRate(null);
  }

  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const pixels = framePixels(v);
    stopCamera();
    setMode('photo');
    setPhoto(null);
    setFace({ src: faceUrl(pixels), label: null, votes: 0, probs: models.map(() => null) });
    void run(pixels);
  };

  const loading = progress && progress.ready.length < models.length;
  // one line under the controls: what the networks are doing (a problem may take two)
  const status = message
    ? message
    : !engine.current
      ? null
      : loading
        ? `Loading the networks: ${MB(progress.loadedBytes)} of ${MB(progress.totalBytes)}`
        : streaming
          ? rate
            ? `Real-time in your browser: ${fps(rate[0]) === fps(rate[1]) ? fps(rate[0]) : `${fps(rate[0])} to ${fps(rate[1])}`} frames/s`
            : 'Starting real-time…'
          : timing !== null
            ? `Computed in your browser in ${(timing / 1000).toFixed(2)} s`
            : live.size > 0
              ? 'Computing in your browser…'
              : null;

  // a line above the face and one below it
  const draggable = mode === 'photo' && photo !== null;
  const title = mode === 'camera' ? (streaming ? 'Keep your face in the square' : 'Put your face in the square') : face.label === null ? (draggable ? 'Your photo: drag to move it' : 'Your photo') : 'A FER2013 test face';
  const caption =
    mode === 'camera' ? (
      streaming ? 'the bars follow it live.' : 'then take the photo.'
    ) : face.label === null ? (
      'as the networks see it.'
    ) : (
      <>
        {face.votes} of 10 annotators said <span className="fer-demo-emotion">{classes[face.label]}</span>.
      </>
    );

  return (
    <div className="fer-demo">
      <div className="fer-demo-left">
        <p className="fer-demo-title">{title}</p>
        <div
          className={`fer-demo-face${draggable ? ' is-draggable' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {mode === 'camera' ? (
            <>
              <video ref={video} muted playsInline aria-label="Camera view" />
              <span className="fer-demo-guide" aria-hidden="true" />
            </>
          ) : (
            <img src={face.src} width={48} height={48} alt={face.label === null ? 'Your photo, 48 by 48 pixels, grayscale' : `A face labeled ${classes[face.label]}, 48 by 48 pixels`} />
          )}
        </div>
        {draggable && photo ? (
          <label className="fer-demo-zoom">
            <span>Zoom</span>
            <input type="range" min={1} max={4} step={0.05} value={photo.zoom} onChange={(e) => zoomTo(Number(e.target.value))} />
          </label>
        ) : (
          <p className="fer-demo-caption">{caption}</p>
        )}
        <div className="fer-demo-controls">
          {mode === 'camera' ? (
            <>
              <button type="button" className="is-primary" onClick={snap}>Take photo</button>
              <button type="button" className={streaming ? 'is-live' : undefined} aria-pressed={streaming} onClick={() => (streaming ? stopLive() : void startLive())}>
                <LiveIcon />
                Real-time
              </button>
              <button type="button" onClick={next}>Cancel</button>
            </>
          ) : (
            <>
              <button type="button" className="is-primary" onClick={next}>Next face</button>
              <button type="button" onClick={() => fileInput.current?.click()}>
                <UploadIcon />
                Upload
              </button>
              <button type="button" onClick={startCamera}>
                <CameraIcon />
                Camera
              </button>
            </>
          )}
          <input ref={fileInput} className="fer-demo-file" type="file" accept="image/*" aria-label="A photo with a face" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {/* not read out every second while the camera runs in real-time */}
        <p className={`fer-demo-status${message ? ' is-message' : ''}`} role="status" aria-live={streaming ? 'off' : undefined}>{status}</p>
        <p className="fer-demo-privacy" tabIndex={0} aria-describedby="fer-demo-privacy-tip">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="fer-demo-incognito">
            <path d="M2.5 10.6h19" />
            <path d="M5.6 10.6 7.4 4.9c.2-.6.8-.9 1.4-.7l3.2 1 3.2-1c.6-.2 1.2.1 1.4.7l1.8 5.7z" className="is-fill" />
            <circle cx="7.6" cy="16" r="3" />
            <circle cx="16.4" cy="16" r="3" />
            <path d="M10.6 15.6c.9-.6 1.9-.6 2.8 0" />
          </svg>
          <span>Runs on your device; nothing is uploaded.</span>
          <span className="fer-demo-tip" role="tooltip" id="fer-demo-privacy-tip">
            <strong className="fer-demo-tip-title">Privacy note</strong>
            Your photos and camera pictures stay on your device. “Upload” only opens a photo in this page: the networks run here in your browser, and nothing is sent anywhere. The website’s code is public, so anyone can <a href="https://github.com/RnLe/profile" rel="noopener">check this</a>.
          </span>
        </p>
      </div>
      <Chart classes={classes} models={models} probs={face.probs} label={face.label} highlight={highlight}>
        <ul className="fer-demo-legend">
          {models.map((m) => (
            <li key={m}>
              <button
                type="button"
                aria-pressed={highlight === m}
                onMouseEnter={() => setHighlight(m)}
                onMouseLeave={() => setHighlight(null)}
                onFocus={() => setHighlight(m)}
                onBlur={() => setHighlight(null)}
              >
                <span className="swatch" style={{ background: MODEL_COLORS[m] }} />
                {MODEL_NAMES[m] ?? m}
              </button>
            </li>
          ))}
        </ul>
      </Chart>
    </div>
  );
}

interface ChartProps {
  classes: string[];
  models: string[];
  probs: (number[] | null)[];
  label: number | null;
  highlight: string | null;
  children: ReactNode;
}

function Chart({ classes, models, probs, label, highlight, children }: ChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 720, h: 420 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { w, h } = size;
  const narrow = w < 520;
  const m = { top: 18, right: 6, bottom: narrow ? 46 : 40, left: 40 };
  const pw = w - m.left - m.right;
  const ph = h - m.top - m.bottom;
  const group = pw / classes.length;
  const pad = group * (narrow ? 0.1 : 0.16);
  const bar = (group - 2 * pad) / models.length;
  const y = (p: number) => m.top + ph * (1 - p);
  const aria = probs
    .map((p, i) => (p ? `${MODEL_NAMES[models[i]] ?? models[i]}: ${classes[argmax(p)]} ${Math.round(Math.max(...p) * 100)}%` : null))
    .filter(Boolean)
    .join('; ');

  return (
    <div className="fer-demo-right">
      <div className="fer-demo-chart" ref={box}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Probability of each emotion per network. ${aria}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t} className="grid">
              <line x1={m.left} x2={w - m.right} y1={y(t)} y2={y(t)} />
              <text x={m.left - 6} y={y(t) + 3.5} textAnchor="end">{`${t * 100}%`}</text>
            </g>
          ))}
          {classes.map((c, k) => (
            <g key={c}>
              {models.map((name, i) => {
                const p = probs[i]?.[k] ?? 0;
                const x = m.left + k * group + pad + i * bar;
                const dim = highlight !== null && highlight !== name;
                return (
                  <rect
                    key={name}
                    className="bar"
                    x={x + 0.5}
                    y={m.top}
                    width={Math.max(1, bar - 1)}
                    height={ph}
                    fill={MODEL_COLORS[name]}
                    opacity={probs[i] === null ? 0 : dim ? 0.18 : 1}
                    style={{ transform: `scaleY(${Math.max(p, 0.002)})` }}
                  >
                    <title>{`${MODEL_NAMES[name] ?? name}, ${c}: ${(p * 100).toFixed(1)}%`}</title>
                  </rect>
                );
              })}
              {/* on a narrow chart the names alternate between two rows, so none overlap */}
              <text
                className={`label${k === label ? ' is-label' : ''}${narrow ? ' is-narrow' : ''}`}
                x={m.left + (k + 0.5) * group}
                y={h - m.bottom + (narrow && k % 2 === 1 ? 32 : 17)}
                textAnchor="middle"
              >
                {c}
              </text>
              {k === label && !narrow && (
                <text className="label-note" x={m.left + (k + 0.5) * group} y={h - m.bottom + 33} textAnchor="middle">
                  annotators
                </text>
              )}
            </g>
          ))}
          <line className="axis" x1={m.left} x2={w - m.right} y1={y(0)} y2={y(0)} />
        </svg>
      </div>
      {children}
    </div>
  );
}
