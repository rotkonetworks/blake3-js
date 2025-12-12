/**
 * @rotko/blake3-wasm - High-performance Blake3 with Rust WASM + Rayon
 *
 * Requires SharedArrayBuffer for multi-threading (needs COOP/COEP headers)
 */

let wasm = null;
let initialized = false;
let threadCount = 0;

/**
 * Initialize the WASM module
 * @param {number} threads - Number of threads (default: navigator.hardwareConcurrency)
 * @returns {Promise<void>}
 */
export async function init(threads) {
  if (initialized) return;

  const module = await import('./wasm/blake3_wasm.js');
  await module.default();
  wasm = module;

  // Try to initialize thread pool if SharedArrayBuffer available
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  if (hasSharedArrayBuffer) {
    const numThreads = threads || (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4) || 4;
    try {
      await wasm.initThreadPool(numThreads);
      threadCount = wasm.get_thread_count();
    } catch (e) {
      console.warn('blake3-wasm: thread pool init failed, using single-threaded mode', e.message);
      threadCount = 0;
    }
  }

  initialized = true;
}

/**
 * Hash data using Blake3 (single-threaded WASM)
 * @param {Uint8Array|string} input - Data to hash
 * @param {number} outputLength - Output length (default: 32)
 * @returns {Uint8Array}
 */
export function blake3(input, outputLength = 32) {
  if (!initialized) {
    throw new Error('blake3-wasm not initialized. Call init() first.');
  }

  const data = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : input;

  return wasm.hash(data, outputLength);
}

/**
 * Hash data using Blake3 with Rayon parallelism (multi-threaded)
 * Falls back to single-threaded if threads not available
 * @param {Uint8Array|string} input - Data to hash
 * @param {number} outputLength - Output length (default: 32)
 * @returns {Uint8Array}
 */
export function blake3Parallel(input, outputLength = 32) {
  if (!initialized) {
    throw new Error('blake3-wasm not initialized. Call init() first.');
  }

  const data = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : input;

  if (threadCount > 0) {
    return wasm.hash_rayon(data, outputLength);
  }
  return wasm.hash(data, outputLength);
}

/**
 * Hash and return hex string
 */
blake3.hex = function(input, outputLength = 32) {
  const hash = blake3(input, outputLength);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
};

blake3Parallel.hex = function(input, outputLength = 32) {
  const hash = blake3Parallel(input, outputLength);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Get number of threads in pool (0 if single-threaded)
 */
export function getThreadCount() {
  return threadCount;
}

/**
 * Check if module is initialized
 */
export function isInitialized() {
  return initialized;
}

export default blake3;
