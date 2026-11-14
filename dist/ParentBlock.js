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
exports.ParentBlock = void 0;
const Transaction_1 = require("./Transaction");
const Types_1 = require("./Types");
/**
 * cn_fast_hash of the single byte 0x00 (the empty RingCT base of a Monero version 2 coinbase)
 * followed by 32 zero bytes (no prunable data): the tail of Monero's version 2 coinbase id
 * @ignore
 */
const MoneroVersion2CoinbaseSuffix = 'bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a' +
    '0000000000000000000000000000000000000000000000000000000000000000';
/**
 * Represents a parent block object
 */
class ParentBlock {
    constructor() {
        /**
         * The major block version number
         */
        this.majorVersion = 0;
        /**
         * The minor block version number
         */
        this.minorVersion = 0;
        /**
         * The previous block hash
         */
        this.previousBlockHash = ''.padStart(64, '0');
        /**
         * The number of transactions in the block
         */
        this.transactionCount = 0;
        /**
         * The base transaction branches
         */
        this.baseTransactionBranch = [];
        /**
         * The miner reward transaction
         */
        this.minerTransaction = new Transaction_1.Transaction();
        /**
         * The blockchain branches
         */
        this.blockchainBranch = [];
    }
    /**
     * The id of the parent block's miner transaction as the merged-mining merkle root uses it
     * (C++ getBaseTransactionHash): cn_fast_hash of the serialized transaction for version < 2, and
     * for version >= 2 the Monero coinbase rule cn_fast_hash(cn_fast_hash(prefix) || cn_fast_hash(0x00) || 0^32).
     * This rule applies only here: the parent's miner transaction is not a Kryptokrona transaction.
     * Kryptokrona transactions of every version use Transaction.hash() (cn_fast_hash of the blob)
     */
    minerTransactionHash() {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = this.minerTransaction;
            if (tx.version < 2) {
                return tx.hash();
            }
            const prefixHash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(tx.toString(true));
            return Types_1.TurtleCoinCrypto.cn_fast_hash(prefixHash + MoneroVersion2CoinbaseSuffix);
        });
    }
}
exports.ParentBlock = ParentBlock;
