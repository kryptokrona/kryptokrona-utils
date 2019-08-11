// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Block = require('./block.js')

const BlockTemplate = function (opts) {
  opts = opts || {}
  if (!(this instanceof BlockTemplate)) return new BlockTemplate(opts)
  if (!opts.blocktemplate || !opts.difficulty || !opts.height || !opts.reservedOffset) {
    throw new Error('Cannot initialize object without required parameters')
  }
  this.activateParentBlockVersion = opts.activateParentBlockVersion || 2
  this.blocktemplate = opts.blocktemplate
  this.difficulty = opts.difficulty
  this.height = opts.height
  this.reservedOffset = opts.reservedOffset
  this.block = new Block()
  try {
    this.block.blob = this.blocktemplate
  } catch (e) {
    throw new Error('Could not parse provided Block Template: ' + e.toString())
  }
  this.block.targetDifficulty = opts.difficulty

  Object.defineProperty(this, 'extraNonce', {
    get: function () {
      return this.block.extraNonce
    },
    set: function (value) {
      this.block.extraNonce = value
    }
  })

  Object.defineProperty(this, 'nonce', {
    get: function () {
      return this.block.nonce
    },
    set: function (nonce) {
      this.block.nonce = nonce
    }
  })
}

/* This method converts the block template provided by a nodeName
   into a block blob that is hashed via a pool compatible miner */
BlockTemplate.prototype.convert = function (block) {
  block = block || this.block
  if (block.majorVersion >= this.activateParentBlockVersion) {
    /* If we support merged mining, then we can reduce the size of
       the block blob sent to the miners by crafting a new block
       with the blocktemplate provided by the daemon into a new
       block that contains the original block information as a MM
       tag in the miner transaction */
    const newBlock = new Block()
    newBlock.majorVersion = 1
    newBlock.minorVersion = 0
    newBlock.timestamp = block.timestamp
    newBlock.previousBlockHash = block.previousBlockHash
    newBlock.nonce = block.nonce

    /* Here, we fill the new block miner transaction with the
       MM tag and the merkle root of the block contained
       in the blocktemplate provided by the daemon. We form the
       tag using the nice transaction API because that makes life
       a lot easier than forming it by hand */
    newBlock.minerTransaction.extra = []
    newBlock.minerTransaction.extra.push({
      tag: 3,
      depth: 0,
      merkleRoot: block.merkleRoot
    })
    /* Once the extra tag is formed, we'll overwrite extra
       with the blob version of it */
    newBlock.minerTransaction.extra = newBlock.minerTransaction.extraBlob

    return newBlock
  } else {
    return block
  }
}

/* This method reconstructs a full block template using the nonce
   found by a pool miner by first creating the parent block in the
   convert method above, and then merging the two blocks together */
BlockTemplate.prototype.construct = function (nonce, branch) {
  const block = this.block
  block.nonce = nonce

  if (block.majorVersion >= this.activateParentBlockVersion) {
    /* First we create the new parent block */
    const newBlock = this.convert(block)
    /* Then assign the nonce to it */
    newBlock.parentBlock.nonce = nonce

    /* Then we merge the two blocks together */
    block.timestamp = newBlock.timestamp
    block.parentBlock.majorVersion = newBlock.majorVersion
    block.parentBlock.minorVersion = newBlock.minorVersion
    block.parentBlock.previousBlockHash = newBlock.previousBlockHash
    block.parentBlock.nonce = newBlock.nonce
    block.parentBlock.minerTransaction = newBlock.minerTransaction
    block.parentBlock.transactionCount = newBlock.transactions.length + 1 // +1 for the miner transaction
    block.parentBlock.baseTransactionBranch = newBlock.baseTransactionBranch

    /* We only add this if it actually exists */
    if (branch) {
      block.parentBlock.blockchainBranch = branch
    }
  }

  return block
}

module.exports = BlockTemplate
