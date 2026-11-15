# Changelog

## 1.5.0

Transaction version 2 (fork 14: view tags and single-key CLSAG). The public API stays backward
compatible and transaction building stays version 1 unless version 2 is requested.

### Added

- Version 2 transactions in `Transaction.from` / `toBuffer`: tagged outputs (type `0x03`: key and one
  view-tag byte; `KeyOutput` takes an optional `viewTag`, `OutputType.TAGGED_KEY`,
  `TransactionOutputs.isKeyOutput`) and one CLSAG signature per key input in the new
  `Transaction.clsagSignatures` (`TransactionSignatures.ClsagSignature`, wire layout
  `s_0 .. s_{n-1} || c1`). The signature section is parsed by transaction version; the
  "remaining bytes divisible by 64" heuristic is kept for versions 0 and 1 only.
- Version 2 coinbase transactions in `Block.from`.
- Building version 2: `createTransaction`, `createTransactionStructure` and `prepareTransaction`
  take an optional trailing `options` argument (`Interfaces.TransactionOptions`: `version`,
  `transactionPrivateKey`, `sortInputs`, `clsagRandomness`). Version 2 outputs carry
  `view_tag(8·r·A, i)`, every input is signed with CLSAG over the prefix hash and verified, and the
  inputs keep the order given (as the Rust wallet core builds them). `completeTransaction` signs a
  prepared version 2 transaction.
- `mixin` may be one number per input, so rings of different sizes can be built.
- `CryptoNote.deriveViewTag`, `generateClsagSignature`, `checkClsagSignature`; `hasClsagSupport()`.
  CLSAG needs kryptokrona-crypto 1.1.0 or later (`clsagSign` / `clsagVerify`); the view tag uses
  kryptokrona-crypto's `deriveViewTag` when present and a TypeScript implementation otherwise.
- View-tag pre-check in `scanTransactionOutputs` / `isOurTransactionOutput` for outputs with
  `viewTag` (`Interfaces.Output.viewTag`); one key derivation per transaction in
  `scanTransactionOutputs`.
- `MixinLimit` / `MixinLimits` with the mainnet table (`MixinLimits.defaults()`), including the
  1 250 000 limit (mixin 1 to 5, default 5).
- Tests with the fork-14 vectors of the Rust node (`test/txv2.test.ts`, `test/vectors/`).

### Fixed

- `Transaction.hash()` and `prefixHash()` no longer apply Monero's version 2 coinbase rule
  (`... || bc36789e...`) to version 2 transactions: Kryptokrona transaction ids are
  `cn_fast_hash(blob)` for every version. The rule now applies only to the merge-mining parent
  block's miner transaction (`ParentBlock.minerTransactionHash()`, used by `Block`).
- Block major versions 6 and 7 use CN-Turtle-Lite v2 proof of work like version 5 (they were mapped
  to TurtleCoin's Chukwa).
- `scanTransactionOutputs` rejected as soon as one output was not ours (`.catch()` without a
  handler); it now returns the outputs that are ours.
- Rings are built strictly increasing in global index with each index once: a decoy repeating an
  index already in the ring, or at the real output's index, is skipped (the node resolves a ring as
  the sorted set of its indexes). If fewer distinct decoys remain than the mixin, building fails with
  "There are not enough distinct random outputs to mix with". Applies to `CryptoNote` and `LedgerNote`.
- The parser refuses transaction versions above 2 and blobs that end inside a key, key image or
  extra field instead of reading short values.

### Unchanged / version 1 only

- Version 1 serialization, hashing and building are byte for byte as before.
- Ledger (`LedgerNote`) and multisig (`Multisig`) signing support version 1 only and throw for
  version 2.
