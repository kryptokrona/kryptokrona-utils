// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Transaction } from './Transaction';
import { TurtleCoinCrypto } from './Types';

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
export class ParentBlock {
    /**
     * The id of the parent block's miner transaction as the merged-mining merkle root uses it
     * (C++ getBaseTransactionHash): cn_fast_hash of the serialized transaction for version < 2, and
     * for version >= 2 the Monero coinbase rule cn_fast_hash(cn_fast_hash(prefix) || cn_fast_hash(0x00) || 0^32).
     * This rule applies only here: the parent's miner transaction is not a Kryptokrona transaction.
     * Kryptokrona transactions of every version use Transaction.hash() (cn_fast_hash of the blob)
     */
    public async minerTransactionHash (): Promise<string> {
        const tx = this.minerTransaction;

        if (tx.version < 2) {
            return tx.hash();
        }

        const prefixHash = await TurtleCoinCrypto.cn_fast_hash(tx.toString(true));

        return TurtleCoinCrypto.cn_fast_hash(prefixHash + MoneroVersion2CoinbaseSuffix);
    }

    /**
     * The major block version number
     */
    public majorVersion = 0;
    /**
     * The minor block version number
     */
    public minorVersion = 0;
    /**
     * The previous block hash
     */
    public previousBlockHash: string = ''.padStart(64, '0');
    /**
     * The number of transactions in the block
     */
    public transactionCount = 0;
    /**
     * The base transaction branches
     */
    public baseTransactionBranch: string[] = [];
    /**
     * The miner reward transaction
     */
    public minerTransaction: Transaction = new Transaction();
    /**
     * The blockchain branches
     */
    public blockchainBranch: string[] = [];
}
