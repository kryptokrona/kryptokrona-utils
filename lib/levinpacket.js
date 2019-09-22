// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Reader = require('./reader')
const Writer = require('./writer')

class LevinPacket {
  constructor (hexData) {
    /* Initialize default values */
    this.signature = '0101010101012101'
    this.returnData = false
    this.command = 0
    this.returnCode = 0
    this.flags = 0
    this.protocolVersion = 1
    this.payload = Buffer.alloc(0)

    /* If we were supplied initialization data, parse it and
     handle it to initialize our object */
    if (hexData && isHex(hexData) && hexData.length % 2 === 0) {
      const reader = new Reader(hexData)
      this.signature = reader.nextBytes(8).swap64().toString('hex')
      const bodyLength = reader.nextUInt64()
      this.returnData = (reader.nextUInt8() === 1)
      this.command = reader.nextUInt32()
      this.returnCode = reader.nextInt32()
      this.flags = reader.nextInt32()
      this.protocolVersion = reader.nextUInt32()
      this.payload = reader.nextBytes(bodyLength)
    }
  }

  get blob () {
    return this.buffer.toString('hex')
  }

  get buffer () {
    const writer = new Writer()
    writer.writeBytes(Buffer.from(this.signature, 'hex').swap64())
    writer.writeUInt64(this.payload.length)
    writer.writeUInt8((this.returnData) ? 1 : 0)
    writer.writeUInt32(this.command)
    writer.writeInt32(this.returnCode)
    writer.writeUInt32(this.flags)
    writer.writeUInt32(this.protocolVersion)
    writer.writeBytes(this.payload)
    return writer.buffer
  }

  get payloadLength () {
    return this.payload.length
  }
}

function isHex (str) {
  const regex = new RegExp('^[0-9a-fA-F]+$')
  return regex.test(str)
}

module.exports = LevinPacket
