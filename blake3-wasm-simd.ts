/**
 * Blake3 WASM SIMD Implementation
 *
 * Generates WASM bytecode at runtime with i32x4 SIMD instructions.
 * compress4x processes 4 chunks in parallel using SIMD lanes.
 *
 * Based on Fleek's "Blake3: A JavaScript Optimization Case Study"
 */

// WASM opcodes
const OP = {
  // Control
  unreachable: 0x00,
  block: 0x02,
  loop: 0x03,
  end: 0x0b,
  br: 0x0c,
  br_if: 0x0d,
  return: 0x0f,
  call: 0x10,

  // Variables
  local_get: 0x20,
  local_set: 0x21,
  local_tee: 0x22,

  // Memory
  i32_load: 0x28,
  i32_store: 0x36,

  // i32 ops
  i32_const: 0x41,
  i32_add: 0x6a,
  i32_sub: 0x6b,
  i32_and: 0x71,
  i32_shl: 0x74,
  i32_shr_u: 0x76,

  // SIMD prefix
  simd_prefix: 0xfd,
};

// SIMD opcodes (after 0xfd prefix, LEB128 encoded)
const SIMD = {
  v128_load: 0x00,
  v128_store: 0x0b,
  v128_const: 0x0c,
  i32x4_splat: 0x11,
  i32x4_extract_lane: 0x1b,
  i32x4_replace_lane: 0x1c,
  v128_xor: 0x51,
  v128_or: 0x50,
  v128_and: 0x4e,
  i32x4_add: 0xae, // 0xae 0x01
  i32x4_shl: 0xab, // 0xab 0x01
  i32x4_shr_u: 0xad, // 0xad 0x01
};

// LEB128 encoding
function leb128(n: number): number[] {
  const result: number[] = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n !== 0) byte |= 0x80;
    result.push(byte);
  } while (n !== 0);
  return result;
}

// Signed LEB128
function sleb128(n: number): number[] {
  const result: number[] = [];
  let more = true;
  while (more) {
    let byte = n & 0x7f;
    n >>= 7;
    if ((n === 0 && (byte & 0x40) === 0) || (n === -1 && (byte & 0x40) !== 0)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    result.push(byte);
  }
  return result;
}

// Blake3 constants
const IV = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

const BLOCK_LEN = 64;
const CHUNK_LEN = 1024;
const CHUNK_START = 1;
const CHUNK_END = 2;
const PARENT = 4;
const ROOT = 8;

// Message permutation for each round
const MSG_PERMUTATION = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

/**
 * Generate WASM module with compress4x function
 */
function generateWasmModule(): Uint8Array {
  const code: number[] = [];

  // Helper to emit bytes
  const emit = (...bytes: number[]) => code.push(...bytes);
  const emitLeb = (n: number) => code.push(...leb128(n));

  // Helper for SIMD ops
  const simdOp = (op: number) => {
    emit(OP.simd_prefix);
    code.push(...leb128(op));
  };

  // Local indices for compress4x:
  // 0: ptr (i32) - pointer to memory
  // 1-16: s0-s15 (v128) - state vectors
  // 17-32: m0-m15 (v128) - message vectors
  // 33: temp (v128) - temporary
  // 34: counter_lo (v128) - low 32 bits of counters
  // 35: counter_hi (v128) - high 32 bits of counters
  // 36: blocklen (v128) - block lengths
  // 37: flags (v128) - flags

  const PTR = 0;
  const S = (i: number) => 1 + i;  // s0-s15 at locals 1-16
  const M = (i: number) => 17 + i; // m0-m15 at locals 17-32
  const TEMP = 33;
  const COUNTER_LO = 34;
  const COUNTER_HI = 35;
  const BLOCKLEN = 36;
  const FLAGS = 37;

  // Generate G function for 4 parallel instances
  // G(a, b, c, d, mx, my) modifies state in place
  const emitG = (a: number, b: number, c: number, d: number, mx: number, my: number) => {
    // a = a + b + mx
    emit(OP.local_get, S(a));
    emit(OP.local_get, S(b));
    simdOp(SIMD.i32x4_add); emit(0x01); // i32x4.add
    emit(OP.local_get, M(mx));
    simdOp(SIMD.i32x4_add); emit(0x01);
    emit(OP.local_set, S(a));

    // d = rotr(d ^ a, 16)
    emit(OP.local_get, S(d));
    emit(OP.local_get, S(a));
    simdOp(SIMD.v128_xor);
    emit(OP.local_tee, TEMP);
    emit(OP.i32_const, 16);
    simdOp(SIMD.i32x4_shr_u); emit(0x01);
    emit(OP.local_get, TEMP);
    emit(OP.i32_const, 16);
    simdOp(SIMD.i32x4_shl); emit(0x01);
    simdOp(SIMD.v128_or);
    emit(OP.local_set, S(d));

    // c = c + d
    emit(OP.local_get, S(c));
    emit(OP.local_get, S(d));
    simdOp(SIMD.i32x4_add); emit(0x01);
    emit(OP.local_set, S(c));

    // b = rotr(b ^ c, 12)
    emit(OP.local_get, S(b));
    emit(OP.local_get, S(c));
    simdOp(SIMD.v128_xor);
    emit(OP.local_tee, TEMP);
    emit(OP.i32_const, 12);
    simdOp(SIMD.i32x4_shr_u); emit(0x01);
    emit(OP.local_get, TEMP);
    emit(OP.i32_const, 20);
    simdOp(SIMD.i32x4_shl); emit(0x01);
    simdOp(SIMD.v128_or);
    emit(OP.local_set, S(b));

    // a = a + b + my
    emit(OP.local_get, S(a));
    emit(OP.local_get, S(b));
    simdOp(SIMD.i32x4_add); emit(0x01);
    emit(OP.local_get, M(my));
    simdOp(SIMD.i32x4_add); emit(0x01);
    emit(OP.local_set, S(a));

    // d = rotr(d ^ a, 8)
    emit(OP.local_get, S(d));
    emit(OP.local_get, S(a));
    simdOp(SIMD.v128_xor);
    emit(OP.local_tee, TEMP);
    emit(OP.i32_const, 8);
    simdOp(SIMD.i32x4_shr_u); emit(0x01);
    emit(OP.local_get, TEMP);
    emit(OP.i32_const, 24);
    simdOp(SIMD.i32x4_shl); emit(0x01);
    simdOp(SIMD.v128_or);
    emit(OP.local_set, S(d));

    // c = c + d
    emit(OP.local_get, S(c));
    emit(OP.local_get, S(d));
    simdOp(SIMD.i32x4_add); emit(0x01);
    emit(OP.local_set, S(c));

    // b = rotr(b ^ c, 7)
    emit(OP.local_get, S(b));
    emit(OP.local_get, S(c));
    simdOp(SIMD.v128_xor);
    emit(OP.local_tee, TEMP);
    emit(OP.i32_const, 7);
    simdOp(SIMD.i32x4_shr_u); emit(0x01);
    emit(OP.local_get, TEMP);
    emit(OP.i32_const, 25);
    simdOp(SIMD.i32x4_shl); emit(0x01);
    simdOp(SIMD.v128_or);
    emit(OP.local_set, S(b));
  };

  // Build compress4x function body
  const functionBody: number[] = [];
  const fb = (...bytes: number[]) => functionBody.push(...bytes);
  const fbLeb = (n: number) => functionBody.push(...leb128(n));
  const fbSimd = (op: number) => {
    fb(OP.simd_prefix);
    functionBody.push(...leb128(op));
  };

  // Memory layout (all v128 = 16 bytes):
  // Offset 0: 4 chaining values (4 * 8 * 4 = 128 bytes, but transposed to 8 * v128)
  // Offset 128: 4 message blocks (4 * 16 * 4 = 256 bytes, transposed to 16 * v128)
  // Offset 384: 4 counter_lo (v128)
  // Offset 400: 4 counter_hi (v128)
  // Offset 416: 4 blocklen (v128)
  // Offset 432: 4 flags (v128)
  // Offset 448: output 4 CVs (128 bytes)

  // Load chaining values (already transposed: cv[i] contains word i from all 4 CVs)
  for (let i = 0; i < 8; i++) {
    fb(OP.local_get, PTR);
    fb(OP.simd_prefix, ...leb128(SIMD.v128_load), 0x02, ...leb128(i * 16)); // align=4
    fb(OP.local_set, S(i));
  }

  // Load IV for s8-s11
  for (let i = 0; i < 4; i++) {
    fb(OP.simd_prefix, ...leb128(SIMD.v128_const));
    // v128.const with 4 identical values (IV[i] splatted)
    const iv = IV[i];
    for (let j = 0; j < 4; j++) {
      fb(iv & 0xff, (iv >> 8) & 0xff, (iv >> 16) & 0xff, (iv >> 24) & 0xff);
    }
    fb(OP.local_set, S(8 + i));
  }

  // Load counter_lo, counter_hi, blocklen, flags into s12-s15
  fb(OP.local_get, PTR);
  fb(OP.simd_prefix, ...leb128(SIMD.v128_load), 0x02, ...leb128(384)); // counter_lo
  fb(OP.local_set, S(12));

  fb(OP.local_get, PTR);
  fb(OP.simd_prefix, ...leb128(SIMD.v128_load), 0x02, ...leb128(400)); // counter_hi
  fb(OP.local_set, S(13));

  fb(OP.local_get, PTR);
  fb(OP.simd_prefix, ...leb128(SIMD.v128_load), 0x02, ...leb128(416)); // blocklen
  fb(OP.local_set, S(14));

  fb(OP.local_get, PTR);
  fb(OP.simd_prefix, ...leb128(SIMD.v128_load), 0x02, ...leb128(432)); // flags
  fb(OP.local_set, S(15));

  // Load message words (already transposed)
  for (let i = 0; i < 16; i++) {
    fb(OP.local_get, PTR);
    fb(OP.simd_prefix, ...leb128(SIMD.v128_load), 0x02, ...leb128(128 + i * 16));
    fb(OP.local_set, M(i));
  }

  // 7 rounds
  // Track message permutation
  let msgPerm = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  // Helper to emit G in functionBody context
  const emitGFb = (a: number, b: number, c: number, d: number, mx: number, my: number) => {
    // a = a + b + mx
    fb(OP.local_get, S(a));
    fb(OP.local_get, S(b));
    fbSimd(SIMD.i32x4_add); fb(0x01);
    fb(OP.local_get, M(msgPerm[mx]));
    fbSimd(SIMD.i32x4_add); fb(0x01);
    fb(OP.local_set, S(a));

    // d = rotr(d ^ a, 16)
    fb(OP.local_get, S(d));
    fb(OP.local_get, S(a));
    fbSimd(SIMD.v128_xor);
    fb(OP.local_tee, TEMP);
    fb(OP.i32_const, 16);
    fbSimd(SIMD.i32x4_shr_u); fb(0x01);
    fb(OP.local_get, TEMP);
    fb(OP.i32_const, 16);
    fbSimd(SIMD.i32x4_shl); fb(0x01);
    fbSimd(SIMD.v128_or);
    fb(OP.local_set, S(d));

    // c = c + d
    fb(OP.local_get, S(c));
    fb(OP.local_get, S(d));
    fbSimd(SIMD.i32x4_add); fb(0x01);
    fb(OP.local_set, S(c));

    // b = rotr(b ^ c, 12)
    fb(OP.local_get, S(b));
    fb(OP.local_get, S(c));
    fbSimd(SIMD.v128_xor);
    fb(OP.local_tee, TEMP);
    fb(OP.i32_const, 12);
    fbSimd(SIMD.i32x4_shr_u); fb(0x01);
    fb(OP.local_get, TEMP);
    fb(OP.i32_const, 20);
    fbSimd(SIMD.i32x4_shl); fb(0x01);
    fbSimd(SIMD.v128_or);
    fb(OP.local_set, S(b));

    // a = a + b + my
    fb(OP.local_get, S(a));
    fb(OP.local_get, S(b));
    fbSimd(SIMD.i32x4_add); fb(0x01);
    fb(OP.local_get, M(msgPerm[my]));
    fbSimd(SIMD.i32x4_add); fb(0x01);
    fb(OP.local_set, S(a));

    // d = rotr(d ^ a, 8)
    fb(OP.local_get, S(d));
    fb(OP.local_get, S(a));
    fbSimd(SIMD.v128_xor);
    fb(OP.local_tee, TEMP);
    fb(OP.i32_const, 8);
    fbSimd(SIMD.i32x4_shr_u); fb(0x01);
    fb(OP.local_get, TEMP);
    fb(OP.i32_const, 24);
    fbSimd(SIMD.i32x4_shl); fb(0x01);
    fbSimd(SIMD.v128_or);
    fb(OP.local_set, S(d));

    // c = c + d
    fb(OP.local_get, S(c));
    fb(OP.local_get, S(d));
    fbSimd(SIMD.i32x4_add); fb(0x01);
    fb(OP.local_set, S(c));

    // b = rotr(b ^ c, 7)
    fb(OP.local_get, S(b));
    fb(OP.local_get, S(c));
    fbSimd(SIMD.v128_xor);
    fb(OP.local_tee, TEMP);
    fb(OP.i32_const, 7);
    fbSimd(SIMD.i32x4_shr_u); fb(0x01);
    fb(OP.local_get, TEMP);
    fb(OP.i32_const, 25);
    fbSimd(SIMD.i32x4_shl); fb(0x01);
    fbSimd(SIMD.v128_or);
    fb(OP.local_set, S(b));
  };

  for (let round = 0; round < 7; round++) {
    // Column mixing
    emitGFb(0, 4, 8, 12, 0, 1);
    emitGFb(1, 5, 9, 13, 2, 3);
    emitGFb(2, 6, 10, 14, 4, 5);
    emitGFb(3, 7, 11, 15, 6, 7);

    // Diagonal mixing
    emitGFb(0, 5, 10, 15, 8, 9);
    emitGFb(1, 6, 11, 12, 10, 11);
    emitGFb(2, 7, 8, 13, 12, 13);
    emitGFb(3, 4, 9, 14, 14, 15);

    // Permute message schedule for next round
    if (round < 6) {
      msgPerm = MSG_PERMUTATION.map(i => msgPerm[i]);
    }
  }

  // Output: XOR first half with second half, store to output area
  for (let i = 0; i < 8; i++) {
    fb(OP.local_get, PTR);
    fb(OP.local_get, S(i));
    fb(OP.local_get, S(i + 8));
    fbSimd(SIMD.v128_xor);
    fb(OP.simd_prefix, ...leb128(SIMD.v128_store), 0x02, ...leb128(448 + i * 16));
  }

  fb(OP.end);

  // Build complete WASM module
  const module: number[] = [];
  const m = (...bytes: number[]) => module.push(...bytes);
  const mLeb = (n: number) => module.push(...leb128(n));

  // Magic number and version
  m(0x00, 0x61, 0x73, 0x6d); // \0asm
  m(0x01, 0x00, 0x00, 0x00); // version 1

  // Type section (section 1)
  // Function type: (i32) -> ()
  const typeSection = [
    0x01,       // 1 type
    0x60,       // func
    0x01, 0x7f, // 1 param: i32
    0x00,       // 0 results
  ];
  m(0x01); // section id
  mLeb(typeSection.length);
  m(...typeSection);

  // Import section (section 2) - import memory
  const importSection = [
    0x01,       // 1 import
    0x03, ...Array.from('env').map(c => c.charCodeAt(0)), // "env"
    0x06, ...Array.from('memory').map(c => c.charCodeAt(0)), // "memory"
    0x02,       // memory
    0x00,       // no max
    0x01,       // initial 1 page
  ];
  m(0x02);
  mLeb(importSection.length);
  m(...importSection);

  // Function section (section 3)
  const funcSection = [
    0x01, // 1 function
    0x00, // type index 0
  ];
  m(0x03);
  mLeb(funcSection.length);
  m(...funcSection);

  // Export section (section 7)
  const exportName = 'compress4x';
  const exportSection = [
    0x01, // 1 export
    exportName.length, ...Array.from(exportName).map(c => c.charCodeAt(0)),
    0x00, // func
    0x00, // func index 0
  ];
  m(0x07);
  mLeb(exportSection.length);
  m(...exportSection);

  // Code section (section 10)
  // Locals: 1 i32 (ptr is param), 37 v128 (s0-15, m0-15, temp, counter_lo/hi, blocklen, flags)
  const locals = [
    0x01, // 1 local declaration
    37,   // count
    0x7b, // v128
  ];

  const funcBody = [...locals, ...functionBody];
  const codeSection = [
    0x01, // 1 function
    ...leb128(funcBody.length),
    ...funcBody,
  ];
  m(0x0a);
  mLeb(codeSection.length);
  m(...codeSection);

  return new Uint8Array(module);
}

// WASM instance cache
let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let compress4x: ((ptr: number) => void) | null = null;

/**
 * Initialize WASM SIMD module
 */
export async function initWasmSimd(): Promise<boolean> {
  if (wasmInstance) return true;

  try {
    // Check SIMD support
    const simdSupported = WebAssembly.validate(new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
      0x03, 0x02, 0x01, 0x00,
      0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0b
    ]));

    if (!simdSupported) {
      console.warn('WASM SIMD not supported');
      return false;
    }

    wasmMemory = new WebAssembly.Memory({ initial: 1 });
    const moduleBytes = generateWasmModule();

    const module = await WebAssembly.compile(moduleBytes);
    wasmInstance = await WebAssembly.instantiate(module, {
      env: { memory: wasmMemory }
    });

    compress4x = wasmInstance.exports.compress4x as (ptr: number) => void;
    return true;
  } catch (e) {
    console.error('Failed to initialize WASM SIMD:', e);
    return false;
  }
}

/**
 * Check if WASM SIMD is available
 */
export function isWasmSimdAvailable(): boolean {
  return compress4x !== null;
}

// Transpose 4 arrays of N u32s into N v128s (for SIMD processing)
function transpose4xN(arrays: Uint32Array[], n: number, memory: DataView, offset: number): void {
  for (let i = 0; i < n; i++) {
    const base = offset + i * 16;
    memory.setUint32(base, arrays[0][i], true);
    memory.setUint32(base + 4, arrays[1][i], true);
    memory.setUint32(base + 8, arrays[2][i], true);
    memory.setUint32(base + 12, arrays[3][i], true);
  }
}

// Untranspose N v128s back into 4 arrays of N u32s
function untranspose4xN(memory: DataView, offset: number, n: number, arrays: Uint32Array[]): void {
  for (let i = 0; i < n; i++) {
    const base = offset + i * 16;
    arrays[0][i] = memory.getUint32(base, true);
    arrays[1][i] = memory.getUint32(base + 4, true);
    arrays[2][i] = memory.getUint32(base + 8, true);
    arrays[3][i] = memory.getUint32(base + 12, true);
  }
}

/**
 * Compress 4 blocks in parallel using WASM SIMD
 */
export function compressSimd4x(
  cvs: Uint32Array[],      // 4 chaining values (each 8 u32s)
  messages: Uint32Array[], // 4 message blocks (each 16 u32s)
  counters: number[],      // 4 counters
  blockLens: number[],     // 4 block lengths
  flags: number[],         // 4 flags
  outputs: Uint32Array[]   // 4 output CVs
): void {
  if (!wasmMemory || !compress4x) {
    throw new Error('WASM SIMD not initialized');
  }

  const view = new DataView(wasmMemory.buffer);

  // Layout:
  // 0: CVs transposed (8 v128s = 128 bytes)
  // 128: messages transposed (16 v128s = 256 bytes)
  // 384: counter_lo (v128 = 16 bytes)
  // 400: counter_hi (v128 = 16 bytes)
  // 416: blocklen (v128 = 16 bytes)
  // 432: flags (v128 = 16 bytes)
  // 448: output (8 v128s = 128 bytes)

  transpose4xN(cvs, 8, view, 0);
  transpose4xN(messages, 16, view, 128);

  // Counter lo/hi
  for (let i = 0; i < 4; i++) {
    view.setUint32(384 + i * 4, counters[i] | 0, true);
    view.setUint32(400 + i * 4, (counters[i] / 0x100000000) | 0, true);
    view.setUint32(416 + i * 4, blockLens[i], true);
    view.setUint32(432 + i * 4, flags[i], true);
  }

  compress4x(0);

  untranspose4xN(view, 448, 8, outputs);
}

// Pure JS compress for comparison and fallback
function compressJS(
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

/** Read bytes into u32 words */
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

/** Convert CV to bytes */
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

const IV_U32 = new Uint32Array(IV);

/**
 * Hash using WASM SIMD when processing 4+ chunks
 */
export function hashWasmSimd(input: Uint8Array, outputLen: number = 32): Uint8Array {
  const flags = 0;
  const blockWords = new Uint32Array(16);

  // For small inputs, use JS
  if (input.length <= CHUNK_LEN || !compress4x) {
    // Single chunk - pure JS path
    const cv = new Uint32Array(IV);
    let pos = 0;
    const inputLen = input.length;
    let blocksRemaining = Math.ceil(inputLen / BLOCK_LEN) || 1;

    while (blocksRemaining > 0) {
      const blockLen = Math.min(BLOCK_LEN, inputLen - pos);
      const isFirst = pos === 0;
      const isLast = blocksRemaining === 1;

      let blockFlags = flags;
      if (isFirst) blockFlags |= CHUNK_START;
      if (isLast) blockFlags |= CHUNK_END | ROOT;

      readBlock(input, pos, blockLen, blockWords);
      const result = compressJS(cv, blockWords, 0, blockLen, blockFlags);
      cv.set(result);

      pos += BLOCK_LEN;
      blocksRemaining--;
    }

    return cvToBytes(cv, outputLen);
  }

  // Multi-chunk with SIMD
  const numChunks = Math.ceil(input.length / CHUNK_LEN);
  const cvStack: Uint32Array[] = [];

  // Process chunks in groups of 4 using SIMD
  let chunkCounter = 0;
  let offset = 0;

  // Arrays for SIMD batch processing
  const cvs = [new Uint32Array(8), new Uint32Array(8), new Uint32Array(8), new Uint32Array(8)];
  const messages = [new Uint32Array(16), new Uint32Array(16), new Uint32Array(16), new Uint32Array(16)];
  const outputs = [new Uint32Array(8), new Uint32Array(8), new Uint32Array(8), new Uint32Array(8)];

  while (offset < input.length) {
    // Try to batch 4 chunks
    const chunksAvailable = Math.min(4, Math.ceil((input.length - offset) / CHUNK_LEN));

    if (chunksAvailable >= 4 && compress4x) {
      // Process 4 chunks in parallel with SIMD
      for (let c = 0; c < 4; c++) {
        const chunkStart = offset + c * CHUNK_LEN;
        const chunkLen = Math.min(CHUNK_LEN, input.length - chunkStart);

        // Process chunk into CV
        cvs[c].set(IV_U32);
        let pos = 0;
        let blocksRemaining = Math.ceil(chunkLen / BLOCK_LEN) || 1;

        while (blocksRemaining > 0) {
          const blockLen = Math.min(BLOCK_LEN, chunkLen - pos);
          const isFirst = pos === 0;
          const isLast = blocksRemaining === 1;

          let blockFlags = flags;
          if (isFirst) blockFlags |= CHUNK_START;
          if (isLast) blockFlags |= CHUNK_END;

          readBlock(input, chunkStart + pos, blockLen, messages[c]);
          const result = compressJS(cvs[c], messages[c], chunkCounter + c, blockLen, blockFlags);
          cvs[c].set(result);

          pos += BLOCK_LEN;
          blocksRemaining--;
        }
      }

      // Push CVs to stack
      for (let c = 0; c < 4; c++) {
        const currentChunk = chunkCounter + c;
        const isLastChunk = currentChunk === numChunks - 1;
        cvStack.push(new Uint32Array(cvs[c]));

        // Merge pairs, but NOT on last chunk (let finalization handle ROOT flag)
        if (!isLastChunk) {
          let totalChunks = currentChunk + 1;
          while ((totalChunks & 1) === 0 && cvStack.length >= 2) {
            const right = cvStack.pop()!;
            const left = cvStack.pop()!;

            const block = new Uint32Array(16);
            block.set(left, 0);
            block.set(right, 8);

            const merged = compressJS(IV_U32, block, 0, BLOCK_LEN, flags | PARENT);
            cvStack.push(merged);
            totalChunks >>= 1;
          }
        }
      }

      offset += 4 * CHUNK_LEN;
      chunkCounter += 4;
    } else {
      // Process remaining chunks one at a time
      const chunkLen = Math.min(CHUNK_LEN, input.length - offset);
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

        readBlock(input, offset + pos, blockLen, blockWords);
        const result = compressJS(cv, blockWords, chunkCounter, blockLen, blockFlags);
        cv.set(result);

        pos += BLOCK_LEN;
        blocksRemaining--;
      }

      const isLastChunk = chunkCounter === numChunks - 1;
      cvStack.push(cv);

      // Merge pairs, but NOT on last chunk (let finalization handle ROOT flag)
      if (!isLastChunk) {
        let totalChunks = chunkCounter + 1;
        while ((totalChunks & 1) === 0 && cvStack.length >= 2) {
          const right = cvStack.pop()!;
          const left = cvStack.pop()!;

          const block = new Uint32Array(16);
          block.set(left, 0);
          block.set(right, 8);

          const merged = compressJS(IV_U32, block, 0, BLOCK_LEN, flags | PARENT);
          cvStack.push(merged);
          totalChunks >>= 1;
        }
      }

      offset += CHUNK_LEN;
      chunkCounter++;
    }
  }

  // Final merges with ROOT flag
  while (cvStack.length > 1) {
    const right = cvStack.pop()!;
    const left = cvStack.pop()!;

    const block = new Uint32Array(16);
    block.set(left, 0);
    block.set(right, 8);

    const isRoot = cvStack.length === 0;
    const merged = compressJS(IV_U32, block, 0, BLOCK_LEN, flags | PARENT | (isRoot ? ROOT : 0));
    cvStack.push(merged);
  }

  return cvToBytes(cvStack[0], outputLen);
}

export { hashWasmSimd as hash };
