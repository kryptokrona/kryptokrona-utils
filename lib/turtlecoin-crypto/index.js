// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

/* eslint camelcase: 0 */

'use strict'

class Crypto {
  constructor () {
    this.isNative = false
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

  checkRingSignatures (transactionPrefixHash, keyImage, inputKeys, signatures) {
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
  }

  cn_fast_hash (data) {
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
  }

  derivePublicKey (derivation, outputIndex, publicKey) {
    if (!this.isNative) {
      return this.crypto.derivePublicKey(derivation, outputIndex, publicKey)
    } else {
      var result

      try {
        result = this.crypto.derivePublicKey(derivation, outputIndex, publicKey)
      } catch (e) {
        result = e
        result = false
      }

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  deriveSecretKey (derivation, outputIndex, secretKey) {
    if (!this.isNative) {
      return this.crypto.deriveSecretKey(derivation, outputIndex, secretKey)
    } else {
      var result

      try {
        result = this.crypto.deriveSecretKey(derivation, outputIndex, secretKey)
      } catch (e) {
        result = e
        result = false
      }

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  generateKeyDerivation (transactionPublicKey, privateViewKey) {
    if (!this.isNative) {
      return this.crypto.generateKeyDerivation(transactionPublicKey, privateViewKey)
    } else {
      var result

      try {
        result = this.crypto.generateKeyDerivation(transactionPublicKey, privateViewKey)
      } catch (e) {
        result = e
        result = false
      }

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  generateKeyImage (publicKey, privateKey) {
    if (!this.isNative) {
      return this.crypto.generateKeyImage(publicKey, privateKey)
    } else {
      var result

      try {
        result = this.crypto.generateKeyImage(publicKey, privateKey)
      } catch (e) {
        result = e
        result = false
      }

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  generateRingSignatures (transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex) {
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
  }

  scReduce32 (data) {
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
  }

  secretKeyToPublicKey (privateKey) {
    if (!this.isNative) {
      return this.crypto.secretKeyToPublicKey(privateKey)
    } else {
      var result

      try {
        result = this.crypto.secretKeyToPublicKey(privateKey)
      } catch (e) {
        result = e
        result = false
      }

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  tree_branch (arr) {
    if (!this.isNative) {
      return this.crypto.tree_branch(arr)
    } else {
      var branches = new this.crypto.VectorString()
      const hashes = new this.crypto.VectorString()

      arr.forEach((item) => {
        hashes.push_back(item)
      })

      try {
        branches = this.crypto.tree_branch(hashes)
      } catch (e) {
        branches = e
        branches = false
      }

      if (!branches) return [true, null]

      const results = []

      for (var i = 0; i < branches.size(); i++) {
        results.push(branches.get(i))
      }

      return [null, results]
    }
  }

  tree_depth (count) {
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
  }

  tree_hash (arr) {
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
  }

  tree_hash_from_branch (branches, leaf, path) {
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
  }

  underivePublicKey (derivation, outputIndex, outputKey) {
    if (!this.isNative) {
      return this.crypto.underivePublicKey(derivation, outputIndex, outputKey)
    } else {
      var result

      try {
        result = this.crypto.underivePublicKey(derivation, outputIndex, outputKey)
      } catch (e) {
        result = e
        result = false
      }

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  /* Hashing methods */

  cn_slow_hash_v0 (data) {
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
  }

  cn_slow_hash_v1 (data) {
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
  }

  cn_slow_hash_v2 (data) {
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
  }

  cn_lite_slow_hash_v0 (data) {
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
  }

  cn_lite_slow_hash_v1 (data) {
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
  }

  cn_lite_slow_hash_v2 (data) {
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
  }

  cn_dark_slow_hash_v0 (data) {
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
  }

  cn_dark_slow_hash_v1 (data) {
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
  }

  cn_dark_slow_hash_v2 (data) {
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
  }

  cn_dark_lite_slow_hash_v0 (data) {
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
  }

  cn_dark_lite_slow_hash_v1 (data) {
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
  }

  cn_dark_lite_slow_hash_v2 (data) {
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
  }

  cn_turtle_slow_hash_v0 (data) {
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
  }

  cn_turtle_slow_hash_v1 (data) {
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
  }

  cn_turtle_slow_hash_v2 (data) {
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
  }

  cn_turtle_lite_slow_hash_v0 (data) {
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
  }

  cn_turtle_lite_slow_hash_v1 (data) {
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
  }

  cn_turtle_lite_slow_hash_v2 (data) {
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
  }

  cn_soft_shell_slow_hash_v0 (data) {
    if (!this.isNative) {
      return this.crypto.cn_soft_shell_slow_hash_v0(data)
    } else {
      const result = this.crypto.cn_soft_shell_slow_hash_v0(data)

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  cn_soft_shell_slow_hash_v1 (data) {
    if (!this.isNative) {
      return this.crypto.cn_soft_shell_slow_hash_v1(data)
    } else {
      const result = this.crypto.cn_soft_shell_slow_hash_v1(data)

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  cn_soft_shell_slow_hash_v2 (data) {
    if (!this.isNative) {
      return this.crypto.cn_soft_shell_slow_hash_v2(data)
    } else {
      const result = this.crypto.cn_soft_shell_slow_hash_v2(data)

      if (!result) {
        return [true, null]
      } else {
        return [null, result]
      }
    }
  }

  chukwa_slow_hash (data) {
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
