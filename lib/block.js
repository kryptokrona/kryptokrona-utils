// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

// const crypto = require('./turtlecoin-crypto/index.js')()
const Reader = require('./reader.js')
const Transaction = require('./transaction.js')
const Writer = require('./writer.js')

const Block = function (opts) {
  opts = opts || {}
  if (!(this instanceof Block)) return new Block(opts)

  this.activateParentBlockVersion = opts.activateParentBlockVersion || 2

  this.difficulty = 0

  this.majorVersion = 0
  this.minorVersion = 0
  this.timestamp = 0
  this.previousBlockHash = '0000000000000000000000000000000000000000000000000000000000000000'
  this.parentBlock = {
    majorVersion: 0,
    minorVersion: 0,
    previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
    transactionCount: 0,
    baseTransactionBranch: '',
    minerTransaction: new Transaction(),
    transactions: []
  }
  this.nonce = 0
  this.minerTransaction = new Transaction()
  this.transactions = []

  Object.defineProperty(this, 'blob', {
    get: function () {
      return this._toBlob()
    },
    set: function (blob) {
      if (blob.length % 2 !== 0) {
        throw new Error('Invalid hexadecimal data supplied')
      }
      this._fromBlob(blob)
    }
  })

  Object.defineProperty(this, 'height', {
    get: function () {
      if (this.minerTransaction.inputs.length !== 0) {
        return this.minerTransaction.inputs[0].blockIndex
      } else {
        return null
      }
    }
  })

  Object.defineProperty(this, 'extraNonce', {
    get: function () {
      return this._getExtraNonce()
    },
    set: function (value) {
      this._setExtraNonce(value)
    }
  })
}

Block.prototype._fromBlob = function (blob) {
  const reader = new Reader(blob)

  this.majorVersion = reader.nextVarint()
  this.minorVersion = reader.nextVarint()

  if (this.majorVersion >= this.activateParentBlockVersion) {
    this.previousBlockHash = reader.nextHash()
    this.parentBlock.majorVersion = reader.nextVarint()
    this.parentBlock.minorVersion = reader.nextVarint()
  }

  this.timestamp = reader.nextVarint()

  if (this.majorVersion >= this.activateParentBlockVersion) {
    this.parentBlock.previousBlockHash = reader.nextHash()
  } else {
    this.previousBlockHash = reader.nextHash()
  }

  this.nonce = reader.nextUInt32()

  if (this.majorVersion >= this.activateParentBlockVersion) {
    this.parentBlock.transactionCount = reader.nextVarint()

    if (this.previousBlockHash !== this.parentBlock.previousBlockHash &&
        this.parentBlock.previousBlockHash !== '0000000000000000000000000000000000000000000000000000000000000000' &&
        this.parentBlock.transactionCount !== 1) {
      this.parentBlock.baseTransactionBranch = reader.nextHash()
    }

    this.parentBlock.minerTransaction = new Transaction()
    this.parentBlock.minerTransaction.version = reader.nextVarint()
    this.parentBlock.minerTransaction.unlockTime = reader.nextVarint()

    const pInputs = reader.nextVarint()

    for (var i = 0; i < pInputs; i++) {
      this.parentBlock.minerTransaction.inputs.push({
        type: reader.nextBytes().toString('hex'),
        blockIndex: reader.nextVarint()
      })
    }

    const pOutputs = reader.nextVarint()

    for (var j = 0; j < pOutputs; j++) {
      this.parentBlock.minerTransaction.outputs.push({
        amount: reader.nextVarint(),
        type: reader.nextBytes().toString('hex'),
        key: reader.nextHash()
      })
    }

    const extraLength = reader.nextVarint()

    this.parentBlock.minerTransaction.extra = reader.nextBytes(extraLength).toString('hex')

    if (pInputs !== 0) {
      const txnCount = reader.nextVarint()

      for (var k = 0; k < txnCount; k++) {
        this.parentBlock.transactions.push(reader.nextHash())
      }
    }
  }

  this.minerTransaction = new Transaction()

  this.minerTransaction.version = reader.nextVarint()
  this.minerTransaction.unlockTime = reader.nextVarint()

  const inputs = reader.nextVarint()

  for (var l = 0; l < inputs; l++) {
    this.minerTransaction.inputs.push({
      type: reader.nextBytes().toString('hex'),
      blockIndex: reader.nextVarint()
    })
  }

  const outputs = reader.nextVarint()

  for (var m = 0; m < outputs; m++) {
    this.minerTransaction.outputs.push({
      amount: reader.nextVarint(),
      type: reader.nextBytes().toString('hex'),
      key: reader.nextHash()
    })
  }

  const extraLength = reader.nextVarint()

  this.minerTransaction.extra = reader.nextBytes(extraLength).toString('hex')

  const txnCount = reader.nextVarint()

  for (var n = 0; n < txnCount; n++) {
    this.transactions.push(reader.nextHash())
  }

  if (reader.unreadBytes > 0) {
    throw new Error('Unhandled data in block blob detected')
  }
}

Block.prototype._toBlob = function () {
  const writer = new Writer()

  writer.writeVarint(this.majorVersion)
  writer.writeVarint(this.minorVersion)

  if (this.majorVersion >= this.activateParentBlockVersion) {
    writer.writeHash(this.previousBlockHash)
    writer.writeVarint(this.parentBlock.majorVersion)
    writer.writeVarint(this.parentBlock.minorVersion)
  }

  writer.writeVarint(this.timestamp)

  if (this.majorVersion >= this.activateParentBlockVersion) {
    writer.writeHash(this.parentBlock.previousBlockHash)
  } else {
    writer.writeHash(this.previousBlockHash)
  }

  writer.writeUInt32(this.nonce)

  if (this.majorVersion >= this.activateParentBlockVersion) {
    writer.writeVarint(this.parentBlock.transactionCount)

    if (this.parentBlock.baseTransactionBranch.length !== 0) {
      writer.writeHash(this.parentBlock.baseTransactionBranch)
    }

    writer.writeVarint(this.parentBlock.minerTransaction.version)
    writer.writeVarint(this.parentBlock.minerTransaction.unlockTime)

    writer.writeVarint(this.parentBlock.minerTransaction.inputs.length)

    this.parentBlock.minerTransaction.inputs.forEach((input) => {
      writer.writeHex(input.type)
      writer.writeVarint(input.blockIndex)
    })

    writer.writeVarint(this.parentBlock.minerTransaction.outputs.length)

    this.parentBlock.minerTransaction.outputs.forEach((output) => {
      writer.writeVarint(output.amount)
      writer.writeHex(output.type)
      writer.writeHash(output.key)
    })

    writer.writeVarint(this.parentBlock.minerTransaction.extra.length / 2)
    writer.writeHex(this.parentBlock.minerTransaction.extra)

    if (this.parentBlock.minerTransaction.inputs.length !== 0) {
      writer.writeVarint(this.parentBlock.transactions.length)

      this.parentBlock.transactions.forEach((txn) => {
        writer.writeHash(txn)
      })
    }
  }

  writer.writeVarint(this.minerTransaction.version)
  writer.writeVarint(this.minerTransaction.unlockTime)

  writer.writeVarint(this.minerTransaction.inputs.length)

  this.minerTransaction.inputs.forEach((input) => {
    writer.writeHex(input.type)
    writer.writeVarint(input.blockIndex)
  })

  writer.writeVarint(this.minerTransaction.outputs.length)

  this.minerTransaction.outputs.forEach((output) => {
    writer.writeVarint(output.amount)
    writer.writeHex(output.type)
    writer.writeHash(output.key)
  })

  writer.writeVarint(this.minerTransaction.extra.length / 2)
  writer.writeHex(this.minerTransaction.extra)

  writer.writeVarint(this.transactions.length)

  this.transactions.forEach((txn) => {
    writer.writeHash(txn)
  })

  return writer.blob
}

Block.prototype._getExtraNonce = function () {
  if (this.minerTransaction.extra.length === 0) return 0

  const extraNonce = findExtraNonce(this.minerTransaction.extra)

  return extraNonce.value
}

Block.prototype._setExtraNonce = function (value, length) {
  if (value > 4294967295) {
    throw new Error('Cannot store value greater than a UInt32')
  }

  const extraNonce = findExtraNonce(this.minerTransaction.extra)

  length = length || extraNonce.bytes

  const reader = new Reader(this.minerTransaction.extra)
  const writer = new Writer()

  writer.writeBytes(reader.nextBytes(extraNonce.offset))

  reader.skip(extraNonce.lengthBytes) // skip the nonce length

  const nonce = new Writer()
  nonce.writeUInt32(value, true)

  if (reader.unreadBytes >= nonce.length) {
    reader.skip(nonce.length)
  }

  for (var i = nonce.length; i < length; i++) {
    if (reader.unreadBytes > 0) {
      nonce.writeBytes(reader.nextBytes())
    } else {
      nonce.writeHex('00')
    }
  }

  /* If we are adding a new field, then we need to
     add the tag to identify the field */
  if (extraNonce.bytes === 0) {
    writer.writeVarint(2)
  }

  writer.writeVarint(nonce.length)
  writer.writeHex(nonce.blob)

  this.minerTransaction.extra = writer.blob
}

function findExtraNonce (blob) {
  const reader = new Reader(blob)

  while (reader.unreadBytes > 0) {
    const tag = reader.nextVarint()

    switch (tag) {
      case 0:
        break
      case 1:
        reader.skip(32)
        break
      case 2:
        const offset = reader.currentOffset
        const nonceLength = reader.nextVarint()
        const lengthBytes = reader.currentOffset - offset
        const safeNonceLength = (nonceLength > 4) ? 4 : (nonceLength === 3) ? 2 : nonceLength
        const extraNonce = reader.nextUInt(safeNonceLength, true)
        return { offset, lengthBytes: lengthBytes, bytes: nonceLength, value: extraNonce }
      case 3:
        const mmLength = reader.nextVarint()
        reader.skip(mmLength)
        break
    }
  }

  return { offset: reader.currentOffset, lengthBytes: 0, bytes: 0, value: 0 }
}

module.exports = Block
