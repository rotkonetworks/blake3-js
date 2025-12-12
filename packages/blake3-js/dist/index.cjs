"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  blake3: () => blake3,
  default: () => index_default,
  deriveKey: () => deriveKey,
  keyedHash: () => keyedHash
});
module.exports = __toCommonJS(index_exports);
var IV = new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var BLOCK_LEN = 64;
var CHUNK_LEN = 1024;
var CHUNK_START = 1;
var CHUNK_END = 2;
var PARENT = 4;
var ROOT = 8;
var IS_LE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
var blockBuf = new Uint32Array(16);
function compress(cv, m, counter, blockLen, flags) {
  let s0 = cv[0] | 0, s1 = cv[1] | 0, s2 = cv[2] | 0, s3 = cv[3] | 0;
  let s4 = cv[4] | 0, s5 = cv[5] | 0, s6 = cv[6] | 0, s7 = cv[7] | 0;
  let s8 = 1779033703, s9 = 3144134277, s10 = 1013904242, s11 = 2773480762;
  let s12 = counter | 0, s13 = counter / 4294967296 | 0;
  let s14 = blockLen | 0, s15 = flags | 0;
  let m0 = m[0] | 0, m1 = m[1] | 0, m2 = m[2] | 0, m3 = m[3] | 0;
  let m4 = m[4] | 0, m5 = m[5] | 0, m6 = m[6] | 0, m7 = m[7] | 0;
  let m8 = m[8] | 0, m9 = m[9] | 0, m10 = m[10] | 0, m11 = m[11] | 0;
  let m12 = m[12] | 0, m13 = m[13] | 0, m14 = m[14] | 0, m15 = m[15] | 0;
  for (let i = 0; i < 7; ++i) {
    s0 = (s0 + s4 | 0) + m0 | 0;
    s12 ^= s0;
    s12 = s12 >>> 16 | s12 << 16;
    s8 = s8 + s12 | 0;
    s4 ^= s8;
    s4 = s4 >>> 12 | s4 << 20;
    s0 = (s0 + s4 | 0) + m1 | 0;
    s12 ^= s0;
    s12 = s12 >>> 8 | s12 << 24;
    s8 = s8 + s12 | 0;
    s4 ^= s8;
    s4 = s4 >>> 7 | s4 << 25;
    s1 = (s1 + s5 | 0) + m2 | 0;
    s13 ^= s1;
    s13 = s13 >>> 16 | s13 << 16;
    s9 = s9 + s13 | 0;
    s5 ^= s9;
    s5 = s5 >>> 12 | s5 << 20;
    s1 = (s1 + s5 | 0) + m3 | 0;
    s13 ^= s1;
    s13 = s13 >>> 8 | s13 << 24;
    s9 = s9 + s13 | 0;
    s5 ^= s9;
    s5 = s5 >>> 7 | s5 << 25;
    s2 = (s2 + s6 | 0) + m4 | 0;
    s14 ^= s2;
    s14 = s14 >>> 16 | s14 << 16;
    s10 = s10 + s14 | 0;
    s6 ^= s10;
    s6 = s6 >>> 12 | s6 << 20;
    s2 = (s2 + s6 | 0) + m5 | 0;
    s14 ^= s2;
    s14 = s14 >>> 8 | s14 << 24;
    s10 = s10 + s14 | 0;
    s6 ^= s10;
    s6 = s6 >>> 7 | s6 << 25;
    s3 = (s3 + s7 | 0) + m6 | 0;
    s15 ^= s3;
    s15 = s15 >>> 16 | s15 << 16;
    s11 = s11 + s15 | 0;
    s7 ^= s11;
    s7 = s7 >>> 12 | s7 << 20;
    s3 = (s3 + s7 | 0) + m7 | 0;
    s15 ^= s3;
    s15 = s15 >>> 8 | s15 << 24;
    s11 = s11 + s15 | 0;
    s7 ^= s11;
    s7 = s7 >>> 7 | s7 << 25;
    s0 = (s0 + s5 | 0) + m8 | 0;
    s15 ^= s0;
    s15 = s15 >>> 16 | s15 << 16;
    s10 = s10 + s15 | 0;
    s5 ^= s10;
    s5 = s5 >>> 12 | s5 << 20;
    s0 = (s0 + s5 | 0) + m9 | 0;
    s15 ^= s0;
    s15 = s15 >>> 8 | s15 << 24;
    s10 = s10 + s15 | 0;
    s5 ^= s10;
    s5 = s5 >>> 7 | s5 << 25;
    s1 = (s1 + s6 | 0) + m10 | 0;
    s12 ^= s1;
    s12 = s12 >>> 16 | s12 << 16;
    s11 = s11 + s12 | 0;
    s6 ^= s11;
    s6 = s6 >>> 12 | s6 << 20;
    s1 = (s1 + s6 | 0) + m11 | 0;
    s12 ^= s1;
    s12 = s12 >>> 8 | s12 << 24;
    s11 = s11 + s12 | 0;
    s6 ^= s11;
    s6 = s6 >>> 7 | s6 << 25;
    s2 = (s2 + s7 | 0) + m12 | 0;
    s13 ^= s2;
    s13 = s13 >>> 16 | s13 << 16;
    s8 = s8 + s13 | 0;
    s7 ^= s8;
    s7 = s7 >>> 12 | s7 << 20;
    s2 = (s2 + s7 | 0) + m13 | 0;
    s13 ^= s2;
    s13 = s13 >>> 8 | s13 << 24;
    s8 = s8 + s13 | 0;
    s7 ^= s8;
    s7 = s7 >>> 7 | s7 << 25;
    s3 = (s3 + s4 | 0) + m14 | 0;
    s14 ^= s3;
    s14 = s14 >>> 16 | s14 << 16;
    s9 = s9 + s14 | 0;
    s4 ^= s9;
    s4 = s4 >>> 12 | s4 << 20;
    s3 = (s3 + s4 | 0) + m15 | 0;
    s14 ^= s3;
    s14 = s14 >>> 8 | s14 << 24;
    s9 = s9 + s14 | 0;
    s4 ^= s9;
    s4 = s4 >>> 7 | s4 << 25;
    if (i < 6) {
      const t0 = m0, t1 = m1;
      m0 = m2;
      m2 = m3;
      m3 = m10;
      m10 = m12;
      m12 = m9;
      m9 = m11;
      m11 = m5;
      m5 = t0;
      m1 = m6;
      m6 = m4;
      m4 = m7;
      m7 = m13;
      m13 = m14;
      m14 = m15;
      m15 = m8;
      m8 = t1;
    }
  }
  return new Uint32Array([
    s0 ^ s8,
    s1 ^ s9,
    s2 ^ s10,
    s3 ^ s11,
    s4 ^ s12,
    s5 ^ s13,
    s6 ^ s14,
    s7 ^ s15
  ]);
}
function readBlock(input, offset, length, out) {
  out.fill(0);
  const end = Math.min(offset + length, input.length);
  let wi = 0;
  let i = offset;
  while (i + 4 <= end) {
    out[wi++] = input[i] | input[i + 1] << 8 | input[i + 2] << 16 | input[i + 3] << 24;
    i += 4;
  }
  if (i < end) {
    let word = 0;
    let shift = 0;
    while (i < end) {
      word |= input[i++] << shift;
      shift += 8;
    }
    out[wi] = word;
  }
}
function readBlockLE(input, offset, out) {
  const abs = input.byteOffset + offset;
  if (IS_LE && (abs & 3) === 0 && offset + 64 <= input.length) {
    out.set(new Uint32Array(input.buffer, abs, 16));
    return true;
  }
  return false;
}
function cvToBytes(cv, len) {
  const result = new Uint8Array(len);
  for (let i = 0; i < Math.min(8, Math.ceil(len / 4)); i++) {
    const w = cv[i];
    const b = i * 4;
    if (b < len) result[b] = w & 255;
    if (b + 1 < len) result[b + 1] = w >> 8 & 255;
    if (b + 2 < len) result[b + 2] = w >> 16 & 255;
    if (b + 3 < len) result[b + 3] = w >> 24 & 255;
  }
  return result;
}
function processChunk(input, start, len, counter, flags) {
  const cv = new Uint32Array(IV);
  let pos = 0;
  let blocks = Math.ceil(len / BLOCK_LEN) || 1;
  while (blocks > 0) {
    const bLen = Math.min(BLOCK_LEN, len - pos);
    let bf = flags;
    if (pos === 0) bf |= CHUNK_START;
    if (blocks === 1) bf |= CHUNK_END;
    if (bLen === BLOCK_LEN && readBlockLE(input, start + pos, blockBuf)) {
    } else {
      readBlock(input, start + pos, bLen, blockBuf);
    }
    cv.set(compress(cv, blockBuf, counter, bLen, bf));
    pos += BLOCK_LEN;
    blocks--;
  }
  return cv;
}
function mergeParents(left, right, flags, isRoot) {
  const block = new Uint32Array(16);
  block.set(left, 0);
  block.set(right, 8);
  return compress(IV, block, 0, BLOCK_LEN, flags | PARENT | (isRoot ? ROOT : 0));
}
function blake3(input, outputLength = 32) {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const flags = 0;
  if (data.length <= CHUNK_LEN) {
    const cv = new Uint32Array(IV);
    let pos = 0;
    let blocks = Math.ceil(data.length / BLOCK_LEN) || 1;
    while (blocks > 0) {
      const bLen = Math.min(BLOCK_LEN, data.length - pos);
      let bf = flags;
      if (pos === 0) bf |= CHUNK_START;
      if (blocks === 1) bf |= CHUNK_END | ROOT;
      if (bLen === BLOCK_LEN && readBlockLE(data, pos, blockBuf)) {
      } else {
        readBlock(data, pos, bLen, blockBuf);
      }
      cv.set(compress(cv, blockBuf, 0, bLen, bf));
      pos += BLOCK_LEN;
      blocks--;
    }
    return cvToBytes(cv, outputLength);
  }
  const numChunks = Math.ceil(data.length / CHUNK_LEN);
  const cvStack = [];
  for (let c = 0; c < numChunks; c++) {
    const start = c * CHUNK_LEN;
    const len = Math.min(CHUNK_LEN, data.length - start);
    cvStack.push(processChunk(data, start, len, c, flags));
    if (c < numChunks - 1) {
      let totalChunks = c + 1;
      while ((totalChunks & 1) === 0 && cvStack.length >= 2) {
        const right = cvStack.pop();
        const left = cvStack.pop();
        cvStack.push(mergeParents(left, right, flags, false));
        totalChunks >>= 1;
      }
    }
  }
  while (cvStack.length > 1) {
    const right = cvStack.pop();
    const left = cvStack.pop();
    cvStack.push(mergeParents(left, right, flags, cvStack.length === 0));
  }
  return cvToBytes(cvStack[0], outputLength);
}
blake3.hex = function(input, outputLength = 32) {
  const hash = blake3(input, outputLength);
  return Array.from(hash).map((b) => b.toString(16).padStart(2, "0")).join("");
};
function keyedHash(key, input) {
  if (key.length !== 32) {
    throw new Error("Key must be exactly 32 bytes");
  }
  throw new Error("Keyed hash not yet implemented");
}
function deriveKey(context, keyMaterial, outputLength = 32) {
  throw new Error("Key derivation not yet implemented");
}
var index_default = blake3;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  blake3,
  deriveKey,
  keyedHash
});
