// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Writer } from '@turtlecoin/bytestream';

export namespace TransactionSignatures {

    /**
     * A single-key CLSAG signature of one key input of a version 2 transaction (fork 14).
     * On the wire it is `s_0 .. s_{n-1} || c1` (32 bytes each), where n is the ring size of the input.
     * The legacy (version 0/1) ring signature remains `Transaction.signatures` (n 64-byte `c || r` pairs).
     */
    export interface IClsagSignature {
        /**
         * The responses s_0 .. s_{n-1}, one per ring member in ring (transaction) order, as 64 hex characters each
         */
        s: string[];
        /**
         * The challenge c1 (the challenge at ring index 0) as 64 hex characters
         */
        c1: string;
    }

    /**
     * Represents a single-key CLSAG signature
     */
    export class ClsagSignature implements IClsagSignature {
        /**
         * Constructs a new instance from the supplied values
         * @param s the responses s_0 .. s_{n-1}
         * @param c1 the challenge c1
         */
        constructor (public s: string[], public c1: string) {
        }

        /**
         * The size of the signature in bytes: 32 * (n + 1)
         */
        public get size (): number {
            return 32 * (this.s.length + 1);
        }

        /**
         * Represents the signature as a Buffer (s_0 .. s_{n-1} || c1)
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            return clsagSignatureToBuffer(this);
        }

        /**
         * Represents the signature as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    /**
     * Serializes a CLSAG signature as `s_0 .. s_{n-1} || c1`
     * @param signature the signature
     * @returns the Buffer representation
     */
    export function clsagSignatureToBuffer (signature: IClsagSignature): Buffer {
        const writer = new Writer();

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

    /** @ignore */
    function isHex64 (value: string): boolean {
        return typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value);
    }
}
