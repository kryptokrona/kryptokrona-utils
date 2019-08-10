// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./biginteger.js')
const crypto = require('./turtlecoin-crypto/index.js')()
const Reader = require('./reader.js')
const Transaction = require('./transaction.js')
const Writer = require('./writer.js')

const Block = function (opts) {
  opts = opts || {}
  if (!(this instanceof Block)) return new Block(opts)

  this.activateParentBlockVersion = opts.activateParentBlockVersion || 2

  this.targetDifficulty = 1

  this.majorVersion = 0
  this.minorVersion = 0
  this.timestamp = 0
  this.previousBlockHash = '0000000000000000000000000000000000000000000000000000000000000000'
  this.parentBlock = {
    majorVersion: 0,
    minorVersion: 0,
    previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
    transactionCount: 0,
    baseTransactionBranch: [],
    minerTransaction: new Transaction(),
    blockchainBranch: []
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

  Object.defineProperty(this, 'baseTransactionBranch', {
    get: function () {
      return calculateBaseTransactionBranch(this)
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

  Object.defineProperty(this, 'hash', {
    get: function () {
      return getBlockHash(toHashingBlob(this))
    }
  })

  Object.defineProperty(this, 'hashingBlob', {
    get: function () {
      return toHashingBlob(this, true)
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

  Object.defineProperty(this, 'longHash', {
    get: function () {
      return getBlockPoWHash(this.majorVersion, toHashingBlob(this, true))
    }
  })

  Object.defineProperty(this, 'meetsDiff', {
    get: function () {
      return this.hashMeetsDifficulty(this.longHash, this.targetDifficulty)
    }
  })

  Object.defineProperty(this, 'merkleRoot', {
    get: function () {
      const merkleRootBlob = toMerkleHeaderBlob(this, this.activateParentBlockVersion)
      return getBlockHash(merkleRootBlob)
    }
  })

  Object.defineProperty(this, 'transactionTreeHashData', {
    get: function () {
      return calculateTransactionTreeHashData(this)
    }
  })
}

Block.prototype.hashMeetsDifficulty = function (hash, difficulty) {
  return checkAgainstDifficulty(hash, difficulty)
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

  this.nonce = reader.nextUInt32(true)

  if (this.majorVersion >= this.activateParentBlockVersion) {
    this.parentBlock.transactionCount = reader.nextVarint()

    const [btbderr, baseTransactionBranchDepth] = crypto.tree_depth(this.parentBlock.transactionCount)

    if (btbderr) throw new Error('Cannot calculate baseTransaction depth')

    for (var btbd = 0; btbd < baseTransactionBranchDepth; btbd++) {
      this.parentBlock.baseTransactionBranch.push(reader.nextHash())
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

    if (this.parentBlock.minerTransaction.version >= 2) {
      this.parentBlock.minerTransaction.ignoredField = reader.nextVarint()
    }

    const blockchainBranchDepth = findMMTagDepth(this.parentBlock.minerTransaction.extra)

    for (var bbd = 0; bbd < blockchainBranchDepth; bbd++) {
      this.parentBlock.blockchainBranch.push(reader.nextHash())
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

  writer.writeUInt32(this.nonce, true)

  if (this.majorVersion >= this.activateParentBlockVersion) {
    writer.writeVarint(this.parentBlock.transactionCount)

    this.parentBlock.baseTransactionBranch.forEach((hash) => {
      writer.writeHash(hash)
    })

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

    if (this.parentBlock.minerTransaction.version >= 2) {
      writer.writeVarint(this.parentBlock.minerTransaction.ignoredField)
    }

    this.parentBlock.blockchainBranch.forEach((branch) => {
      writer.writeHash(branch)
    })
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

  if (reader.unreadBytes > 0) {
    writer.writeBytes(reader.nextBytes(reader.unreadBytes))
  }

  this.minerTransaction.extra = writer.blob
}

/* These methods are not exported */

function toHashingBlob (block, headerOnly) {
  /* block value only matters for majorVersion >= 2 */
  headerOnly = headerOnly || false

  const writer = new Writer()

  writer.writeVarint(block.majorVersion)
  writer.writeVarint(block.minorVersion)

  if (block.majorVersion >= block.activateParentBlockVersion) {
    writer.writeHash(block.previousBlockHash)
  } else {
    writer.writeVarint(block.timestamp)
    writer.writeHash(block.previousBlockHash)
    writer.writeUInt32(block.nonce, true)
  }

  const txnTreeHashData = calculateTransactionTreeHashData(block)

  writer.writeHash(txnTreeHashData.hash)

  writer.writeVarint(txnTreeHashData.length)

  if (block.majorVersion >= block.activateParentBlockVersion) {
    if (headerOnly) {
      writer.clear()
    }

    writer.writeVarint(block.parentBlock.majorVersion)
    writer.writeVarint(block.parentBlock.minorVersion)
    writer.writeVarint(block.timestamp)
    writer.writeHash(block.parentBlock.previousBlockHash)
    writer.writeUInt32(block.nonce, true)

    const [parentErr, parentTreeHash] = crypto.tree_hash_from_branch(block.parentBlock.baseTransactionBranch, block.parentBlock.minerTransaction.hash, 0)

    if (parentErr) throw new Error('Cannot generate parent block transaction tree_hash_from_branch')

    writer.writeHash(parentTreeHash)

    writer.writeVarint(block.parentBlock.transactionCount)

    if (headerOnly) {
      return writer.blob
    }

    block.parentBlock.baseTransactionBranch.forEach((branch) => {
      writer.writeHash(branch)
    })

    writer.writeHex(block.parentBlock.minerTransaction.blob)

    if (block.parentBlock.minerTransaction.version >= 2) {
      writer.writeVarint(block.parentBlock.minerTransaction.ignoredField)
    }

    block.parentBlock.blockchainBranch.forEach((branch) => {
      writer.writeHash(branch)
    })
  }

  return writer.blob
}

function toMerkleHeaderBlob (block, activateParentBlockVersion) {
  activateParentBlockVersion = activateParentBlockVersion || 2

  const writer = new Writer()

  writer.writeVarint(block.majorVersion)
  writer.writeVarint(block.minorVersion)

  if (block.majorVersion < activateParentBlockVersion) {
    writer.writeVarint(block.timestamp)
  }

  writer.writeHash(block.previousBlockHash)

  if (writer.majorVersion < activateParentBlockVersion) {
    writer.writeUInt32(block.nonce, true)
  }

  const txnTreeHashData = calculateTransactionTreeHashData(block)

  writer.writeHash(txnTreeHashData.hash)

  writer.writeVarint(txnTreeHashData.length)

  return writer.blob
}

function calculateTransactionTreeHashData (block) {
  const transactions = [block.minerTransaction.hash]
  block.transactions.forEach(txn => transactions.push(txn))
  const [err, treeHash] = crypto.tree_hash(transactions)
  if (err) throw new Error('Cannot generate tree hash of the transactions')
  return { hash: treeHash, length: transactions.length }
}

function calculateBaseTransactionBranch (block) {
  const transactions = [block.minerTransaction.hash]
  block.transactions.forEach(txn => transactions.push(txn))
  const [err, treeBranch] = crypto.tree_branch(transactions)
  if (err) throw new Error('Cannot generate the tree branch of the transactions')
  return treeBranch
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

function findMMTagDepth (blob) {
  const reader = new Reader(blob)

  while (reader.unreadBytes > 0) {
    const tag = { tag: reader.nextVarint() }

    switch (tag.tag) {
      case 0:
        break
      case 1:
        reader.skip(32)
        break
      case 2:
        reader.skip(reader.nextVarint())
        break
      case 3:
        reader.nextVarint()
        return reader.nextVarint()
      default:
        break
    }
  }

  return 0
}

function getBlockHash (blob) {
  const reader = new Reader(blob)
  const writer = new Writer()

  writer.writeVarint(reader.length)
  writer.writeBytes(reader.nextBytes(reader.unreadBytes))

  const [err, hash] = crypto.cn_fast_hash(writer.blob)

  if (err) return new Error('Could not calculate block hash')

  return hash
}

function getBlockPoWHash (majorVersion, blob) {
  var err
  var hash

  switch (majorVersion) {
    case 1:
    case 2:
    case 3:
      [err, hash] = crypto.cn_slow_hash_v0(blob)
      break
    case 4:
      [err, hash] = crypto.cn_lite_slow_hash_v1(blob)
      break
    case 5:
      [err, hash] = crypto.cn_turtle_lite_slow_hash_v2(blob)
      break
    default:
      throw new Error('Unhandled major block version')
  }

  if (err) return new Error('Could not calculate block PoW hash')

  return hash
}

function checkAgainstDifficulty (hash, difficulty) {
  const reversedHash = hash.match(/[0-9a-f]{2}/gi).reverse().join('')

  const hashDiff = BigInteger.parse(reversedHash, 16).multiply(difficulty)

  const maxValue = BigInteger.parse('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)

  return (hashDiff.compare(maxValue) === -1)
}

module.exports = Block
