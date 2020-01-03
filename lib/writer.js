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

  writeLevinVarint (value) {
    var tempValue = value << 2

    var byteCount = 0

    if (value <= 63) {
      tempValue |= 0
      byteCount = 1
    } else if (value <= 16383) {
      tempValue |= 1
      byteCount = 2
    } else if (value <= 1073741823) {
      tempValue |= 2
      byteCount = 4
    } else {
      if (value > 4611686018427387903) {
        throw new Error('failed to pack varint -- amount too big')
      }
      tempValue |= 7
      byteCount = 8
    }

    for (var i = 0; i < byteCount; i++) {
      this.writeUInt8((tempValue >> i * 8) & 0xFF)
    }
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

  writeUInt16 (value, useBE) {
    const buf = Buffer.alloc(2)
    if (!useBE) {
      buf.writeUInt16LE(value)
    } else {
      buf.writeUInt16BE(value)
    }
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

    return buf.toString('hex')
  }

  writeVarint (value) {
    if (typeof value === 'number' && parseInt(value) === value) {
      value = parseInt(value)
      this.blobs.push(Buffer.from(varint.encode(value)))
    } else if (typeof value === 'string' && parseInt(value).toString() === value) {
      value = parseInt(value)
      this.blobs.push(Buffer.from(varint.encode(value)))
    } else if (typeof value === 'string' && value.length % 2 === 0 && isHex(value)) {
      this.blobs.push(Buffer.from(value, 'hex')) // this is here because JS sucks with uint64_t
    } else {
      throw new Error('Invalid supplied value')
    }
  }
}

/* Helper methods */

function isHex (str) {
  const regex = new RegExp('^[0-9a-fA-F]+$')
  return regex.test(str)
}

function writeUInt64LE (buf, value, offset) {
  var bigNumber = BigInteger(value).toString(16)
  if (bigNumber.length % 2 !== 0) bigNumber = bigNumber.padStart(Math.ceil(bigNumber.length / 2) * 2, '0')
  const bigBuffer = Buffer.from(bigNumber, 'hex')
  const tempBuffer = Buffer.alloc(8)
  bigBuffer.copy(tempBuffer, 8 - bigBuffer.length)
  tempBuffer.swap64().copy(buf, offset)
  return buf
}

module.exports = Writer
