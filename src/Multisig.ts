// Copyright (c) 2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import {Address} from './Address';
import {ED25519} from './Types/ED25519';
import {TurtleCoinCrypto} from './Types';
/** @ignore */
import KeyPair = ED25519.KeyPair;

/**
 * Represents a multisig helper class that can be used for the creation of multisig wallets
 */
export class Multisig {

    /**
     * Returns an address object representing the multisig wallet address
     */
    public get address(): Address {
        if (!this.isReady) {
            throw new Error('Not all participants have been loaded');
        }

        return Address.fromViewOnlyKeys(this.spend, this.view);
    }

    /**
     * Returns the threshold (M) of the multisig wallet
     */
    public get threshold(): number {
        return this.m_threshold;
    }

    /**
     * Returns the participants (N) of the multisig wallet
     */
    public get participants(): number {
        return this.m_participants;
    }

    /**
     * Returns the number of participants currently loaded into the object
     */
    public get current_participants(): number {
        return this.m_currentParticipants;
    }

    /**
     * Returns the shared private view key of the multisig wallet
     */
    public get view(): string {
        if (!this.isViewReady) {
            throw new Error('Not all participants have been loaded');
        }

        return TurtleCoinCrypto.calculateSharedPrivateKey(this.m_view_keys);
    }

    /**
     * Returns the shared public spend key of the multisig wallet
     */
    public get spend(): string {
        if (!this.isSpendReady) {
            throw new Error('Not all participants have been loaded');
        }

        const keys: string[] = this.m_participant_keys;

        this.m_multisig_keys.forEach((key) => {
            if (key.publicKey.length !== 0
                && keys.indexOf(key.publicKey) === -1) {
                keys.push(key.publicKey);
            }
        });

        return TurtleCoinCrypto.calculateSharedPublicKey(keys);
    }

    /**
     * Returns if the object is ready for export and/or use
     */
    public get isReady(): boolean {
        return (this.isViewReady && this.isSpendReady);
    }

    /**
     * Returns our multisig keys
     */
    public get multisig_keys(): KeyPair[] {
        return this.m_multisig_keys;
    }

    /**
     * Returns the public multisig keys
     */
    public get public_multisig_keys(): string[] {
        const result: string[] = [];

        this.calculated_multisig_keys.forEach((key) => {
            result.push(key.publicKey);
        });

        return result;
    }

    /**
     * Returns the private multisig keys
     */
    public get private_multisig_keys(): string [] {
        const result: string[] = [];

        this.calculated_multisig_keys.forEach((key) => {
            result.push(key.privateKey);
        });

        return result;
    }

    /**
     * Calculates our multisig keys using the participant public spend keys
     * @returns our multisig keys key pairs
     */
    private get calculated_multisig_keys(): KeyPair[] {
        if (this.m_threshold !== this.m_participants) {
            const multisig_keys: KeyPair[] = [];

            this.m_wallet_multisig_keys.forEach((multisig_key) => {
                const keys =
                    TurtleCoinCrypto.calculateMultisigPrivateKeys(multisig_key.privateKey, this.m_participant_keys);

                keys.forEach((key) => {
                    multisig_keys.push(new KeyPair(undefined, key));
                });
            });

            return multisig_keys;
        }

        throw new Error('Not a M:N instance');
    }

    /**
     * Returns if the view information is ready
     */
    private get isViewReady(): boolean {
        return (this.m_currentParticipants === this.m_participants);
    }

    /**
     * Returns if the spend information is ready
     */
    private get isSpendReady(): boolean {
        const loaded = (this.threshold === this.participants) ?
            this.m_participant_keys.length + 1 :
            this.m_participant_keys.length;
        return (loaded === Multisig.requiredSigningKeys(this.threshold, this.participants));
    }

    /**
     * Let's us know how many times participants must exchange information after the initial exchange
     * @param threshold the number of participants required to construct a new transaction
     * @param participants the wallet participants
     * @returns the number of additional exchange rounds required
     */
    public static exchangeRoundsRequired(threshold: number, participants: number): number {
        return participants - threshold;
    }

    /**
     * Initializes an initial multisig object using our address information
     * @param wallet our base wallet used to create the wallet
     * @param threshold the number of participants required to construct a new transaction
     * @param participants the wallet participants
     * @returns a new instance of the object
     */
    public static fromAddress(wallet: Address, threshold: number, participants: number): Multisig {
        if (!isValidThreshold(threshold, participants)) {
            throw new Error('Threshold does not require a majority of participants');
        }

        const result = new Multisig();

        if (!wallet.spend.isPaired) {
            throw new Error('Must have both private and public spend keys');
        }

        if (!wallet.view.isPaired) {
            throw new Error('Must have both private and public view keys');
        }

        result.m_wallet_multisig_keys.push(wallet.spend);

        result.m_multisig_keys.push(wallet.spend);

        result.m_view_keys.push(wallet.view.privateKey);

        result.m_threshold = threshold;

        result.m_participants = participants;

        return result;
    }

    /**
     * Initializes a multisig object using our previously generated multisig private keys
     * @param multisig_private_keys the previously generated multisig private keys
     * @param sharedPrivateViewKey the previously calculated view private key
     * @param threshold the number of participants required to construct a new transaction
     * @param participants the wallet participants
     * @returns a new instance of the object
     */
    public static fromMultisigKeys(
        multisig_private_keys: string[],
        sharedPrivateViewKey: string,
        threshold: number,
        participants: number): Multisig {
        if (!isValidThreshold(threshold, participants)) {
            throw new Error('Threshold does not require a majority of participants');
        }

        const result = new Multisig();

        multisig_private_keys.forEach((key) => {
            if (!TurtleCoinCrypto.checkScalar(key)) {
                throw new Error('Found an invalid private key in the list of multisig private keys');
            }

            result.m_multisig_keys.push(new KeyPair(undefined, key));

            result.m_wallet_multisig_keys.push(new KeyPair(undefined, key));
        });

        if (!TurtleCoinCrypto.checkScalar(sharedPrivateViewKey)) {
            throw new Error('Private view key is not a valid private key');
        }

        result.m_view_keys.push(sharedPrivateViewKey);

        result.m_threshold = threshold;

        result.m_participants = participants;

        return result;
    }

    /**
     * Returns the total number of signing keys created using the M:N values supplied
     * @param threshold the number of participants required to construct a new transaction
     * @param participants the wallet participants
     * @returns the total number of signing keys created
     */
    public static requiredSigningKeys(threshold: number, participants: number): number {
        return required_keys(threshold, participants);
    }

    /**
     * Returns if the given M:N scheme is valid for this library
     * @param threshold the number of participants required to construct a new transaction
     * @param participants the wallet participants
     * @returns if the given scheme is valid for this library
     */
    public static isValidThreshold(threshold: number, participants: number): boolean {
        return isValidThreshold(threshold, participants);
    }

    private m_wallet_multisig_keys: KeyPair[] = [];
    private m_multisig_keys: KeyPair[] = [];
    private m_participant_keys: string[] = [];
    private m_view_keys: string[] = [];
    private m_threshold: number = 0;
    private m_participants: number = 0;
    private m_currentParticipants: number = 1;

    /**
     * Adds a participant to the multisig object
     * Note: If this is an additional round of exchange, the publicSpendKeys should be the array of
     * public multisig keys of the participant and we will not supply the private view key again.
     * @param publicSpendKeys the participant spend key(s)
     * @param [privateViewKey] the private view key of the participant
     */
    public addParticipant(publicSpendKeys: string[] | string, privateViewKey?: string) {
        if (privateViewKey && !TurtleCoinCrypto.checkScalar(privateViewKey)) {
            throw new Error('Private view key is not a valid private key');
        }

        if (Array.isArray(publicSpendKeys) && publicSpendKeys.length > 1 && privateViewKey) {
            throw new Error('Must not supply the private view key with the participant in subsequent rounds');
        }

        if (!Array.isArray(publicSpendKeys)) {
            publicSpendKeys = [publicSpendKeys];
        }

        publicSpendKeys.forEach((key) => {
            if (!TurtleCoinCrypto.checkKey(key)) {
                throw new Error('Found an invalid public spend key in the list');
            }
        });

        if (privateViewKey && this.m_view_keys.indexOf(privateViewKey) === -1) {
            this.m_view_keys.push(privateViewKey);
        }

        publicSpendKeys.forEach((key) => {
            if (this.m_participant_keys.indexOf(key) === -1) {
                this.m_participant_keys.push(key);
            }
        });

        this.m_currentParticipants++;
    }
}

/** @ignore */
function isValidThreshold(threshold: number, participants: number): boolean {
    return (!((threshold / participants) <= .5) && required_keys(threshold, participants) <= 2 ** 13);
}

/** @ignore */
function required_keys(threshold: number, participants: number): number {
    let result = participants;

    const rounds = Multisig.exchangeRoundsRequired(threshold, participants);

    for (let i = 0; i < rounds; i++) {
        result = result - 1;

        result = ((result ** 2) + result) / 2;
    }

    return result;
}
