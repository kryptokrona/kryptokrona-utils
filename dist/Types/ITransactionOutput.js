"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionOutputs = void 0;
const Types_1 = require("../Types");
const bytestream_1 = require("@turtlecoin/bytestream");
var TransactionOutputs;
(function (TransactionOutputs) {
    /**
     * Transaction Output Type
     */
    let OutputType;
    (function (OutputType) {
        /**
         * Key output of transaction versions 0 and 1: amount, 0x02, key
         */
        OutputType[OutputType["KEY"] = 2] = "KEY";
        /**
         * Tagged key output of transaction version 2 (fork 14): amount, 0x03, key, view tag (1 byte)
         */
        OutputType[OutputType["TAGGED_KEY"] = 3] = "TAGGED_KEY";
    })(OutputType = TransactionOutputs.OutputType || (TransactionOutputs.OutputType = {}));
    /**
     * Returns whether the output is a key output of either kind (untagged 0x02 or tagged 0x03)
     * @param output the output to check
     */
    function isKeyOutput(output) {
        return output.type === OutputType.KEY || output.type === OutputType.TAGGED_KEY;
    }
    TransactionOutputs.isKeyOutput = isKeyOutput;
    /**
     * Normalises a view tag to two lowercase hexadecimal characters
     * @param viewTag the view tag as a number (0-255) or hexadecimal string
     * @returns the view tag as two lowercase hexadecimal characters
     */
    function normalizeViewTag(viewTag) {
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
    TransactionOutputs.normalizeViewTag = normalizeViewTag;
    /**
     * Abstract interface for structured transaction outputs
     */
    class ITransactionOutput {
    }
    TransactionOutputs.ITransactionOutput = ITransactionOutput;
    /**
     * Represents an output to a set of keys (wallet).
     * Without a view tag it is the untagged output of transaction versions 0 and 1 (type 0x02);
     * with a view tag it is the tagged output of transaction version 2 (type 0x03)
     */
    class KeyOutput {
        /**
         * Creates a new key output using the specified values
         * @param amount the output amount
         * @param key the one-time output key of the output
         * @param [viewTag] the view tag (one byte, as two hexadecimal characters or a number);
         * only for outputs of transaction version 2
         */
        constructor(amount, key, viewTag) {
            this.m_type = OutputType.KEY;
            this.m_amount = Types_1.BigInteger.zero;
            this.m_key = '';
            if (typeof amount === 'number') {
                amount = Types_1.BigInteger(amount);
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
        get type() {
            return this.m_type;
        }
        /**
         * The view tag of the output as two lowercase hexadecimal characters,
         * undefined for untagged (version 0/1) outputs
         */
        get viewTag() {
            return this.m_viewTag;
        }
        /**
         * Whether the output carries a view tag (transaction version 2)
         */
        get isTagged() {
            return typeof this.m_viewTag !== 'undefined';
        }
        /**
         * The output amount
         */
        get amount() {
            return this.m_amount;
        }
        /**
         * The one-time output key of the output
         */
        get key() {
            return this.m_key;
        }
        /**
         * Represents the output as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
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
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    TransactionOutputs.KeyOutput = KeyOutput;
})(TransactionOutputs = exports.TransactionOutputs || (exports.TransactionOutputs = {}));
