// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./biginteger')
const varint = require('varint')

class Writer {
  constructor () {
    this.blobs = []
  }

  get blob () {
    return Buffer.concat(this.blobs).toString('hex')
  }

  get buffer () {
    return Buffer.concat(this.blobs)
  }

  get length () {
    return Buffer.concat(this.blobs).length
  }

  clear () {
    this.blobs = []
  }

  write (payload) {
    if (payload instanceof Buffer) {
      return this.writeBytes(payload)
    } else if (typeof payload === 'string' && isHex(payload) && payload.length % 2 === 0) {
      return this.writeHex(payload)
    } else if (typeof payload === 'string') {
      return this.blobs.push(Buffer.from(payload))
    } else { // if it's not a string, it needs to be
      return this.blobs.push(Buffer.from(JSON.stringify(payload)))
    }
  }

  writeBytes (bytes) {
    this.blobs.push(bytes)
  }

  writeHash (hash) {
    this.writeHex(hash)
  }

  writeHex (hex) {
    this.blobs.push(Buffer.from(hex, 'hex'))
  }

  writeInt32 (value, useBE) {
    const buf = Buffer.alloc(4)
    if (!useBE) {
      buf.writeInt32LE(value)
    } else {
      buf.writeInt32BE(value)
    }
    this.blobs.push(buf)
  }

  writeUInt (value, useBE) {
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

  writeUInt8 (value) {
    const buf = Buffer.alloc(1)
    buf.writeUInt8(value)
    this.blobs.push(buf)
  }

  writeUInt32 (value, useBE) {
    const buf = Buffer.alloc(4)
    if (!useBE) {
      buf.writeUInt32LE(value)
    } else {
      buf.writeUInt32BE(value)
    }
    this.blobs.push(buf)
  }

  writeUInt64 (value, useBE) {
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

  writeVarint (value) {
    this.blobs.push(Buffer.from(varint.encode(value)))
  }
}

/* Helper methods */

function isHex (str) {
  const regex = new RegExp('^[0-9a-fA-F]+$')
  return regex.test(str)
}

function writeUInt64LE (buf, value, offset) {
  const bigBuffer = Buffer.from(BigInteger(value).toString(16), 'hex')
  const tempBuffer = Buffer.alloc(8)
  bigBuffer.copy(tempBuffer, 8 - bigBuffer.length)
  tempBuffer.swap64().copy(buf, offset)
  return buf
}

module.exports = Writer
