/* tslint:disable */
/* eslint-disable */

/**
 * A decoded product. Heights are float32 metres rounded from the float64 values of the Python decoder; the
 * lattice (1 mm units) is exact.
 */
export class DecodedField {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Heights in metres as float64, identical to the Python decoder's output.
     */
    heightsF64(): Float64Array;
    /**
     * Heights in metres, row-major (a copy).
     */
    heights(): Float32Array;
    /**
     * Hex sha256 of the lattice as little-endian i64.
     */
    latticeSha256(): string;
    /**
     * Lattice integers; throws if one does not fit 32 bits (no terrain product comes near).
     */
    lattice(): Int32Array;
    /**
     * Bound half-width E in lattice units.
     */
    readonly boundUnits: number;
    readonly coder: string;
    readonly cols: number;
    readonly rows: number;
}

/**
 * Decodes a product. `model` is the shared `.gnm` file a corpus product names; omit it otherwise.
 */
export function decode(product: Uint8Array, model?: Uint8Array | null): DecodedField;

/**
 * Header and byte breakdown of any product (foreign ones too) as JSON text, after every container check.
 */
export function describe(product: Uint8Array): string;

/**
 * Hex id of the rANS tables compiled into this decoder.
 */
export function tableId(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_decodedfield_free: (a: number, b: number) => void;
    readonly decode: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly decodedfield_boundUnits: (a: number) => number;
    readonly decodedfield_coder: (a: number) => [number, number];
    readonly decodedfield_cols: (a: number) => number;
    readonly decodedfield_heights: (a: number) => [number, number];
    readonly decodedfield_heightsF64: (a: number) => [number, number];
    readonly decodedfield_lattice: (a: number) => [number, number, number, number];
    readonly decodedfield_latticeSha256: (a: number) => [number, number];
    readonly decodedfield_rows: (a: number) => number;
    readonly describe: (a: number, b: number) => [number, number, number, number];
    readonly tableId: () => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
