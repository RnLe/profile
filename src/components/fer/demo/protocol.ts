// Messages between the demo and its workers. Each worker owns one network: it fetches the
// network's file in parts, builds it in WebAssembly, and answers every face it is sent.

export interface ModelEntry {
  name: string;
  bytes: number;
  /** Parts of the model file, relative to the demo's folder, in order. */
  parts: string[];
}

export type ToWorker =
  | { type: 'load'; wasmUrl: string; base: string; model: ModelEntry }
  | { type: 'predict'; id: number; pixels: Uint8Array };

export type FromWorker =
  | { type: 'progress'; name: string; bytes: number }
  | { type: 'loaded'; name: string }
  | { type: 'result'; id: number; name: string; logits: Float32Array; ms: number }
  | { type: 'error'; name: string; message: string };
