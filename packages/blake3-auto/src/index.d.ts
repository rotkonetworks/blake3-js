/**
 * Initialize and select best backend
 */
export function init(options?: {
  threads?: number;
  forceJS?: boolean;
}): Promise<'wasm-rayon' | 'wasm' | 'js'>;

/**
 * Hash data using best available Blake3 implementation
 */
export function blake3(input: Uint8Array | string, outputLength?: number): Uint8Array;

export namespace blake3 {
  function hex(input: Uint8Array | string, outputLength?: number): string;
}

/**
 * Get current backend
 */
export function getBackend(): 'wasm-rayon' | 'wasm' | 'js';

/**
 * Check if initialized
 */
export function isInitialized(): boolean;

export default blake3;
