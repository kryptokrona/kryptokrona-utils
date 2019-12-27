// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Crypto = require('./turtlecoin-crypto')
const Reader = require('./reader')
const TransactionVersion2Suffix = 'bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a0000000000000000000000000000000000000000000000000000000000000000'
const TurtleCoinCrypto = new Crypto()
const Writer = require('./writer')

/**
 * Class representing a CryptoNote Transaction
 * @module Transaction
 * @class
 */
class Transaction {
  /**
   * Transaction Output Structure
   * @memberof Transaction
   * @typedef {Object} TransactionOutput
   * @property {string} type - the output type
   * @property {number} amount - the amount of the output
   * @property {string} key - the output key
   */

  /**
   * Transaction Input Structure. What properties exist depend on the type
   * @memberof Transaction
   * @typedef {Object} TransactionInput
   * @property {string} type - the input type
   * @property {number} [amount] - the amount of the input (type '02' only)
   * @property {number[]} [keyOffsets] - the keyOffsets of the input (type '02' only)
   * @property {string} [keyImage] - the keyImage of the input (type '02' only)
   * @property {number} [blockIndex] - the block index of the input (type 'ff' only)
   */

  /**
   * Transaction Extra Nonce Tag Structure
   * @memberof Transaction
   * @typedef {Object} TransactionExtraNonce
   * @property {number} tag - the nonce tag type
   * @property {string} paymentId - the payment ID of the transaction
   */

  /**
   * Transaction Merged Mining Tag Structure
   * @memberof Transaction
   * @typedef {Object} TransactionExtraMergedMining
   * @property {number} depth - the depth of the merkle root
   * @property {string} merkleRoot - the merkle root hash
   */

  /**
   * Transaction Extra Tag Structure. What properties exist depend on the type
   * @memberof Transaction
   * @typedef {Object} TransactionExtraTag
   * @property {number} tag - the tag type
   * @property {string} [publicKey] - the public key of the transaction (type 1 only)
   * @property {Transaction.TransactionExtraNonce[]} [nonces] - extra nonces (type 2 only)
   * @property {number} [depth] - The depth of the merkle root (type 3 only)
   * @property {string} [merkleRoot] - the merkle root hash (type 3 only)
   */

  /**
   * Initializes a new CryptoNote Transaction object
   * @constructs
   * @param {string} [hexData] - the hexadecimal representation of an existing transaction
   */
  constructor (hexData) {
    /* Setup transaction defaults */

    /**
     * The version number of the transaction
     * @type {number}
     * @default 1
     */
    this.version = 1

    /**
     * The unlock time of the transaction
     * @type {number}
     * @default 0
     */
    this.unlockTime = 0

    /**
     * The transaction inputs
     * @type {Transaction.TransactionInput[]}
     */
    this.inputs = []

    /**
     * The transaction outputs
     * @type {Transaction.TransactionOutput[]}
     */
    this.outputs = []

    /**
     * The transaction extra tags/hex
     * @type {Transaction.TransactionExtraTag[]|string}
     */
    this.extra = []

    /**
     * The transaction signatures
     * @type {string[][]}
     */
    this.signatures = []

    /**
     * Ignored field only used in some transactions
     * @type {boolean}
     */
    this.ignoredField = false

    /**
     * Transaction Keypair
     * @memberof Transaction
     * @typedef {Object} KeyPair
     * @property {string} [privateKey] - a private key
     * @property {string} [publicKey] - a public key
     */

    /**
     * Transaction one time keys - used for legacy purposes and convenience
     * Note: setting these will not cause the actual transaction data to be
     *   update with the publicKey provided
     * @type {Transaction.KeyPair}
     */
    this.transactionKeys = {
      privateKey: null,
      publicKey: null
    }

    /* This variable is designed to hold cached values
       that would otherwise be computationally expensive
       to run each time we need to use them */
    this.cached = {}

    /* If we were supplied with hex data as part of our
     constructor, try to load it */
    if (hexData && isHex(hexData) && hexData.length % 2 === 0) {
      this.blob = hexData
    }
  }

  /**
   * The amount of the transaction
   * @type {number}
   * @readonly
   */
  get amount () {
    var amount = 0

    this.inputs.forEach((input) => {
      if (input.type === '02') {
        amount += input.amount
      }
    })

    return amount
  }

  /**
   * The hexadecimal representation of the transaction
   * @type {string}
   */
  get blob () {
    return this._toBlob(false)
  }

  set blob (hexData) {
    /* Clear any cached values because we changed something */
    this.cached = {}

    this._fromBlob(hexData)
    this.readOnly = true
  }

  /**
   * Returns the underlying cryptography module used
   * @type {string}
   * @readonly
   */
  get cryptoType () {
    return TurtleCoinCrypto.type
  }

  /**
   * The hexadecimal representation of the transaction extra information
   * @type {string}
   * @readonly
   */
  get extraBlob () {
    if (!this.readOnly) return extraToBlob(this.extra).toString('hex')
    return this.rawExtra.toString('hex')
  }

  /**
   * The hexadecimal representation of the transaction extra data
   * @type {string}
   * @readonly
   */
  get extraData () {
    var extraData = null

    var extra = this.extra

    if (!Array.isArray(extra)) {
      extra = extraFromBlob(extra)
    }

    extra.forEach(tag => {
      if (tag.tag === 2) {
        tag.nonces.forEach(nonce => {
          if (nonce.tag === 127) extraData = nonce.data
        })
      }
    })

    return extraData
  }

  /**
   * The size of the transaction extra field in bytes
   * @type {number}
   * @readonly
   */
  get extraSize () {
    return this.extraBlob.length / 2
  }

  /**
   * The transaction fee of the transaction
   * @type {number}
   * @readonly
   */
  get fee () {
    var inputAmount = this.amount

    if (inputAmount === 0) {
      return 0
    }

    var outputAmount = 0

    this.outputs.forEach((output) => {
      outputAmount += output.amount
    })

    return inputAmount - outputAmount
  }

  /**
   * The transaction hash
   * @type {string}
   * @readonly
   */
  get hash () {
    if (this.cached.blob && this.cached.blob === this.blob && this.cached.hash) {
      return this.cached.hash
    }

    this.cached.blob = this.blob

    const [err, hash] = TurtleCoinCrypto.cn_fast_hash(this.cached.blob)

    /* Version 2 transactions are actualy double hashed to get the hash */
    if (this.version >= 2) {
      const [err, hash2] = TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix)

      if (err) return false

      this.cached.hash = hash2

      return hash2
    }

    if (err) return false

    this.cached.hash = hash

    return hash
  }

  /**
   * The merged mining tag
   * @type {TransactionExtraMergedMining}
   * @readonly
   */
  get mergedMining () {
    var mergedMining = null

    var extra = this.extra

    if (!Array.isArray(extra)) {
      extra = extraFromBlob(extra)
    }

    extra.forEach(tag => {
      if (tag.tag === 3) {
        mergedMining = { depth: tag.depth, merkleRoot: tag.merkleRoot }
      }
    })

    return mergedMining
  }

  /**
   * The hexadecimal representation of the transaction payment ID
   * @type {string}
   * @readonly
   */
  get paymentId () {
    var paymentId = null

    var extra = this.extra

    if (!Array.isArray(extra)) {
      extra = extraFromBlob(extra)
    }

    extra.forEach(tag => {
      if (tag.tag === 2) {
        tag.nonces.forEach(nonce => {
          if (nonce.tag === 0) paymentId = nonce.paymentId
        })
      }
    })

    return paymentId
  }

  /**
   * The hexadecimal representation of the transaction prefix
   * @type {string}
   * @readonly
   */
  get prefix () {
    return this._toBlob(true)
  }

  /**
   * The transaction prefix hash
   * @type {string}
   * @readonly
   */
  get prefixHash () {
    if (this.cached.prefix && this.cached.prefix === this.prefix && this.cached.prefixHash) {
      return this.cached.prefixHash
    }

    this.cached.prefix = this.prefix

    const [err, hash] = TurtleCoinCrypto.cn_fast_hash(this.cached.prefix)

    /* Version 2 transactions are actualy double hashed to get the hash */
    if (this.version >= 2) {
      const [err, hash2] = TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix)

      if (err) return false

      this.cached.prefixHash = hash2

      return hash2
    }

    if (err) return false

    this.cached.prefixHash = hash

    return hash
  }

  /**
   * The hexadecimal representation of the transction public key
   * @type {string}
   * @readonly
   */
  get publicKey () {
    var publicKey = null

    var extra = this.extra

    if (!Array.isArray(extra)) {
      extra = extraFromBlob(extra)
    }

    extra.forEach(tag => {
      if (tag.tag === 1) {
        publicKey = tag.publicKey
      }
    })

    return publicKey
  }

  /**
   * The size of the transaction in bytes
   * @type {number}
   * @readonly
   */
  get size () {
    return this.blob.length / 2
  }

  /**
   * Returns a stripped version of this transaction that does not contain
   * signatures or unknown extra data
   * @type {Transaction}
   * @readonly
   */
  get stripped () {
    const tempTransaction = new Transaction()
    tempTransaction.version = this.version
    tempTransaction.unlockTime = this.unlockTime
    tempTransaction.inputs = this.inputs.slice(0)
    tempTransaction.outputs = this.outputs.slice(0)
    if (this.publicKey) tempTransaction.addPublicKey(this.publicKey)
    if (this.paymentId) tempTransaction.addPaymentId(this.paymentId)
    if (this.extraData) tempTransaction.addExtraData(this.extraData)
    if (this.mergedMining) tempTransaction.addMergedMining(this.mergedMining.depth, this.mergedMining.merkleRoot)

    return tempTransaction
  }

  /**
   * Adds a arbitrary data to the Transaction's extra information
   * @param {Buffer|string} data - the data to add
   * @returns {boolean} if succeeded
   */
  addExtraData (data) {
    if (this.readOnly) throw new Error('Transaction is read only')
    if (!Array.isArray(this.extra)) throw new Error('Transaction Extra must ben an array of tags')

    /* rebuild our extra tag without any current nonce
       extra information and add ours at the end */
    const extra = []
    var found = false

    const extraData = new Writer()
    extraData.write(data)

    this.extra.forEach((tag) => {
      if (tag.tag !== 2) return extra.push(tag)

      const nonceTags = []

      tag.nonces.forEach((nonceTag) => {
        if (nonceTag.tag !== 127) nonceTags.push(nonceTag)
      })

      nonceTags.push({
        tag: 127,
        data: extraData.blob
      })

      nonceTags.sort((a, b) => (a.tag > b.tag) ? 1 : -1)

      extra.push({
        tag: 2,
        nonces: nonceTags
      })

      found = true
    })

    if (!found) {
      extra.push({ tag: 2, nonces: [{ tag: 127, data: extraData.blob }] })
    }

    extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1)

    this.extra = extra

    return true
  }

  /**
   * Adds a Merged Mining tag to the Transaction's extra information
   * @param {number} depth - the merkle root hash depth
   * @param {string} merkleRoot - the merkle root hash
   * @returns {boolean} if succeeded
   */
  addMergedMining (depth, merkleRoot) {
    if (this.readOnly) throw new Error('Transaction is read only')
    /* This method only works if extra is an array of tags, if it's free form
       data via a hexadecimal string, we cannot won't be touching the free form
       string */
    if (!Array.isArray(this.extra)) throw new Error('Transaction Extra must ben an array of tags')
    if (isNaN(depth)) throw new Error('Merged Mining depth must be a number')
    if (!isHex64(merkleRoot)) throw new Error('Merged Mining merkle root hash must be 64 hexadecimal characters')

    /* Delete any previous public key tags from
       the current extra data */
    const extra = []

    this.extra.forEach((tag) => {
      if (tag.tag !== 3) extra.push(tag)
    })

    this.extra = extra

    /* Build our public key tag and add to extra */
    const extraTag = {
      tag: 3,
      depth: depth,
      merkleRoot: merkleRoot
    }

    /* Add the new public key tag to the extra array */
    this.extra.push(extraTag)

    extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1)

    return true
  }

  /**
   * Adds a payment ID to the Transaction's extra information
   * @param {string} paymentId - the payment ID for the transaction
   * @returns {boolean} if succeeded
   */
  addPaymentId (paymentId) {
    if (this.readOnly) throw new Error('Transaction is read only')
    /* This method only works if extra is an array of tags, if it's free form
       data via a hexadecimal string, we cannot won't be touching the free form
       string */
    if (!Array.isArray(this.extra)) throw new Error('Transaction Extra must ben an array of tags')
    if (!isHex64(paymentId)) throw new Error('Payment ID must be 64 hexadecimal characters')

    /* rebuild our extra tag without any current nonce
       payment id information and add ours at the end */
    const extra = []
    var found = false

    this.extra.forEach((tag) => {
      if (tag.tag !== 2) return extra.push(tag)

      const nonceTags = []

      tag.nonces.forEach((nonceTag) => {
        if (nonceTag.tag !== 0) nonceTags.push(nonceTag)
      })

      nonceTags.push({
        tag: 0,
        paymentId: paymentId
      })

      nonceTags.sort((a, b) => (a.tag > b.tag) ? 1 : -1)

      extra.push({
        tag: 2,
        nonces: nonceTags
      })

      found = true
    })

    if (!found) {
      extra.push({ tag: 2, nonces: [{ tag: 0, paymentId: paymentId }] })
    }

    extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1)

    this.extra = extra

    return true
  }

  /**
   * Adds a transaction public key to the Transaction's extra information
   * @param {string} publicKey - the public key of the transaction
   * @returns {boolean} if succeeded
   */
  addPublicKey (publicKey) {
    if (this.readOnly) throw new Error('Transaction is read only')
    /* This method only works if extra is an array of tags, if it's free form
       data via a hexadecimal string, we cannot won't be touching the free form
       string */
    if (!Array.isArray(this.extra)) throw new Error('Transaction Extra must ben an array of tags')
    if (!isHex64(publicKey)) throw new Error('Transaction Public Key must 64 hexadecimal characters')

    /* Delete any previous public key tags from
       the current extra data */
    const extra = []

    this.extra.forEach((tag) => {
      if (tag.tag !== 1) extra.push(tag)
    })

    this.extra = extra

    /* Build our public key tag and add to extra */
    const extraTag = {
      tag: 1,
      publicKey: publicKey
    }

    /* Add the new public key tag to the extra array */
    this.extra.push(extraTag)

    extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1)

    /* Also store it on the transaction keys property */
    this.transactionKeys.publicKey = publicKey

    return true
  }

  /**
   * Parses a Transaction strcuture from a hexadecimal representation of a transaction
   * @param {string} blob - The hexadecimal string
   * @returns {boolean} if the operation succeeded
   * @private
   */
  _fromBlob (blob) {
    const reader = new Reader(Buffer.from(blob, 'hex'))

    this.inputs = []
    this.outputs = []
    this.extra = []
    this.signatures = []

    this.version = reader.nextVarint()
    this.unlockTime = reader.nextVarint()

    const inputsCount = reader.nextVarint()

    for (var i = 0; i < inputsCount; i++) {
      var offsetsLength

      const input = {}

      input.type = reader.nextBytes().toString('hex')

      switch (input.type) {
        case '02':
          input.amount = reader.nextVarint()
          input.keyOffsets = []
          offsetsLength = reader.nextVarint()
          for (var j = 0; j < offsetsLength; j++) {
            input.keyOffsets.push(reader.nextVarint())
          }
          input.keyImage = reader.nextHash()
          break
        case 'ff':
          input.blockIndex = reader.nextVarint()
          break
        default:
          throw new Error('Unhandled transaction input type')
      }
      this.inputs.push(input)
    }

    const outputsCount = reader.nextVarint()

    for (i = 0; i < outputsCount; i++) {
      const output = {}

      output.amount = reader.nextVarint()
      output.type = reader.nextBytes().toString('hex')

      switch (output.type) {
        case '02':
          output.key = reader.nextHash()
          break
        default:
          throw new Error('Unhandled transaction output type')
      }
      this.outputs.push(output)
    }

    /* Handle the tx extra */
    const extraSize = reader.nextVarint()
    const extraBlob = reader.nextBytes(extraSize)

    this.rawExtra = extraBlob

    this.extra = extraFromBlob(extraBlob)

    this.transactionKeys.publicKey = this.publicKey

    /* If there are bytes remaining and they are divisible by 64,
     then we have signatures remaining at the end */
    if (reader.unreadBytes > 0 && reader.unreadBytes % 64 === 0) {
      /* Loop through our inputs */
      for (i = 0; i < this.inputs.length; i++) {
        const signatures = []
        for (j = 0; j < this.inputs[i].keyOffsets.length; j++) {
          signatures.push(reader.nextBytes(64).toString('hex'))
        }
        this.signatures.push(signatures)
      }
    } else if (reader.unreadBytes > 0) {
      throw new Error('Unstructured data found at the end of transaction blob')
    }

    return true
  }

  /**
   * Serializes a Transaction strcuture to a hexadecimal representation of a transaction
   * @param {boolean} [headerOnly=false] - if we should only serialize the transaction header
   * @returns {boolean} if the operation succeeded
   * @private
   */
  _toBlob (headerOnly) {
    headerOnly = headerOnly || false

    const writer = new Writer()

    writer.writeVarint(this.version)
    writer.writeVarint(this.unlockTime)
    writer.writeVarint(this.inputs.length)

    this.inputs.forEach((input) => {
      writer.writeHex(input.type)

      switch (input.type) {
        case '02':
          writer.writeVarint(input.amount)
          writer.writeVarint(input.keyOffsets.length)
          input.keyOffsets.forEach(offset => writer.writeVarint(offset))
          writer.writeHash(input.keyImage)
          break
        case 'ff':
          writer.writeVarint(input.blockIndex)
          break
        default:
          throw new Error('Unhandled transaction input type')
      }
    })

    writer.writeVarint(this.outputs.length)

    this.outputs.forEach((output) => {
      switch (output.type) {
        case '02':
          writer.writeVarint(output.amount)
          writer.writeHex(output.type)
          writer.writeHash(output.key)
          break
        default:
          throw new Error('Unhandled transaction output type')
      }
    })

    if (!this.readOnly) {
      const extra = extraToBlob(this.extra)
      writer.writeVarint(extra.length)
      writer.writeBytes(extra)
    } else {
      writer.writeVarint(this.rawExtra.length)
      writer.writeBytes(this.rawExtra)
    }

    if (!headerOnly && this.signatures.length !== 0) {
      if (this.inputs.length !== this.signatures.length) {
        throw new Error('Number of signatures does not equal the number of inputs used.')
      }

      for (var i = 0; i < this.inputs.length; i++) {
        for (var j = 0; j < this.signatures[i].length; j++) {
          writer.writeHex(this.signatures[i][j])
        }
      }
    }

    return writer.blob
  }
}

function extraToBlob (extras) {
  /* Define our writer helper */
  const writer = new Writer()

  if (Array.isArray(extras)) {
    /* Loop through the extra fields */
    extras.forEach((extra) => {
      /* Write out the tag */
      writer.writeVarint(extra.tag)
      var data, nonceData

      /* Figure out which tag we're working with */
      switch (extra.tag) {
        case 1:
          /* Write the transaction public key to the buffer */
          writer.writeHash(extra.publicKey)
          break
        case 2:
          /* Set up a new writer to write our nonce to */
          data = new Writer()

          extra.nonces.forEach((nonce) => {
            data.writeVarint(nonce.tag)

            switch (nonce.tag) {
              case 0:
                data.writeHash(nonce.paymentId)
                break
              case 127:
                /* Compose the extra nonce data for writing */
                nonceData = new Writer()
                nonceData.write(nonce.data)
                /* Write out the length of the information and finally the data */
                data.writeVarint(nonceData.length)
                data.writeHex(nonceData.blob)
                break
              default:
                throw new Error('Unhandled transaction nonce data')
            }
          })

          /* Write out the length of our nonce and finally the nonce */
          writer.writeVarint(data.length)
          writer.writeHex(data.blob)
          break
        case 3:
          /* Set up a new writer to write the MM tag info */
          data = new Writer()
          data.writeVarint(extra.depth)
          data.writeHash(extra.merkleRoot)
          /* Write out the length of the information and finally the data */
          writer.writeVarint(data.length)
          writer.writeHex(data.blob)
          break
      }
    })
  } else {
    writer.writeHex(extras)
  }

  return writer.buffer
}

/* Parsing the TX_EXTRA field is generally a mess because
   people can put basically anything they want in the field
   and the network will accept it; however, meaningful data
   must be pulled from the field for public key, payment id,
   and other known structured data. In short, whenever we
   encounter garbage data that does not follow known structures
   we skip those bytes and keep reading */
function extraFromBlob (blob) {
  /* We were passed a Buffer and we're going to set up
     a new reader for it to make life easier */
  const reader = new Reader(blob)

  /* Set up our result for returning what we find */
  const result = []

  /* We're going to shadow this later */
  var length

  /* Track what fields we've seen thus far */
  const seen = {}

  /* While there's still data to read, we need to loop
     through it until we're done */
  while (reader.currentOffset < blob.length) {
    var nonceReader

    /* We need to peek at the next varint to determine
       if it is actually a varint, if not, then we will
       skip it because we don't want to throw an exception
       in reading garbage data that is not a varint */
    try {
      reader.nextVarint(true) // peek
    } catch (e) {
      reader.skip(1)
      continue
    }

    /* Get the TX extra tag */
    const tag = { tag: reader.nextVarint() }

    switch (tag.tag) {
      case 0: // Padding?
        break
      case 1: // Transaction Public Key
        if (!seen.publicKey && reader.unreadBytes >= 32) {
          tag.publicKey = reader.nextHash()
          seen.publicKey = true
        }
        break
      case 2: // Extra Nonce
        if (!seen.nonce && reader.unreadBytes >= 1) {
          /* Check that the next bytes are actually a
             varint and if they are not, then skip them
             as this is not a valid nonce subfield */
          try {
            reader.nextVarint(true)
          } catch (e) {
            reader.skip(1)
            continue
          }

          length = reader.nextVarint()
          tag.nonces = []
          nonceReader = new Reader(reader.nextBytes(length))

          while (nonceReader.unreadBytes > 0) {
            /* Check to make sure that the next bytes are
               actually a varint before we try to read them
               and if they are not, then skip them */
            try {
              nonceReader.nextVarint(true)
            } catch (e) {
              nonceReader.skip(1)
              continue
            }

            const nonceTag = { tag: nonceReader.nextVarint() }

            switch (nonceTag.tag) {
              case 0:
                if (!seen.paymentId && nonceReader.unreadBytes >= 32) {
                  nonceTag.paymentId = nonceReader.nextHash()
                  seen.paymentId = true
                }
                break
              case 127:
                if (!seen.extraData && nonceReader.unreadBytes >= 1) {
                  /* Check to make sure that the next bytes are actually
                     a varint before we try to read them */
                  try {
                    nonceReader.nextVarint(true)
                  } catch (e) {
                    nonceReader.skip()
                    continue
                  }

                  var extraDataLength = nonceReader.nextVarint()

                  if (nonceReader.unreadBytes < extraDataLength) {
                    continue
                  }

                  nonceTag.data = Buffer.from(nonceReader.nextBytes(extraDataLength)).toString('hex')
                  seen.extraData = true
                }
                break
            }

            if (Object.keys(nonceTag).length > 1) tag.nonces.push(nonceTag)
          }
          seen.nonce = true
        }
        break
      case 3: // Merged Mining Tag
        if (!seen.mergedMining && reader.unreadBytes >= 34) {
          /* Check to make sure that the next bytes are actually
             a varint before we try to read them. Also done below */
          try {
            reader.nextVarint(true)
          } catch (e) {
            reader.skip(1)
            continue
          }

          length = reader.nextVarint()

          try {
            reader.nextVarint(true)
          } catch (e) {
            reader.skip(1)
            continue
          }

          tag.depth = reader.nextVarint()

          if (reader.unreadBytes < 32) {
            continue
          }

          tag.merkleRoot = reader.nextHash()
          seen.mergedMining = true
        }
        break
    }

    if (Object.keys(tag).length > 1) result.push(tag)
  }

  /* We have what we need so we'll kick it back */
  return result
}

function isHex (str) {
  const regex = new RegExp('^[0-9a-fA-F]+$')
  return regex.test(str)
}

function isHex64 (str) {
  const regex = new RegExp('^[0-9a-fA-F]{64}$')
  return regex.test(str)
}

module.exports = Transaction
