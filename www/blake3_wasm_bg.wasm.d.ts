/* tslint:disable */
/* eslint-disable */
export const benchmark_hash: (a: number, b: number, c: number) => number;
export const benchmark_hash_rayon: (a: number, b: number, c: number) => number;
export const derive_key: (a: number, b: number, c: number, d: number, e: number) => [number, number];
export const hash: (a: number, b: number) => [number, number];
export const hash_rayon: (a: number, b: number) => [number, number];
export const hash_rayon_xof: (a: number, b: number, c: number) => [number, number];
export const hash_xof: (a: number, b: number, c: number) => [number, number];
export const init: () => void;
export const keyed_hash: (a: number, b: number, c: number, d: number) => [number, number, number, number];
export const get_thread_count: () => number;
export const __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
export const wbg_rayon_poolbuilder_build: (a: number) => void;
export const wbg_rayon_poolbuilder_numThreads: (a: number) => number;
export const wbg_rayon_poolbuilder_receiver: (a: number) => number;
export const wbg_rayon_start_worker: (a: number) => void;
export const initThreadPool: (a: number) => any;
export const memory: WebAssembly.Memory;
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
export const __wbindgen_start: (a: number) => void;
