/* tslint:disable */
/* eslint-disable */

/**
 * Benchmark helper - hash N times and return total microseconds
 */
export function benchmark_hash(data: Uint8Array, iterations: number): number;

/**
 * Benchmark helper - hash_rayon N times and return total microseconds
 */
export function benchmark_hash_rayon(data: Uint8Array, iterations: number): number;

/**
 * Derive key (KDF mode)
 */
export function derive_key(context: string, key_material: Uint8Array, output_len: number): Uint8Array;

/**
 * Get number of rayon threads
 */
export function get_thread_count(): number;

/**
 * Hash data using Blake3 (single-threaded)
 */
export function hash(data: Uint8Array): Uint8Array;

/**
 * Hash data using Blake3 with Rayon parallelism
 * This uses multiple threads for large inputs
 */
export function hash_rayon(data: Uint8Array): Uint8Array;

/**
 * Hash data using Blake3 with Rayon and custom output length
 */
export function hash_rayon_xof(data: Uint8Array, output_len: number): Uint8Array;

/**
 * Hash data using Blake3 with custom output length
 */
export function hash_xof(data: Uint8Array, output_len: number): Uint8Array;

/**
 * Initialize the WASM module
 */
export function init(): void;

export function initThreadPool(num_threads: number): Promise<any>;

/**
 * Keyed hash (MAC mode)
 */
export function keyed_hash(key: Uint8Array, data: Uint8Array): Uint8Array;

export class wbg_rayon_PoolBuilder {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  numThreads(): number;
  build(): void;
  receiver(): number;
}

export function wbg_rayon_start_worker(receiver: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly benchmark_hash: (a: number, b: number, c: number) => number;
  readonly benchmark_hash_rayon: (a: number, b: number, c: number) => number;
  readonly derive_key: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly hash: (a: number, b: number) => [number, number];
  readonly hash_rayon: (a: number, b: number) => [number, number];
  readonly hash_rayon_xof: (a: number, b: number, c: number) => [number, number];
  readonly hash_xof: (a: number, b: number, c: number) => [number, number];
  readonly init: () => void;
  readonly keyed_hash: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly get_thread_count: () => number;
  readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
  readonly wbg_rayon_poolbuilder_build: (a: number) => void;
  readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
  readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
  readonly wbg_rayon_start_worker: (a: number) => void;
  readonly initThreadPool: (a: number) => any;
  readonly memory: WebAssembly.Memory;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
  readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;
