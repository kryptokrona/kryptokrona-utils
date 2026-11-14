/// <reference types="node" />
export declare namespace TransactionSignatures {
    /**
     * A single-key CLSAG signature of one key input of a version 2 transaction (fork 14).
     * On the wire it is `s_0 .. s_{n-1} || c1` (32 bytes each), where n is the ring size of the input.
     * The legacy (version 0/1) ring signature remains `Transaction.signatures` (n 64-byte `c || r` pairs).
     */
    interface IClsagSignature {
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
    class ClsagSignature implements IClsagSignature {
        s: string[];
        c1: string;
        /**
         * Constructs a new instance from the supplied values
         * @param s the responses s_0 .. s_{n-1}
         * @param c1 the challenge c1
         */
        constructor(s: string[], c1: string);
        /**
         * The size of the signature in bytes: 32 * (n + 1)
         */
        get size(): number;
        /**
         * Represents the signature as a Buffer (s_0 .. s_{n-1} || c1)
         * @returns the Buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Represents the signature as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    /**
     * Serializes a CLSAG signature as `s_0 .. s_{n-1} || c1`
     * @param signature the signature
     * @returns the Buffer representation
     */
    function clsagSignatureToBuffer(signature: IClsagSignature): Buffer;
}
