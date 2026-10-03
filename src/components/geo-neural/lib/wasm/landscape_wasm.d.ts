/* tslint:disable */
/* eslint-disable */

/** Returned by `Scenario.step` and `Scenario.diagnostics`. Volumes in m^3, cumulative since reset. */
export interface Diagnostics {
    timeYears: number;
    advancedYears: number;
    stepsDone: number;
    substeps: number;
    maxSubstepYears: number;
    stableDtYears: number;
    integralM3: number;
    initialIntegralM3: number;
    /** Material that entered through the boundary; negative when it left. */
    boundaryExchangeM3: number;
    sourcesM3: number;
    /** integral - initialIntegral - boundaryExchange - sources. */
    residualM3: number;
    residualRelative: number;
    maxSlope: number;
    minHeightM: number;
    maxHeightM: number;
    limitedFaces: number;
    rejections: number;
    rejected: boolean;
    truncated: boolean;
    message: string;
}



/**
 * A surface evolving under one model.
 */
export class Scenario {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The same object as `step` returns, for the current state, without stepping.
     */
    diagnostics(): Diagnostics;
    /**
     * - `side`, `spacing_m`: a `side * side` grid of cells, metres.
     * - `initial`: `side * side` heights in metres, row-major, row 0 north.
     * - `model`: `"linear"`, `"nonlinear"`, `"flux"`, `"kfield"` or `"penalty"`.
     * - `boundary`: `"closed"`, `"fixed"` or `"periodic"` (learned models: closed or fixed).
     * - `params_json`: `diffusivity` (m^2/yr, default 0.05) for linear and
     *   nonlinear; `criticalSlope` (default 0.6) for nonlinear; `uplift`
     *   (m/yr, default 0), `safety` (default 0.9) and `maxSubsteps` (default
     *   512, or 4 for learned models) for all. Other keys are refused.
     * - `weights`, `weights_meta_json`: for the learned models, the arm's
     *   float32 weights and the full `closure.json` text.
     * - `diffusivity`: optional per-cell diffusivity for `"linear"`, m^2/yr.
     */
    constructor(side: number, spacing_m: number, initial: Float64Array, model: string, boundary: string, params_json: string, weights?: Float32Array | null, weights_meta_json?: string | null, diffusivity?: Float64Array | null);
    /**
     * Replaces the surface and clears time and the ledger.
     */
    reset(initial: Float64Array): void;
    /**
     * Advances `steps` steps of `dt_years`, splitting each into stable
     * substeps, and returns a plain object:
     *
     * `timeYears, advancedYears, stepsDone, substeps, maxSubstepYears,
     * stableDtYears, integralM3, initialIntegralM3, boundaryExchangeM3,
     * sourcesM3, residualM3, residualRelative, maxSlope, minHeightM,
     * maxHeightM, limitedFaces, rejections, rejected, truncated, message`.
     *
     * A call stops after `maxSubsteps` substeps (`truncated`, check
     * `advancedYears`) or before a state the model refuses (`rejected`, with
     * `message`).
     */
    step(steps: number, dt_years: number): Diagnostics;
    /**
     * A Float32Array copy of the current heights.
     */
    surface(): Float32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_scenario_free: (a: number, b: number) => void;
    readonly scenario_diagnostics: (a: number) => any;
    readonly scenario_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number) => [number, number, number];
    readonly scenario_reset: (a: number, b: number, c: number) => [number, number];
    readonly scenario_step: (a: number, b: number, c: number) => any;
    readonly scenario_surface: (a: number) => [number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
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
