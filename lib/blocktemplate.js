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
BlockTemplate.prototype.convert = function () {
  if (this.block.majorVersion >= this.activateParentBlockVersion) {
    /* If we support merged mining, then we can reduce the size of
       the block blob sent to the miners by crafting a new block
       with the blocktemplate provided by the daemon into a new
       block that contains the original block information as a MM
       tag in the miner transaction */
    const newBlock = new Block()
    newBlock.majorVersion = 1
    newBlock.minorVersion = 0
    newBlock.timestamp = this.block.timestamp
    newBlock.previousBlockHash = this.block.previousBlockHash
    newBlock.nonce = this.block.nonce

    /* Here, we fill the new block miner transaction with the
       MM tag and the merkle root of the transactions contained
       in the blocktemplate provided by the daemon */
    newBlock.minerTransaction.extra = []
    newBlock.minerTransaction.extra.push({
      tag: 3,
      depth: 0,
      merkleRoot: this.block.merkleRoot
    })

    return newBlock
  } else {
    return this.block
  }
}

module.exports = BlockTemplate
