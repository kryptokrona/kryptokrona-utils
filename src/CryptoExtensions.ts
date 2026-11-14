// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

/**
 * Adapter for the transaction version 2 (fork 14) primitives of kryptokrona-crypto:
 * view tags and single-key CLSAG signatures. Every call to those primitives goes through this
 * file, so a change of the kryptokrona-crypto interface is a change here only.
 *
 * kryptokrona-crypto `Crypto` methods used (hex strings, 64 hex characters per key or scalar):
 *
 *   clsagSign(prefix_hash: string, ring: string[], private_ephemeral: string, real_output_index: number,
 *             alpha?: string, decoy_responses?: string[]): Promise<{ c1: string, s: string[] }>
 *     ring = the public keys in transaction order (ascending global index), real_output_index = position
 *     of the signer in it, private_ephemeral = x with x*G = ring[real_output_index]; alpha and
 *     decoy_responses are the optional explicit randomness (decoy responses in consumption order
 *     s_{l+1} .. s_{n-1}, s_0 .. s_{l-1}), as xkr_crypto::clsag_sign_with_randomness takes them.
 *
 *   clsagVerify(prefix_hash: string, ring: string[], key_image: string, c1: string, s: string[]): Promise<boolean>
 *
 *   deriveViewTag(derivation: string, output_index: number): Promise<string>
 *     the view tag as two lowercase hexadecimal characters
 *
 * When the loaded kryptokrona-crypto lacks a method, the user crypto overrides (ICryptoConfig) of the
 * same name are called directly, with kryptokrona-crypto's override convention: clsagSign always gets
 * six arguments (alpha '' and decoy_responses [] for fresh randomness). The view tag has a
 * TypeScript fallback (one cn_fast_hash).
 */

import { TransactionOutputs, TransactionSignatures, TurtleCoinCrypto } from './Types';
import { Writer } from '@turtlecoin/bytestream';

/**
 * The 8 ASCII bytes "view_tag" (no terminator): the domain separator of the view tag hash
 * @ignore
 */
export const VIEW_TAG_DOMAIN = '766965775f746167';

/**
 * Explicit CLSAG signing randomness (deterministic signing, test vectors)
 */
export interface IClsagRandomness {
    /**
     * The nonce alpha (scalar, 64 hex characters)
     */
    alpha: string;
    /**
     * The decoy responses in consumption order s_{l+1} .. s_{n-1}, s_0 .. s_{l-1} (n - 1 scalars)
     */
    decoyResponses: string[];
}

/** @ignore */
function isHex64 (value: any): boolean {
    return typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value);
}

/** @ignore */
interface ICryptoFunction {
    /**
     * Whether the function is a user override called directly (kryptokrona-crypto lacks the method)
     */
    override: boolean;
    call: (...args: any[]) => Promise<any>;
}

/** @ignore */
function cryptoFunction (name: string): ICryptoFunction | undefined {
    const crypto: any = TurtleCoinCrypto;

    if (typeof crypto[name] === 'function') {
        return { override: false, call: (...args: any[]) => crypto[name](...args) };
    }

    let overrides: any;

    try {
        overrides = crypto.userCryptoFunctions;
    } catch {
        overrides = undefined;
    }

    if (overrides && typeof overrides[name] === 'function') {
        return { override: true, call: (...args: any[]) => Promise.resolve(overrides[name](...args)) };
    }

    return undefined;
}

/**
 * Whether the loaded cryptographic library provides CLSAG signing and verification
 */
export function hasClsagSupport (): boolean {
    return cryptoFunction('clsagSign') !== undefined && cryptoFunction('clsagVerify') !== undefined;
}

/**
 * The view tag computed in TypeScript: the first byte of cn_fast_hash("view_tag" || derivation || varint(index))
 * @param derivation the key derivation (8*r*A = 8*a*R)
 * @param outputIndex the index of the output in the transaction
 * @returns the view tag as two lowercase hexadecimal characters
 */
export async function deriveViewTagFallback (derivation: string, outputIndex: number): Promise<string> {
    if (!isHex64(derivation)) {
        throw new Error('Invalid derivation found');
    }

    if (!Number.isInteger(outputIndex) || outputIndex < 0) {
        throw new RangeError('Invalid output index found');
    }

    const writer = new Writer();

    writer.hex(VIEW_TAG_DOMAIN);

    writer.hash(derivation.toLowerCase());

    writer.varint(outputIndex);

    const hash = await TurtleCoinCrypto.cn_fast_hash(writer.blob);

    return hash.substring(0, 2).toLowerCase();
}

/**
 * Computes the view tag of output `outputIndex` for the given key derivation, through
 * kryptokrona-crypto's deriveViewTag when available, otherwise in TypeScript
 * @param derivation the key derivation (8*r*A = 8*a*R)
 * @param outputIndex the index of the output in the transaction
 * @returns the view tag as two lowercase hexadecimal characters
 */
export async function deriveViewTag (derivation: string, outputIndex: number): Promise<string> {
    const func = cryptoFunction('deriveViewTag');

    if (func) {
        try {
            return TransactionOutputs.normalizeViewTag(await func.call(derivation, outputIndex));
        } catch {
            /* fall through to the TypeScript implementation */
        }
    }

    return deriveViewTagFallback(derivation, outputIndex);
}

/**
 * Generates a single-key CLSAG signature over the supplied message
 * @param prefixHash the message (the transaction prefix hash)
 * @param ring the ring public keys in transaction order (ascending global index)
 * @param secretKey the private ephemeral of the output being spent
 * @param realIndex the position of the output being spent in the ring
 * @param [randomness] explicit signing randomness (tests); random if omitted
 * @returns the signature
 */
export async function clsagSign (
    prefixHash: string,
    ring: string[],
    secretKey: string,
    realIndex: number,
    randomness?: IClsagRandomness
): Promise<TransactionSignatures.ClsagSignature> {
    const func = cryptoFunction('clsagSign');

    if (!func) {
        throw new Error('The cryptographic library does not provide clsagSign: ' +
            'transaction version 2 needs kryptokrona-crypto 1.1.0 or later');
    }

    if (!isHex64(prefixHash)) {
        throw new Error('Invalid prefix hash found');
    }

    if (!Array.isArray(ring) || ring.length === 0) {
        throw new Error('The ring must contain at least one public key');
    }

    if (!Number.isInteger(realIndex) || realIndex < 0 || realIndex >= ring.length) {
        throw new RangeError('Invalid real index found');
    }

    if (randomness && randomness.decoyResponses.length !== ring.length - 1) {
        throw new RangeError('CLSAG randomness must contain exactly ring size - 1 decoy responses');
    }

    const args: any[] = [
        prefixHash.toLowerCase(), ring.map((key) => key.toLowerCase()), secretKey.toLowerCase(), realIndex];

    if (randomness) {
        args.push(randomness.alpha.toLowerCase(), randomness.decoyResponses.map((s) => s.toLowerCase()));
    } else if (func.override) {
        /* kryptokrona-crypto's override convention for fresh randomness */
        args.push('', []);
    }

    const signature = await func.call(...args);

    if (!signature || !Array.isArray(signature.s) || signature.s.length !== ring.length ||
        !signature.s.every(isHex64) || !isHex64(signature.c1)) {
        throw new Error('The cryptographic library returned a malformed CLSAG signature');
    }

    return new TransactionSignatures.ClsagSignature(
        signature.s.map((s: string) => s.toLowerCase()),
        signature.c1.toLowerCase());
}

/**
 * Verifies a single-key CLSAG signature
 * @param prefixHash the message (the transaction prefix hash)
 * @param ring the ring public keys in transaction order (ascending global index)
 * @param keyImage the key image of the input
 * @param signature the signature
 * @returns whether the signature is valid; false for malformed inputs
 */
export async function clsagVerify (
    prefixHash: string,
    ring: string[],
    keyImage: string,
    signature: TransactionSignatures.IClsagSignature
): Promise<boolean> {
    const func = cryptoFunction('clsagVerify');

    if (!func) {
        throw new Error('The cryptographic library does not provide clsagVerify: ' +
            'transaction version 2 needs kryptokrona-crypto 1.1.0 or later');
    }

    try {
        return (await func.call(
            prefixHash.toLowerCase(),
            ring.map((key) => key.toLowerCase()),
            keyImage.toLowerCase(),
            signature.c1.toLowerCase(),
            signature.s.map((s) => s.toLowerCase()))) === true;
    } catch {
        return false;
    }
}
