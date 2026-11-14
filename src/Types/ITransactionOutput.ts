// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { BigInteger } from '../Types';
import { Writer } from '@turtlecoin/bytestream';

export namespace TransactionOutputs {

    /**
     * Transaction Output Type
     */
    export enum OutputType {
        /**
         * Key output of transaction versions 0 and 1: amount, 0x02, key
         */
        KEY = 0x02,
        /**
         * Tagged key output of transaction version 2 (fork 14): amount, 0x03, key, view tag (1 byte)
         */
        TAGGED_KEY = 0x03,
    }

    /**
     * Returns whether the output is a key output of either kind (untagged 0x02 or tagged 0x03)
     * @param output the output to check
     */
    export function isKeyOutput (output: ITransactionOutput): boolean {
        return output.type === OutputType.KEY || output.type === OutputType.TAGGED_KEY;
    }

    /**
     * Normalises a view tag to two lowercase hexadecimal characters
     * @param viewTag the view tag as a number (0-255) or hexadecimal string
     * @returns the view tag as two lowercase hexadecimal characters
     */
    export function normalizeViewTag (viewTag: string | number): string {
        if (typeof viewTag === 'number') {
            if (!Number.isInteger(viewTag) || viewTag < 0 || viewTag > 255) {
                throw new RangeError('View tag must be a single byte');
            }

            return viewTag.toString(16).padStart(2, '0');
        }

        if (typeof viewTag !== 'string' || !/^[0-9a-fA-F]{2}$/.test(viewTag)) {
            throw new Error('View tag must be a single byte as two hexadecimal characters');
        }

        return viewTag.toLowerCase();
    }

    /**
     * Abstract interface for structured transaction outputs
     */
    export abstract class ITransactionOutput {
        /**
         * The output type
         */
        public abstract get type(): OutputType;

        /**
         * Returns the output as a buffer
         * @returns the Buffer representation of the object
         */
        public abstract toBuffer(): Buffer;

        /**
         * Returns the input as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public abstract toString(): string;
    }

    /**
     * Represents an output to a set of keys (wallet).
     * Without a view tag it is the untagged output of transaction versions 0 and 1 (type 0x02);
     * with a view tag it is the tagged output of transaction version 2 (type 0x03)
     */
    export class KeyOutput implements ITransactionOutput {
        private readonly m_type: OutputType = OutputType.KEY;
        private readonly m_amount: BigInteger.BigInteger = BigInteger.zero;
        private readonly m_key: string = '';
        private readonly m_viewTag?: string;

        /**
         * Creates a new key output using the specified values
         * @param amount the output amount
         * @param key the one-time output key of the output
         * @param [viewTag] the view tag (one byte, as two hexadecimal characters or a number);
         * only for outputs of transaction version 2
         */
        constructor (amount: BigInteger.BigInteger | number, key: string, viewTag?: string | number) {
            if (typeof amount === 'number') {
                amount = BigInteger(amount);
            }

            this.m_amount = amount;

            this.m_key = key;

            if (typeof viewTag !== 'undefined' && viewTag !== null) {
                this.m_viewTag = normalizeViewTag(viewTag);
                this.m_type = OutputType.TAGGED_KEY;
            }
        }

        /**
         * The output type (KEY for untagged outputs, TAGGED_KEY for outputs with a view tag)
         */
        public get type (): OutputType {
            return this.m_type;
        }

        /**
         * The view tag of the output as two lowercase hexadecimal characters,
         * undefined for untagged (version 0/1) outputs
         */
        public get viewTag (): string | undefined {
            return this.m_viewTag;
        }

        /**
         * Whether the output carries a view tag (transaction version 2)
         */
        public get isTagged (): boolean {
            return typeof this.m_viewTag !== 'undefined';
        }

        /**
         * The output amount
         */
        public get amount (): BigInteger.BigInteger {
            return this.m_amount;
        }

        /**
         * The one-time output key of the output
         */
        public get key (): string {
            return this.m_key;
        }

        /**
         * Represents the output as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.amount);

            writer.uint8_t(this.type);

            writer.hash(this.key);

            if (this.m_viewTag !== undefined) {
                writer.hex(this.m_viewTag);
            }

            return writer.buffer;
        }

        /**
         * Represents the output as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }
}
