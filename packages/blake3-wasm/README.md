# @rotko/blake3-wasm

Rust Blake3 compiled to WASM with Rayon multi-threading.

**Demo:** https://blake3.rotko.net

```js
import { init, blake3, blake3Parallel } from '@rotko/blake3-wasm';

await init();           // or init(8) for 8 threads
blake3(data);           // single-threaded
blake3Parallel(data);   // multi-threaded
```

Requires COOP/COEP headers for multi-threading.

MIT
