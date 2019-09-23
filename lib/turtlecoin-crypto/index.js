// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

/* eslint camelcase: 0 */

'use strict'

/**
 * Module of TurtleCoin Cryptographic Methods
 * @module Crypto
 * @class
 */
class Crypto {
  constructor () {
    /**
     * Whether the module is using native JS or WASM methods
     * @type {boolean}
     * @readonly
     */
    this.isNative = false

    /**
     * What type of underlying cryptographic library is being used
     * @type {string}
     * @readonly
     */
    this.type = 'unloaded'

    this.crypto = loadNativeAddon()

    if (this.crypto) {
      this.type = 'c++'
    }

    if (!this.crypto && typeof window !== 'undefined' && typeof window.TurtleCoinCrypto !== 'undefined') {
      this.crypto = loadBrowserWASM()

      if (this.crypto) {
        this.type = 'wasm'
        this.isNative = true
      }
    }

    if (!this.crypto && typeof window !== 'undefined') {
    /* If the there isn't a TurtleCoinCrypto WASM module
       preloaded in the environment, then let's try to load
       the WASM ourselves */
      this.crypto = loadWASMJS()

      if (this.crypto) {
        this.type = 'wasmjs'
        this.isNative = true
      }
    }

    if (!this.crypto) {
      this.crypto = loadNativeJS()
      if (this.crypto) {
        this.type = 'js'
        this.isNative = true
      } else {
        throw new Error('Could not load a core cryptography module')
      }
    }
  }

  /**
   * Checks that the given key is a valid public key
   * @param {string} key - the public key to check
   * @returns {boolean} whether the key is a valid public key
   */
  checkKey (key) {
    try {
      if (!this.isNative) {
        return this.crypto.checkKey(key)
      } else {
        return this.crypto.checkKey(key)
      }
    } catch (e) {
      return (!e)
    }
  }

  /**
   * Validates that the ring signatures provided are valid
   * @param {string} transactionPrefixHash - the transaction prefix hash
   * @param {string} keyImage - the key image that the signature pertains to
   * @param {string[]} inputKeys - the input keys used in the ring
   * @param {string[]} signatures - the signatures to verify
   * @returns {boolean} whether the signatures are valid or not
   */
  checkRingSignatures (transactionPrefixHash, keyImage, inputKeys, signatures) {
    try {
      if (!this.isNative) {
        return this.crypto.checkRingSignature(transactionPrefixHash, keyImage, inputKeys, signatures)
      } else {
        const cSigs = new this.crypto.VectorString()
        const cInputKeys = new this.crypto.VectorString()

        inputKeys.forEach((key) => {
          cInputKeys.push_back(key)
        })

        signatures.forEach((sig) => {
          cSigs.push_back(sig)
        })

        return this.crypto.checkRingSignature(transactionPrefixHash, keyImage, cInputKeys, cSigs)
      }
    } catch (e) {
      return (!e)
    }
  }

  /**
   * Checks an individual signature
   * @param {string} hash - the input hash
   * @param {string} publicKey - the public key used
   * @param {string} signature - the signature to check
   * @returns {boolean} whether the signature is valid
   */
  checkSignature (hash, publicKey, signature) {
    try {
      return this.crypto.checkSignature(hash, publicKey, signature)
    } catch (e) {
      return (!e)
    }
  }

  /**
   * CryptoNight Fast Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_fast_hash (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_fast_hash(data)
      } else {
        const result = this.crypto.cn_fast_hash(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Derives the public key from the specified parameters
   * @param {string} derivation - the derivation
   * @param {number} outputIndex - the output index in the transaction
   * @param {string} publicKey - the public key
   * @returns {Array.<boolean|string>} array consisting of [error, publicKey]
   */
  derivePublicKey (derivation, outputIndex, publicKey) {
    try {
      if (!this.isNative) {
        return this.crypto.derivePublicKey(derivation, outputIndex, publicKey)
      } else {
        const result = this.crypto.derivePublicKey(derivation, outputIndex, publicKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Derives the secret key from the specified parameters
   * @param {string} derivation - the derivation
   * @param {number} outputIndex - the output index in the transaction
   * @param {string} secretKey - the secret key
   * @returns {Array.<boolean|string>} array consisting of [error, secretKey]
   */
  deriveSecretKey (derivation, outputIndex, secretKey) {
    try {
      if (!this.isNative) {
        return this.crypto.deriveSecretKey(derivation, outputIndex, secretKey)
      } else {
        const result = this.crypto.deriveSecretKey(derivation, outputIndex, secretKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates the key derivation of the given keys
   * @param {string} transactionPublicKey - the transaction public key
   * @param {string} privateViewKey - the private view key
   * @returns {Array.<boolean|string>} array consisting of [error, derivation]
   */
  generateKeyDerivation (transactionPublicKey, privateViewKey) {
    try {
      if (!this.isNative) {
        return this.crypto.generateKeyDerivation(transactionPublicKey, privateViewKey)
      } else {
        const result = this.crypto.generateKeyDerivation(transactionPublicKey, privateViewKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates the key  image from the given public and private keys
   * @param {string} publicKey - the public emphemeral
   * @param {string} privateKey - the private emphemeral
   * @returns {Array.<boolean|string>} array consisting of [error, keyImage]
   */
  generateKeyImage (publicKey, privateKey) {
    try {
      if (!this.isNative) {
        return this.crypto.generateKeyImage(publicKey, privateKey)
      } else {
        const result = this.crypto.generateKeyImage(publicKey, privateKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates a key pair
   * @returns {Array.<boolean|{publicKey: string, secretKey: string}>} array consisting of [error, keys]
   */
  generateKeys () {
    try {
      if (!this.isNative) {
        return this.crypto.generateKeys()
      } else {
        const result = this.crypto.generateKeys()

        if (!result) {
          return [true, null]
        } else {
          return [null, {
            publicKey: result.publicKey || result.PublicKey,
            secretKey: result.secretKey || result.SecretKey
          }]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates the deterministic private view key from the supplied private spend key
   * @param {string} privateKey - the private spend key
   * @returns {Array.<boolean|string>} array consisting of [error, privateKey]
   */
  generatePrivateViewKeyFromPrivateSpendKey (privateKey) {
    try {
      if (!this.isNative) {
        return this.crypto.generatePrivateViewKeyFromPrivateSpendKey(privateKey)
      } else {
        const result = this.crypto.generatePrivateViewKeyFromPrivateSpendKey(privateKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates the ring signatures for the supplied parameters
   * @param {string} transactionPrefixHash - the transaction prefix hash
   * @param {string} keyImage - the key image that the signature pertains to
   * @param {string[]} inputKeys - the input keys used in the ring
   * @param {string} privateKey - the real private key used for signing
   * @param {number} realIndex - the index of the real output in the inputKeys array
   * @returns {Array.<boolean|string[]>} array consisting of [error, signatures]
   */
  generateRingSignatures (transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex) {
    try {
      if (!this.isNative) {
        return this.crypto.generateRingSignatures(transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex)
      } else {
        var cSigs = new this.crypto.VectorString()
        const cInputKeys = new this.crypto.VectorString()

        inputKeys.forEach((key) => {
          cInputKeys.push_back(key)
        })

        try {
          cSigs = this.crypto.generateRingSignatures(transactionPrefixHash, keyImage, cInputKeys, privateKey, realIndex)
        } catch (e) {
          cSigs = e
          cSigs = false
        }

        if (!cSigs) return [true, null]

        const sigs = []

        for (var i = 0; i < cSigs.size(); i++) {
          sigs.push(cSigs.get(i))
        }

        return [null, sigs]
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates a single signature
   * @param {string} hash - the input hash
   * @param {string} publicKey - the public key to use
   * @param {string} privateKey - the private key to use for the signing process
   * @returns {Array.<boolean|string>} array consisting of [error, signature]
   */
  generateSignature (hash, publicKey, privateKey) {
    try {
      if (!this.isNative) {
        return this.crypto.generateSignature(hash, publicKey, privateKey)
      } else {
        const result = this.crypto.generateSignature(hash, publicKey, privateKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates the deterministic view keys from the supplied private spend key
   * @param {string} privateKey - the private spend key
   * @returns {Array.<boolean|{publicKey: string, secretKey: string}>} array consisting of [error, keys]
   */
  generateViewKeysFromPrivateSpendKey (privateKey) {
    try {
      if (!this.isNative) {
        return this.crypto.generateViewKeysFromPrivateSpendKey(privateKey)
      } else {
        const result = this.crypto.generateViewKeysFromPrivateSpendKey(privateKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, {
            publicKey: result.publicKey || result.PublicKey,
            secretKey: result.secretKey || result.SecretKey
          }]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Converts a hash to an elliptic curve
   * @param {string} hash - the hash to convert
   * @returns {Array.<boolean|string>} array consisting of [error, ellipticCurve]
   */
  hashToEllipticCurve (hash) {
    try {
      if (!this.isNative) {
        return this.crypto.hashToEllipticCurve(hash)
      } else {
        const result = this.crypto.hashToEllipticCurve(hash)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Converts a hash to a scalar
   * @param {string} hash - the hash to convert
   * @returns {Array.<boolean|string>} array consisting of [error, scalar]
   */
  hashToScalar (hash) {
    try {
      if (!this.isNative) {
        return this.crypto.hashToScalar(hash)
      } else {
        const result = this.crypto.hashToScalar(hash)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Performs a scalar multkey operation
   * @param {string} keyImageA - the first key image
   * @param {string} keyImageB - the second key image
   * @returns {Array.<boolean|string>} array consisting of [error, keyImage]
   */
  scalarmultKey (keyImageA, keyImageB) {
    try {
      if (!this.isNative) {
        return this.crypto.scalarmultKey(keyImageA, keyImageB)
      } else {
        const result = this.crypto.scalarmultKey(keyImageA, keyImageB)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * scalar 32-bit reduction
   * @param {string} data - hexadecimal data to reduce
   * @returns {Array.<boolean|string>} array consisting of [error, result]
   */
  scReduce32 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.scReduce32(data)
      } else {
        const result = this.crypto.scReduce32(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Generates the public key from the private key
   * @param {string} privateKey - the private key
   * @returns {Array.<boolean|string>} array consisting of [error, publicKey]
   */
  secretKeyToPublicKey (privateKey) {
    try {
      if (!this.isNative) {
        return this.crypto.secretKeyToPublicKey(privateKey)
      } else {
        const result = this.crypto.secretKeyToPublicKey(privateKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Calculates the tree branch of the given hashes
   * @param {string[]} arr - the hashes to use in the calculation
   * @returns {Array.<boolean|string[]>} array consisting of [error, treeBranches]
   */
  tree_branch (arr) {
    try {
      if (!this.isNative) {
        return this.crypto.tree_branch(arr)
      } else {
        const hashes = new this.crypto.VectorString()

        arr.forEach((item) => {
          hashes.push_back(item)
        })

        const branches = this.crypto.tree_branch(hashes)

        if (!branches) return [true, null]

        const results = []

        for (var i = 0; i < branches.size(); i++) {
          results.push(branches.get(i))
        }

        return [null, results]
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Calculates the tree depth of the given value
   * @param {number} count - the number of items
   * @returns {Array.<boolean|number>} array consisting of [error, treeDepth]
   */
  tree_depth (count) {
    try {
      if (!this.isNative) {
        return this.crypto.tree_depth(count)
      } else {
        const result = this.crypto.tree_depth(count)

        if (typeof result !== 'number') {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Calculates the tree hash of the given hashes
   * @param {string[]} arr - the hashes to use in the calculation
   * @returns {Array.<boolean|string>} array consisting of [error, treeHash]
   */
  tree_hash (arr) {
    try {
      if (!this.isNative) {
        return this.crypto.tree_hash(arr)
      } else {
        const hashes = new this.crypto.VectorString()

        arr.forEach((item) => {
          hashes.push_back(item)
        })

        const result = this.crypto.tree_hash(hashes)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Calculates the tree hash of the given branches
   * @param {string[]} branches - the hashes of the branches to use in the calculation
   * @param {string} leaf - the leaf to include in the calculation
   * @param {number} path - the path to include in the calculation
   * @returns {Array.<boolean|string>} array consisting of [error, treeHash]
   */
  tree_hash_from_branch (branches, leaf, path) {
    try {
      if (!this.isNative) {
        return this.crypto.tree_hash_from_branch(branches, leaf, path)
      } else {
        const _branches = new this.crypto.VectorString()

        branches.forEach((branch) => {
          _branches.push_back(branch)
        })

        const result = this.crypto.tree_hash_from_branch(_branches, leaf, path.toString())

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Underives the public key from the given parameters
   * @param {string} derivation - the derivation
   * @param {number} outputIndex - the output index in the transaction
   * @param {string} outputKey - the output key
   * @returns {Array.<boolean|string>} array consisting of [error, publicKey]
   */
  underivePublicKey (derivation, outputIndex, outputKey) {
    try {
      if (!this.isNative) {
        return this.crypto.underivePublicKey(derivation, outputIndex, outputKey)
      } else {
        const result = this.crypto.underivePublicKey(derivation, outputIndex, outputKey)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /* Hashing methods */

  /**
   * CryptoNight v0 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_slow_hash_v0 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_slow_hash_v0(data)
      } else {
        const result = this.crypto.cn_slow_hash_v0(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight v1 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_slow_hash_v1 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_slow_hash_v1(data)
      } else {
        const result = this.crypto.cn_slow_hash_v1(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight v2 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_slow_hash_v2 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_slow_hash_v2(data)
      } else {
        const result = this.crypto.cn_slow_hash_v2(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Lite v0 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_lite_slow_hash_v0 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_lite_slow_hash_v0(data)
      } else {
        const result = this.crypto.cn_lite_slow_hash_v0(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Lite v1 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_lite_slow_hash_v1 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_lite_slow_hash_v1(data)
      } else {
        const result = this.crypto.cn_lite_slow_hash_v1(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Lite v2 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_lite_slow_hash_v2 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_lite_slow_hash_v2(data)
      } else {
        const result = this.crypto.cn_lite_slow_hash_v2(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Dark v0 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_dark_slow_hash_v0 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_dark_slow_hash_v0(data)
      } else {
        const result = this.crypto.cn_dark_slow_hash_v0(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Dark v1 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_dark_slow_hash_v1 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_dark_slow_hash_v1(data)
      } else {
        const result = this.crypto.cn_dark_slow_hash_v1(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Dark v2 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_dark_slow_hash_v2 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_dark_slow_hash_v2(data)
      } else {
        const result = this.crypto.cn_dark_slow_hash_v2(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Dark Lite v0 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_dark_lite_slow_hash_v0 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_dark_lite_slow_hash_v0(data)
      } else {
        const result = this.crypto.cn_dark_lite_slow_hash_v0(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Dark Lite v1 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_dark_lite_slow_hash_v1 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_dark_lite_slow_hash_v1(data)
      } else {
        const result = this.crypto.cn_dark_lite_slow_hash_v1(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Dark Lite v2 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_dark_lite_slow_hash_v2 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_dark_lite_slow_hash_v2(data)
      } else {
        const result = this.crypto.cn_dark_lite_slow_hash_v2(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Turtle v0 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_turtle_slow_hash_v0 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_turtle_slow_hash_v0(data)
      } else {
        const result = this.crypto.cn_turtle_slow_hash_v0(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Turtle v1 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_turtle_slow_hash_v1 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_turtle_slow_hash_v1(data)
      } else {
        const result = this.crypto.cn_turtle_slow_hash_v1(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Turtle v2 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_turtle_slow_hash_v2 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_turtle_slow_hash_v2(data)
      } else {
        const result = this.crypto.cn_turtle_slow_hash_v2(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Turtle Lite v0 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_turtle_lite_slow_hash_v0 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_turtle_lite_slow_hash_v0(data)
      } else {
        const result = this.crypto.cn_turtle_lite_slow_hash_v0(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Turtle Lite v1 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_turtle_lite_slow_hash_v1 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_turtle_lite_slow_hash_v1(data)
      } else {
        const result = this.crypto.cn_turtle_lite_slow_hash_v1(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Turtle Lite v2 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_turtle_lite_slow_hash_v2 (data) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_turtle_lite_slow_hash_v2(data)
      } else {
        const result = this.crypto.cn_turtle_lite_slow_hash_v2(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Soft Shell v0 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @param {number} height - the height to use in the calculation
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_soft_shell_slow_hash_v0 (data, height) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_soft_shell_slow_hash_v0(data, height)
      } else {
        const result = this.crypto.cn_soft_shell_slow_hash_v0(data, height)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Soft Shell v1 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @param {number} height - the height to use in the calculation
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_soft_shell_slow_hash_v1 (data, height) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_soft_shell_slow_hash_v1(data, height)
      } else {
        const result = this.crypto.cn_soft_shell_slow_hash_v1(data, height)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * CryptoNight Soft Shell v2 Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @param {number} height - the height to use in the calculation
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  cn_soft_shell_slow_hash_v2 (data, height) {
    try {
      if (!this.isNative) {
        return this.crypto.cn_soft_shell_slow_hash_v2(data, height)
      } else {
        const result = this.crypto.cn_soft_shell_slow_hash_v2(data, height)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }

  /**
   * Chukwa Slow Hash Method
   * @param {string} data - hexadecimal string to hash
   * @returns {Array.<boolean|string>} array consisting of [error, hash]
   */
  chukwa_slow_hash (data) {
    try {
      if (!this.isNative) {
        return this.crypto.chukwa_slow_hash(data)
      } else {
        const result = this.crypto.chukwa_slow_hash(data)

        if (!result) {
          return [true, null]
        } else {
          return [null, result]
        }
      }
    } catch (e) {
      return [(e), null]
    }
  }
}

function loadNativeAddon () {
  var Self = false

  try {
    Self = require('turtlecoin-crypto')
    if (Object.getOwnPropertyNames(Self).length === 0) {
      throw new Error('Could not load')
    }
  } catch (e) {
    Self = e
    Self = false
  }

  return Self
}

function loadNativeJS () {
  var Self = false

  try {
    Self = require('./turtlecoin-crypto.js')()
    if (Object.getOwnPropertyNames(Self).length === 0) {
      throw new Error('Could not load')
    }
  } catch (e) {
    Self = e
    Self = false
  }

  return Self
}

function loadBrowserWASM () {
  var Self = false

  try {
    Self = window.TurtleCoinCrypto()
    if (Object.getOwnPropertyNames(Self).length === 0) {
      throw new Error('Could not load')
    }
  } catch (e) {
    Self = e
    Self = false
  }

  return Self
}

function loadWASMJS () {
  if (typeof window === 'undefined') return false

  var Self = false

  try {
    Self = require('./turtlecoin-crypto-wasm.js')()
    if (Object.getOwnPropertyNames(Self).length === 0) {
      throw new Error('Could not load')
    }
  } catch (e) {
    Self = e
    Self = false
  }

  return Self
}

module.exports = Crypto
