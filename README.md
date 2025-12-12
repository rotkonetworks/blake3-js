# blake3-js

High-performance Blake3 hash implementations for JavaScript/TypeScript.

**Live benchmark:** https://blake3.rotko.net

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| `@rotko/blake3` | Pure JS, optimized (~250 MB/s) | `npm i @rotko/blake3` |
| `@rotko/blake3-wasm` | Rust WASM + Rayon (multi-threaded) | `npm i @rotko/blake3-wasm` |

## Usage

```typescript
import { blake3 } from '@rotko/blake3';

// Hash bytes
const hash = blake3(new Uint8Array([1, 2, 3]));

// Hash string
const hash2 = blake3('hello world');

// Get hex string
const hex = blake3.hex('hello world');
// => "d74981efa70a0c880b8d8c1985d075dbcbf679b99a5f9914e5aaf96b831a9e24"

// Custom output length
const hash64 = blake3('data', 64);
```

## Performance

Benchmarked on typical hardware (see https://blake3.rotko.net for live results):

| Implementation | Throughput | Notes |
|----------------|------------|-------|
| Noble-hashes | ~70 MB/s | Popular, audited |
| **@rotko/blake3** | **~250 MB/s** | Pure JS, optimized |
| Rust WASM | ~90 MB/s | Single-threaded |
| **Rust WASM + Rayon** | **~400 MB/s** | Multi-threaded (4 cores) |

## Optimizations

The pure JS implementation uses techniques from [Aspect's optimization article](https://aspect.dev/blog/blazingly-fast-wyhash-js):

- SMI (Small Integer) variables for V8 optimization
- Message words as local variables (not array)
- Inlined message permutation (no temp arrays)
- Little-endian fast path for aligned reads
- Buffer reuse to reduce allocations

## Building

```bash
# JS package
cd packages/blake3-js
npm install
npm run build

# WASM package (requires Rust nightly + wasm-pack)
cd rust-wasm
rustup override set nightly
wasm-pack build --target web
```

## License

MIT
