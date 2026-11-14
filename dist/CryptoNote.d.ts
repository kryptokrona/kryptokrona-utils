/// <reference types="node" />
import { AddressPrefix } from './AddressPrefix';
import { ICoinConfig, ICoinRunningConfig } from './Config';
import { BigInteger, TransactionSignatures, Interfaces, CryptoNoteInterfaces, ICryptoConfig } from './Types';
import { Transaction } from './Transaction';
import { EventEmitter } from 'events';
import ICryptoNote = CryptoNoteInterfaces.ICryptoNote;
/**
 * CryptoNote helper class for constructing transactions and performing
 * various other cryptographic items during the receipt or transfer
 * of funds on the network
 */
export declare class CryptoNote extends EventEmitter implements ICryptoNote {
    protected m_config: ICoinRunningConfig;
    /**
     * Constructs a new instance of the object
     * If a configuration is supplied, it is also passed to the underlying
     * cryptographic library
     * @param config the base configuration to apply to our helper
     * @param cryptoConfig configuration to allow for overriding the provided cryptographic primitives
     */
    constructor(config?: ICoinConfig, cryptoConfig?: ICryptoConfig);
    /**
     * Emits an event if we have sent a command to the cryptographic library that is likely awaiting
     * manual user confirmation on the device
     * @param event
     * @param listener
     */
    on(event: 'user_confirm', listener: () => void): this;
    /**
     * Emits an event when the underlying cryptographic library receives data
     * @param event
     * @param listener
     */
    on(event: 'transport_receive', listener: (data: string) => void): this;
    /**
     * Emits an event when the underlying cryptographic library sends data
     * @param event
     * @param listener
     */
    on(event: 'transport_send', listener: (data: string) => void): this;
    /**
     * This does nothing in this class
     */
    init(): Promise<void>;
    /**
     * This does nothing in this class
     */
    fetchKeys(): Promise<void>;
    /**
     * This does nothing in this class
     */
    get address(): undefined;
    /**
     * The current coin configuration
     */
    get config(): ICoinConfig;
    set config(config: ICoinConfig);
    /**
     * The current cryptographic primitives configuration
     */
    get cryptoConfig(): ICryptoConfig;
    set cryptoConfig(config: ICryptoConfig);
    /**
     * Converts absolute global index offsets to relative ones
     * @param offsets the absolute offsets
     * @returns the relative offsets
     */
    absoluteToRelativeOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];
    /**
     * Converts relative global index offsets to absolute offsets
     * @param offsets the relative offsets
     * @returns the absolute offsets
     */
    relativeToAbsoluteOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];
    /**
     * Generates a key derivation
     * @param transactionPublicKey the transaction public key
     * @param privateViewKey the private view key (ignored)
     */
    generateKeyDerivation(transactionPublicKey: string, privateViewKey: string): Promise<string>;
    /**
     * Generates a key image from the supplied values
     * @async
     * @param transactionPublicKey the transaction public key
     * @param privateViewKey the private view key
     * @param publicSpendKey the public spend key
     * @param privateSpendKey the private spend key
     * @param outputIndex the index of the output in the transaction
     * @returns the key image
     */
    generateKeyImage(transactionPublicKey: string, privateViewKey: string, publicSpendKey: string, privateSpendKey: string, outputIndex: number): Promise<CryptoNoteInterfaces.IKeyImage>;
    /**
     * Primitive method for generating a key image from the supplied values
     * @async
     * @param publicSpendKey the public spend key
     * @param privateSpendKey the private spend key
     * @param outputIndex the index of the output in the transaction
     * @param derivation the key derivation
     * @returns the key image
     */
    generateKeyImagePrimitive(publicSpendKey: string, privateSpendKey: string, outputIndex: number, derivation: string): Promise<CryptoNoteInterfaces.IKeyImage>;
    /**
     * Provides the public key of the supplied private key
     * @async
     * @param privateKey the private key
     * @returns the public key
     */
    privateKeyToPublicKey(privateKey: string): Promise<string>;
    /**
     * Scans the provided transaction outputs and returns those outputs which belong to us.
     * If the privateSpendKey is not supplied, the private ephemeral and key image will be undefined
     * @async
     * @param transactionPublicKey the transaction public key
     * @param outputs the transaction outputs
     * @param privateViewKey the private view key
     * @param publicSpendKey the public spend key
     * @param [privateSpendKey] the private spend key
     * @param [generatePartial] whether we should generate partial key images if the output belongs to use
     * @returns an list of outputs that belong to us
     */
    scanTransactionOutputs(transactionPublicKey: string, outputs: Interfaces.Output[], privateViewKey: string, publicSpendKey: string, privateSpendKey?: string, generatePartial?: boolean): Promise<Interfaces.Output[]>;
    /**
     * Scans the given transaction output to determine if it belongs to us, if so, we return the output
     * with the private ephemeral and key image if the privateSpendKey was supplied
     * @async
     * @param transactionPublicKey the transaction public key
     * @param output the transaction output
     * @param privateViewKey the private view key
     * @param publicSpendKey the public spend key
     * @param [privateSpendKey] the private spend key
     * @param [generatePartial] whether we should generate partial key images
     * @returns the output if it belongs to us
     */
    isOurTransactionOutput(transactionPublicKey: string, output: Interfaces.Output, privateViewKey: string, publicSpendKey: string, privateSpendKey?: string, generatePartial?: boolean): Promise<Interfaces.Output>;
    /**
     * Computes the view tag of an output (transaction version 2):
     * the first byte of cn_fast_hash("view_tag" || derivation || varint(outputIndex))
     * @param derivation the key derivation (generateKeyDerivation of the transaction public key and
     * the private view key, or of the recipient public view key and the transaction private key)
     * @param outputIndex the index of the output in the transaction
     * @returns the view tag as two lowercase hexadecimal characters
     */
    deriveViewTag(derivation: string, outputIndex: number): Promise<string>;
    /**
     * Generates a single-key CLSAG signature (transaction version 2) and verifies it
     * @param prefixHash the transaction prefix hash
     * @param ring the ring public keys in transaction order (ascending global index)
     * @param privateEphemeral the private ephemeral of the output being spent
     * @param realOutputIndex the position of the output being spent in the ring
     * @param keyImage the key image of the output being spent
     * @param [randomness] explicit signing randomness (tests only); random if omitted
     * @returns the signature
     */
    generateClsagSignature(prefixHash: string, ring: string[], privateEphemeral: string, realOutputIndex: number, keyImage: string, randomness?: Interfaces.ClsagRandomness): Promise<TransactionSignatures.ClsagSignature>;
    /**
     * Verifies a single-key CLSAG signature (transaction version 2)
     * @param prefixHash the transaction prefix hash
     * @param ring the ring public keys in transaction order (ascending global index)
     * @param keyImage the key image of the input
     * @param signature the signature
     * @returns whether the signature is valid
     */
    checkClsagSignature(prefixHash: string, ring: string[], keyImage: string, signature: TransactionSignatures.IClsagSignature): Promise<boolean>;
    /**
     * Scans one output with an already computed key derivation. A tagged output (viewTag set)
     * whose view tag does not match is skipped before the output key is derived
     * @ignore
     */
    protected isOurTransactionOutputPrimitive(transactionPublicKey: string, derivedKey: string, output: Interfaces.Output, publicSpendKey: string, privateSpendKey?: string, generatePartial?: boolean): Promise<Interfaces.Output>;
    /**
     * Calculates the minimum transaction fee given the transaction size (bytes)
     * @param txSize the transaction size in bytes
     * @returns the minimum transaction fee
     */
    calculateMinimumTransactionFee(txSize: number): number;
    /**
     * Creates an integrated address using the supplied values
     * @param address the wallet address
     * @param paymentId the payment ID
     * @param [prefix] the address prefix
     * @returns the integrated address
     */
    createIntegratedAddress(address: string, paymentId: string, prefix?: AddressPrefix | number): Promise<string>;
    /**
     * Formats atomic units into human readable units
     * @param amount the amount in atomic units
     * @returns the amount in human readable units
     */
    formatMoney(amount: BigInteger.BigInteger | number): string;
    /**
     * Generates an array of transaction outputs (new destinations) for the given address
     * and the given amount within the allowed rules of the network
     * @param address the destination wallet address
     * @param amount the amount to send
     * @returns a list of transaction outputs
     */
    generateTransactionOutputs(address: string, amount: number): Promise<Interfaces.GeneratedOutput[]>;
    /**
     * Signs an arbitrary message using the supplied private key
     * @async
     * @param message the arbitrary message to sign
     * @param privateKey the private key to sign with
     * @returns the signature
     */
    signMessage(message: any, privateKey: string): Promise<string>;
    /**
     * Verifies the signature of an arbitrary message using the signature and the supplied public key
     * @async
     * @param message the arbitrary message that was signed
     * @param publicKey the public key of the private key that was used to sign
     * @param signature the signature
     * @returns whether the signature is valid
     */
    verifyMessageSignature(message: any, publicKey: string, signature: string): Promise<boolean>;
    /**
     * Constructs a new Transaction using the supplied values.
     * The resulting transaction can be broadcasted to the TurtleCoin network
     * @async
     * @param outputs the new outputs for the transaction (TO)
     * @param inputs outputs we will be spending (FROM)
     * @param randomOutputs the random outputs to use for mixing
     * @param mixin the number of mixins to use, or one number per input (rings of different sizes)
     * @param [feeAmount] the transaction fee amount to pay
     * @param [paymentId] the payment ID to use in the transaction,
     * @param [unlockTime] the unlock time or block height for the transaction
     * @param [extraData] arbitrary extra data to include in the transaction extra field
     * @param [options] build options: the transaction version (1 by default, 2 for view tags and CLSAG), ...
     * @returns the newly created transaction object
     */
    createTransaction(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number | number[], feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any, options?: Interfaces.TransactionOptions): Promise<Transaction>;
    /**
     * Constructs a new Transaction using the supplied values.
     * Note: Does not sign the transaction
     * @async
     * @param outputs the new outputs for the transaction (TO)
     * @param inputs outputs we will be spending (FROM)
     * @param randomOutputs the random outputs to use for mixing
     * @param mixin the number of mixins to use, or one number per input (rings of different sizes)
     * @param [feeAmount] the transaction fee amount to pay
     * @param [paymentId] the payment ID to use in the transaction,
     * @param [unlockTime] the unlock time or block height for the transaction
     * @param [extraData] arbitrary extra data to include in the transaction extra field
     * @param [options] build options: the transaction version (1 by default, 2 for view tags and CLSAG), ...
     * @returns the newly created transaction object and it's input data
     */
    createTransactionStructure(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number | number[], feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any, options?: Interfaces.TransactionOptions): Promise<Interfaces.IPreparedTransaction>;
    /**
     * Constructs a new Transaction using the supplied values.
     * The resulting transaction can be broadcasted to the TurtleCoin network
     * @async
     * @param outputs the new outputs for the transaction (TO)
     * @param inputs outputs we will be spending (FROM)
     * @param randomOutputs the random outputs to use for mixing
     * @param mixin the number of mixins to use, or one number per input (rings of different sizes)
     * @param [feeAmount] the transaction fee amount to pay
     * @param [paymentId] the payment ID to use in the transaction,
     * @param [unlockTime] the unlock time or block height for the transaction
     * @param [extraData] arbitrary extra data to include in the transaction extra field
     * @param [randomKey] a random scalar (private key); version 1 only
     * @param [options] build options: the transaction version (1 by default, 2 for view tags and CLSAG), ...
     * @returns the newly created transaction object with prepared signatures. For version 2 the
     * transaction carries no signatures yet: signatureMeta holds, per input, the ring, the real index,
     * the key image and the derivation data that completeTransaction (or an external signer) needs
     * to produce the CLSAG signatures over the prefix hash
     */
    prepareTransaction(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number | number[], feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any, randomKey?: string, options?: Interfaces.TransactionOptions): Promise<Interfaces.PreparedTransaction>;
    /**
     * Completes a prepared transaction using the supplied private ephemeral
     * The resulting transaction can be broadcast to the network. Please note that the PreparedTransaction
     * signatures meta data must be updated to include the proper private ephemeral
     * @param preparedTransaction the prepared transaction
     * @param privateSpendKey the private spend key of the wallet that contains the funds
     * @returns the completed transaction
     */
    completeTransaction(preparedTransaction: Interfaces.PreparedTransaction, privateSpendKey: string): Promise<Transaction>;
}
