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
  this.blockTemplate = daemonResponse.blocktemplate || daemonResponse.blocktemplate_blob
  this.block = blockFromBlob(Buffer.from(this.blockTemplate, 'hex'), this.mmBlockVersion)

  Object.defineProperty(this, 'blob', {
    get: function (blob) {
      return blockToBlob(this.block, this.mmBlockVersion)
    }
  })
}

/* This interface allows for easier building of a Buffer (blob)
   without manually doing repetitive code entry */
const Writer = function () {
  if (!(this instanceof Writer)) return new Writer()
  this.blobs = []
  Object.defineProperty(this, 'blob', {
    get: function blob () {
      return Buffer.concat(this.blobs).toString('hex')
    }
  })
  Object.defineProperty(this, 'buffer', {
    get: function buffer () {
      return Buffer.concat(this.blobs)
    }
  })
  Object.defineProperty(this, 'length', {
    get: function length () {
      return Buffer.concat(this.blobs).length
    }
  })
}

Writer.prototype.writeVarint = function (value) {
  this.blobs.push(Buffer.from(varint.encode(value)))
}

Writer.prototype.writeBytes = function (bytes) {
  this.blobs.push(bytes)
}

Writer.prototype.writeHex = function (hex) {
  this.blobs.push(Buffer.from(hex, 'hex'))
}

Writer.prototype.writeHash = function (hash) {
  this.writeHex(hash)
}

Writer.prototype.writeUInt32 = function (value) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32BE(value)
  this.blobs.push(buf)
}

/* This interface allows for easier reading of a Buffer (blob)
   without manually keeping track of where we are at in the Buffer */
const Reader = function (blob) {
  if (!(this instanceof Reader)) return new Reader(blob)
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
    BlockTemplate.parentBlock.inputs = []
    BlockTemplate.parentBlock.outputs = []

    const parentBlockInputCount = reader.nextVarint()

    for (var pbi = 0; pbi < parentBlockInputCount; pbi++) {
      const input = {
        type: reader.nextBytes().toString('hex')
      }

      switch (input.type) {
        case '02':
          input.amount = reader.nextVarint()
          const keyOffSetCount = reader.nextVarint()
          input.keyOffsets = []
          for (var ko = 0; ko < input.keyOffSetCount; ko++) {
            input.keyOffsets.push(reader.nextVarint())
          }
          assert(input.keyOffsets.length === keyOffSetCount)
          input.keyImage = reader.nextHash()
          break
        case 'ff':
          input.blockIndex = reader.nextVarint()
          break
      }

      BlockTemplate.parentBlock.inputs.push(input)
    }

    assert(BlockTemplate.parentBlock.inputs.length === parentBlockInputCount)

    const parentBlockOutputCount = reader.nextVarint()

    for (var pbo = 0; pbo < parentBlockOutputCount; pbo++) {
      BlockTemplate.parentBlock.outputs.push({
        amount: reader.nextVarint(),
        type: reader.nextBytes().toString('hex'),
        key: reader.nextHash()
      })
    }

    assert(BlockTemplate.parentBlock.outputs.length === parentBlockOutputCount)

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

function blockToBlob (block, mmBlockVersion) {
  /* Set up a new writer */
  const writer = new Writer()

  /* Write out the major & minor block versions */
  writer.writeVarint(block.majorVersion)
  writer.writeVarint(block.minorVersion)

  /* If the block version supports MM, write out a few values */
  if (block.majorVersion >= mmBlockVersion) {
    writer.writeHash(block.previousBlockHash)
    writer.writeVarint(block.parentBlock.majorVersion)
    writer.writeVarint(block.parentBlock.minorVersion)
  }

  /* Write out the block timestamp */
  writer.writeVarint(block.timestamp)

  /* If the block version supports MM, write out the parent block
     previous hash otherwise print the block hash */
  if (block.majorVersion >= mmBlockVersion) {
    writer.writeHash(block.parentBlock.previousBlockHash)
  } else {
    writer.writeHash(block.previousBlockHash)
  }

  /* Write out the block nonce */
  writer.writeUInt32(block.nonce)

  /* If the block version supports MM, write out the rest
     of the parent block values */
  if (block.majorVersion >= mmBlockVersion) {
    writer.writeVarint(block.parentBlock.transactionCount)
    writer.writeVarint(block.parentBlock.versions)
    writer.writeVarint(block.parentBlock.unlockTime)

    writer.writeVarint(block.parentBlock.inputs.length)

    block.parentBlock.inputs.forEach((input) => {
      writer.writeHex(input.type)

      switch (input.type) {
        case '02':
          writer.writeVarint(input.amount)
          writer.writeVarint(input.keyOffsets.length)
          input.keyOffsets.forEach((offset) => {
            writer.writeVarint(offset)
          })
          writer.writeHash(input.keyImage)
          break
        case 'ff':
          writer.writeVarint(input.blockIndex)
          break
      }
    })

    writer.writeVarint(block.parentBlock.outputs.length)

    block.parentBlock.outputs.forEach((output) => {
      writer.writeVarint(output.amount)
      writer.writeHex(output.type)
      writer.writeHash(output.key)
    })

    writer.writeHex(extraToBlob(block.parentBlock.extra))
  }

  /* Write out the information for the base transaction */
  writer.writeVarint(block.baseTransaction.version)
  writer.writeVarint(block.baseTransaction.unlockTime)

  /* Loop through the base transaction inputs */
  writer.writeVarint(block.baseTransaction.inputs.length)
  block.baseTransaction.inputs.forEach((input) => {
    writer.writeHex(input.type)
    writer.writeVarint(input.blockIndex)
  })

  /* Loop through the base transaction outputs */
  writer.writeVarint(block.baseTransaction.outputs.length)
  block.baseTransaction.outputs.forEach((output) => {
    writer.writeVarint(output.amount)
    writer.writeHex(output.type)
    writer.writeHash(output.key)
  })

  /* Write out the base transaction extra information */
  writer.writeHex(extraToBlob(block.baseTransaction.extra))

  /* Write out the transaction hashes that are included in
     this block template */
  writer.writeVarint(block.transactions.length)
  block.transactions.forEach((txn) => {
    writer.writeHash(txn)
  })

  return writer.blob
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
          merkleRoot: reader.nextHash()
        })
        break
    }
  }

  /* We have what we need so we'll kick it back */
  return result
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
        data.writeHex(extra.nonce)
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

  /* Set up a new writer to write the total Buffer including
     the length of the extra information as a prefix */
  const resultWriter = new Writer()
  resultWriter.writeVarint(writer.length)
  resultWriter.writeHex(writer.blob)

  /* Spit back the raw Buffer */
  return resultWriter.buffer
}

module.exports = Self
