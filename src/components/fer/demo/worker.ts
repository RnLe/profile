// Owns one network: fetches its model file in parts from this site, builds it with the
// study's Rust engine compiled to WebAssembly, and returns seven logits per face. Faces
// sent before the network is ready wait for it.

import init, { Network } from './wasm/fer_wasm.js';
import type { FromWorker, ToWorker } from './protocol';

interface WorkerScope {
  postMessage(message: FromWorker, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<ToWorker>) => void) | null;
}
const scope = self as unknown as WorkerScope;

let name = '';
let network: Promise<Network> | null = null;

async function load(msg: Extract<ToWorker, { type: 'load' }>): Promise<Network> {
  name = msg.model.name;
  await init({ module_or_path: msg.wasmUrl });
  const bytes = new Uint8Array(msg.model.bytes);
  let at = 0;
  for (const part of msg.model.parts) {
    const response = await fetch(new URL(part, msg.base));
    if (!response.ok) throw new Error(`${part}: HTTP ${response.status}`);
    const chunk = new Uint8Array(await response.arrayBuffer());
    bytes.set(chunk, at);
    at += chunk.byteLength;
    scope.postMessage({ type: 'progress', name, bytes: chunk.byteLength });
  }
  if (at !== bytes.byteLength) throw new Error(`${name}: expected ${bytes.byteLength} bytes, got ${at}`);
  const net = new Network(bytes);
  scope.postMessage({ type: 'loaded', name });
  return net;
}

scope.onmessage = async (event) => {
  const msg = event.data;
  if (msg.type === 'load') {
    network ??= load(msg);
    network.catch((err: unknown) => {
      scope.postMessage({ type: 'error', name: msg.model.name, message: err instanceof Error ? err.message : String(err) });
    });
    return;
  }
  if (!network) return;
  try {
    const net = await network;
    const started = performance.now();
    const logits = net.predict(msg.pixels);
    scope.postMessage({ type: 'result', id: msg.id, name, logits, ms: performance.now() - started }, [logits.buffer]);
  } catch (err) {
    scope.postMessage({ type: 'error', name, message: err instanceof Error ? err.message : String(err) });
  }
};
