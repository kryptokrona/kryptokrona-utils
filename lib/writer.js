// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

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

module.exports = Writer
