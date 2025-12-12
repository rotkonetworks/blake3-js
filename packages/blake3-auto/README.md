# @rotko/blake3-auto

Auto-selects fastest Blake3 backend (WASM+Rayon > WASM > JS).

**Demo:** https://blake3.rotko.net

```js
import { init, blake3, getBackend } from '@rotko/blake3-auto';

await init();
blake3(data);
getBackend();  // 'wasm-rayon', 'wasm', or 'js'
```

MIT
