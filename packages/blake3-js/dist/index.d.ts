/**
 * @aspect/blake3 - High-performance Blake3 hash for JavaScript
 *
 * Optimized pure JS implementation using techniques from:
 * - SMI (Small Integer) optimizations for V8
 * - Inlined message permutation
 * - Little-endian fast path
 * - Buffer reuse
 *
 * @module @aspect/blake3
 */
/**
 * Hash data using Blake3
 *
 * @param input - Data to hash (Uint8Array or string)
 * @param outputLength - Output length in bytes (default: 32)
 * @returns Hash as Uint8Array
 *
 * @example
 * ```ts
 * import { blake3 } from '@aspect/blake3';
 *
 * const hash = blake3(new Uint8Array([1, 2, 3]));
 * const hashHex = blake3.hex('hello world');
 * ```
 */
declare function blake3(input: Uint8Array | string, outputLength?: number): Uint8Array;
declare namespace blake3 {
    var hex: (input: Uint8Array | string, outputLength?: number) => string;
}
/**
 * Keyed hash (MAC mode)
 * @param key - 32-byte key
 * @param input - Data to hash
 */
declare function keyedHash(key: Uint8Array, input: Uint8Array | string): Uint8Array;
/**
 * Key derivation function
 * @param context - Context string
 * @param keyMaterial - Input key material
 * @param outputLength - Desired output length
 */
declare function deriveKey(context: string, keyMaterial: Uint8Array, outputLength?: number): Uint8Array;

export { blake3, blake3 as default, deriveKey, keyedHash };
