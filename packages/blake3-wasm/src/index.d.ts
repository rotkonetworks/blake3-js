/**
 * Initialize the WASM module
 * @param threads - Number of threads (default: navigator.hardwareConcurrency)
 */
export function init(threads?: number): Promise<void>;

/**
 * Hash data using Blake3 (single-threaded WASM)
 */
export function blake3(input: Uint8Array | string, outputLength?: number): Uint8Array;

export namespace blake3 {
  function hex(input: Uint8Array | string, outputLength?: number): string;
}

/**
 * Hash data using Blake3 with Rayon parallelism (multi-threaded)
 */
export function blake3Parallel(input: Uint8Array | string, outputLength?: number): Uint8Array;

export namespace blake3Parallel {
  function hex(input: Uint8Array | string, outputLength?: number): string;
}

/**
 * Get number of threads in pool (0 if single-threaded)
 */
export function getThreadCount(): number;

/**
 * Check if module is initialized
 */
export function isInitialized(): boolean;

export default blake3;
