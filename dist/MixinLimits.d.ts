/**
 * A mixin limit that becomes active at a block height
 */
export declare class MixinLimit {
    /**
     * Height this mixin limit becomes active at (inclusive)
     */
    readonly height: number;
    /**
     * Minimum mixin (ring size - 1) allowed from this height
     */
    readonly minMixin: number;
    /**
     * Maximum mixin allowed from this height
     */
    readonly maxMixin: number;
    /**
     * Default mixin to use from this height (within min/max)
     */
    readonly defaultMixin: number;
    /**
     * @param height Height this mixin limit becomes active at (inclusive)
     * @param minMixin Minimum mixin allowed at this height
     * @param [maxMixin] Maximum mixin allowed at this height (default: minMixin)
     * @param [defaultMixin] Default mixin to use at this height (default: minMixin)
     */
    constructor(height: number, minMixin: number, maxMixin?: number, defaultMixin?: number);
}
/**
 * A table of mixin limits by height. At a height the limit with the highest activation height at
 * or below that height applies (C++ Mixins::getMixinAllowableRange, Rust xkr_consensus::mixin_limits).
 * The mixin limits apply to transaction versions 1 and 2 alike
 */
export declare class MixinLimits {
    /**
     * The Kryptokrona mainnet table (xkr-consensus params.rs, C++ CryptoNoteConfig.h):
     * from 440 000 mixin 0..100 (default 100), from 620 000 exactly 7, from 800 000 exactly 3,
     * from 1 250 000 mixin 1..5 (default 5); below 440 000 any mixin, default 3
     */
    static defaults(): MixinLimits;
    private readonly m_limits;
    private readonly m_defaultMixin;
    /**
     * @param limits Mixin limits to apply; can be empty
     * @param defaultMixin Default mixin to use if no limits are given or before the first limit applies
     */
    constructor(limits: MixinLimit[], defaultMixin: number);
    /**
     * The limits, ordered by activation height (highest first)
     */
    get limits(): MixinLimit[];
    /**
     * Returns the limit that applies at the given height (the one with the highest activation
     * height at or below it), or undefined before the first limit
     * @param height the block height
     */
    getMixinLimitByHeight(height: number): MixinLimit | undefined;
    /**
     * Returns the default mixin for the given height
     * @param height the block height
     */
    getDefaultMixinByHeight(height: number): number;
    /**
     * Returns the minimum and maximum mixin for the given height: those of the newest limit at or
     * below the height; [0, 2^64] before the first limit
     * @param height the block height
     * @returns [minimum mixin, maximum mixin]
     */
    getMixinLimitsByHeight(height: number): [number, number];
}
