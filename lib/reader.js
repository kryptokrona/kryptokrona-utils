// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./biginteger.js')
const varint = require('varint')

/* This interface allows for easier reading of a Buffer (blob)
   without manually keeping track of where we are at in the Buffer */
const Reader = function (blob) {
  if (!(this instanceof Reader)) return new Reader(blob)
  if (blob instanceof Buffer) {
    this.blob = blob
  } else {
    this.blob = Buffer.from(blob, 'hex')
  }
  this.currentOffset = 0

  Object.defineProperty(this, 'length', {
    get: function () {
      return this.blob.length
    }
  })

  Object.defineProperty(this, 'unreadBytes', {
    get: function () {
      const unreadBytes = this.blob.length - this.currentOffset
      return (unreadBytes >= 0) ? unreadBytes : 0
    }
  })
}

/* Reads the next byte(s) from the Buffer and returns a Buffer */
Reader.prototype.nextBytes = function (count) {
  count = count || 1
  const start = this.currentOffset
  this.currentOffset += count
  return this.blob.slice(start, this.currentOffset)
}

/* Reads the next hash value from the buffer */
Reader.prototype.nextHash = function () {
  const start = this.currentOffset
  this.currentOffset += 32
  return this.blob.slice(start, this.currentOffset).toString('hex')
}

Reader.prototype.nextInt32 = function (useBE) {
  useBE = useBE || false
  const start = this.currentOffset
  this.currentOffset += 4
  if (!useBE) {
    return this.blob.readInt32LE(start)
  } else {
    return this.blob.readInt32BE(start)
  }
}

/* Reads the next uint from the buffer */
Reader.prototype.nextUInt = function (bytes, useBE) {
  useBE = useBE || false
  bytes = bytes || 1

  if (bytes !== 1 && bytes !== 2 && bytes !== 4) {
    throw new Error('Must specify either 1, 2, or 4 bytes')
  }

  const start = this.currentOffset
  this.currentOffset += bytes

  if (!useBE) {
    return this.blob.readUIntLE(start, bytes)
  } else {
    return this.blob.readUIntBE(start, bytes)
  }
}

/* Reads the next uint8 from the buffer */
Reader.prototype.nextUInt8 = function () {
  const start = this.currentOffset
  this.currentOffset += 1
  return this.blob.readUInt8(start)
}

/* Reads the next uint32 from the buffer */
Reader.prototype.nextUInt32 = function (useBE) {
  useBE = useBE || false
  const start = this.currentOffset
  this.currentOffset += 4
  if (!useBE) {
    return this.blob.readUInt32LE(start)
  } else {
    return this.blob.readUInt32BE(start)
  }
}

/* Reads the next uint64 from the buffer */
Reader.prototype.nextUInt64 = function (useBE) {
  useBE = useBE || false
  const start = this.currentOffset
  this.currentOffset += 8
  if (!useBE) {
    /* If we have native support for this in our Node version
       then use it, else use the one we have provided in the
       helper methods */
    if (typeof Buffer.alloc(0).readUInt64LE === 'undefined') {
      return readUInt64LE(this.blob, start)
    } else {
      return this.blob.nextUInt64LE(start)
    }
  } else {
    throw new Error('Not implemented')
  }
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

/* Skips the specified number of bytes in the Buffer */
Reader.prototype.skip = function (count) {
  count = count || 1
  this.currentOffset += count
}

/* Helper methods */

function readUInt64LE (buf, offset = 0, noAssert = false) {
  if (buf.length < offset + 8) {
    if (noAssert) {
      return 0
    }
    throw new Error('Out of bounds')
  }

  const first = buf[offset]
  const last = buf[offset + 7]

  if (first === undefined || last === undefined) {
    if (noAssert) {
      return 0
    }
    throw new Error('Out of bounds')
  }

  const lo = first + (buf[++offset] * Math.pow(2, 8)) + (buf[++offset] * Math.pow(2, 16)) + (buf[++offset] * Math.pow(2, 24))
  const hi = buf[++offset] + (buf[++offset] * Math.pow(2, 8)) + (buf[++offset] * Math.pow(2, 16)) + (last * Math.pow(2, 24))

  return BigInteger(lo) + (BigInteger(hi) << 32)
}

module.exports = Reader
