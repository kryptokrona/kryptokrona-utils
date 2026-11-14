"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSignatures = void 0;
const bytestream_1 = require("@turtlecoin/bytestream");
var TransactionSignatures;
(function (TransactionSignatures) {
    /**
     * Represents a single-key CLSAG signature
     */
    class ClsagSignature {
        /**
         * Constructs a new instance from the supplied values
         * @param s the responses s_0 .. s_{n-1}
         * @param c1 the challenge c1
         */
        constructor(s, c1) {
            this.s = s;
            this.c1 = c1;
        }
        /**
         * The size of the signature in bytes: 32 * (n + 1)
         */
        get size() {
            return 32 * (this.s.length + 1);
        }
        /**
         * Represents the signature as a Buffer (s_0 .. s_{n-1} || c1)
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            return clsagSignatureToBuffer(this);
        }
        /**
         * Represents the signature as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    TransactionSignatures.ClsagSignature = ClsagSignature;
    /**
     * Serializes a CLSAG signature as `s_0 .. s_{n-1} || c1`
     * @param signature the signature
     * @returns the Buffer representation
     */
    function clsagSignatureToBuffer(signature) {
        const writer = new bytestream_1.Writer();
        for (const s of signature.s) {
            if (!isHex64(s)) {
                throw new Error('Invalid CLSAG response (s) found');
            }
            writer.hash(s);
        }
        if (!isHex64(signature.c1)) {
            throw new Error('Invalid CLSAG challenge (c1) found');
        }
        writer.hash(signature.c1);
        return writer.buffer;
    }
    TransactionSignatures.clsagSignatureToBuffer = clsagSignatureToBuffer;
    /** @ignore */
    function isHex64(value) {
        return typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value);
    }
})(TransactionSignatures = exports.TransactionSignatures || (exports.TransactionSignatures = {}));
