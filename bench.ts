/**
 * Blake3 Comprehensive Benchmark
 *
 * Tests all backends against official test vectors and benchmarks performance
 */

import { blake3 } from '@noble/hashes/blake3.js';
import { hash as hashJS, keyedHash, deriveKey } from './blake3.ts';
import { hash as hashWasm, initWasmSimd, isWasmSimdAvailable } from './blake3-wasm-simd.ts';
import { hash as hashWorkersSync } from './blake3-workers.ts';

// Test data generator
function generateInput(len: number): Uint8Array {
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = i % 251;
  return arr;
}

// Hex conversion
function toHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
  console.log('Blake3 Implementation Benchmark');
  console.log('================================\n');

  // Initialize WASM
  console.log('Initializing backends...');
  const wasmAvailable = await initWasmSimd();
  console.log(`  WASM SIMD: ${wasmAvailable ? '✓ available' : '✗ not available'}`);
  console.log(`  Workers: ✓ available (running in Node.js, sync fallback)\n`);

  // Correctness tests
  console.log('Correctness Tests');
  console.log('-----------------\n');

  const testSizes = [0, 1, 2, 3, 4, 31, 32, 33, 63, 64, 65, 127, 128, 129,
                    255, 256, 257, 511, 512, 513, 1023, 1024, 1025,
                    2047, 2048, 2049, 4096, 8192, 16384, 65536];

  // Test pure JS
  {
    let passed = 0;
    let failed = 0;
    for (const len of testSizes) {
      const input = generateInput(len);
      const expected = toHex(blake3(input));
      const got = toHex(hashJS(input));
      if (expected === got) {
        passed++;
      } else {
        failed++;
        console.log(`  JS FAIL len=${len}: got ${got.slice(0, 16)}... expected ${expected.slice(0, 16)}...`);
      }
    }
    console.log(`Pure JS:     ${passed}/${testSizes.length} tests passed`);
  }

  // Test WASM SIMD
  if (wasmAvailable) {
    let passed = 0;
    let failed = 0;
    for (const len of testSizes) {
      const input = generateInput(len);
      const expected = toHex(blake3(input));
      const got = toHex(hashWasm(input));
      if (expected === got) {
        passed++;
      } else {
        failed++;
        console.log(`  WASM FAIL len=${len}: got ${got.slice(0, 16)}... expected ${expected.slice(0, 16)}...`);
      }
    }
    console.log(`WASM SIMD:   ${passed}/${testSizes.length} tests passed`);
  }

  // Test Workers (sync fallback in Node.js)
  {
    let passed = 0;
    let failed = 0;
    for (const len of testSizes) {
      const input = generateInput(len);
      const expected = toHex(blake3(input));
      const got = toHex(hashWorkersSync(input));
      if (expected === got) {
        passed++;
      } else {
        failed++;
        console.log(`  Workers FAIL len=${len}: got ${got.slice(0, 16)}... expected ${expected.slice(0, 16)}...`);
      }
    }
    console.log(`Workers:     ${passed}/${testSizes.length} tests passed`);
  }

  console.log();

  // Benchmark
  console.log('Performance Benchmarks');
  console.log('----------------------\n');

  const benchSizes = [64, 256, 1024, 4096, 16384, 65536, 262144, 1048576];

  console.log('Size (bytes) | Noble      | Pure JS    | WASM SIMD  | JS/Noble | WASM/Noble');
  console.log('-------------|------------|------------|------------|----------|----------');

  for (const size of benchSizes) {
    const data = generateInput(size);
    const iterations = size < 10000 ? 5000 : size < 100000 ? 500 : 50;

    // Warm up
    for (let i = 0; i < 10; i++) {
      hashJS(data);
      if (wasmAvailable) hashWasm(data);
      blake3(data);
    }

    // Benchmark noble-hashes
    let start = performance.now();
    for (let i = 0; i < iterations; i++) blake3(data);
    const nobleTime = performance.now() - start;
    const nobleThroughput = (size * iterations) / (nobleTime / 1000) / (1024 * 1024);

    // Benchmark pure JS
    start = performance.now();
    for (let i = 0; i < iterations; i++) hashJS(data);
    const jsTime = performance.now() - start;
    const jsThroughput = (size * iterations) / (jsTime / 1000) / (1024 * 1024);

    // Benchmark WASM SIMD
    let wasmThroughput = 0;
    if (wasmAvailable) {
      start = performance.now();
      for (let i = 0; i < iterations; i++) hashWasm(data);
      const wasmTime = performance.now() - start;
      wasmThroughput = (size * iterations) / (wasmTime / 1000) / (1024 * 1024);
    }

    const jsRatio = (jsThroughput / nobleThroughput).toFixed(1);
    const wasmRatio = wasmAvailable ? (wasmThroughput / nobleThroughput).toFixed(1) : 'N/A';

    console.log(
      `${size.toString().padStart(12)} | ` +
      `${nobleThroughput.toFixed(1).padStart(8)} MB/s | ` +
      `${jsThroughput.toFixed(1).padStart(8)} MB/s | ` +
      `${wasmAvailable ? wasmThroughput.toFixed(1).padStart(8) + ' MB/s' : '       N/A'} | ` +
      `${jsRatio.padStart(6)}x  | ` +
      `${wasmRatio.padStart(6)}x`
    );
  }

  console.log('\n');

  // Summary
  console.log('Summary');
  console.log('-------');
  console.log('Pure JS:   SMI variables, inlined permutations, LE fast path');
  console.log('WASM SIMD: Runtime-generated WASM with i32x4 compress4x');
  console.log('Workers:   Task parallelism (async, best for large inputs in browser)');
  console.log();
  console.log('Note: WASM SIMD may show similar performance to JS because the');
  console.log('current implementation still uses JS for chunk processing.');
  console.log('Full SIMD benefit requires batching 4 chunks at compress level.');
}

main().catch(console.error);
