// The seven networks in the browser, one Web Worker each, so they load and run side by
// side. Everything stays on the page: the workers fetch model files from this site and
// return probabilities; no image ever goes over the network.

import type { FromWorker, ModelEntry, ToWorker } from './protocol';

export interface Progress {
  loadedBytes: number;
  totalBytes: number;
  ready: string[];
}

export type ResultHandler = (name: string, probs: number[], ms: number) => void;

export function softmax(logits: ArrayLike<number>): number[] {
  const max = Math.max(...Array.from(logits));
  const exp = Array.from(logits, (v) => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((v) => v / sum);
}

export class Engine {
  private workers = new Map<string, Worker>();
  private loaded = new Set<string>();
  private loadedBytes = 0;
  private nextId = 1;
  private latest = 0;
  private handlers = new Map<number, ResultHandler>();
  /** Faces sent to a single network (the live camera), answered whatever came after. */
  private single = new Map<number, ResultHandler>();

  constructor(
    private base: string,
    private wasmUrl: string,
    private models: ModelEntry[],
    private onProgress: (progress: Progress) => void,
    private onError: (name: string, message: string) => void,
  ) {}

  get totalBytes(): number {
    return this.models.reduce((sum, m) => sum + m.bytes, 0);
  }

  get started(): boolean {
    return this.workers.size > 0;
  }

  /** Starts every worker (smallest model first); progress arrives part by part. */
  start(): void {
    if (this.started) return;
    for (const model of this.models) {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<FromWorker>) => this.receive(event.data);
      const msg: ToWorker = { type: 'load', wasmUrl: this.wasmUrl, base: this.base, model };
      worker.postMessage(msg);
      this.workers.set(model.name, worker);
    }
  }

  private receive(msg: FromWorker): void {
    if (msg.type === 'progress') {
      this.loadedBytes += msg.bytes;
      this.report();
    } else if (msg.type === 'loaded') {
      this.loaded.add(msg.name);
      this.report();
    } else if (msg.type === 'result') {
      const one = this.single.get(msg.id);
      if (one) {
        this.single.delete(msg.id);
        one(msg.name, softmax(msg.logits), msg.ms);
      } else if (msg.id === this.latest) this.handlers.get(msg.id)?.(msg.name, softmax(msg.logits), msg.ms);
    } else {
      this.onError(msg.name, msg.message);
    }
  }

  private report(): void {
    this.onProgress({ loadedBytes: this.loadedBytes, totalBytes: this.totalBytes, ready: [...this.loaded] });
  }

  /** Sends one 48x48 face to every network; results for older faces are dropped. */
  predict(pixels: Uint8Array, onResult: ResultHandler): void {
    this.start();
    const id = this.nextId++;
    this.handlers.delete(this.latest);
    this.latest = id;
    this.handlers.set(id, onResult);
    for (const worker of this.workers.values()) {
      const msg: ToWorker = { type: 'predict', id, pixels };
      worker.postMessage(msg);
    }
  }

  /**
   * Sends one face to one network; its result always comes back. The live camera keeps
   * each network busy this way, every one at its own pace.
   */
  predictOne(name: string, pixels: Uint8Array, onResult: ResultHandler): void {
    this.start();
    const worker = this.workers.get(name);
    if (!worker) return;
    const id = this.nextId++;
    this.single.set(id, onResult);
    const msg: ToWorker = { type: 'predict', id, pixels };
    worker.postMessage(msg);
  }

  dispose(): void {
    for (const worker of this.workers.values()) worker.terminate();
    this.workers.clear();
    this.handlers.clear();
    this.single.clear();
  }
}
