"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixinLimits = exports.MixinLimit = void 0;
/**
 * A mixin limit that becomes active at a block height
 */
class MixinLimit {
    /**
     * @param height Height this mixin limit becomes active at (inclusive)
     * @param minMixin Minimum mixin allowed at this height
     * @param [maxMixin] Maximum mixin allowed at this height (default: minMixin)
     * @param [defaultMixin] Default mixin to use at this height (default: minMixin)
     */
    constructor(height, minMixin, maxMixin, defaultMixin) {
        this.height = height;
        this.minMixin = minMixin;
        this.maxMixin = (typeof maxMixin === 'undefined') ? minMixin : maxMixin;
        this.defaultMixin = (typeof defaultMixin === 'undefined') ? minMixin : defaultMixin;
    }
}
exports.MixinLimit = MixinLimit;
/**
 * A table of mixin limits by height. At a height the limit with the highest activation height at
 * or below that height applies (C++ Mixins::getMixinAllowableRange, Rust xkr_consensus::mixin_limits).
 * The mixin limits apply to transaction versions 1 and 2 alike
 */
class MixinLimits {
    /**
     * @param limits Mixin limits to apply; can be empty
     * @param defaultMixin Default mixin to use if no limits are given or before the first limit applies
     */
    constructor(limits, defaultMixin) {
        /* Ordered by height, highest first */
        this.m_limits = limits.slice().sort((a, b) => b.height - a.height);
        this.m_defaultMixin = defaultMixin;
    }
    /**
     * The Kryptokrona mainnet table (xkr-consensus params.rs, C++ CryptoNoteConfig.h):
     * from 440 000 mixin 0..100 (default 100), from 620 000 exactly 7, from 800 000 exactly 3,
     * from 1 250 000 mixin 1..5 (default 5); below 440 000 any mixin, default 3
     */
    static defaults() {
        return new MixinLimits([
            new MixinLimit(440000, 0, 100, 100),
            new MixinLimit(620000, 7, 7, 7),
            new MixinLimit(800000, 3, 3, 3),
            new MixinLimit(1250000, 1, 5, 5)
        ], 3);
    }
    /**
     * The limits, ordered by activation height (highest first)
     */
    get limits() {
        return this.m_limits.slice();
    }
    /**
     * Returns the limit that applies at the given height (the one with the highest activation
     * height at or below it), or undefined before the first limit
     * @param height the block height
     */
    getMixinLimitByHeight(height) {
        for (const limit of this.m_limits) {
            if (height >= limit.height) {
                return limit;
            }
        }
        return undefined;
    }
    /**
     * Returns the default mixin for the given height
     * @param height the block height
     */
    getDefaultMixinByHeight(height) {
        const limit = this.getMixinLimitByHeight(height);
        return (limit) ? limit.defaultMixin : this.m_defaultMixin;
    }
    /**
     * Returns the minimum and maximum mixin for the given height: those of the newest limit at or
     * below the height; [0, 2^64] before the first limit
     * @param height the block height
     * @returns [minimum mixin, maximum mixin]
     */
    getMixinLimitsByHeight(height) {
        const limit = this.getMixinLimitByHeight(height);
        if (!limit) {
            return [0, Math.pow(2, 64)];
        }
        return [limit.minMixin, limit.maxMixin];
    }
}
exports.MixinLimits = MixinLimits;
