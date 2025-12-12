/**
 * @rotko/blake3-auto - Auto-selects best Blake3 implementation
 *
 * Tries WASM+Rayon first, falls back to pure JS
 */

import { blake3 as blake3JS } from '@rotko/blake3';

let backend = 'js';
let wasmModule = null;
let initialized = false;

/**
 * Initialize and select best backend
 * @param {object} options
 * @param {number} options.threads - Thread count for WASM (default: auto)
 * @param {boolean} options.forceJS - Force pure JS backend
 * @returns {Promise<string>} - Selected backend: 'wasm-rayon', 'wasm', or 'js'
 */
export async function init(options = {}) {
  if (initialized) return backend;

  if (options.forceJS) {
    backend = 'js';
    initialized = true;
    return backend;
  }

  // Try WASM
  try {
    const wasm = await import('@rotko/blake3-wasm');
    await wasm.init(options.threads);
    wasmModule = wasm;

    if (wasm.getThreadCount() > 0) {
      backend = 'wasm-rayon';
    } else {
      backend = 'wasm';
    }
  } catch (e) {
    backend = 'js';
  }

  initialized = true;
  return backend;
}

/**
 * Hash data using best available Blake3 implementation
 * @param {Uint8Array|string} input
 * @param {number} outputLength
 * @returns {Uint8Array}
 */
export function blake3(input, outputLength = 32) {
  if (!initialized) {
    // Sync fallback to JS if not initialized
    return blake3JS(input, outputLength);
  }

  if (backend === 'wasm-rayon' && wasmModule) {
    return wasmModule.blake3Parallel(input, outputLength);
  } else if (backend === 'wasm' && wasmModule) {
    return wasmModule.blake3(input, outputLength);
  }
  return blake3JS(input, outputLength);
}

/**
 * Hash and return hex string
 */
blake3.hex = function(input, outputLength = 32) {
  const hash = blake3(input, outputLength);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Get current backend
 */
export function getBackend() {
  return backend;
}

/**
 * Check if initialized
 */
export function isInitialized() {
  return initialized;
}

export default blake3;
