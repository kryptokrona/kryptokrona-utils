import { Transaction } from './Transaction';
/**
 * Represents a parent block object
 */
export declare class ParentBlock {
    /**
     * The id of the parent block's miner transaction as the merged-mining merkle root uses it
     * (C++ getBaseTransactionHash): cn_fast_hash of the serialized transaction for version < 2, and
     * for version >= 2 the Monero coinbase rule cn_fast_hash(cn_fast_hash(prefix) || cn_fast_hash(0x00) || 0^32).
     * This rule applies only here: the parent's miner transaction is not a Kryptokrona transaction.
     * Kryptokrona transactions of every version use Transaction.hash() (cn_fast_hash of the blob)
     */
    minerTransactionHash(): Promise<string>;
    /**
     * The major block version number
     */
    majorVersion: number;
    /**
     * The minor block version number
     */
    minorVersion: number;
    /**
     * The previous block hash
     */
    previousBlockHash: string;
    /**
     * The number of transactions in the block
     */
    transactionCount: number;
    /**
     * The base transaction branches
     */
    baseTransactionBranch: string[];
    /**
     * The miner reward transaction
     */
    minerTransaction: Transaction;
    /**
     * The blockchain branches
     */
    blockchainBranch: string[];
}
