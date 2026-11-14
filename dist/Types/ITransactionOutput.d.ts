/// <reference types="node" />
import { BigInteger } from '../Types';
export declare namespace TransactionOutputs {
    /**
     * Transaction Output Type
     */
    enum OutputType {
        /**
         * Key output of transaction versions 0 and 1: amount, 0x02, key
         */
        KEY = 2,
        /**
         * Tagged key output of transaction version 2 (fork 14): amount, 0x03, key, view tag (1 byte)
         */
        TAGGED_KEY = 3
    }
    /**
     * Returns whether the output is a key output of either kind (untagged 0x02 or tagged 0x03)
     * @param output the output to check
     */
    function isKeyOutput(output: ITransactionOutput): boolean;
    /**
     * Normalises a view tag to two lowercase hexadecimal characters
     * @param viewTag the view tag as a number (0-255) or hexadecimal string
     * @returns the view tag as two lowercase hexadecimal characters
     */
    function normalizeViewTag(viewTag: string | number): string;
    /**
     * Abstract interface for structured transaction outputs
     */
    abstract class ITransactionOutput {
        /**
         * The output type
         */
        abstract get type(): OutputType;
        /**
         * Returns the output as a buffer
         * @returns the Buffer representation of the object
         */
        abstract toBuffer(): Buffer;
        /**
         * Returns the input as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        abstract toString(): string;
    }
    /**
     * Represents an output to a set of keys (wallet).
     * Without a view tag it is the untagged output of transaction versions 0 and 1 (type 0x02);
     * with a view tag it is the tagged output of transaction version 2 (type 0x03)
     */
    class KeyOutput implements ITransactionOutput {
        private readonly m_type;
        private readonly m_amount;
        private readonly m_key;
        private readonly m_viewTag?;
        /**
         * Creates a new key output using the specified values
         * @param amount the output amount
         * @param key the one-time output key of the output
         * @param [viewTag] the view tag (one byte, as two hexadecimal characters or a number);
         * only for outputs of transaction version 2
         */
        constructor(amount: BigInteger.BigInteger | number, key: string, viewTag?: string | number);
        /**
         * The output type (KEY for untagged outputs, TAGGED_KEY for outputs with a view tag)
         */
        get type(): OutputType;
        /**
         * The view tag of the output as two lowercase hexadecimal characters,
         * undefined for untagged (version 0/1) outputs
         */
        get viewTag(): string | undefined;
        /**
         * Whether the output carries a view tag (transaction version 2)
         */
        get isTagged(): boolean;
        /**
         * The output amount
         */
        get amount(): BigInteger.BigInteger;
        /**
         * The one-time output key of the output
         */
        get key(): string;
        /**
         * Represents the output as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Represents the output as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
}
