# @rotko/blake3

Pure JS Blake3 (~250 MB/s).

**Demo:** https://blake3.rotko.net

```js
import { blake3 } from '@rotko/blake3';

blake3(new Uint8Array([1, 2, 3]));  // Uint8Array
blake3.hex('hello world');          // hex string
blake3('data', 64);                 // custom length
```

MIT
