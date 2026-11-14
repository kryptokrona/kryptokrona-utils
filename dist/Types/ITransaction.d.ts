import { Transaction } from '../Transaction';
import { Address } from '../Address';
import { ED25519 } from './ED25519';
export declare namespace Interfaces {
    /**
     * Represents a transaction recipient
     */
    interface TransactionRecipient {
        /**
         * The recipient public wallet address
         */
        address: string;
        /**
         * The amount sent to the recipient
         */
        amount: number;
    }
    /**
     * Represents a prepared ring signature for a given input of a prepared transaction
     */
    interface PreparedRingSignature {
        /**
         * The index of the input in the transaction in which these prepared ring signatures belong
         */
        index: number;
        /**
         * The index in the list of prepared ring signatures that is our real input.
         * Although this can sometimes be deduced based on the last 32-bytes being all 0s,
         * it is safer to make sure that this value is transferred with the prepared
         * ring signatures
         */
        realOutputIndex: number;
        /**
         * The randomly generated scalar value that was created in preparing the ring signatures
         * This value is required for when we restore the ring signatures will all of the required
         * partial signing keys.
         * Empty for transaction version 2 (CLSAG is signed in one step by completeTransaction)
         */
        key: string;
        /**
         * The prepared ring signatures
         */
        signatures?: string[];
        /**
         * The public keys used in the signature preparation (random + real), in ring order
         */
        inputKeys?: string[];
        /**
         * The key image of the input (transaction version 2)
         */
        keyImage?: string;
        /**
         * The output information used to create this input
         */
        input: {
            derivation: string;
            tx_public_key?: string;
            outputIndex: number;
        };
    }
    /**
     * Represents a prepared transaction
     */
    interface PreparedTransaction {
        /**
         * The prepared transaction as a hexadecimal string (blob) -- this should be the prefix only (no signatures)
         */
        transaction: Transaction;
        /**
         * The transaction one-time private key.
         * We need this value along with the list of addresses that funds are being sent to
         * to ensure that funds are going where we believe the funds are going.
         */
        transactionPrivateKey: string;
        /**
         * The list of recipient addresses where funds are being sent to in the transaction.
         * This is provided so that other participants can check the outputs to determine what
         * amounts are going to which addresses so that they can verify that funds are going
         * where they believe them to be going.
         */
        transactionRecipients: TransactionRecipient[];
        /**
         * The list of prepared ring signatures (incomplete) that are later used
         * when we generate our partial signing key for the prepared transaction
         */
        signatureMeta: PreparedRingSignature[];
    }
    /**
     * The derived input transaction keys
     */
    interface InputKeys {
        /**
         * The derived public key
         */
        publicKey: string;
        /**
         * The key derivation
         */
        derivedKey: string;
        /**
         * The output index
         */
        outputIndex: number;
    }
    /**
     * Represents a generated input if the output belongs to us
     */
    interface GeneratedInput {
        /**
         * The derived transaction keys
         */
        transactionKeys: InputKeys;
        /**
         * The public ephemeral of the input
         */
        publicEphemeral: string;
        /**
         * the private ephemeral of the input
         */
        privateEphemeral?: string;
    }
    /**
     * Represents a Generated Output (destination)
     */
    interface GeneratedOutput {
        /**
         * The amount of the output
         */
        amount: number;
        /**
         * The destination of the output
         */
        destination: Address;
    }
    /**
     * Represents a transaction output to external applications
     */
    interface Output {
        /**
         * The output key
         */
        key: string;
        /**
         * The output index (position) in the transaction
         */
        index: number;
        /**
         * The output global index
         */
        globalIndex: number;
        /**
         * The output amount
         */
        amount: number;
        /**
         * The output type
         */
        type?: number;
        /**
         * The view tag of the output (transaction version 2) as two hexadecimal characters.
         * When present, output scanning compares it before deriving the output key
         */
        viewTag?: string;
        /**
         * The output key image
         */
        keyImage?: string;
        /**
         * The GeneratedInput of the output (if it belongs to us)
         */
        input?: GeneratedInput;
        /**
         * Defines whether this is a partial key image
         */
        isPartialKeyImage?: boolean;
    }
    /**
     * Represents a random output
     */
    interface RandomOutput {
        /**
         * The output key
         */
        key: string;
        /**
         * The output global index
         */
        globalIndex: number;
    }
    /** @ignore */
    interface PreparedInputOutputs {
        key: string;
        index: number;
    }
    /** @ignore */
    interface PreparedInput {
        amount: number;
        realOutputIndex: number;
        keyImage: string;
        input: GeneratedInput;
        outputs: PreparedInputOutputs[];
    }
    /** @ignore */
    interface PreparedOutput {
        amount: number;
        key: string;
        viewTag?: string;
    }
    /** @ignore */
    interface PreparedOutputs {
        transactionKeys: ED25519.KeyPair;
        outputs: PreparedOutput[];
    }
    /** @ignore */
    interface GeneratedRingSignatures {
        signatures: string[];
        index: number;
    }
    interface IPreparedTransaction {
        transaction: Transaction;
        inputs: PreparedInput[];
    }
    /**
     * Explicit CLSAG signing randomness for one input (deterministic signing, test vectors)
     */
    interface ClsagRandomness {
        /**
         * The nonce alpha (scalar, 64 hex characters)
         */
        alpha: string;
        /**
         * The decoy responses in consumption order s_{l+1} .. s_{n-1}, s_0 .. s_{l-1} (ring size - 1 scalars)
         */
        decoyResponses: string[];
    }
    /**
     * Options for building a transaction
     */
    interface TransactionOptions {
        /**
         * The transaction version: 1 (ring signatures, untagged outputs; the default) or
         * 2 (fork 14: view tags and single-key CLSAG signatures). Build the highest version the
         * daemon lists in /getinfo `tx_versions`
         */
        version?: number;
        /**
         * The transaction private key r (64 hex characters); random if omitted.
         * Only for deterministic builds (tests); never reuse a transaction private key
         */
        transactionPrivateKey?: string;
        /**
         * Whether to sort the inputs by key image (descending). Default: true for version 1 (the
         * historical behaviour of this library), false for version 2 (inputs stay in the order
         * given, as the Rust wallet core builds them)
         */
        sortInputs?: boolean;
        /**
         * Explicit CLSAG randomness per input, in transaction input order (version 2, tests only)
         */
        clsagRandomness?: ClsagRandomness[];
    }
}
