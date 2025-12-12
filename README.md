# blake3-js

High-performance Blake3 for JavaScript.

**Demo & Benchmark:** https://blake3.rotko.net

## Packages

| Package | Description |
|---------|-------------|
| [@rotko/blake3](https://www.npmjs.com/package/@rotko/blake3) | Pure JS (~250 MB/s) |
| [@rotko/blake3-wasm](https://www.npmjs.com/package/@rotko/blake3-wasm) | Rust WASM + Rayon |
| [@rotko/blake3-auto](https://www.npmjs.com/package/@rotko/blake3-auto) | Auto-selects best |

## Usage

```js
import { blake3 } from '@rotko/blake3';

blake3(new Uint8Array([1, 2, 3]));  // Uint8Array
blake3.hex('hello world');          // hex string
```

## License

MIT
