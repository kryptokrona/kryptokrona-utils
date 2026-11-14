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
exports.CryptoNote = void 0;
const Address_1 = require("./Address");
const AddressPrefix_1 = require("./AddressPrefix");
const Config_1 = require("./Config");
const Common_1 = require("./Common");
const Types_1 = require("./Types");
const Transaction_1 = require("./Transaction");
const CryptoExtensions_1 = require("./CryptoExtensions");
const events_1 = require("events");
const Numeral = require("numeral");
/** @ignore */
const UINT64_MAX = Types_1.BigInteger(2).pow(64);
/**
 * CryptoNote helper class for constructing transactions and performing
 * various other cryptographic items during the receipt or transfer
 * of funds on the network
 */
class CryptoNote extends events_1.EventEmitter {
    /**
     * Constructs a new instance of the object
     * If a configuration is supplied, it is also passed to the underlying
     * cryptographic library
     * @param config the base configuration to apply to our helper
     * @param cryptoConfig configuration to allow for overriding the provided cryptographic primitives
     */
    constructor(config, cryptoConfig) {
        super();
        this.m_config = Config_1.Config;
        if (config) {
            this.m_config = Common_1.Common.mergeConfig(config);
        }
        if (cryptoConfig) {
            Types_1.TurtleCoinCrypto.userCryptoFunctions = cryptoConfig;
        }
    }
    /** @ignore */
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * This does nothing in this class
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    /**
     * This does nothing in this class
     */
    fetchKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    /**
     * This does nothing in this class
     */
    get address() {
        return undefined;
    }
    /**
     * The current coin configuration
     */
    get config() {
        return this.m_config;
    }
    set config(config) {
        this.m_config = Common_1.Common.mergeConfig(config);
    }
    /**
     * The current cryptographic primitives configuration
     */
    get cryptoConfig() {
        return Types_1.TurtleCoinCrypto.userCryptoFunctions;
    }
    set cryptoConfig(config) {
        Types_1.TurtleCoinCrypto.userCryptoFunctions = config;
    }
    /**
     * Converts absolute global index offsets to relative ones
     * @param offsets the absolute offsets
     * @returns the relative offsets
     */
    absoluteToRelativeOffsets(offsets) {
        const result = [];
        const tmpOffsets = Common_1.Common.absoluteToRelativeOffsets(offsets);
        tmpOffsets.forEach((offset) => result.push(offset.toJSNumber()));
        return result;
    }
    /**
     * Converts relative global index offsets to absolute offsets
     * @param offsets the relative offsets
     * @returns the absolute offsets
     */
    relativeToAbsoluteOffsets(offsets) {
        const result = [];
        const tmpOffsets = Common_1.Common.relativeToAbsoluteOffsets(offsets);
        tmpOffsets.forEach((offset) => result.push(offset.toJSNumber()));
        return result;
    }
    /**
     * Generates a key derivation
     * @param transactionPublicKey the transaction public key
     * @param privateViewKey the private view key (ignored)
     */
    generateKeyDerivation(transactionPublicKey, privateViewKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return Types_1.TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey, privateViewKey);
        });
    }
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
    generateKeyImage(transactionPublicKey, privateViewKey, publicSpendKey, privateSpendKey, outputIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const derivation = yield Types_1.TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey, privateViewKey);
            return this.generateKeyImagePrimitive(publicSpendKey, privateSpendKey, outputIndex, derivation);
        });
    }
    /**
     * Primitive method for generating a key image from the supplied values
     * @async
     * @param publicSpendKey the public spend key
     * @param privateSpendKey the private spend key
     * @param outputIndex the index of the output in the transaction
     * @param derivation the key derivation
     * @returns the key image
     */
    generateKeyImagePrimitive(publicSpendKey, privateSpendKey, outputIndex, derivation) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicEphemeral = yield Types_1.TurtleCoinCrypto.derivePublicKey(derivation, outputIndex, publicSpendKey);
            const privateEphemeral = yield Types_1.TurtleCoinCrypto.deriveSecretKey(derivation, outputIndex, privateSpendKey);
            const keyImage = yield Types_1.TurtleCoinCrypto.generateKeyImage(publicEphemeral, privateEphemeral);
            return {
                publicEphemeral: publicEphemeral,
                privateEphemeral: privateEphemeral,
                keyImage: keyImage
            };
        });
    }
    /**
     * Provides the public key of the supplied private key
     * @async
     * @param privateKey the private key
     * @returns the public key
     */
    privateKeyToPublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return Types_1.TurtleCoinCrypto.secretKeyToPublicKey(privateKey);
        });
    }
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
    scanTransactionOutputs(transactionPublicKey, outputs, privateViewKey, publicSpendKey, privateSpendKey, generatePartial) {
        return __awaiter(this, void 0, void 0, function* () {
            /* One key derivation per transaction, shared by every output */
            const derivedKey = yield Types_1.TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey, privateViewKey);
            const promises = [];
            for (const output of outputs) {
                promises.push(this.isOurTransactionOutputPrimitive(transactionPublicKey, derivedKey, output, publicSpendKey, privateSpendKey, generatePartial).catch(() => undefined));
            }
            const results = yield Promise.all(promises);
            const ourOutputs = [];
            for (const result of results) {
                if (result) {
                    ourOutputs.push(result);
                }
            }
            return ourOutputs;
        });
    }
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
    isOurTransactionOutput(transactionPublicKey, output, privateViewKey, publicSpendKey, privateSpendKey, generatePartial) {
        return __awaiter(this, void 0, void 0, function* () {
            const derivedKey = yield Types_1.TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey, privateViewKey);
            return this.isOurTransactionOutputPrimitive(transactionPublicKey, derivedKey, output, publicSpendKey, privateSpendKey, generatePartial);
        });
    }
    /**
     * Computes the view tag of an output (transaction version 2):
     * the first byte of cn_fast_hash("view_tag" || derivation || varint(outputIndex))
     * @param derivation the key derivation (generateKeyDerivation of the transaction public key and
     * the private view key, or of the recipient public view key and the transaction private key)
     * @param outputIndex the index of the output in the transaction
     * @returns the view tag as two lowercase hexadecimal characters
     */
    deriveViewTag(derivation, outputIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            return CryptoExtensions_1.deriveViewTag(derivation, outputIndex);
        });
    }
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
    generateClsagSignature(prefixHash, ring, privateEphemeral, realOutputIndex, keyImage, randomness) {
        return __awaiter(this, void 0, void 0, function* () {
            return generateClsagSignature(prefixHash, keyImage, ring, privateEphemeral, realOutputIndex, randomness);
        });
    }
    /**
     * Verifies a single-key CLSAG signature (transaction version 2)
     * @param prefixHash the transaction prefix hash
     * @param ring the ring public keys in transaction order (ascending global index)
     * @param keyImage the key image of the input
     * @param signature the signature
     * @returns whether the signature is valid
     */
    checkClsagSignature(prefixHash, ring, keyImage, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            return CryptoExtensions_1.clsagVerify(prefixHash, ring, keyImage, signature);
        });
    }
    /**
     * Scans one output with an already computed key derivation. A tagged output (viewTag set)
     * whose view tag does not match is skipped before the output key is derived
     * @ignore
     */
    isOurTransactionOutputPrimitive(transactionPublicKey, derivedKey, output, publicSpendKey, privateSpendKey, generatePartial) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof output.viewTag !== 'undefined' && output.viewTag !== null) {
                const expectedViewTag = yield CryptoExtensions_1.deriveViewTag(derivedKey, output.index);
                if (expectedViewTag !== Types_1.TransactionOutputs.normalizeViewTag(output.viewTag)) {
                    throw new Error('Not our output');
                }
            }
            const publicEphemeral = yield Types_1.TurtleCoinCrypto.derivePublicKey(derivedKey, output.index, publicSpendKey);
            if (publicEphemeral === output.key) {
                output.input = {
                    publicEphemeral,
                    transactionKeys: {
                        publicKey: transactionPublicKey,
                        derivedKey,
                        outputIndex: output.index
                    }
                };
                if (privateSpendKey) {
                    /*  If we are forcing the generation of a partial key image then we
                        use the supplied private spend key in the key generation instead of
                        the privateEphemeral that we don't have
                     */
                    const privateEphemeral = (generatePartial)
                        ? privateSpendKey
                        : yield Types_1.TurtleCoinCrypto.deriveSecretKey(derivedKey, output.index, privateSpendKey);
                    const derivedPublicEphemeral = yield Types_1.TurtleCoinCrypto.secretKeyToPublicKey(privateEphemeral);
                    if (derivedPublicEphemeral !== publicEphemeral && !generatePartial) {
                        throw new Error('Incorrect private spend key supplied');
                    }
                    const keyImage = yield Types_1.TurtleCoinCrypto.generateKeyImage(publicEphemeral, privateEphemeral);
                    output.input.privateEphemeral = privateEphemeral;
                    output.keyImage = keyImage;
                    output.isPartialKeyImage = (generatePartial) || false;
                }
                return output;
            }
            throw new Error('Not our output');
        });
    }
    /**
     * Calculates the minimum transaction fee given the transaction size (bytes)
     * @param txSize the transaction size in bytes
     * @returns the minimum transaction fee
     */
    calculateMinimumTransactionFee(txSize) {
        return 10;
        const chunks = Math.ceil(txSize /
            (this.m_config.feePerByteChunkSize || Config_1.Config.feePerByteChunkSize));
        return chunks *
            (this.m_config.feePerByteChunkSize || Config_1.Config.feePerByteChunkSize) *
            (this.m_config.feePerByte || Config_1.Config.feePerByte);
    }
    /**
     * Creates an integrated address using the supplied values
     * @param address the wallet address
     * @param paymentId the payment ID
     * @param [prefix] the address prefix
     * @returns the integrated address
     */
    createIntegratedAddress(address, paymentId, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof prefix === 'number') {
                prefix = new AddressPrefix_1.AddressPrefix(prefix);
            }
            if (!prefix) {
                prefix = new AddressPrefix_1.AddressPrefix(this.m_config.addressPrefix || Config_1.Config.addressPrefix);
            }
            const addr = yield Address_1.Address.fromAddress(address);
            addr.paymentId = paymentId;
            if (prefix) {
                addr.prefix = prefix;
            }
            return addr.toString();
        });
    }
    /**
     * Formats atomic units into human readable units
     * @param amount the amount in atomic units
     * @returns the amount in human readable units
     */
    formatMoney(amount) {
        let places = '';
        for (let i = 0; i < (this.m_config.coinUnitPlaces || Config_1.Config.coinUnitPlaces); i++) {
            places += '0';
        }
        if (typeof amount !== 'number') {
            amount = amount.toJSNumber();
        }
        return Numeral(amount / Math.pow(10, this.m_config.coinUnitPlaces || Config_1.Config.coinUnitPlaces)).format('0,0.' + places);
    }
    /**
     * Generates an array of transaction outputs (new destinations) for the given address
     * and the given amount within the allowed rules of the network
     * @param address the destination wallet address
     * @param amount the amount to send
     * @returns a list of transaction outputs
     */
    generateTransactionOutputs(address, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount < 0) {
                throw new RangeError('Amount must be a positive value');
            }
            const result = [];
            const destination = yield Address_1.Address.fromAddress(address);
            const amountChars = amount.toString().split('').reverse();
            for (let i = 0; i < amountChars.length; i++) {
                const amt = parseInt(amountChars[i], 10) * Math.pow(10, i);
                if (amt > (this.m_config.maximumOutputAmount || Config_1.Config.maximumOutputAmount)) {
                    let splitAmt = amt;
                    while (splitAmt >= (this.m_config.maximumOutputAmount || Config_1.Config.maximumOutputAmount)) {
                        result.push({
                            amount: this.m_config.maximumOutputAmount || Config_1.Config.maximumOutputAmount,
                            destination: destination
                        });
                        splitAmt -= this.m_config.maximumOutputAmount || Config_1.Config.maximumOutputAmount;
                    }
                }
                else if (amt !== 0) {
                    result.push({
                        amount: amt,
                        destination: destination
                    });
                }
            }
            return result;
        });
    }
    /**
     * Signs an arbitrary message using the supplied private key
     * @async
     * @param message the arbitrary message to sign
     * @param privateKey the private key to sign with
     * @returns the signature
     */
    signMessage(message, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof message !== 'string') {
                message = JSON.stringify(message);
            }
            const publicKey = yield Types_1.TurtleCoinCrypto.secretKeyToPublicKey(privateKey);
            const hex = Buffer.from(message);
            const hash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(hex.toString('hex'));
            return Types_1.TurtleCoinCrypto.generateSignature(hash, publicKey, privateKey);
        });
    }
    /**
     * Verifies the signature of an arbitrary message using the signature and the supplied public key
     * @async
     * @param message the arbitrary message that was signed
     * @param publicKey the public key of the private key that was used to sign
     * @param signature the signature
     * @returns whether the signature is valid
     */
    verifyMessageSignature(message, publicKey, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof message !== 'string') {
                message = JSON.stringify(message);
            }
            const hex = Buffer.from(message);
            const hash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(hex.toString('hex'));
            return Types_1.TurtleCoinCrypto.checkSignature(hash, publicKey, signature);
        });
    }
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
    createTransaction(outputs, inputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, extraData, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const feePerByte = this.m_config.activateFeePerByteTransactions || Config_1.Config.activateFeePerByteTransactions || false;
            const prepared = yield this.createTransactionStructure(outputs, inputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, extraData, options);
            const txPrefixHash = yield prepared.transaction.prefixHash();
            if (prepared.transaction.version >= 2) {
                prepared.transaction.clsagSignatures = yield generateClsagSignatures(txPrefixHash, prepared.inputs, (options) ? options.clsagRandomness : undefined);
                const minimumV2Fee = this.calculateMinimumTransactionFee(prepared.transaction.size);
                if (feeAmount && feeAmount !== 0 && feePerByte && feeAmount < minimumV2Fee) {
                    throw new Error('Transaction fee [' + prepared.transaction.fee +
                        '] is not enough for network transmission: ' + minimumV2Fee);
                }
                return prepared.transaction;
            }
            const promises = [];
            for (let i = 0; i < prepared.inputs.length; i++) {
                const input = prepared.inputs[i];
                const srcKeys = [];
                if (!input.input.privateEphemeral) {
                    throw new Error('private ephemeral missing from input');
                }
                input.outputs.forEach((out) => srcKeys.push(out.key));
                promises.push(generateRingSignatures(txPrefixHash, input.keyImage, srcKeys, input.input.privateEphemeral, input.realOutputIndex, i));
            }
            const tmpSignatures = yield Promise.all(promises);
            tmpSignatures.sort((a, b) => (a.index > b.index) ? 1 : -1);
            const signatures = [];
            tmpSignatures.forEach((sigs) => {
                const sigSet = [];
                sigs.signatures.forEach((sig) => sigSet.push(sig));
                signatures.push(sigSet);
            });
            prepared.transaction.signatures = signatures;
            const minimumFee = this.calculateMinimumTransactionFee(prepared.transaction.size);
            if (feeAmount && feeAmount !== 0 && feePerByte && feeAmount < minimumFee) {
                throw new Error('Transaction fee [' + prepared.transaction.fee +
                    '] is not enough for network transmission: ' + minimumFee);
            }
            return prepared.transaction;
        });
    }
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
    createTransactionStructure(outputs, inputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, extraData, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const version = transactionVersion(options);
            if (typeof feeAmount === 'undefined') {
                feeAmount = this.m_config.defaultNetworkFee || Config_1.Config.defaultNetworkFee;
            }
            unlockTime = unlockTime || 0;
            const feePerByte = this.m_config.activateFeePerByteTransactions || Config_1.Config.activateFeePerByteTransactions || false;
            if (Array.isArray(mixin) && mixin.length !== inputs.length) {
                throw new Error('The number of mixins supplied does not match the number of inputs supplied');
            }
            if (randomOutputs.length !== inputs.length && hasMixin(mixin)) {
                throw new Error('The sets of random outputs supplied does not match the number of inputs supplied');
            }
            for (let i = 0; i < randomOutputs.length; i++) {
                if (randomOutputs[i].length < mixinOf(mixin, i)) {
                    throw new Error('There are not enough random outputs to mix with');
                }
            }
            let neededMoney = Types_1.BigInteger.zero;
            let integratedPaymentId;
            for (const output of outputs) {
                if (output.amount <= 0) {
                    throw new RangeError('Cannot create an output with an amount <= 0');
                }
                if (output.amount > (this.m_config.maximumOutputAmount || Config_1.Config.maximumOutputAmount)) {
                    throw new RangeError('Cannot create an output with an amount > ' +
                        (this.m_config.maximumOutputAmount || Config_1.Config.maximumOutputAmount));
                }
                neededMoney = neededMoney.add(output.amount);
                if (neededMoney.greater(UINT64_MAX)) {
                    throw new RangeError('Total output amount exceeds UINT64_MAX');
                }
                /* Check to see if our destination contains differeing payment IDs via integrated addresses */
                if (output.destination.paymentId) {
                    if (!integratedPaymentId) {
                        integratedPaymentId = output.destination.paymentId;
                    }
                    else if (integratedPaymentId && integratedPaymentId !== output.destination.paymentId) {
                        throw new Error('Cannot perform multiple transfers with differing integrated addresses');
                    }
                }
            }
            /* If we found an integrated payment ID in the destinations and we supplied a payment ID
            in our call to this method and they do not match, this will result in a failure */
            if (integratedPaymentId && paymentId && integratedPaymentId !== paymentId) {
                throw new Error('Transfer destinations contains an integrated payment ID that does not match the payment' +
                    'ID supplied to this method');
            }
            let foundMoney = Types_1.BigInteger.zero;
            for (const input of inputs) {
                if (input.amount <= 0) {
                    throw new RangeError('Cannot spend outputs with an amount <= 0');
                }
                foundMoney = foundMoney.add(input.amount);
                if (foundMoney.greater(UINT64_MAX)) {
                    throw new RangeError('Total input amount exceeds UINT64_MAX');
                }
            }
            if (neededMoney.greater(foundMoney)) {
                throw new Error('We need more funds than was currently supplied for the transaction');
            }
            const change = foundMoney.subtract(neededMoney);
            if (!feePerByte && feeAmount && change.lesser(feeAmount)) {
                throw new Error('We have not spent all of what we sent in');
            }
            const transactionInputs = yield prepareTransactionInputs(inputs, randomOutputs, mixin);
            const transactionOutputs = yield prepareTransactionOutputs(outputs, version, (options) ? options.transactionPrivateKey : undefined);
            if (transactionOutputs.outputs.length >
                (this.m_config.maximumOutputsPerTransaction || Config_1.Config.maximumOutputsPerTransaction)) {
                throw new RangeError('Tried to create a transaction with more outputs than permitted');
            }
            if (feeAmount === 0) {
                if (transactionInputs.length < 12) {
                    throw new Error('Sending a [0] fee transaction (fusion) requires a minimum of [' +
                        (this.m_config.fusionMinInputCount || Config_1.Config.fusionMinInputCount) + '] inputs');
                }
                const ratio = this.m_config.fusionMinInOutCountRatio || Config_1.Config.fusionMinInOutCountRatio;
                if ((transactionInputs.length / transactionOutputs.outputs.length) < ratio) {
                    throw new Error('Sending a [0] fee transaction (fusion) requires the ' +
                        'correct input:output ratio be met');
                }
            }
            const tx = new Transaction_1.Transaction();
            tx.version = version;
            tx.unlockTime = Types_1.BigInteger(unlockTime);
            yield tx.addPublicKey(transactionOutputs.transactionKeys.publicKey);
            tx.transactionKeys = transactionOutputs.transactionKeys;
            if (integratedPaymentId) {
                tx.addPaymentId(integratedPaymentId);
            }
            else if (paymentId) {
                tx.addPaymentId(paymentId);
            }
            if (extraData) {
                if (!(extraData instanceof Buffer)) {
                    extraData = (typeof extraData === 'string')
                        ? Buffer.from(extraData)
                        : Buffer.from(JSON.stringify(extraData));
                }
                tx.addData(extraData);
            }
            /* Version 1 sorts the inputs by key image (descending) as this library always did; version 2
               keeps the order given, as the Rust wallet core (xkr-wallet-core build_transaction) does */
            const sortInputs = (options && typeof options.sortInputs === 'boolean')
                ? options.sortInputs
                : version < 2;
            if (sortInputs) {
                transactionInputs.sort((a, b) => {
                    return (Types_1.BigInteger(a.keyImage, 16).compare(Types_1.BigInteger(b.keyImage, 16)) * -1);
                });
            }
            for (const input of transactionInputs) {
                let offsets = [];
                input.outputs.forEach((output) => offsets.push(Types_1.BigInteger(output.index)));
                offsets = Common_1.Common.absoluteToRelativeOffsets(offsets);
                tx.inputs.push(new Types_1.TransactionInputs.KeyInput(input.amount, offsets, input.keyImage));
            }
            for (const output of transactionOutputs.outputs) {
                /* The view tag is only set for version 2 (tagged output 0x03) */
                tx.outputs.push(new Types_1.TransactionOutputs.KeyOutput(output.amount, output.key, output.viewTag));
            }
            if (tx.extra.length > (this.m_config.maximumExtraSize || Config_1.Config.maximumExtraSize)) {
                throw new Error('Transaction extra exceeds the limit of [' +
                    (this.m_config.maximumExtraSize || Config_1.Config.maximumExtraSize) + '] bytes');
            }
            return {
                transaction: tx,
                inputs: transactionInputs
            };
        });
    }
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
    prepareTransaction(outputs, inputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, extraData, randomKey, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const feePerByte = this.m_config.activateFeePerByteTransactions || Config_1.Config.activateFeePerByteTransactions || false;
            const prepared = yield this.createTransactionStructure(outputs, inputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, extraData, options);
            const recipients = [];
            for (const output of outputs) {
                recipients.push({
                    address: yield output.destination.address(),
                    amount: output.amount
                });
            }
            if (prepared.transaction.version >= 2) {
                const signatureMetaV2 = [];
                let signatureBytes = 0;
                for (let i = 0; i < prepared.inputs.length; i++) {
                    const input = prepared.inputs[i];
                    signatureMetaV2.push({
                        index: i,
                        realOutputIndex: input.realOutputIndex,
                        key: '',
                        inputKeys: input.outputs.map((out) => out.key),
                        keyImage: input.keyImage,
                        input: {
                            derivation: input.input.transactionKeys.derivedKey,
                            outputIndex: input.input.transactionKeys.outputIndex,
                            tx_public_key: input.input.transactionKeys.publicKey
                        }
                    });
                    signatureBytes += 32 * (input.outputs.length + 1);
                }
                /* The signed size: the prefix plus one CLSAG (32 * (ring size + 1) bytes) per input */
                const minimumV2Fee = this.calculateMinimumTransactionFee(prepared.transaction.size + signatureBytes);
                if (feeAmount && feeAmount !== 0 && feePerByte && feeAmount < minimumV2Fee) {
                    throw new Error('Transaction fee [' + prepared.transaction.fee +
                        '] is not enough for network transmission: ' + minimumV2Fee);
                }
                return {
                    transaction: prepared.transaction,
                    transactionRecipients: recipients,
                    transactionPrivateKey: prepared.transaction.transactionKeys.privateKey,
                    signatureMeta: signatureMetaV2
                };
            }
            const txPrefixHash = yield prepared.transaction.prefixHash();
            const promises = [];
            for (let i = 0; i < prepared.inputs.length; i++) {
                const input = prepared.inputs[i];
                const srcKeys = [];
                input.outputs.forEach((out) => srcKeys.push(out.key));
                promises.push(prepareRingSignatures(txPrefixHash, input.keyImage, srcKeys, input.realOutputIndex, input.input.transactionKeys.derivedKey, input.input.transactionKeys.outputIndex, i, input.input.transactionKeys.publicKey, randomKey));
            }
            const results = yield Promise.all(promises);
            results.sort((a, b) => (a.index > b.index) ? 1 : -1);
            const signatures = [];
            const signatureMeta = [];
            for (const result of results) {
                const sigSet = [];
                if (!result.signatures) {
                    throw new Error('Prepared signatures are incomplete');
                }
                result.signatures.forEach((sig) => sigSet.push(sig));
                signatures.push(sigSet);
                const meta = {
                    index: result.index,
                    realOutputIndex: result.realOutputIndex,
                    key: result.key,
                    inputKeys: result.inputKeys,
                    input: {
                        derivation: prepared.inputs[result.index].input.transactionKeys.derivedKey,
                        outputIndex: prepared.inputs[result.index].input.transactionKeys.outputIndex
                    }
                };
                signatureMeta.push(meta);
            }
            prepared.transaction.signatures = signatures;
            const minimumFee = this.calculateMinimumTransactionFee(prepared.transaction.size);
            if (feeAmount && feeAmount !== 0 && feePerByte && feeAmount < minimumFee) {
                throw new Error('Transaction fee [' + prepared.transaction.fee +
                    '] is not enough for network transmission: ' + minimumFee);
            }
            return {
                transaction: prepared.transaction,
                transactionRecipients: recipients,
                transactionPrivateKey: prepared.transaction.transactionKeys.privateKey,
                signatureMeta: signatureMeta
            };
        });
    }
    /**
     * Completes a prepared transaction using the supplied private ephemeral
     * The resulting transaction can be broadcast to the network. Please note that the PreparedTransaction
     * signatures meta data must be updated to include the proper private ephemeral
     * @param preparedTransaction the prepared transaction
     * @param privateSpendKey the private spend key of the wallet that contains the funds
     * @returns the completed transaction
     */
    completeTransaction(preparedTransaction, privateSpendKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            const tx = preparedTransaction.transaction;
            if (!preparedTransaction.signatureMeta) {
                throw new Error('No transaction signature meta data supplied');
            }
            if (tx.version >= 2) {
                return completeClsagTransaction(preparedTransaction, privateSpendKey);
            }
            for (const meta of preparedTransaction.signatureMeta) {
                if (!meta.input || !meta.input.derivation || !meta.input.outputIndex) {
                    throw new Error('Meta data is missing critical information');
                }
                promises.push(completeRingSignatures(privateSpendKey, meta.input.derivation, meta.input.outputIndex, meta.realOutputIndex, meta.key, tx.signatures[meta.index], meta.index));
            }
            const results = yield Promise.all(promises);
            for (const result of results) {
                tx.signatures[result.index] = result.signatures;
            }
            const prefixHash = yield tx.prefixHash();
            const checkPromises = [];
            for (let i = 0; i < tx.inputs.length; i++) {
                checkPromises.push(checkRingSignatures(prefixHash, tx.inputs[i].keyImage, getInputKeys(preparedTransaction.signatureMeta, i), tx.signatures[i]));
            }
            const validSigs = yield Promise.all(checkPromises);
            for (const valid of validSigs) {
                if (!valid) {
                    throw new Error('Could not complete ring signatures');
                }
            }
            return preparedTransaction.transaction;
        });
    }
}
exports.CryptoNote = CryptoNote;
/**
 * Returns the transaction version requested by the options: 1 (default) or 2
 * @ignore
 */
function transactionVersion(options) {
    if (!options || typeof options.version === 'undefined' || options.version === null) {
        return 1;
    }
    if (options.version !== 1 && options.version !== 2) {
        throw new RangeError('Unsupported transaction version: ' + options.version + ' (supported: 1, 2)');
    }
    return options.version;
}
/**
 * Generates a CLSAG signature and verifies it before returning it
 * @ignore
 */
function generateClsagSignature(hash, keyImage, publicKeys, privateEphemeral, realOutputIndex, randomness) {
    return __awaiter(this, void 0, void 0, function* () {
        const signature = yield CryptoExtensions_1.clsagSign(hash, publicKeys, privateEphemeral, realOutputIndex, randomness);
        /* Verifying with the input's key image also catches a key image that does not belong to the secret */
        const valid = yield CryptoExtensions_1.clsagVerify(hash, publicKeys, keyImage, signature);
        if (!valid) {
            throw new Error('Could not generate CLSAG signature');
        }
        return signature;
    });
}
/**
 * Signs every input of a version 2 transaction with CLSAG over the prefix hash, in input order
 * @ignore
 */
function generateClsagSignatures(txPrefixHash, inputs, randomness) {
    return __awaiter(this, void 0, void 0, function* () {
        if (randomness && randomness.length !== inputs.length) {
            throw new RangeError('CLSAG randomness must be given for every input');
        }
        const promises = [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            if (!input.input.privateEphemeral) {
                throw new Error('private ephemeral missing from input');
            }
            promises.push(generateClsagSignature(txPrefixHash, input.keyImage, input.outputs.map((out) => out.key), input.input.privateEphemeral, input.realOutputIndex, (randomness) ? randomness[i] : undefined));
        }
        return Promise.all(promises);
    });
}
/**
 * Completes a prepared version 2 transaction: derives each input's private ephemeral from the
 * private spend key and signs the input with CLSAG
 * @ignore
 */
function completeClsagTransaction(preparedTransaction, privateSpendKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = preparedTransaction.transaction;
        if (tx.signatures.length !== 0) {
            throw new Error('Version 2 transactions carry CLSAG signatures, not ring signatures');
        }
        const prefixHash = yield tx.prefixHash();
        const promises = [];
        for (let i = 0; i < tx.inputs.length; i++) {
            const meta = getSignatureMeta(preparedTransaction.signatureMeta, i);
            if (!meta.input || !meta.input.derivation || typeof meta.input.outputIndex !== 'number' ||
                !meta.inputKeys) {
                throw new Error('Meta data is missing critical information');
            }
            const input = tx.inputs[i];
            if (input.type !== Types_1.TransactionInputs.InputType.KEY) {
                throw new Error('Only key inputs can be signed');
            }
            const keyImage = input.keyImage;
            if (meta.keyImage && meta.keyImage !== keyImage) {
                throw new Error('Meta data key image does not match the transaction input');
            }
            const privateEphemeral = yield Types_1.TurtleCoinCrypto.deriveSecretKey(meta.input.derivation, meta.input.outputIndex, privateSpendKey);
            promises.push(generateClsagSignature(prefixHash, keyImage, meta.inputKeys, privateEphemeral, meta.realOutputIndex));
        }
        tx.clsagSignatures = yield Promise.all(promises);
        return tx;
    });
}
/** @ignore */
function getSignatureMeta(preparedSignatures, index) {
    for (const meta of preparedSignatures) {
        if (meta.index === index) {
            return meta;
        }
    }
    throw new Error('Could not locate the signature meta data of input ' + index);
}
/** @ignore */
function checkRingSignatures(hash, keyImage, publicKeys, signatures) {
    return __awaiter(this, void 0, void 0, function* () {
        return Types_1.TurtleCoinCrypto.checkRingSignatures(hash, keyImage, publicKeys, signatures);
    });
}
/** @ignore */
function generateRingSignatures(hash, keyImage, publicKeys, privateKey, realOutputIndex, index) {
    return __awaiter(this, void 0, void 0, function* () {
        const signatures = yield Types_1.TurtleCoinCrypto.generateRingSignatures(hash, keyImage, publicKeys, privateKey, realOutputIndex);
        const valid = yield checkRingSignatures(hash, keyImage, publicKeys, signatures);
        if (!valid) {
            throw new Error('Could not generate ring signatures');
        }
        return { signatures, index };
    });
}
/** @ignore */
function prepareRingSignatures(hash, keyImage, publicKeys, realOutputIndex, derivation, outputIndex, index, tx_public_key, randomKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const prepped = yield Types_1.TurtleCoinCrypto.prepareRingSignatures(hash, keyImage, publicKeys, realOutputIndex, randomKey);
        return {
            index: index,
            realOutputIndex: realOutputIndex,
            key: prepped.k,
            signatures: prepped.signatures,
            inputKeys: publicKeys,
            input: {
                derivation,
                outputIndex,
                tx_public_key
            }
        };
    });
}
/** @ignore */
function completeRingSignatures(privateSpendKey, derivation, outputIndex, realOutputIndex, key, sigs, index) {
    return __awaiter(this, void 0, void 0, function* () {
        const privateEphemeral = yield Types_1.TurtleCoinCrypto.deriveSecretKey(derivation, outputIndex, privateSpendKey);
        const signatures = yield Types_1.TurtleCoinCrypto.completeRingSignatures(privateEphemeral, realOutputIndex, key, sigs);
        return { signatures, index };
    });
}
/**
 * The mixin of input i: the single mixin, or the i-th entry of a per-input list
 * @ignore
 */
function mixinOf(mixin, index) {
    if (Array.isArray(mixin)) {
        return (index < mixin.length) ? mixin[index] : 0;
    }
    return mixin;
}
/**
 * Whether any input mixes with random outputs
 * @ignore
 */
function hasMixin(mixin) {
    return (Array.isArray(mixin)) ? mixin.some((m) => m !== 0) : mixin !== 0;
}
/** @ignore */
function prepareTransactionInputs(inputs, randomOutputs, mixins) {
    if (inputs.length !== randomOutputs.length && hasMixin(mixins)) {
        throw new Error('There are not enough random output sets to mix with the real outputs');
    }
    for (let i = 0; i < randomOutputs.length; i++) {
        if (randomOutputs[i].length < mixinOf(mixins, i)) {
            throw new Error('There are not enough random outputs to mix with');
        }
    }
    const mixedInputs = [];
    for (let i = 0; i < inputs.length; i++) {
        const mixedOutputs = [];
        const realOutput = inputs[i];
        const mixin = mixinOf(mixins, i);
        if (!realOutput.keyImage) {
            throw new Error('input is missing its key image');
        }
        if (!realOutput.input) {
            throw new Error('input is missing mandatory data fields');
        }
        if (realOutput.amount <= 0) {
            throw new RangeError('Real inputs cannot have an amount <= 0');
        }
        if (mixin !== 0) {
            const fakeOutputs = randomOutputs[i];
            fakeOutputs.sort((a, b) => {
                return Types_1.BigInteger(a.globalIndex).compare(b.globalIndex);
            });
            for (const fakeOutput of fakeOutputs) {
                if (mixedOutputs.length === mixin) {
                    continue;
                }
                if (fakeOutput.globalIndex === realOutput.globalIndex) {
                    continue;
                }
                mixedOutputs.push({
                    key: fakeOutput.key,
                    index: fakeOutput.globalIndex
                });
            }
            if (mixedOutputs.length < mixin) {
                throw new Error('It is impossible to mix with yourself. Find some more random outputs and try again.');
            }
        }
        mixedOutputs.push({
            key: realOutput.key,
            index: realOutput.globalIndex
        });
        mixedOutputs.sort((a, b) => {
            return Types_1.BigInteger(a.index).compare(b.index);
        });
        const input = {
            amount: realOutput.amount,
            realOutputIndex: 0,
            keyImage: realOutput.keyImage,
            input: realOutput.input,
            outputs: mixedOutputs
        };
        for (let j = 0; j < mixedOutputs.length; j++) {
            if (mixedOutputs[j].index === realOutput.globalIndex) {
                input.realOutputIndex = j;
            }
        }
        mixedInputs.push(input);
    }
    return mixedInputs;
}
/** @ignore */
function prepareTransactionOutputs(outputs, version = 1, transactionPrivateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        function prepareOutput(destination, amount, index, privateKey) {
            return __awaiter(this, void 0, void 0, function* () {
                const outDerivation = yield Types_1.TurtleCoinCrypto.generateKeyDerivation(destination.view.publicKey, privateKey);
                const outPublicEphemeral = yield Types_1.TurtleCoinCrypto.derivePublicKey(outDerivation, index, destination.spend.publicKey);
                if (version >= 2) {
                    /* Version 2: view_tag(8*r*A, index) from the same derivation as the output key */
                    return {
                        amount,
                        key: outPublicEphemeral,
                        viewTag: yield CryptoExtensions_1.deriveViewTag(outDerivation, index)
                    };
                }
                return {
                    amount,
                    key: outPublicEphemeral
                };
            });
        }
        let transactionKeys;
        if (transactionPrivateKey) {
            if (!(yield Types_1.TurtleCoinCrypto.checkScalar(transactionPrivateKey))) {
                throw new Error('Invalid transaction private key supplied');
            }
            const publicKey = yield Types_1.TurtleCoinCrypto.secretKeyToPublicKey(transactionPrivateKey);
            transactionKeys = yield Types_1.ED25519.KeyPair.from(publicKey, transactionPrivateKey);
        }
        else {
            const keys = yield Types_1.TurtleCoinCrypto.generateKeys();
            transactionKeys = yield Types_1.ED25519.KeyPair.from(keys.public_key, keys.private_key);
        }
        outputs.sort((a, b) => (a.amount > b.amount) ? 1 : ((b.amount > a.amount) ? -1 : 0));
        const promises = [];
        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            if (output.amount <= 0) {
                throw new RangeError('Amount cannot be <= 0');
            }
            promises.push(prepareOutput(output.destination, output.amount, i, transactionKeys.privateKey));
        }
        const preparedOutputs = yield Promise.all(promises);
        return {
            transactionKeys,
            outputs: preparedOutputs
        };
    });
}
/** @ignore */
function getInputKeys(preparedSignatures, index) {
    for (const meta of preparedSignatures) {
        if (meta.index === index) {
            if (meta.inputKeys) {
                return meta.inputKeys;
            }
        }
    }
    throw new Error('Could not locate input keys in the prepared signatures');
}
