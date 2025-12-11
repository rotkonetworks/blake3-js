/**
 * Blake3 - Unified API with Multiple Backends
 *
 * Provides three implementations:
 * 1. Pure JS - Optimized with SMI variables, inlined permutations, LE fast path
 * 2. WASM SIMD - Runtime-generated WASM with i32x4 SIMD for compress4x
 * 3. Web Workers - Task parallelism for large inputs
 *
 * @example
 * ```ts
 * import { hash, hashAsync, benchmark, Backend } from './blake3';
 *
 * // Simple usage (auto-selects best backend)
 * const digest = hash(data);
 *
 * // Async with workers for large data
 * const digest = await hashAsync(largeData);
 *
 * // Explicit backend selection
 * const digest = hash(data, 32, Backend.WASM_SIMD);
 *
 * // Benchmark all backends
 * const results = await benchmark(1024 * 1024);
 * ```
 */

// Import all backends
import { hash as hashJS, keyedHash, deriveKey } from './blake3.ts';
import { hash as hashWasm, initWasmSimd, isWasmSimdAvailable } from './blake3-wasm-simd.ts';
import {
  hash as hashWorkersSync,
  hashWorkers,
  initWorkers,
  terminateWorkers,
  isWorkersAvailable,
  getWorkerCount
} from './blake3-workers.ts';

/** Available backends */
export enum Backend {
  /** Pure JavaScript with SMI optimizations (~230 MB/s) */
  JS = 'js',
  /** WASM with SIMD i32x4 operations (~320 MB/s expected) */
  WASM_SIMD = 'wasm-simd',
  /** Web Workers for task parallelism (best for large inputs) */
  WORKERS = 'workers',
  /** Auto-select best available backend */
  AUTO = 'auto',
}

/** Backend capabilities */
export interface BackendInfo {
  name: string;
  available: boolean;
  description: string;
  async: boolean;
}

// Initialize state
let wasmInitialized = false;
let workersInitialized = false;

/**
 * Initialize all backends
 * Call this once at startup for best performance
 */
export async function init(numWorkers?: number): Promise<void> {
  // Initialize WASM SIMD
  if (!wasmInitialized) {
    wasmInitialized = await initWasmSimd();
  }

  // Initialize workers
  if (!workersInitialized && isWorkersAvailable()) {
    initWorkers(numWorkers);
    workersInitialized = true;
  }
}

/**
 * Get info about all backends
 */
export function getBackendInfo(): Record<Backend, BackendInfo> {
  return {
    [Backend.JS]: {
      name: 'Pure JavaScript',
      available: true,
      description: 'SMI variables, inlined permutations, LE fast path (~230 MB/s)',
      async: false,
    },
    [Backend.WASM_SIMD]: {
      name: 'WASM SIMD',
      available: wasmInitialized && isWasmSimdAvailable(),
      description: 'Runtime-generated WASM with i32x4 compress4x',
      async: false,
    },
    [Backend.WORKERS]: {
      name: 'Web Workers',
      available: workersInitialized && getWorkerCount() > 0,
      description: `Task parallelism with ${getWorkerCount()} workers`,
      async: true,
    },
    [Backend.AUTO]: {
      name: 'Auto',
      available: true,
      description: 'Selects best backend based on input size and availability',
      async: true,
    },
  };
}

/**
 * Select best backend for given input size
 */
function selectBackend(inputLength: number): Backend {
  // For very large inputs (> 64KB), workers are best if available
  if (inputLength > 65536 && workersInitialized && getWorkerCount() > 1) {
    return Backend.WORKERS;
  }

  // For medium inputs (> 4KB), WASM SIMD is best if available
  if (inputLength > 4096 && wasmInitialized && isWasmSimdAvailable()) {
    return Backend.WASM_SIMD;
  }

  // For small inputs, pure JS is fastest (no overhead)
  return Backend.JS;
}

/**
 * Hash data synchronously
 *
 * @param input - Data to hash
 * @param outputLen - Output length in bytes (default 32)
 * @param backend - Backend to use (default AUTO)
 */
export function hash(
  input: Uint8Array,
  outputLen: number = 32,
  backend: Backend = Backend.AUTO
): Uint8Array {
  const selectedBackend = backend === Backend.AUTO ? selectBackend(input.length) : backend;

  switch (selectedBackend) {
    case Backend.WASM_SIMD:
      if (wasmInitialized && isWasmSimdAvailable()) {
        return hashWasm(input, outputLen);
      }
      // Fall through to JS if WASM not available
    case Backend.WORKERS:
      // Workers are async-only, use sync fallback
      return hashWorkersSync(input, outputLen);
    case Backend.JS:
    default:
      return hashJS(input, outputLen);
  }
}

/**
 * Hash data asynchronously (can use workers for large inputs)
 *
 * @param input - Data to hash
 * @param outputLen - Output length in bytes (default 32)
 * @param backend - Backend to use (default AUTO)
 */
export async function hashAsync(
  input: Uint8Array,
  outputLen: number = 32,
  backend: Backend = Backend.AUTO
): Promise<Uint8Array> {
  const selectedBackend = backend === Backend.AUTO ? selectBackend(input.length) : backend;

  switch (selectedBackend) {
    case Backend.WORKERS:
      if (workersInitialized && getWorkerCount() > 0) {
        return hashWorkers(input, outputLen);
      }
      // Fall through if workers not available
    case Backend.WASM_SIMD:
      if (wasmInitialized && isWasmSimdAvailable()) {
        return hashWasm(input, outputLen);
      }
      // Fall through to JS
    case Backend.JS:
    default:
      return hashJS(input, outputLen);
  }
}

/** Benchmark result for a single backend */
export interface BenchmarkResult {
  backend: Backend;
  available: boolean;
  throughputMBps: number;
  timeMs: number;
  iterations: number;
}

/**
 * Benchmark all backends
 *
 * @param dataSize - Size of test data in bytes
 * @param durationMs - Target duration for each benchmark in ms (default 1000)
 */
export async function benchmark(
  dataSize: number = 65536,
  durationMs: number = 1000
): Promise<BenchmarkResult[]> {
  // Generate test data
  const data = new Uint8Array(dataSize);
  for (let i = 0; i < dataSize; i++) {
    data[i] = i % 251;
  }

  const results: BenchmarkResult[] = [];

  // Benchmark pure JS
  {
    // Warm up
    for (let i = 0; i < 10; i++) hashJS(data);

    // Find iteration count for target duration
    let iterations = 1;
    let elapsed = 0;
    while (elapsed < 100) {
      iterations *= 2;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) hashJS(data);
      elapsed = performance.now() - start;
    }

    // Scale to target duration
    iterations = Math.ceil(iterations * durationMs / elapsed);

    // Actual benchmark
    const start = performance.now();
    for (let i = 0; i < iterations; i++) hashJS(data);
    const timeMs = performance.now() - start;

    const throughputMBps = (dataSize * iterations) / (timeMs / 1000) / (1024 * 1024);

    results.push({
      backend: Backend.JS,
      available: true,
      throughputMBps,
      timeMs,
      iterations,
    });
  }

  // Benchmark WASM SIMD
  {
    const available = wasmInitialized && isWasmSimdAvailable();
    if (available) {
      // Warm up
      for (let i = 0; i < 10; i++) hashWasm(data);

      // Find iteration count
      let iterations = 1;
      let elapsed = 0;
      while (elapsed < 100) {
        iterations *= 2;
        const start = performance.now();
        for (let i = 0; i < iterations; i++) hashWasm(data);
        elapsed = performance.now() - start;
      }

      iterations = Math.ceil(iterations * durationMs / elapsed);

      // Actual benchmark
      const start = performance.now();
      for (let i = 0; i < iterations; i++) hashWasm(data);
      const timeMs = performance.now() - start;

      const throughputMBps = (dataSize * iterations) / (timeMs / 1000) / (1024 * 1024);

      results.push({
        backend: Backend.WASM_SIMD,
        available: true,
        throughputMBps,
        timeMs,
        iterations,
      });
    } else {
      results.push({
        backend: Backend.WASM_SIMD,
        available: false,
        throughputMBps: 0,
        timeMs: 0,
        iterations: 0,
      });
    }
  }

  // Benchmark Workers (async)
  {
    const available = workersInitialized && getWorkerCount() > 0;
    if (available) {
      // Warm up
      for (let i = 0; i < 5; i++) await hashWorkers(data);

      // For workers, we need async iteration
      let iterations = 1;
      let elapsed = 0;
      while (elapsed < 100) {
        iterations *= 2;
        const start = performance.now();
        for (let i = 0; i < iterations; i++) await hashWorkers(data);
        elapsed = performance.now() - start;
      }

      iterations = Math.ceil(iterations * durationMs / elapsed);

      // Actual benchmark
      const start = performance.now();
      for (let i = 0; i < iterations; i++) await hashWorkers(data);
      const timeMs = performance.now() - start;

      const throughputMBps = (dataSize * iterations) / (timeMs / 1000) / (1024 * 1024);

      results.push({
        backend: Backend.WORKERS,
        available: true,
        throughputMBps,
        timeMs,
        iterations,
      });
    } else {
      results.push({
        backend: Backend.WORKERS,
        available: false,
        throughputMBps: 0,
        timeMs: 0,
        iterations: 0,
      });
    }
  }

  return results;
}

/**
 * Format benchmark results as a table string
 */
export function formatBenchmarkResults(results: BenchmarkResult[], dataSize: number): string {
  const lines: string[] = [];

  lines.push(`Blake3 Benchmark (${(dataSize / 1024).toFixed(1)} KB input)`);
  lines.push('='.repeat(60));
  lines.push('Backend         | Available | Throughput  | Iterations');
  lines.push('-'.repeat(60));

  for (const result of results) {
    const name = result.backend.padEnd(15);
    const available = result.available ? '✓' : '✗';
    const throughput = result.available
      ? `${result.throughputMBps.toFixed(1)} MB/s`.padStart(10)
      : 'N/A'.padStart(10);
    const iterations = result.available
      ? result.iterations.toString().padStart(10)
      : 'N/A'.padStart(10);

    lines.push(`${name} |     ${available}     | ${throughput} | ${iterations}`);
  }

  lines.push('='.repeat(60));

  // Find best
  const best = results
    .filter(r => r.available)
    .sort((a, b) => b.throughputMBps - a.throughputMBps)[0];

  if (best) {
    lines.push(`Best: ${best.backend} at ${best.throughputMBps.toFixed(1)} MB/s`);
  }

  return lines.join('\n');
}

// Re-export utilities
export { keyedHash, deriveKey } from './blake3.ts';
export { initWasmSimd, isWasmSimdAvailable } from './blake3-wasm-simd.ts';
export { initWorkers, terminateWorkers, isWorkersAvailable, getWorkerCount } from './blake3-workers.ts';

// Default export
export default {
  hash,
  hashAsync,
  keyedHash,
  deriveKey,
  init,
  benchmark,
  formatBenchmarkResults,
  getBackendInfo,
  Backend,
};
