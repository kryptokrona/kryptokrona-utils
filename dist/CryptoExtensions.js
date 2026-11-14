"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clsagVerify = exports.clsagSign = exports.deriveViewTag = exports.deriveViewTagFallback = exports.hasClsagSupport = exports.VIEW_TAG_DOMAIN = void 0;
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
const Types_1 = require("./Types");
const bytestream_1 = require("@turtlecoin/bytestream");
/**
 * The 8 ASCII bytes "view_tag" (no terminator): the domain separator of the view tag hash
 * @ignore
 */
exports.VIEW_TAG_DOMAIN = '766965775f746167';
/** @ignore */
function isHex64(value) {
    return typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value);
}
/** @ignore */
function cryptoFunction(name) {
    const crypto = Types_1.TurtleCoinCrypto;
    if (typeof crypto[name] === 'function') {
        return { override: false, call: (...args) => crypto[name](...args) };
    }
    let overrides;
    try {
        overrides = crypto.userCryptoFunctions;
    }
    catch (_a) {
        overrides = undefined;
    }
    if (overrides && typeof overrides[name] === 'function') {
        return { override: true, call: (...args) => Promise.resolve(overrides[name](...args)) };
    }
    return undefined;
}
/**
 * Whether the loaded cryptographic library provides CLSAG signing and verification
 */
function hasClsagSupport() {
    return cryptoFunction('clsagSign') !== undefined && cryptoFunction('clsagVerify') !== undefined;
}
exports.hasClsagSupport = hasClsagSupport;
/**
 * The view tag computed in TypeScript: the first byte of cn_fast_hash("view_tag" || derivation || varint(index))
 * @param derivation the key derivation (8*r*A = 8*a*R)
 * @param outputIndex the index of the output in the transaction
 * @returns the view tag as two lowercase hexadecimal characters
 */
function deriveViewTagFallback(derivation, outputIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isHex64(derivation)) {
            throw new Error('Invalid derivation found');
        }
        if (!Number.isInteger(outputIndex) || outputIndex < 0) {
            throw new RangeError('Invalid output index found');
        }
        const writer = new bytestream_1.Writer();
        writer.hex(exports.VIEW_TAG_DOMAIN);
        writer.hash(derivation.toLowerCase());
        writer.varint(outputIndex);
        const hash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(writer.blob);
        return hash.substring(0, 2).toLowerCase();
    });
}
exports.deriveViewTagFallback = deriveViewTagFallback;
/**
 * Computes the view tag of output `outputIndex` for the given key derivation, through
 * kryptokrona-crypto's deriveViewTag when available, otherwise in TypeScript
 * @param derivation the key derivation (8*r*A = 8*a*R)
 * @param outputIndex the index of the output in the transaction
 * @returns the view tag as two lowercase hexadecimal characters
 */
function deriveViewTag(derivation, outputIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        const func = cryptoFunction('deriveViewTag');
        if (func) {
            try {
                return Types_1.TransactionOutputs.normalizeViewTag(yield func.call(derivation, outputIndex));
            }
            catch (_a) {
                /* fall through to the TypeScript implementation */
            }
        }
        return deriveViewTagFallback(derivation, outputIndex);
    });
}
exports.deriveViewTag = deriveViewTag;
/**
 * Generates a single-key CLSAG signature over the supplied message
 * @param prefixHash the message (the transaction prefix hash)
 * @param ring the ring public keys in transaction order (ascending global index)
 * @param secretKey the private ephemeral of the output being spent
 * @param realIndex the position of the output being spent in the ring
 * @param [randomness] explicit signing randomness (tests); random if omitted
 * @returns the signature
 */
function clsagSign(prefixHash, ring, secretKey, realIndex, randomness) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const args = [
            prefixHash.toLowerCase(), ring.map((key) => key.toLowerCase()), secretKey.toLowerCase(), realIndex
        ];
        if (randomness) {
            args.push(randomness.alpha.toLowerCase(), randomness.decoyResponses.map((s) => s.toLowerCase()));
        }
        else if (func.override) {
            /* kryptokrona-crypto's override convention for fresh randomness */
            args.push('', []);
        }
        const signature = yield func.call(...args);
        if (!signature || !Array.isArray(signature.s) || signature.s.length !== ring.length ||
            !signature.s.every(isHex64) || !isHex64(signature.c1)) {
            throw new Error('The cryptographic library returned a malformed CLSAG signature');
        }
        return new Types_1.TransactionSignatures.ClsagSignature(signature.s.map((s) => s.toLowerCase()), signature.c1.toLowerCase());
    });
}
exports.clsagSign = clsagSign;
/**
 * Verifies a single-key CLSAG signature
 * @param prefixHash the message (the transaction prefix hash)
 * @param ring the ring public keys in transaction order (ascending global index)
 * @param keyImage the key image of the input
 * @param signature the signature
 * @returns whether the signature is valid; false for malformed inputs
 */
function clsagVerify(prefixHash, ring, keyImage, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        const func = cryptoFunction('clsagVerify');
        if (!func) {
            throw new Error('The cryptographic library does not provide clsagVerify: ' +
                'transaction version 2 needs kryptokrona-crypto 1.1.0 or later');
        }
        try {
            return (yield func.call(prefixHash.toLowerCase(), ring.map((key) => key.toLowerCase()), keyImage.toLowerCase(), signature.c1.toLowerCase(), signature.s.map((s) => s.toLowerCase()))) === true;
        }
        catch (_a) {
            return false;
        }
    });
}
exports.clsagVerify = clsagVerify;
