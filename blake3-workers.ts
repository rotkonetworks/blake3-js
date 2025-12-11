/**
 * Blake3 Web Worker Implementation
 *
 * Uses Web Workers for task parallelism - each worker processes
 * a subset of chunks, then results are merged on main thread.
 *
 * Best for large inputs where chunk processing dominates.
 */

// Constants
const IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

const BLOCK_LEN = 64;
const CHUNK_LEN = 1024;
const CHUNK_START = 1;
const CHUNK_END = 2;
const PARENT = 4;
const ROOT = 8;

// Core compress function (same as pure JS)
function compress(
  cv: Uint32Array,
  m: Uint32Array,
  counter: number,
  blockLen: number,
  flags: number
): Uint32Array {
  let s_0 = cv[0] | 0, s_1 = cv[1] | 0, s_2 = cv[2] | 0, s_3 = cv[3] | 0;
  let s_4 = cv[4] | 0, s_5 = cv[5] | 0, s_6 = cv[6] | 0, s_7 = cv[7] | 0;
  let s_8 = 0x6a09e667, s_9 = 0xbb67ae85, s_10 = 0x3c6ef372, s_11 = 0xa54ff53a;
  let s_12 = counter | 0, s_13 = (counter / 0x100000000) | 0, s_14 = blockLen | 0, s_15 = flags | 0;

  let m_0 = m[0] | 0, m_1 = m[1] | 0, m_2 = m[2] | 0, m_3 = m[3] | 0;
  let m_4 = m[4] | 0, m_5 = m[5] | 0, m_6 = m[6] | 0, m_7 = m[7] | 0;
  let m_8 = m[8] | 0, m_9 = m[9] | 0, m_10 = m[10] | 0, m_11 = m[11] | 0;
  let m_12 = m[12] | 0, m_13 = m[13] | 0, m_14 = m[14] | 0, m_15 = m[15] | 0;

  for (let i = 0; i < 7; ++i) {
    s_0 = (((s_0 + s_4) | 0) + m_0) | 0; s_12 ^= s_0; s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_8 = (s_8 + s_12) | 0; s_4 ^= s_8; s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_0 = (((s_0 + s_4) | 0) + m_1) | 0; s_12 ^= s_0; s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_8 = (s_8 + s_12) | 0; s_4 ^= s_8; s_4 = (s_4 >>> 7) | (s_4 << 25);
    s_1 = (((s_1 + s_5) | 0) + m_2) | 0; s_13 ^= s_1; s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_9 = (s_9 + s_13) | 0; s_5 ^= s_9; s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_1 = (((s_1 + s_5) | 0) + m_3) | 0; s_13 ^= s_1; s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_9 = (s_9 + s_13) | 0; s_5 ^= s_9; s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_2 = (((s_2 + s_6) | 0) + m_4) | 0; s_14 ^= s_2; s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_10 = (s_10 + s_14) | 0; s_6 ^= s_10; s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_2 = (((s_2 + s_6) | 0) + m_5) | 0; s_14 ^= s_2; s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_10 = (s_10 + s_14) | 0; s_6 ^= s_10; s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_3 = (((s_3 + s_7) | 0) + m_6) | 0; s_15 ^= s_3; s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_11 = (s_11 + s_15) | 0; s_7 ^= s_11; s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_3 = (((s_3 + s_7) | 0) + m_7) | 0; s_15 ^= s_3; s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_11 = (s_11 + s_15) | 0; s_7 ^= s_11; s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_0 = (((s_0 + s_5) | 0) + m_8) | 0; s_15 ^= s_0; s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_10 = (s_10 + s_15) | 0; s_5 ^= s_10; s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_0 = (((s_0 + s_5) | 0) + m_9) | 0; s_15 ^= s_0; s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_10 = (s_10 + s_15) | 0; s_5 ^= s_10; s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_1 = (((s_1 + s_6) | 0) + m_10) | 0; s_12 ^= s_1; s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_11 = (s_11 + s_12) | 0; s_6 ^= s_11; s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_1 = (((s_1 + s_6) | 0) + m_11) | 0; s_12 ^= s_1; s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_11 = (s_11 + s_12) | 0; s_6 ^= s_11; s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_2 = (((s_2 + s_7) | 0) + m_12) | 0; s_13 ^= s_2; s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_8 = (s_8 + s_13) | 0; s_7 ^= s_8; s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_2 = (((s_2 + s_7) | 0) + m_13) | 0; s_13 ^= s_2; s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_8 = (s_8 + s_13) | 0; s_7 ^= s_8; s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_3 = (((s_3 + s_4) | 0) + m_14) | 0; s_14 ^= s_3; s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_9 = (s_9 + s_14) | 0; s_4 ^= s_9; s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_3 = (((s_3 + s_4) | 0) + m_15) | 0; s_14 ^= s_3; s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_9 = (s_9 + s_14) | 0; s_4 ^= s_9; s_4 = (s_4 >>> 7) | (s_4 << 25);
    if (i < 6) {
      const t0 = m_0, t1 = m_1;
      m_0 = m_2; m_2 = m_3; m_3 = m_10; m_10 = m_12; m_12 = m_9; m_9 = m_11; m_11 = m_5; m_5 = t0;
      m_1 = m_6; m_6 = m_4; m_4 = m_7; m_7 = m_13; m_13 = m_14; m_14 = m_15; m_15 = m_8; m_8 = t1;
    }
  }
  return new Uint32Array([s_0 ^ s_8, s_1 ^ s_9, s_2 ^ s_10, s_3 ^ s_11, s_4 ^ s_12, s_5 ^ s_13, s_6 ^ s_14, s_7 ^ s_15]);
}

function readBlock(input: Uint8Array, offset: number, length: number, out: Uint32Array): void {
  out.fill(0);
  const end = Math.min(offset + length, input.length);
  let wi = 0, i = offset;
  while (i + 4 <= end) {
    out[wi++] = input[i] | (input[i+1] << 8) | (input[i+2] << 16) | (input[i+3] << 24);
    i += 4;
  }
  if (i < end) {
    let word = 0, shift = 0;
    while (i < end) { word |= input[i++] << shift; shift += 8; }
    out[wi] = word;
  }
}

function cvToBytes(cv: Uint32Array, outputLen: number): Uint8Array {
  const result = new Uint8Array(outputLen);
  for (let i = 0; i < Math.min(8, Math.ceil(outputLen / 4)); i++) {
    const word = cv[i], base = i * 4;
    if (base < outputLen) result[base] = word & 0xff;
    if (base + 1 < outputLen) result[base + 1] = (word >> 8) & 0xff;
    if (base + 2 < outputLen) result[base + 2] = (word >> 16) & 0xff;
    if (base + 3 < outputLen) result[base + 3] = (word >> 24) & 0xff;
  }
  return result;
}

// Process a single chunk and return its CV
function processChunk(
  input: Uint8Array,
  chunkStart: number,
  chunkLen: number,
  chunkCounter: number,
  flags: number
): Uint32Array {
  const cv = new Uint32Array(IV);
  const blockWords = new Uint32Array(16);

  let pos = 0;
  let blocksRemaining = Math.ceil(chunkLen / BLOCK_LEN) || 1;

  while (blocksRemaining > 0) {
    const blockLen = Math.min(BLOCK_LEN, chunkLen - pos);
    const isFirst = pos === 0;
    const isLast = blocksRemaining === 1;

    let blockFlags = flags;
    if (isFirst) blockFlags |= CHUNK_START;
    if (isLast) blockFlags |= CHUNK_END;

    readBlock(input, chunkStart + pos, blockLen, blockWords);
    const result = compress(cv, blockWords, chunkCounter, blockLen, blockFlags);
    cv.set(result);

    pos += BLOCK_LEN;
    blocksRemaining--;
  }

  return cv;
}

// Worker code as a string (will be used to create Blob URL)
const workerCode = `
const IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);
const BLOCK_LEN = 64;
const CHUNK_LEN = 1024;
const CHUNK_START = 1;
const CHUNK_END = 2;

function compress(cv, m, counter, blockLen, flags) {
  let s_0 = cv[0] | 0, s_1 = cv[1] | 0, s_2 = cv[2] | 0, s_3 = cv[3] | 0;
  let s_4 = cv[4] | 0, s_5 = cv[5] | 0, s_6 = cv[6] | 0, s_7 = cv[7] | 0;
  let s_8 = 0x6a09e667, s_9 = 0xbb67ae85, s_10 = 0x3c6ef372, s_11 = 0xa54ff53a;
  let s_12 = counter | 0, s_13 = (counter / 0x100000000) | 0, s_14 = blockLen | 0, s_15 = flags | 0;

  let m_0 = m[0] | 0, m_1 = m[1] | 0, m_2 = m[2] | 0, m_3 = m[3] | 0;
  let m_4 = m[4] | 0, m_5 = m[5] | 0, m_6 = m[6] | 0, m_7 = m[7] | 0;
  let m_8 = m[8] | 0, m_9 = m[9] | 0, m_10 = m[10] | 0, m_11 = m[11] | 0;
  let m_12 = m[12] | 0, m_13 = m[13] | 0, m_14 = m[14] | 0, m_15 = m[15] | 0;

  for (let i = 0; i < 7; ++i) {
    s_0 = (((s_0 + s_4) | 0) + m_0) | 0; s_12 ^= s_0; s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_8 = (s_8 + s_12) | 0; s_4 ^= s_8; s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_0 = (((s_0 + s_4) | 0) + m_1) | 0; s_12 ^= s_0; s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_8 = (s_8 + s_12) | 0; s_4 ^= s_8; s_4 = (s_4 >>> 7) | (s_4 << 25);
    s_1 = (((s_1 + s_5) | 0) + m_2) | 0; s_13 ^= s_1; s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_9 = (s_9 + s_13) | 0; s_5 ^= s_9; s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_1 = (((s_1 + s_5) | 0) + m_3) | 0; s_13 ^= s_1; s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_9 = (s_9 + s_13) | 0; s_5 ^= s_9; s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_2 = (((s_2 + s_6) | 0) + m_4) | 0; s_14 ^= s_2; s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_10 = (s_10 + s_14) | 0; s_6 ^= s_10; s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_2 = (((s_2 + s_6) | 0) + m_5) | 0; s_14 ^= s_2; s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_10 = (s_10 + s_14) | 0; s_6 ^= s_10; s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_3 = (((s_3 + s_7) | 0) + m_6) | 0; s_15 ^= s_3; s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_11 = (s_11 + s_15) | 0; s_7 ^= s_11; s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_3 = (((s_3 + s_7) | 0) + m_7) | 0; s_15 ^= s_3; s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_11 = (s_11 + s_15) | 0; s_7 ^= s_11; s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_0 = (((s_0 + s_5) | 0) + m_8) | 0; s_15 ^= s_0; s_15 = (s_15 >>> 16) | (s_15 << 16);
    s_10 = (s_10 + s_15) | 0; s_5 ^= s_10; s_5 = (s_5 >>> 12) | (s_5 << 20);
    s_0 = (((s_0 + s_5) | 0) + m_9) | 0; s_15 ^= s_0; s_15 = (s_15 >>> 8) | (s_15 << 24);
    s_10 = (s_10 + s_15) | 0; s_5 ^= s_10; s_5 = (s_5 >>> 7) | (s_5 << 25);
    s_1 = (((s_1 + s_6) | 0) + m_10) | 0; s_12 ^= s_1; s_12 = (s_12 >>> 16) | (s_12 << 16);
    s_11 = (s_11 + s_12) | 0; s_6 ^= s_11; s_6 = (s_6 >>> 12) | (s_6 << 20);
    s_1 = (((s_1 + s_6) | 0) + m_11) | 0; s_12 ^= s_1; s_12 = (s_12 >>> 8) | (s_12 << 24);
    s_11 = (s_11 + s_12) | 0; s_6 ^= s_11; s_6 = (s_6 >>> 7) | (s_6 << 25);
    s_2 = (((s_2 + s_7) | 0) + m_12) | 0; s_13 ^= s_2; s_13 = (s_13 >>> 16) | (s_13 << 16);
    s_8 = (s_8 + s_13) | 0; s_7 ^= s_8; s_7 = (s_7 >>> 12) | (s_7 << 20);
    s_2 = (((s_2 + s_7) | 0) + m_13) | 0; s_13 ^= s_2; s_13 = (s_13 >>> 8) | (s_13 << 24);
    s_8 = (s_8 + s_13) | 0; s_7 ^= s_8; s_7 = (s_7 >>> 7) | (s_7 << 25);
    s_3 = (((s_3 + s_4) | 0) + m_14) | 0; s_14 ^= s_3; s_14 = (s_14 >>> 16) | (s_14 << 16);
    s_9 = (s_9 + s_14) | 0; s_4 ^= s_9; s_4 = (s_4 >>> 12) | (s_4 << 20);
    s_3 = (((s_3 + s_4) | 0) + m_15) | 0; s_14 ^= s_3; s_14 = (s_14 >>> 8) | (s_14 << 24);
    s_9 = (s_9 + s_14) | 0; s_4 ^= s_9; s_4 = (s_4 >>> 7) | (s_4 << 25);
    if (i < 6) {
      const t0 = m_0, t1 = m_1;
      m_0 = m_2; m_2 = m_3; m_3 = m_10; m_10 = m_12; m_12 = m_9; m_9 = m_11; m_11 = m_5; m_5 = t0;
      m_1 = m_6; m_6 = m_4; m_4 = m_7; m_7 = m_13; m_13 = m_14; m_14 = m_15; m_15 = m_8; m_8 = t1;
    }
  }
  return new Uint32Array([s_0 ^ s_8, s_1 ^ s_9, s_2 ^ s_10, s_3 ^ s_11, s_4 ^ s_12, s_5 ^ s_13, s_6 ^ s_14, s_7 ^ s_15]);
}

function readBlock(input, offset, length, out) {
  out.fill(0);
  const end = Math.min(offset + length, input.length);
  let wi = 0, i = offset;
  while (i + 4 <= end) {
    out[wi++] = input[i] | (input[i+1] << 8) | (input[i+2] << 16) | (input[i+3] << 24);
    i += 4;
  }
  if (i < end) {
    let word = 0, shift = 0;
    while (i < end) { word |= input[i++] << shift; shift += 8; }
    out[wi] = word;
  }
}

// Process assigned chunks
self.onmessage = function(e) {
  const { input, startChunk, endChunk, flags } = e.data;
  const data = new Uint8Array(input);
  const blockWords = new Uint32Array(16);
  const cvs = [];

  for (let c = startChunk; c < endChunk; c++) {
    const chunkStart = c * CHUNK_LEN;
    const chunkLen = Math.min(CHUNK_LEN, data.length - chunkStart);

    const cv = new Uint32Array(IV);
    let pos = 0;
    let blocksRemaining = Math.ceil(chunkLen / BLOCK_LEN) || 1;

    while (blocksRemaining > 0) {
      const blockLen = Math.min(BLOCK_LEN, chunkLen - pos);
      const isFirst = pos === 0;
      const isLast = blocksRemaining === 1;

      let blockFlags = flags;
      if (isFirst) blockFlags |= CHUNK_START;
      if (isLast) blockFlags |= CHUNK_END;

      readBlock(data, chunkStart + pos, blockLen, blockWords);
      const result = compress(cv, blockWords, c, blockLen, blockFlags);
      cv.set(result);

      pos += BLOCK_LEN;
      blocksRemaining--;
    }

    cvs.push(Array.from(cv));
  }

  self.postMessage({ startChunk, cvs });
};
`;

// Worker pool
let workers: Worker[] = [];
let workerBlobUrl: string | null = null;
let numWorkers = 0;

/**
 * Initialize worker pool
 */
export function initWorkers(count?: number): void {
  // Default to navigator.hardwareConcurrency or 4
  const targetCount = count ?? (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4) ?? 4;

  if (workers.length === targetCount) return;

  // Terminate existing workers
  terminateWorkers();

  // Create blob URL for worker code
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  workerBlobUrl = URL.createObjectURL(blob);

  // Create workers
  workers = [];
  for (let i = 0; i < targetCount; i++) {
    workers.push(new Worker(workerBlobUrl));
  }
  numWorkers = targetCount;
}

/**
 * Terminate all workers
 */
export function terminateWorkers(): void {
  for (const worker of workers) {
    worker.terminate();
  }
  workers = [];
  numWorkers = 0;

  if (workerBlobUrl) {
    URL.revokeObjectURL(workerBlobUrl);
    workerBlobUrl = null;
  }
}

/**
 * Check if workers are available
 */
export function isWorkersAvailable(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Get number of workers
 */
export function getWorkerCount(): number {
  return numWorkers;
}

// Merge CVs in Merkle tree
function mergeParents(
  left: Uint32Array,
  right: Uint32Array,
  flags: number,
  isRoot: boolean
): Uint32Array {
  const block = new Uint32Array(16);
  block.set(left, 0);
  block.set(right, 8);

  let parentFlags = flags | PARENT;
  if (isRoot) parentFlags |= ROOT;

  return compress(IV, block, 0, BLOCK_LEN, parentFlags);
}

/**
 * Hash using Web Workers for parallel chunk processing
 */
export async function hashWorkers(input: Uint8Array, outputLen: number = 32): Promise<Uint8Array> {
  const flags = 0;

  // For small inputs, use single-threaded
  if (input.length <= CHUNK_LEN || workers.length === 0) {
    const cv = processChunk(input, 0, input.length, 0, flags);

    // Single chunk needs ROOT flag for finalization
    const blockWords = new Uint32Array(16);
    const finalCv = new Uint32Array(IV);

    let pos = 0;
    let blocksRemaining = Math.ceil(input.length / BLOCK_LEN) || 1;

    while (blocksRemaining > 0) {
      const blockLen = Math.min(BLOCK_LEN, input.length - pos);
      const isFirst = pos === 0;
      const isLast = blocksRemaining === 1;

      let blockFlags = flags;
      if (isFirst) blockFlags |= CHUNK_START;
      if (isLast) blockFlags |= CHUNK_END | ROOT;

      readBlock(input, pos, blockLen, blockWords);
      const result = compress(finalCv, blockWords, 0, blockLen, blockFlags);
      finalCv.set(result);

      pos += BLOCK_LEN;
      blocksRemaining--;
    }

    return cvToBytes(finalCv, outputLen);
  }

  // Multi-chunk with workers
  const numChunks = Math.ceil(input.length / CHUNK_LEN);
  const chunksPerWorker = Math.ceil(numChunks / workers.length);

  // Dispatch work to workers
  const promises: Promise<{ startChunk: number; cvs: number[][] }>[] = [];

  for (let i = 0; i < workers.length; i++) {
    const startChunk = i * chunksPerWorker;
    const endChunk = Math.min(startChunk + chunksPerWorker, numChunks);

    if (startChunk >= numChunks) break;

    const promise = new Promise<{ startChunk: number; cvs: number[][] }>((resolve) => {
      const worker = workers[i];

      worker.onmessage = (e) => {
        resolve(e.data);
      };

      // Transfer buffer for efficiency (can't use SharedArrayBuffer without COOP/COEP headers)
      const inputCopy = input.slice().buffer;
      worker.postMessage(
        { input: inputCopy, startChunk, endChunk, flags },
        [inputCopy]
      );
    });

    promises.push(promise);
  }

  // Collect results
  const results = await Promise.all(promises);

  // Sort by startChunk to ensure correct order
  results.sort((a, b) => a.startChunk - b.startChunk);

  // Flatten CVs
  const allCvs: Uint32Array[] = [];
  for (const result of results) {
    for (const cv of result.cvs) {
      allCvs.push(new Uint32Array(cv));
    }
  }

  // Build Merkle tree
  const cvStack: Uint32Array[] = [];

  for (let i = 0; i < allCvs.length; i++) {
    const isLastCv = i === allCvs.length - 1;
    cvStack.push(allCvs[i]);

    // Merge pairs, but NOT on last CV (let finalization handle ROOT flag)
    if (!isLastCv) {
      let totalChunks = i + 1;
      while ((totalChunks & 1) === 0 && cvStack.length >= 2) {
        const right = cvStack.pop()!;
        const left = cvStack.pop()!;
        cvStack.push(mergeParents(left, right, flags, false));
        totalChunks >>= 1;
      }
    }
  }

  // Final merges with ROOT flag
  while (cvStack.length > 1) {
    const right = cvStack.pop()!;
    const left = cvStack.pop()!;
    const isRoot = cvStack.length === 0;
    cvStack.push(mergeParents(left, right, flags, isRoot));
  }

  return cvToBytes(cvStack[0], outputLen);
}

// Sync wrapper for compatibility (uses Promise.resolve pattern)
export function hash(input: Uint8Array, outputLen: number = 32): Uint8Array {
  // Can't use workers synchronously, fall back to single-threaded
  const flags = 0;
  const blockWords = new Uint32Array(16);

  if (input.length <= CHUNK_LEN) {
    const cv = new Uint32Array(IV);

    let pos = 0;
    let blocksRemaining = Math.ceil(input.length / BLOCK_LEN) || 1;

    while (blocksRemaining > 0) {
      const blockLen = Math.min(BLOCK_LEN, input.length - pos);
      const isFirst = pos === 0;
      const isLast = blocksRemaining === 1;

      let blockFlags = flags;
      if (isFirst) blockFlags |= CHUNK_START;
      if (isLast) blockFlags |= CHUNK_END | ROOT;

      readBlock(input, pos, blockLen, blockWords);
      const result = compress(cv, blockWords, 0, blockLen, blockFlags);
      cv.set(result);

      pos += BLOCK_LEN;
      blocksRemaining--;
    }

    return cvToBytes(cv, outputLen);
  }

  // Multi-chunk single-threaded
  const numChunks = Math.ceil(input.length / CHUNK_LEN);
  const cvStack: Uint32Array[] = [];

  for (let c = 0; c < numChunks; c++) {
    const chunkStart = c * CHUNK_LEN;
    const chunkLen = Math.min(CHUNK_LEN, input.length - chunkStart);
    const isLastChunk = c === numChunks - 1;

    const cv = processChunk(input, chunkStart, chunkLen, c, flags);
    cvStack.push(cv);

    // Merge pairs, but NOT on last chunk (let finalization handle ROOT flag)
    if (!isLastChunk) {
      let totalChunks = c + 1;
      while ((totalChunks & 1) === 0 && cvStack.length >= 2) {
        const right = cvStack.pop()!;
        const left = cvStack.pop()!;
        cvStack.push(mergeParents(left, right, flags, false));
        totalChunks >>= 1;
      }
    }
  }

  // Final merges
  while (cvStack.length > 1) {
    const right = cvStack.pop()!;
    const left = cvStack.pop()!;
    const isRoot = cvStack.length === 0;
    cvStack.push(mergeParents(left, right, flags, isRoot));
  }

  return cvToBytes(cvStack[0], outputLen);
}
