# Kryptokrona Utilities

## Overview
This package contains a number of different utility libraries that help with the following network and wallet based activities:

* Wallet (and Address) generation, verification, and encoding/decoding
* Block handling, construction, decoding, and ID and PoW hash calculation
* Block template handling
* Multisig operations including Multisig participant message exchanges
* RPC interations with TurtleCoind and Wallet-API
* Network P2P communication protocols (connect to the P2P network directly)
* Transaction construction facilities
* Ledger hardware wallet support
* Transaction handling, construction, decoding, hash calculations, TX_EXTRA parsing, etc
* Deterministic subwallet generation
* And much, much, more...

If you experience any issues with this library, the best way to address such situations is to submit a Pull Request to resolve the issue you are running into.

## Installation

```bash
npm install kryptokrona-utils
```

## Initialization

### TypeScript

```typescript
import {
    Address, 
    AddressPrefix, 
    Block, 
    BlockTemplate, 
    CryptoNote, 
    LevinPacket, 
    Transaction
} from 'kryptokrona-utils'
const coinUtils = new CryptoNote()
```

### Javascript

```javascript
const KryptokronaUtils = require('kryptokrona-utils')
const coinUtils = new KryptokronaUtils.CryptoNote()
```

### Browser Support

When packing for the browser with a tool like [webpack](https://webpack.js.org/) we advise that you use the ready `event` of the webpacked module to determine when the Cryptographic methods are available.

```html
<script src="KryptokronaUtils.js"></script>
<script>
  KryptokronaUtils.on('ready', () => {
    const coinUtils = new KryptokronaUtils.CryptoNote()
  })
</script>
```

## Transaction version 2 (fork 14)

From version 1.5.0 the library parses, serializes and builds Kryptokrona transaction version 2
(view tags and single-key CLSAG signatures, activated by fork 14):

* `Transaction.from` / `toString` handle version 2 blobs: tagged outputs (`KeyOutput.viewTag`,
  output type `0x03`) and one CLSAG signature per input in `Transaction.clsagSignatures`
  (`s_0 .. s_{n-1} || c1`). Version 1 transactions are unchanged.
* `Transaction.hash()` is `cn_fast_hash` of the blob and `prefixHash()` is `cn_fast_hash` of the
  prefix for every version; the prefix hash is the message the CLSAG signs. The Monero-style
  version 2 coinbase id applies only to the merge-mining parent block's miner transaction
  (`ParentBlock.minerTransactionHash()`).
* `Block.from` accepts the version 2 coinbase that blocks carry from fork 14 on. Block major
  versions 6 and 7 use the same proof of work as version 5 (CN-Turtle-Lite v2).
* Building stays version 1 unless you ask for version 2. Build the highest version the daemon lists in
  `/getinfo` `tx_versions`:

```typescript
const tx = await coinUtils.createTransaction(
    outputs, inputs, randomOutputs, mixin, fee, paymentId, unlockTime, extraData,
    { version: 2 })
```

  Version 2 inputs keep the order given (version 1 sorts them by key image), outputs are sorted by
  amount and carry `view_tag(8·r·A, i)`, and every input is signed with CLSAG over the prefix hash.
  `prepareTransaction(..., { version: 2 })` returns the unsigned version 2 transaction with the
  per-input ring, real index, key image and derivation data in `signatureMeta`;
  `completeTransaction(prepared, privateSpendKey)` signs it. Ledger and multisig signing remain
  version 1 only.
* Output scanning (`scanTransactionOutputs`, `isOurTransactionOutput`) compares the view tag first
  when an output has `viewTag` set and skips the key derivation on a mismatch; outputs without a view
  tag take the full check as before. `CryptoNote.deriveViewTag(derivation, index)` computes a tag.
* CLSAG signing and verification need kryptokrona-crypto 1.1.0 or later (`clsagSign`,
  `clsagVerify`; `hasClsagSupport()` tells whether the loaded one has them); view tags fall back to
  a TypeScript implementation.
* `MixinLimits.defaults()` is the mainnet mixin table (from height 1 250 000: mixin 1 to 5, default 5);
  the mixin limits apply to both transaction versions.

### Credits

Special thanks goes out to:

* Lucas Jones
* Paul Shapiro
* Luigi111
* [The MyMonero Project](https://github.com/mymonero/mymonero-app-js)
* The Masari Project: [gnock](https://github.com/gnock)
* The Plentum Project: [DaveLong](https://github.com/DaveLong)
