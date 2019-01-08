declare class CryptoNote {
    constructor(config?: CryptoNoteOptions);

    createNewSeed(
        entropy?: string,
        iterations?: number): string;

    createNewAddress(
        entropy?: string,
        lang?: string,
        addressPrefix?: string): Address;

    createAddressFromSeed(
        seed: string,
        lang?: string,
        addressPrefix?: string): Address;

    createAddressFromMnemonic(
        mnemonic: string,
        lang?: string,
        addressPrefix?: string): Address;

    createAddressFromKeys(
        privateSpendKey: string,
        privateViewKey: string,
        addressPrefix?: string): Address;

    decodeAddressPrefix(address: string): DecodedAddressPrefix;

    decodeAddress(
        address: string,
        addressPrefix?: string): DecodedAddress;

    encodeRawAddress(rawAddress: string): string;

    encodeAddress(
        publicViewKey: string,
        publicSpendKey: string,
        paymentId?: string,
        addressPrefix?: string): string;

    createIntegratedAddress(
        address: string,
        paymentId: string,
        addressPrefix?: string): string;

    privateKeyToPublicKey(privateKey: string): string;

    scanTransactionOutputs(
        transactionPublicKey: string,
        outputs: Output[],
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey?: string): Output[];

    isOurTransactionOutput(
        transactionPublicKey: string,
        output: Output,
        privateViewKey: string,
        privateSpendKey?: string): Output | boolean;

    generateKeyImage(
        transactionPublicKey: string,
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey: string,
        outputIndex: number): KeyImage;

    createTransaction(
        ourKeys: Wallet,
        transfers: TxDestination[],
        ourOutputs: Output[],
        randomOuts: RandomOutput[],
        mixin: number,
        feeAmount: number,
        paymentId?: string,
        unlockTime?: number): Transaction;

    formatMoney(amount: number): string;

    generateKeyDerivation(
        transactionPublicKey: string,
        privateViewKey: string): string;

    underivePublicKey(
        derivation: string,
        outputIndex: number,
        outputKey: string): string;
}

interface CryptoNoteOptions {
    coinUnitPlaces?: number,
    addressPrefix?: number,
    keccakIterations?: number,
    defaultNetworkFee?: number
}

interface Output {
    key: string,
    input: Input,
    keyImage: string
    index: number,
    globalIndex: number
}

interface Input {
    transactionKey: Keys,
    publicEphemeral: string
    privateEphemeral: string
}

interface Address {
    spend: Keys,
    view: Keys,
    address: string,
    mnemonic: string,
    seed: string
}

interface Keys {
    privateKey: string,
    publicKey: string
}

interface DecodedAddressPrefix {
    prefix: string,
    base58: string,
    decimal: number,
    hexadecimal: string
}

interface DecodedAddress {
    publicViewKey: string,
    publicSpendKey: string,
    paymentId: string,
    encodedPrefix: string,
    prefix: number,
    rawAddress: string
}

interface KeyImage {
    input: Input,
    keyImage: string
}

interface TxDestination {
    amount: number,
    keys: DecodedAddress
}

interface Wallet {
    view: Keys,
    spend: Keys
}

interface RandomOutput {
    key: string,
    globalIndex: number
}

interface CreatedTransaction {
    transaction: Transaction,
    rawTransaction: string,
    hash: string
}

interface Transaction {
    unlockTime: number,
    version: number,
    extra: string,
    prvKey: string,
    vin: Vin[],
    vout: Vout[],
    signatures: string[][]
}

interface Vin {
    type: string,
    amount: number,
    keyImage: string,
    keyOffsets: number[]
}

interface Vout {
    amount: number,
    target: Target,
    type: string
}

interface Target {
    data: string
}

export = CryptoNote;
