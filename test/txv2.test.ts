// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

/* Transaction version 2 (fork 14): view tags and single-key CLSAG.
   The vectors in ./vectors are byte-identical copies of the xkr repository's docs/test-vectors
   (see ./vectors/README.md); the Rust implementation is normative. */

import {
    Address,
    Block,
    Crypto,
    CryptoNote,
    Interfaces,
    KeyOutput,
    MixinLimit,
    MixinLimits,
    ParentBlock,
    Transaction,
    TransactionInputs,
    TransactionOutputs,
    TransactionSignatures,
    hasClsagSupport
} from '../src';
import { deriveViewTagFallback } from '../src/CryptoExtensions';
import * as assert from 'assert';
import { before, describe, it } from 'mocha';
import { Writer } from '@turtlecoin/bytestream';

const TurtleCoinCrypto = new Crypto();
const cnUtil = new CryptoNote();

const layoutVectors = require('./vectors/tx-v2-layout.json');
const transactionVectors = require('./vectors/tx-v2-transactions.json');
const viewTagVectors = require('./vectors/tx-v2-view-tags.json');
const clsagVectors = require('./vectors/tx-v2-clsag.json');

/* Monero's version 2 coinbase id tail: cn_fast_hash(0x00) || 0^32 */
const MONERO_COINBASE_SUFFIX = 'bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a' +
    '0000000000000000000000000000000000000000000000000000000000000000';

/** Whether kryptokrona-crypto honours explicit CLSAG randomness (needed for byte-exact signatures) */
let clsagRandomnessSupported = false;

function wallet (name: string): any {
    const result = transactionVectors.wallets.find((w: any) => w.name === name);

    assert(result, 'unknown wallet ' + name);

    return result;
}

function sum (values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
}

/* The inputs of a transfer vector as this library's wallet scan returns them (with key image and
   private ephemeral), in the vector's (transaction) order */
async function ownedInputs (vector: any): Promise<Interfaces.Output[]> {
    const result: Interfaces.Output[] = [];

    for (const vin of vector.inputs) {
        const owner = wallet(vin.received.wallet);

        const output = await cnUtil.isOurTransactionOutput(
            vin.received.tx_public_key,
            {
                key: vin.key,
                index: vin.received.output_index,
                globalIndex: vin.global_index,
                amount: vin.amount
            },
            owner.view_secret,
            owner.spend_public,
            owner.spend_secret);

        assert.strictEqual(output.keyImage, vin.key_image);
        assert.strictEqual((output.input) ? output.input.privateEphemeral : undefined, vin.secret);

        result.push(output);
    }

    return result;
}

/* Destinations in the order given, then the change, each split into denominations */
async function destinations (vector: any): Promise<Interfaces.GeneratedOutput[]> {
    let outputs: Interfaces.GeneratedOutput[] = [];

    for (const destination of vector.destinations) {
        outputs = outputs.concat(await cnUtil.generateTransactionOutputs(destination.address, destination.amount));
    }

    const change = sum(vector.inputs.map((vin: any) => vin.amount)) -
        sum(vector.destinations.map((d: any) => d.amount)) - vector.fee;

    if (change > 0) {
        outputs = outputs.concat(await cnUtil.generateTransactionOutputs(vector.change_address, change));
    }

    return outputs;
}

function randomOutputs (vector: any): Interfaces.RandomOutput[][] {
    return vector.inputs.map((vin: any) =>
        vin.decoys.map((decoy: any) => ({ globalIndex: decoy.global_index, key: decoy.key })));
}

function buildOptions (vector: any, withRandomness: boolean): Interfaces.TransactionOptions {
    return {
        version: vector.version,
        transactionPrivateKey: vector.tx_secret_key,
        /* The vectors list the inputs in transaction order (the Rust builder keeps the caller's order) */
        sortInputs: false,
        clsagRandomness: (vector.version === 2 && withRandomness)
            ? vector.inputs.map((vin: any) => ({ alpha: vin.alpha, decoyResponses: vin.decoy_responses }))
            : undefined
    };
}

async function buildTransfer (vector: any, withRandomness: boolean): Promise<Transaction> {
    return cnUtil.createTransaction(
        await destinations(vector),
        await ownedInputs(vector),
        randomOutputs(vector),
        vector.inputs.map((vin: any) => vin.decoys.length),
        vector.fee,
        undefined,
        vector.unlock_time,
        (vector.hugin_data) ? Buffer.from(vector.hugin_data, 'hex') : undefined,
        buildOptions(vector, withRandomness));
}

function ringKeys (vin: any): string[] {
    return vin.ring.map((member: any) => member.key);
}

/* Everything up to the signatures must match the vector byte for byte */
async function checkPrefix (tx: Transaction, vector: any): Promise<void> {
    assert.strictEqual(tx.version, vector.version);
    assert.strictEqual(tx.extra.toString('hex'), vector.extra);
    assert.strictEqual(tx.publicKey, vector.tx_public_key);

    assert.strictEqual(tx.inputs.length, vector.inputs.length);

    for (let i = 0; i < tx.inputs.length; i++) {
        const input = tx.inputs[i] as TransactionInputs.KeyInput;

        assert.strictEqual(input.amount.toJSNumber(), vector.inputs[i].amount);
        assert.strictEqual(input.keyImage, vector.inputs[i].key_image);
        assert.deepStrictEqual(input.keyOffsets.map((offset) => offset.toJSNumber()), vector.inputs[i].key_offsets);
    }

    assert.strictEqual(tx.outputs.length, vector.outputs.length);

    for (let i = 0; i < tx.outputs.length; i++) {
        const output = tx.outputs[i] as KeyOutput;

        assert.strictEqual(output.amount.toJSNumber(), vector.outputs[i].amount);
        assert.strictEqual(output.key, vector.outputs[i].key);
        assert.strictEqual(output.viewTag, vector.outputs[i].view_tag || undefined);
    }

    assert.strictEqual(tx.prefix, vector.prefix);
    assert.strictEqual(await tx.prefixHash(), vector.prefix_hash);
}

/* The scan results of the vector: found outputs and the view-tag statistics (ScanStats) */
async function checkScan (vector: any, scan: any): Promise<void> {
    const owner = wallet(scan.wallet);

    const outputs: Interfaces.Output[] = vector.outputs.map((output: any, index: number) => ({
        key: output.key,
        index,
        globalIndex: 0,
        amount: output.amount,
        viewTag: output.view_tag || undefined
    }));

    const found = await cnUtil.scanTransactionOutputs(
        vector.tx_public_key, outputs, owner.view_secret, owner.spend_public, owner.spend_secret);

    assert.deepStrictEqual(found.map((output) => output.index), scan.found.map((f: any) => f.index));
    assert.deepStrictEqual(found.map((output) => output.amount), scan.found.map((f: any) => f.amount));
    assert.deepStrictEqual(found.map((output) => output.key), scan.found.map((f: any) => f.key));
    assert.deepStrictEqual(found.map((output) => output.keyImage), scan.found.map((f: any) => f.key_image));
    assert.deepStrictEqual(found.map((output) => output.viewTag), scan.found.map((f: any) => f.view_tag || undefined));

    /* full_checks = untagged outputs plus tagged outputs whose tag matches; the rest is skipped by tag */
    const derivation = await TurtleCoinCrypto.generateKeyDerivation(vector.tx_public_key, owner.view_secret);

    let tagged = 0;
    let fullChecks = 0;

    for (const output of outputs) {
        if (output.viewTag) {
            tagged++;

            if (await cnUtil.deriveViewTag(derivation, output.index) === output.viewTag) {
                fullChecks++;
            }
        } else {
            fullChecks++;
        }
    }

    assert.strictEqual(outputs.length, scan.stats.outputs);
    assert.strictEqual(tagged, scan.stats.tagged);
    assert.strictEqual(fullChecks, scan.stats.full_checks);
    assert.strictEqual(outputs.length - fullChecks, scan.stats.skipped_by_tag);
}

/* A version 2 transfer: rebuilt from keys, decoys and randomness, byte for byte */
async function checkVersion2Transfer (vector: any): Promise<void> {
    const tx = await buildTransfer(vector, clsagRandomnessSupported);

    await checkPrefix(tx, vector);

    assert.strictEqual(tx.signatures.length, 0);
    assert.strictEqual(tx.clsagSignatures.length, vector.inputs.length);

    for (let i = 0; i < vector.inputs.length; i++) {
        const vin = vector.inputs[i];

        assert.strictEqual(tx.clsagSignatures[i].s.length, vin.ring.length);

        assert(await cnUtil.checkClsagSignature(
            vector.prefix_hash, ringKeys(vin), vin.key_image, tx.clsagSignatures[i]));

        if (clsagRandomnessSupported) {
            assert.deepStrictEqual(tx.clsagSignatures[i].s, vin.clsag.s);
            assert.strictEqual(tx.clsagSignatures[i].c1, vin.clsag.c1);
        }
    }

    if (!clsagRandomnessSupported) {
        /* Structural equality: the vector's signatures in our transaction give the vector blob */
        tx.clsagSignatures = vector.inputs.map((vin: any) =>
            new TransactionSignatures.ClsagSignature(vin.clsag.s, vin.clsag.c1));
    }

    assert.strictEqual(tx.toString(), vector.blob);
    assert.strictEqual(await tx.hash(), vector.hash);
}

/* A version 1 transfer: the prefix is byte for byte; the ring signatures are random inside
   kryptokrona-crypto (only k can be fixed), so they are verified instead */
async function checkVersion1Transfer (vector: any): Promise<void> {
    const tx = await buildTransfer(vector, false);

    await checkPrefix(tx, vector);

    assert.strictEqual(tx.clsagSignatures.length, 0);
    assert.strictEqual(tx.signatures.length, vector.inputs.length);

    for (let i = 0; i < vector.inputs.length; i++) {
        const vin = vector.inputs[i];

        assert(await TurtleCoinCrypto.checkRingSignatures(
            vector.prefix_hash, vin.key_image, ringKeys(vin), tx.signatures[i]));
    }

    assert.strictEqual(tx.toString().length, vector.blob.length);
}

async function checkVersion1Blob (vector: any): Promise<void> {
    const tx = await Transaction.from(vector.blob);

    assert.strictEqual(tx.toString(), vector.blob);
    assert.strictEqual(await tx.hash(), vector.hash);
    assert.strictEqual(await tx.prefixHash(), vector.prefix_hash);

    for (let i = 0; i < vector.inputs.length; i++) {
        const vin = vector.inputs[i];

        const expected = vin.ring_signature.map((sig: any) => sig.c + sig.r);

        assert.deepStrictEqual(tx.signatures[i], expected);

        assert(await TurtleCoinCrypto.checkRingSignatures(vector.prefix_hash, vin.key_image, ringKeys(vin), expected));
    }
}

async function checkVersion2Blob (vector: any): Promise<void> {
    const tx = await Transaction.from(vector.blob);

    assert.strictEqual(tx.toString(), vector.blob);
    assert.strictEqual(tx.prefix, vector.prefix);
    assert.strictEqual(await tx.hash(), vector.hash);
    assert.strictEqual(await tx.prefixHash(), vector.prefix_hash);
    assert.strictEqual(tx.signatures.length, 0);

    for (let i = 0; i < vector.inputs.length; i++) {
        assert.deepStrictEqual(tx.clsagSignatures[i].s, vector.inputs[i].clsag.s);
        assert.strictEqual(tx.clsagSignatures[i].c1, vector.inputs[i].clsag.c1);
    }

    for (let i = 0; i < vector.outputs.length; i++) {
        assert.strictEqual((tx.outputs[i] as KeyOutput).viewTag, vector.outputs[i].view_tag);
        assert.strictEqual(tx.outputs[i].type, TransactionOutputs.OutputType.TAGGED_KEY);
    }
}

describe('Transaction version 2', async function () {
    this.timeout(120000);

    before('probe the CLSAG support of kryptokrona-crypto', async () => {
        if (!hasClsagSupport()) {
            console.warn('kryptokrona-crypto has no clsagSign/clsagVerify: CLSAG tests are skipped');

            return;
        }

        /* A ring of size > 1, so that the decoy responses matter */
        const v = clsagVectors.vectors.find((vector: any) => vector.ring_size > 1);

        try {
            const signature = await cnUtil.generateClsagSignature(
                v.message, v.ring, v.secret, v.signer_index, v.key_image,
                { alpha: v.alpha, decoyResponses: v.decoy_responses });

            clsagRandomnessSupported = signature.c1 === v.c1 && signature.s.join() === v.s.join();
        } catch {
            clsagRandomnessSupported = false;
        }

        if (!clsagRandomnessSupported) {
            console.warn('kryptokrona-crypto clsagSign ignores explicit randomness: ' +
                'CLSAG signatures are verified and checked structurally, not byte for byte');
        }
    });

    describe('Layout vectors', async () => {
        for (const vector of layoutVectors.valid) {
            it('round-trips ' + vector.name, async () => {
                const tx = await Transaction.from(vector.blob);

                assert.strictEqual(tx.version, vector.version);
                assert.strictEqual(tx.toString(), vector.blob);
                assert.strictEqual(tx.prefix, vector.prefix);
                assert.strictEqual(await tx.hash(), vector.hash);
                assert.strictEqual(await tx.prefixHash(), vector.prefix_hash);
                assert.strictEqual(vector.blob.length / 2 - vector.prefix.length / 2, vector.signature_section_len);

                for (const output of tx.outputs) {
                    assert.strictEqual(output.type, TransactionOutputs.OutputType.TAGGED_KEY);
                    assert(TransactionOutputs.isKeyOutput(output));
                    assert((output as KeyOutput).isTagged);
                }

                const signatureBytes = tx.clsagSignatures.reduce((total, sig) => total + 32 * (sig.s.length + 1), 0);

                assert.strictEqual(signatureBytes, vector.signature_section_len);
                assert.strictEqual(tx.signatures.length, 0);
            });

            it('serializes ' + vector.name + ' from constructed objects', async () => {
                const parsed = await Transaction.from(vector.blob);

                const tx = new Transaction();

                tx.version = parsed.version;
                tx.unlockTime = parsed.unlockTime;

                for (const input of parsed.inputs) {
                    if (input.type === TransactionInputs.InputType.COINBASE) {
                        tx.inputs.push(new TransactionInputs.CoinbaseInput(
                            (input as TransactionInputs.CoinbaseInput).blockIndex));
                    } else {
                        const keyInput = input as TransactionInputs.KeyInput;
                        tx.inputs.push(new TransactionInputs.KeyInput(
                            keyInput.amount, keyInput.keyOffsets, keyInput.keyImage));
                    }
                }

                for (const output of parsed.outputs) {
                    const keyOutput = output as KeyOutput;
                    tx.outputs.push(new KeyOutput(keyOutput.amount, keyOutput.key, keyOutput.viewTag));
                }

                await tx.parseExtra(parsed.extra);

                tx.clsagSignatures = parsed.clsagSignatures.map((sig) =>
                    new TransactionSignatures.ClsagSignature(sig.s.slice(), sig.c1));

                assert.strictEqual(tx.toString(), vector.blob);
                assert.strictEqual(await tx.hash(), vector.hash);
                assert.strictEqual(await tx.prefixHash(), vector.prefix_hash);
            });
        }

        it('v2_spend has the expected structure', async () => {
            const vector = layoutVectors.valid.find((v: any) => v.name === 'v2_spend');

            const tx = await Transaction.from(vector.blob);

            assert.deepStrictEqual(tx.clsagSignatures.map((sig) => sig.s.length), [3, 1]);
            assert.deepStrictEqual(tx.outputs.map((output) => (output as KeyOutput).viewTag), ['ab', '00']);
        });

        for (const vector of layoutVectors.invalid) {
            it('refuses ' + vector.name + ' (' + vector.error + ')', async () => {
                await assert.rejects(Transaction.from(vector.blob));
            });
        }

        it('refuses mixed signature kinds when serializing', async () => {
            const vector = layoutVectors.valid.find((v: any) => v.name === 'v2_spend');

            const tx = await Transaction.from(vector.blob);

            tx.signatures = [['00'.repeat(64)]];

            assert.throws(() => tx.toString());

            tx.signatures = [];

            tx.clsagSignatures[1] = new TransactionSignatures.ClsagSignature(
                tx.clsagSignatures[1].s.concat([tx.clsagSignatures[1].c1]), tx.clsagSignatures[1].c1);

            assert.throws(() => tx.toString());

            const v1 = await Transaction.from(transactionVectors.v1_twin.blob);

            v1.clsagSignatures = [new TransactionSignatures.ClsagSignature(['00'.repeat(32)], '00'.repeat(32))];

            assert.throws(() => v1.toString());
        });

        it('refuses transaction versions above 2', async () => {
            const vector = layoutVectors.valid.find((v: any) => v.name === 'v2_coinbase');

            await assert.rejects(Transaction.from('03' + vector.blob.substring(2)));
        });
    });

    describe('Hashes', async () => {
        it('a version 2 transaction id is cn_fast_hash(blob)', async () => {
            for (const vector of layoutVectors.valid) {
                assert.strictEqual(await TurtleCoinCrypto.cn_fast_hash(vector.blob), vector.hash);
                assert.strictEqual(await TurtleCoinCrypto.cn_fast_hash(vector.prefix), vector.prefix_hash);
                assert.strictEqual(await (await Transaction.from(vector.blob)).hash(), vector.hash);
            }
        });

        it('the Monero coinbase rule applies only to the merge-mining parent miner transaction', async () => {
            const parent = new ParentBlock();

            parent.minerTransaction.version = 2;
            parent.minerTransaction.inputs.push(new TransactionInputs.CoinbaseInput(10));
            parent.minerTransaction.outputs.push(new KeyOutput(1000, '09'.repeat(32)));

            const prefixHash = await TurtleCoinCrypto.cn_fast_hash(parent.minerTransaction.toString(true));

            const expected = await TurtleCoinCrypto.cn_fast_hash(prefixHash + MONERO_COINBASE_SUFFIX);

            assert.strictEqual(await parent.minerTransactionHash(), expected);

            assert.strictEqual(
                await parent.minerTransaction.hash(),
                await TurtleCoinCrypto.cn_fast_hash(parent.minerTransaction.toString()));

            parent.minerTransaction.version = 1;

            assert.strictEqual(
                await parent.minerTransactionHash(),
                await TurtleCoinCrypto.cn_fast_hash(parent.minerTransaction.toString()));
        });
    });

    describe('Blocks', async () => {
        const BlockTemplateSample = require('./template.json');

        it('parses and re-serializes a block whose coinbase is version 2', async () => {
            const vector = transactionVectors.v2_coinbase;

            const block = await Block.from(BlockTemplateSample.blob);

            block.majorVersion = 7;
            block.minerTransaction = await Transaction.from(vector.blob);

            const blob = block.toString();

            const parsed = await Block.from(blob);

            assert.strictEqual(parsed.toString(), blob);
            assert.strictEqual(parsed.majorVersion, 7);
            assert.strictEqual(parsed.minerTransaction.version, 2);
            assert.strictEqual(parsed.minerTransaction.toString(), vector.blob);
            assert.strictEqual(await parsed.minerTransaction.hash(), vector.hash);
            assert.strictEqual(parsed.height, vector.height);
            assert.deepStrictEqual(
                parsed.minerTransaction.outputs.map((output) => (output as KeyOutput).viewTag),
                vector.outputs.map((output: any) => output.view_tag));

            const treeHash = await parsed.transactionTreeHash();

            assert.strictEqual(
                treeHash.hash, await TurtleCoinCrypto.tree_hash([vector.hash].concat(parsed.transactions)));
        });

        it('refuses a version 2 coinbase with untagged outputs and a version 1 coinbase with tagged outputs',
            async () => {
                const vector = transactionVectors.v2_coinbase;

                const block = await Block.from(BlockTemplateSample.blob);

                block.majorVersion = 7;
                block.minerTransaction = await Transaction.from(vector.blob);

                const blob = block.toString();

                /* version, unlock time, one coinbase input, 7 outputs, amount 2, then the output tag */
                const tagOffset = '02d58db70101ffc18db7010702'.length;

                assert.strictEqual(vector.blob.substring(0, tagOffset), '02d58db70101ffc18db7010702');
                assert.strictEqual(vector.blob.substring(tagOffset, tagOffset + 2), '03');

                const untagged = vector.blob.substring(0, tagOffset) + '02' + vector.blob.substring(tagOffset + 2);

                await assert.rejects(Block.from(blob.replace(vector.blob, untagged)));

                const version1 = '01' + vector.blob.substring(2);

                await assert.rejects(Block.from(blob.replace(vector.blob, version1)));
            });

        for (const major of [6, 7]) {
            it('uses CN-Turtle-Lite v2 proof of work for block major ' + major, async () => {
                const block = await Block.from(BlockTemplateSample.blob);

                block.majorVersion = major;

                const expected = await TurtleCoinCrypto.cn_turtle_lite_slow_hash_v2(await block.toHashingString(true));

                assert.strictEqual(await block.longHash(), expected);
            });
        }
    });

    describe('View tags', async () => {
        it('matches the 70 Monero vectors', async () => {
            assert.strictEqual(viewTagVectors.monero.length, 70);

            for (const vector of viewTagVectors.monero) {
                assert.strictEqual(await cnUtil.deriveViewTag(vector.derivation, vector.index), vector.view_tag);
                assert.strictEqual(await deriveViewTagFallback(vector.derivation, vector.index), vector.view_tag);
            }
        });

        it('uses the domain "view_tag" without terminator', async () => {
            assert.strictEqual(Buffer.from('view_tag').toString('hex'), viewTagVectors.salt);
        });

        for (const vector of viewTagVectors.transactions) {
            const name = vector.wallet + ' with transaction key ' + vector.tx_public_key.substring(0, 8);

            it('matches ' + name, async () => {
                const owner = viewTagVectors.wallets.find((w: any) => w.name === vector.wallet);

                /* Sender: 8*r*A; recipient: 8*a*R */
                assert.strictEqual(
                    await TurtleCoinCrypto.generateKeyDerivation(owner.view_public, vector.tx_secret_key),
                    vector.derivation);
                assert.strictEqual(
                    await TurtleCoinCrypto.generateKeyDerivation(vector.tx_public_key, owner.view_secret),
                    vector.derivation);
                assert.strictEqual(
                    await TurtleCoinCrypto.secretKeyToPublicKey(vector.tx_secret_key), vector.tx_public_key);

                for (const tag of vector.tags) {
                    const writer = new Writer();

                    writer.varint(tag.index);

                    assert.strictEqual(writer.blob, tag.index_varint);
                    assert.strictEqual(await cnUtil.deriveViewTag(vector.derivation, tag.index), tag.view_tag);
                    assert.strictEqual(await deriveViewTagFallback(vector.derivation, tag.index), tag.view_tag);
                }
            });
        }

        it('KeyOutput carries the view tag', async () => {
            const key = '09'.repeat(32);

            const tagged = new KeyOutput(1000, key, 0x5e);

            assert.strictEqual(tagged.viewTag, '5e');
            assert.strictEqual(tagged.type, TransactionOutputs.OutputType.TAGGED_KEY);
            assert.strictEqual(tagged.toString(), 'e80703' + key + '5e');
            assert.strictEqual(new KeyOutput(1000, key, 'AB').viewTag, 'ab');

            const untagged = new KeyOutput(1000, key);

            assert.strictEqual(untagged.viewTag, undefined);
            assert.strictEqual(untagged.type, TransactionOutputs.OutputType.KEY);
            assert.strictEqual(untagged.toString(), 'e80702' + key);

            assert.throws(() => new KeyOutput(1000, key, 'zz'));
            assert.throws(() => new KeyOutput(1000, key, 256));
            assert.throws(() => new KeyOutput(1000, key, '5e5e'));
        });

        it('a wrong view tag hides an output, a missing one takes the full check', async () => {
            const vector = transactionVectors.v2_spend;
            const recipient = wallet('recipient');
            const found = vector.scans.find((scan: any) => scan.wallet === 'recipient').found[0];

            const output = (viewTag?: string): Interfaces.Output => ({
                key: found.key, index: found.index, globalIndex: 0, amount: found.amount, viewTag
            });

            const ours = await cnUtil.isOurTransactionOutput(
                vector.tx_public_key, output(found.view_tag), recipient.view_secret, recipient.spend_public);

            assert.strictEqual(ours.key, found.key);

            const wrongTag = ((parseInt(found.view_tag, 16) + 1) % 256).toString(16).padStart(2, '0');

            await assert.rejects(cnUtil.isOurTransactionOutput(
                vector.tx_public_key, output(wrongTag), recipient.view_secret, recipient.spend_public));

            const untagged = await cnUtil.isOurTransactionOutput(
                vector.tx_public_key, output(undefined), recipient.view_secret, recipient.spend_public);

            assert.strictEqual(untagged.key, found.key);
        });
    });

    describe('CLSAG vectors', async () => {
        for (const vector of clsagVectors.vectors) {
            it('verifies ' + vector.name, async function () {
                if (!hasClsagSupport()) {
                    this.skip();
                }

                assert.strictEqual(
                    await TurtleCoinCrypto.generateKeyImage(vector.ring[vector.signer_index], vector.secret),
                    vector.key_image);

                assert(await cnUtil.checkClsagSignature(
                    vector.message, vector.ring, vector.key_image, { s: vector.s, c1: vector.c1 }));
            });

            it('signs ' + vector.name + ' with the given randomness', async function () {
                if (!hasClsagSupport()) {
                    this.skip();
                }

                const signature = await cnUtil.generateClsagSignature(
                    vector.message, vector.ring, vector.secret, vector.signer_index, vector.key_image,
                    { alpha: vector.alpha, decoyResponses: vector.decoy_responses });

                assert.strictEqual(signature.s.length, vector.ring_size);

                if (!clsagRandomnessSupported) {
                    this.skip();
                }

                assert.deepStrictEqual(signature.s, vector.s);
                assert.strictEqual(signature.c1, vector.c1);
            });
        }

        for (const vector of clsagVectors.negative) {
            it('negative case ' + vector.name + ' gives ' + vector.expected, async function () {
                if (!hasClsagSupport()) {
                    this.skip();
                }

                const valid = await cnUtil.checkClsagSignature(
                    vector.message, vector.ring, vector.key_image, { s: vector.s, c1: vector.c1 });

                assert.strictEqual(valid, vector.expected);
            });
        }
    });

    describe('Transaction vectors', async () => {
        it('v2_spend parses and re-serializes', async () => {
            await checkVersion2Blob(transactionVectors.v2_spend);
        });

        it('v2_spend signatures verify', async function () {
            if (!hasClsagSupport()) {
                this.skip();
            }

            const vector = transactionVectors.v2_spend;

            for (const vin of vector.inputs) {
                assert(await cnUtil.checkClsagSignature(
                    vector.prefix_hash, ringKeys(vin), vin.key_image, vin.clsag));
            }
        });

        it('v2_spend is rebuilt byte for byte', async function () {
            if (!hasClsagSupport()) {
                this.skip();
            }

            await checkVersion2Transfer(transactionVectors.v2_spend);
        });

        it('v2_spend scans', async () => {
            for (const scan of transactionVectors.v2_spend.scans) {
                await checkScan(transactionVectors.v2_spend, scan);
            }
        });

        it('v2_spend prepared transaction is completed with CLSAG', async function () {
            if (!hasClsagSupport()) {
                this.skip();
            }

            const vector = transactionVectors.v2_spend;

            const prepared = await cnUtil.prepareTransaction(
                await destinations(vector),
                await ownedInputs(vector),
                randomOutputs(vector),
                vector.inputs.map((vin: any) => vin.decoys.length),
                vector.fee,
                undefined,
                vector.unlock_time,
                Buffer.from(vector.hugin_data, 'hex'),
                undefined,
                buildOptions(vector, false));

            assert.strictEqual(prepared.transaction.prefix, vector.prefix);
            assert.strictEqual(prepared.transaction.clsagSignatures.length, 0);
            assert.strictEqual(prepared.transactionPrivateKey, vector.tx_secret_key);

            for (let i = 0; i < vector.inputs.length; i++) {
                const meta = prepared.signatureMeta.find((m) => m.index === i);

                if (!meta) {
                    throw new Error('missing signature meta data for input ' + i);
                }

                assert.deepStrictEqual(meta.inputKeys, ringKeys(vector.inputs[i]));
                assert.strictEqual(meta.realOutputIndex, vector.inputs[i].real_index);
                assert.strictEqual(meta.keyImage, vector.inputs[i].key_image);
            }

            const tx = await cnUtil.completeTransaction(prepared, wallet('sender').spend_secret);

            assert.strictEqual(tx.prefix, vector.prefix);
            assert.strictEqual(tx.clsagSignatures.length, vector.inputs.length);

            for (let i = 0; i < vector.inputs.length; i++) {
                assert(await cnUtil.checkClsagSignature(
                    vector.prefix_hash, ringKeys(vector.inputs[i]), vector.inputs[i].key_image, tx.clsagSignatures[i]));
            }

            assert.strictEqual(tx.toString().length, vector.blob.length);
        });

        it('v1_twin parses and its ring signatures verify', async () => {
            await checkVersion1Blob(transactionVectors.v1_twin);
        });

        it('v1_twin is rebuilt (prefix byte for byte, ring signatures verified)', async () => {
            await checkVersion1Transfer(transactionVectors.v1_twin);
        });

        it('v1_twin has the inputs and output keys of v2_spend', async () => {
            const v1 = transactionVectors.v1_twin;
            const v2 = transactionVectors.v2_spend;

            assert.deepStrictEqual(v1.inputs.map((i: any) => i.key_image), v2.inputs.map((i: any) => i.key_image));
            assert.deepStrictEqual(v1.outputs.map((o: any) => o.key), v2.outputs.map((o: any) => o.key));
        });

        it('version 1 stays the default and sorts inputs by key image', async () => {
            const vector = transactionVectors.v1_twin;

            const prepared = await cnUtil.createTransactionStructure(
                await destinations(vector),
                (await ownedInputs(vector)).reverse(),
                randomOutputs(vector).reverse(),
                vector.inputs.map((vin: any) => vin.decoys.length).reverse(),
                vector.fee,
                undefined,
                vector.unlock_time,
                Buffer.from(vector.hugin_data, 'hex'),
                { transactionPrivateKey: vector.tx_secret_key });

            assert.strictEqual(prepared.transaction.version, 1);
            assert.strictEqual(prepared.transaction.prefix, vector.prefix);
        });

        it('v2_coinbase is rebuilt byte for byte', async () => {
            const vector = transactionVectors.v2_coinbase;

            const miner = await Address.fromAddress(vector.address);

            const tx = new Transaction();

            tx.version = 2;
            tx.unlockTime = vector.unlock_time;
            tx.inputs.push(new TransactionInputs.CoinbaseInput(vector.height));

            const derivation = await TurtleCoinCrypto.generateKeyDerivation(miner.view.publicKey, vector.tx_secret_key);

            const pieces = await cnUtil.generateTransactionOutputs(vector.address, vector.reward);

            pieces.sort((a, b) => a.amount - b.amount);

            assert.deepStrictEqual(pieces.map((piece) => piece.amount), vector.denominations);

            for (let i = 0; i < pieces.length; i++) {
                const key = await TurtleCoinCrypto.derivePublicKey(derivation, i, miner.spend.publicKey);

                const viewTag = await cnUtil.deriveViewTag(derivation, i);

                assert.strictEqual(key, vector.outputs[i].key);
                assert.strictEqual(viewTag, vector.outputs[i].view_tag);

                tx.outputs.push(new KeyOutput(pieces[i].amount, key, viewTag));
            }

            await tx.addPublicKey(vector.tx_public_key);

            assert.strictEqual(tx.extra.toString('hex'), vector.extra);
            assert.strictEqual(tx.toString(), vector.blob);
            assert.strictEqual(await tx.hash(), vector.hash);
            assert.strictEqual(await tx.prefixHash(), vector.prefix_hash);

            const parsed = await Transaction.from(vector.blob);

            assert.strictEqual(parsed.toString(), vector.blob);
            assert.strictEqual(parsed.clsagSignatures.length, 0);
            assert(parsed.isCoinbase);
            assert.strictEqual(parsed.amount, vector.reward);
        });

        it('v2_coinbase scans', async () => {
            await checkScan(transactionVectors.v2_coinbase, transactionVectors.v2_coinbase.scan);
        });

        it('mixed_history: the version 1 funding is rebuilt and parses', async () => {
            await checkVersion1Blob(transactionVectors.mixed_history.funding);
            await checkVersion1Transfer(transactionVectors.mixed_history.funding);

            for (const scan of transactionVectors.mixed_history.funding.scans) {
                await checkScan(transactionVectors.mixed_history.funding, scan);
            }
        });

        it('mixed_history: the version 2 spend is rebuilt byte for byte', async function () {
            await checkVersion2Blob(transactionVectors.mixed_history.spend);

            if (!hasClsagSupport()) {
                this.skip();
            }

            await checkVersion2Transfer(transactionVectors.mixed_history.spend);
        });

        it('mixed_history: an output received in version 1 is spent in version 2 with the same key image',
            async () => {
                const history = transactionVectors.mixed_history;
                const holder = wallet('holder');
                const funding = await Transaction.from(history.funding.blob);
                const output = funding.outputs[history.output_index] as KeyOutput;

                const ours = await cnUtil.isOurTransactionOutput(
                    history.funding.tx_public_key,
                    {
                        key: output.key,
                        index: history.output_index,
                        globalIndex: 0,
                        amount: output.amount.toJSNumber()
                    },
                    holder.view_secret,
                    holder.spend_public,
                    holder.spend_secret);

                assert.strictEqual(ours.keyImage, history.key_image);

                const spend = await Transaction.from(history.spend.blob);

                assert.strictEqual(spend.version, 2);
                assert.strictEqual((spend.inputs[0] as TransactionInputs.KeyInput).keyImage, history.key_image);
            });

        it('version 2 fees and amounts count tagged outputs', async () => {
            const vector = transactionVectors.v2_spend;

            const tx = await Transaction.from(vector.blob);

            assert.strictEqual(tx.fee, vector.fee);
            assert.strictEqual(tx.amount, sum(vector.inputs.map((vin: any) => vin.amount)));
        });

        it('refuses unknown transaction versions when building', async () => {
            const vector = transactionVectors.v2_spend;

            await assert.rejects(cnUtil.createTransactionStructure(
                await destinations(vector),
                await ownedInputs(vector),
                randomOutputs(vector),
                vector.inputs.map((vin: any) => vin.decoys.length),
                vector.fee,
                undefined,
                0,
                undefined,
                { version: 3 }));
        });
    });

    describe('Ring members', async () => {
        /* createTransactionStructure for v2_spend with the given random outputs */
        async function structure (random: Interfaces.RandomOutput[][]): Promise<Interfaces.IPreparedTransaction> {
            const vector = transactionVectors.v2_spend;

            return cnUtil.createTransactionStructure(
                await destinations(vector),
                await ownedInputs(vector),
                random,
                vector.inputs.map((vin: any) => vin.decoys.length),
                vector.fee,
                undefined,
                vector.unlock_time,
                Buffer.from(vector.hugin_data, 'hex'),
                buildOptions(vector, false));
        }

        it('skips repeated decoys and decoys at the real output, rings stay strictly increasing', async () => {
            const vector = transactionVectors.v2_spend;
            const random = randomOutputs(vector);
            const first = vector.inputs[0];

            /* The same decoy twice, the same index with another key, and the real output's index */
            random[0].push({ globalIndex: first.decoys[0].global_index, key: first.decoys[0].key });
            random[0].push({ globalIndex: first.decoys[0].global_index, key: first.key });
            random[0].push({ globalIndex: first.global_index, key: first.decoys[0].key });

            const prepared = await structure(random);

            assert.strictEqual(prepared.transaction.prefix, vector.prefix);

            for (let i = 0; i < vector.inputs.length; i++) {
                const ring = prepared.inputs[i].outputs.map((member) => member.index);

                assert.strictEqual(ring.length, vector.inputs[i].decoys.length + 1);

                for (let j = 1; j < ring.length; j++) {
                    assert(ring[j] > ring[j - 1], 'ring ' + i + ' is not strictly increasing');
                }

                const input = prepared.transaction.inputs[i] as TransactionInputs.KeyInput;

                for (let j = 1; j < input.keyOffsets.length; j++) {
                    assert(input.keyOffsets[j].greater(0), 'offset ' + j + ' of input ' + i + ' is not positive');
                }
            }
        });

        it('refuses a ring with too few distinct decoys', async () => {
            const vector = transactionVectors.v2_spend;
            const random = randomOutputs(vector);
            const first = vector.inputs[0];

            assert(first.decoys.length > 1, 'the first input needs a ring of at least three');

            /* As many decoys as needed, but one index repeated and one at the real output */
            random[0] = first.decoys.map(() => ({
                globalIndex: first.decoys[0].global_index,
                key: first.decoys[0].key
            }));
            random[0].push({ globalIndex: first.global_index, key: first.key });

            await assert.rejects(structure(random), /not enough distinct random outputs/);
        });
    });

    describe('Mixin limits', async () => {
        const limits = MixinLimits.defaults();

        const cases: [number, number, number, number][] = [
            /* height, min, max, default */
            [0, 0, 2 ** 64, 3],
            [439999, 0, 2 ** 64, 3],
            [440000, 0, 100, 100],
            [619999, 0, 100, 100],
            [620000, 7, 7, 7],
            [799999, 7, 7, 7],
            [800000, 3, 3, 3],
            [1249999, 3, 3, 3],
            [1250000, 1, 5, 5],
            [3000001, 1, 5, 5]
        ];

        for (const [height, min, max, defaultMixin] of cases) {
            it('height ' + height + ': mixin ' + min + '..' + max + ', default ' + defaultMixin, async () => {
                assert.deepStrictEqual(limits.getMixinLimitsByHeight(height), [min, max]);
                assert.strictEqual(limits.getDefaultMixinByHeight(height), defaultMixin);
            });
        }

        it('returns the newest limit regardless of the order given', async () => {
            const table = new MixinLimits([
                new MixinLimit(800000, 3),
                new MixinLimit(1250000, 1, 5, 5),
                new MixinLimit(440000, 0, 100, 3)
            ], 3);

            assert.deepStrictEqual(table.getMixinLimitsByHeight(2000000), [1, 5]);
            assert.deepStrictEqual(table.getMixinLimitsByHeight(900000), [3, 3]);
            assert.deepStrictEqual(table.getMixinLimitsByHeight(500000), [0, 100]);
            assert.strictEqual(table.getDefaultMixinByHeight(100), 3);
        });
    });
});
