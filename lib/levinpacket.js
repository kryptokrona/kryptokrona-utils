// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./biginteger.js')

const LevinPacket = function (hexData) {
  /* Initialize default values */
  this.signature = '0101010101012101'
  this.returnData = false
  this.command = 0
  this.returnCode = 0
  this.flags = 0
  this.protocolVersion = 1
  this.payload = Buffer.alloc(0)

  /* If our version of node has support for 64bit Buffer reading, use it,
     else we will define our own */
  if (typeof Buffer.alloc(0).readUInt64LE === 'undefined') {
    Buffer.prototype.readUInt64LE = function (offset = 0, noAssert = false) {
      if (this.length < offset + 8) {
        if (noAssert) {
          return 0
        }
        throw new Error('Out of bounds')
      }

      const first = this[offset]
      const last = this[offset + 7]

      if (first === undefined || last === undefined) {
        if (noAssert) {
          return 0
        }
        throw new Error('Out of bounds')
      }

      const lo = first + (this[++offset] * Math.pow(2, 8)) + (this[++offset] * Math.pow(2, 16)) + (this[++offset] * Math.pow(2, 24))
      const hi = this[++offset] + (this[++offset] * Math.pow(2, 8)) + (this[++offset] * Math.pow(2, 16)) + (last * Math.pow(2, 24))

      return BigInteger(lo) + (BigInteger(hi) << 32)
    }
  }

  /* If our version of node has support for 64bit Buffer writing, use it,
     else we will define our own */
  if (typeof Buffer.alloc(0).writeUInt64LE === 'undefined') {
    Buffer.prototype.writeUInt64LE = function (value, offset) {
      const bigBuffer = Buffer.from(BigInteger(value).toString(16), 'hex')
      const tempBuffer = Buffer.alloc(8)
      bigBuffer.copy(tempBuffer, 8 - bigBuffer.length)
      tempBuffer.swap64().copy(this, offset)
    }
  }

  /* If we were supplied initialization data, parse it and
     handle it to initialize our object */
  if (hexData && hexData.length % 2 === 0) {
    const buffer = Buffer.from(hexData, 'hex')
    this.signature = buffer.slice(0, 8).swap64().toString('hex')
    var bodyLength = buffer.slice(8, 16).readUInt64LE(0)
    this.returnData = (buffer.slice(16, 17).readUInt8(0) === 1)
    this.command = buffer.slice(17, 21).readUInt32LE(0)
    this.returnCode = buffer.slice(21, 25).readInt32LE(0)
    this.flags = buffer.slice(25, 29).readUInt32LE(0)
    this.protocolVersion = buffer.slice(29, 33).readUInt32LE(0)
    this.payload = buffer.slice(33, 33 + bodyLength)
  }

  /* Helper property regarding the payload length (bytes) */
  Object.defineProperty(this, 'payloadLength', {
    get: function () {
      return this.payload.length
    }
  })

  /* Returns this assembled object as a Buffer */
  Object.defineProperty(this, 'buffer', {
    get: function () {
      const buffer = Buffer.alloc(33 + this.payload.length)
      const sigBuff = Buffer.from(this.signature, 'hex').swap64()
      sigBuff.copy(buffer, 0)
      buffer.writeUInt64LE(this.payload.length, 8)
      buffer.writeUInt8((this.returnData) ? 1 : 0, 16)
      buffer.writeUInt32LE(this.command, 17)
      buffer.writeInt32LE(this.returnCode, 21)
      buffer.writeUInt32LE(this.flags, 25)
      buffer.writeUInt32LE(this.protocolVersion, 29)
      this.payload.copy(buffer, 33)
      return buffer
    }
  })

  /* Returns this assembled object as a hex string */
  Object.defineProperty(this, 'blob', {
    get: function () {
      return this.buffer.toString('hex')
    }
  })
}

module.exports = LevinPacket
