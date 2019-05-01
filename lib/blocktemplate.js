// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const varint = require('varint')
const assert = require('assert')

const Self = function (daemonResponse, mergedMiningBlockVersion) {
  if (!(this instanceof Self)) return new Self(daemonResponse, mergedMiningBlockVersion)
  this.mmBlockVersion = mergedMiningBlockVersion || 2
  this.difficulty = daemonResponse.difficulty
  this.height = daemonResponse.height
  this.reservedOffset = daemonResponse.reservedOffset || daemonResponse.reserved_offset
  this.blob = Buffer.from(daemonResponse.blocktemplate || daemonResponse.blocktemplate_blob, 'hex')
  this.block = blockFromBlob(this.blob, this.mmBlockVersion)
}

/* This interface allows for easier reading of a Buffer (blob)
   without manually keeping track of where we are at in the Buffer */
const Reader = function (blob) {
  if (!(this instanceof Reader)) return new Self(blob)
  this.blob = blob
  this.currentOffset = 0
}

/* Reads the next varint encoded value from the Buffer */
Reader.prototype.nextVarint = function () {
  const start = this.currentOffset
  do {
    /* Check to see if the MSB not set and if it's not
       then we have reached the end of our varint */
    if (this.blob.readUInt8(this.currentOffset) < 128) {
      this.currentOffset++
      return varint.decode(this.blob.slice(start, this.currentOffset))
    }
    this.currentOffset++
  } while (true)
}

/* Reads the next hash value from the buffer */
Reader.prototype.nextHash = function () {
  const start = this.currentOffset
  this.currentOffset += 32
  return this.blob.slice(start, this.currentOffset).toString('hex')
}

/* Reads the next uint32 from the buffer */
Reader.prototype.nextUInt32 = function () {
  const start = this.currentOffset
  this.currentOffset += 4
  return this.blob.readUInt32BE(start)
}

/* Reads the next byte(s) from the Buffer and returns a Buffer */
Reader.prototype.nextBytes = function (count) {
  count = count || 1
  const start = this.currentOffset
  this.currentOffset += count
  return this.blob.slice(start, this.currentOffset)
}

/* Skips the specified number of bytes in the Buffer */
Reader.prototype.skip = function (count) {
  count = count || 1
  this.currentOffset += count
}

/* Helper function that parses a Buffer into a CryptoNote BlockTemplate */
function blockFromBlob (blob, mmBlockVersion) {
  /* Initiate a new Reader */
  const reader = new Reader(blob)

  /* Set up our base object for return */
  const BlockTemplate = {}

  /* Get the major & minor block versions */
  BlockTemplate.majorVersion = reader.nextVarint()
  BlockTemplate.minorVersion = reader.nextVarint()

  /* If we activated Merged Mining, the next few values in the
     blob are related to the Parent Block */
  if (BlockTemplate.majorVersion >= mmBlockVersion) {
    BlockTemplate.previousBlockHash = reader.nextHash()
    BlockTemplate.parentBlock = {
      majorVersion: reader.nextVarint(),
      minorVersion: reader.nextVarint()
    }
  }

  /* Get the block timestamp */
  BlockTemplate.timestamp = reader.nextVarint()

  /* If we activated Merged Mining, the next hash in the blob
     is that of the parentBlock previous hash; otherwise, its
     the previous block hash for the block */
  if (BlockTemplate.majorVersion >= mmBlockVersion) {
    BlockTemplate.parentBlock.previousBlockHash = reader.nextHash()
  } else {
    BlockTemplate.previousBlockHash = reader.nextHash()
  }

  /* Get the block nonce */
  BlockTemplate.nonce = reader.nextUInt32()

  /* If we activated Merged Mining, the next few values in the
     blob are the rest of the parentBlock */
  if (BlockTemplate.majorVersion >= mmBlockVersion) {
    BlockTemplate.parentBlock.transactionCount = reader.nextVarint()
    BlockTemplate.parentBlock.version = reader.nextVarint()
    BlockTemplate.parentBlock.unlockTime = reader.nextVarint()

    /* The daemon doesn't usually return any data here other
       than to say that these arrays are empty with 0 lengths
       so we'll skip the next two bytes in the Buffer and
       initialize the arrays */
    reader.skip(2)
    BlockTemplate.parentBlock.inputs = []
    BlockTemplate.parentBlock.outputs = []

    /* Get the parent block base transaction extra field size */
    const extraSize = reader.nextVarint()

    /* Read the extra blob out so we can handle it on its own */
    const extraBlob = reader.nextBytes(extraSize)

    /* Parse the extra blob and stuff it in the parent block */
    BlockTemplate.parentBlock.extra = extraFromBlob(extraBlob)
  }

  /* Set up the base transaction for the block including
     grabbing the transaction version and unlockTime */
  BlockTemplate.baseTransaction = {
    version: reader.nextVarint(),
    unlockTime: reader.nextVarint(),
    inputs: [],
    outputs: []
  }

  /* Get how many inputs there are in the base transaction */
  const inputCount = reader.nextVarint()

  /* There should only ever be a single input for a base transaction */
  assert(inputCount === 1)

  /* Even though we only have one input, we'll build out the base
     transaction inputs array */
  for (var i = 0; i < inputCount; i++) {
    BlockTemplate.baseTransaction.inputs.push({
      type: reader.nextBytes().toString('hex'),
      blockIndex: reader.nextVarint()
    })
  }

  /* Get how many outputs there are in the base transaction */
  const outputCount = reader.nextVarint()

  /* Loop through the outputs and build those out into the
     base transaction outputs array */
  for (var j = 0; j < outputCount; j++) {
    BlockTemplate.baseTransaction.outputs.push({
      amount: reader.nextVarint(),
      type: reader.nextBytes().toString('hex'),
      key: reader.nextHash()
    })
  }

  /* Get the base transaction extra length */
  const extraLength = reader.nextVarint()

  /* Read the extra blob out so we can handle it on its own */
  const extra = reader.nextBytes(extraLength)

  /* Parse the extra blob and stuff it in the parent block */
  BlockTemplate.baseTransaction.extra = extraFromBlob(extra)

  /* Get the number of transactions included in the block */
  const transactionCount = reader.nextVarint()

  /* Set up our transactions array */
  BlockTemplate.transactions = []

  /* Loop through the Buffer and read in the transaction hashes */
  for (var k = 0; k < transactionCount; k++) {
    BlockTemplate.transactions.push(reader.nextHash())
  }

  /* That's it, return the resulting object */
  return BlockTemplate
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
    const tag = reader.nextVarint()

    switch (tag) {
      case 1: // Transaction Public Key
        result.push({
          tag: tag,
          publicKey: reader.nextHash()
        })
        break
      case 2: // Extra Nonce
        length = reader.nextVarint()
        result.push({
          tag: tag,
          nonce: reader.nextBytes(length).toString('hex')
        })
        break
      case 3: // Merged Mining Tag
        length = reader.nextVarint()
        result.push({
          tag: tag,
          depth: reader.nextVarint(),
          merkleRoot: reader.nextBytes(length - 1).toString('hex')
        })
        break
    }
  }

  /* We have what we need so we'll kick it back */
  return result
}

module.exports = Self
