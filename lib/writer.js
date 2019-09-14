// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./biginteger.js')
const varint = require('varint')

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

Writer.prototype.clear = function () {
  this.blobs = []
}

Writer.prototype.writeBytes = function (bytes) {
  this.blobs.push(bytes)
}

Writer.prototype.writeHash = function (hash) {
  this.writeHex(hash)
}

Writer.prototype.writeHex = function (hex) {
  this.blobs.push(Buffer.from(hex, 'hex'))
}

Writer.prototype.writeInt32 = function (value, useBE) {
  const buf = Buffer.alloc(4)
  if (!useBE) {
    buf.writeInt32LE(value)
  } else {
    buf.writeInt32BE(value)
  }
  this.blobs.push(buf)
}

Writer.prototype.writeUInt = function (value, useBE) {
  useBE = useBE || false

  var buf

  if (value <= 255) {
    buf = Buffer.alloc(1)
    buf.writeUInt8(value)
  } else if (value <= 65536) {
    buf = Buffer.alloc(2)
    if (!useBE) {
      buf.writeUInt16LE(value)
    } else {
      buf.writeUInt16BE(value)
    }
  } else if (value <= 4294967295) {
    buf = Buffer.alloc(4)
    if (!useBE) {
      buf.writeUInt32LE(value)
    } else {
      buf.writeUInt32BE(value)
    }
  } else {
    throw new Error('Cannot safely store a value larger than a UInt32')
  }

  this.blobs.push(buf)
}

Writer.prototype.writeUInt8 = function (value) {
  const buf = Buffer.alloc(1)
  buf.writeUInt8(value)
  this.blobs.push(buf)
}

Writer.prototype.writeUInt32 = function (value, useBE) {
  const buf = Buffer.alloc(4)
  if (!useBE) {
    buf.writeUInt32LE(value)
  } else {
    buf.writeUInt32BE(value)
  }
  this.blobs.push(buf)
}

Writer.prototype.writeUInt64 = function (value, useBE) {
  var buf = Buffer.alloc(8)
  if (!useBE) {
    /* If we have native support for this in our Node version
       then use it, else use the one we have provided in the
       helper methods */
    if (typeof Buffer.alloc(0).writeUInt64LE === 'undefined') {
      buf = writeUInt64LE(buf, value)
    } else {
      buf.writeUInt64LE(value)
    }
  } else {
    throw new Error('Not implemented')
  }
  this.blobs.push(buf)
}

Writer.prototype.writeVarint = function (value) {
  this.blobs.push(Buffer.from(varint.encode(value)))
}

/* Helper methods */

function writeUInt64LE (buf, value, offset) {
  const bigBuffer = Buffer.from(BigInteger(value).toString(16), 'hex')
  const tempBuffer = Buffer.alloc(8)
  bigBuffer.copy(tempBuffer, 8 - bigBuffer.length)
  tempBuffer.swap64().copy(buf, offset)
  return buf
}

module.exports = Writer
