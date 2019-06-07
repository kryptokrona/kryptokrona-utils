// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Reader = require('./reader.js')
const Writer = require('./writer.js')
const crypto = require('./turtlecoin-crypto/index.js')()

const Transaction = function () {
  if (!(this instanceof Transaction)) return new Transaction()

  /* Setup transaction defaults */
  this.version = 1
  this.unlockTime = 0
  this.inputs = []
  this.outputs = []
  this.extra = []
  this.signatures = []

  Object.defineProperty(this, 'prefix', {
    get: function () {
      return this._toBlob(true)
    },
    set: function (blob) {
      this._fromBlob(blob)
    }
  })

  Object.defineProperty(this, 'blob', {
    get: function () {
      return this._toBlob(false)
    },
    set: function (blob) {
      this._fromBlob(blob)
    }
  })

  Object.defineProperty(this, 'prefixHash', {
    get: function () {
      const [err, hash] = crypto.cn_fast_hash(this.prefix)

      if (!err) return hash

      return false
    }
  })

  Object.defineProperty(this, 'hash', {
    get: function () {
      const [err, hash] = crypto.cn_fast_hash(this.blob)

      if (!err) return hash

      return false
    }
  })
}

Transaction.prototype.addPublicKey = function (publicKey) {
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

  this.extra.push(extraTag)
}

Transaction.prototype.addPaymentId = function (paymentId) {
  function isHex64 (str) {
    const regex = new RegExp('^[0-9a-fA-F]{64}$')
    return regex.test(str)
  }

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

    extra.push(nonceTags)

    found = true
  })

  if (!found) {
    extra.push({ tag: 2, nonces: [{ tag: 0, paymentId: paymentId }] })
  }

  this.extra = extra
}

Transaction.prototype._fromBlob = function (blob) {
  const reader = new Reader(Buffer.from(blob, 'hex'))

  this.inputs = []
  this.outputs = []
  this.extra = []
  this.signatures = []

  this.version = reader.nextVarint()
  this.unlockTime = reader.nextVarint()

  const inputsCount = reader.nextVarint()

  for (var i = 0; i < inputsCount; i++) {
    const input = {}
    input.type = reader.nextBytes().toString('hex')

    switch (input.type) {
      case '02':
        input.amount = reader.nextVarint()
        input.keyOffsets = []
        const offsetsLength = reader.nextVarint()
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
  this.extra = extraFromBlob(extraBlob)

  /* If there are bytes remaining and they are divisible by 64,
     then we have signatures remaining at the end */
  if (reader.unreadBytes % 64 === 0) {
    /* Calculate the number of mixins we expect */
    const mixins = reader.unreadBytes / 64 / this.inputs.length

    /* Loop through our inputs */
    for (i = 0; i < this.inputs.length; i++) {
      const signatures = []
      for (j = 0; j < mixins; j++) {
        signatures.push(reader.nextBytes(64).toString('hex'))
      }
      this.signatures.push(signatures)
    }
  }

  return true
}

Transaction.prototype._toBlob = function (headerOnly) {
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

  const extra = extraToBlob(this.extra)
  writer.writeVarint(extra.length)
  writer.writeBytes(extra)

  if (!headerOnly) {
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

function extraToBlob (extras) {
  /* Define our writer helper */
  const writer = new Writer()

  /* Loop through the extra fields */
  extras.forEach((extra) => {
    /* Write out the tag */
    writer.writeVarint(extra.tag)
    var data

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

  return writer.buffer
}

function extraFromBlob (blob) {
  /* We were passed a Buffer and we're going to set up
     a new reader for it to make life easier */
  const reader = new Reader(blob)

  /* Set up our result for returning what we find */
  const result = []

  /* We're going to shadow this later */
  var length

  /* While there's still data to read, we need to loop
     through it until we're done */
  while (reader.currentOffset < blob.length) {
    /* Get the TX extra tag */
    const tag = { tag: reader.nextVarint() }

    switch (tag.tag) {
      case 0: // Padding?
        break
      case 1: // Transaction Public Key
        tag.publicKey = reader.nextHash()
        break
      case 2: // Extra Nonce
        length = reader.nextVarint()
        tag.nonces = []
        const nonceReader = new Reader(reader.nextBytes(length))

        while (nonceReader.unreadBytes !== 0) {
          const nonceTag = { tag: nonceReader.nextVarint() }

          switch (nonceTag.tag) {
            case 0:
              nonceTag.paymentId = nonceReader.nextHash()
              break
            default:
              throw new Error('Unhandled transaction nonce data')
          }

          tag.nonces.push(nonceTag)
        }
        break
      case 3: // Merged Mining Tag
        length = reader.nextVarint()
        tag.depth = reader.nextVarint()
        tag.merkleRoot = reader.nextHash()
        break
    }

    result.push(tag)
  }

  /* We have what we need so we'll kick it back */
  return result
}

module.exports = Transaction
