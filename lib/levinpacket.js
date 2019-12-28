// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const LevinPayload = require('./levinpayload')
const Reader = require('./reader')
const Writer = require('./writer')

const LevinPacketConstants = {
  signature: '0101010101012101'
}

/**
 * Class representing a Levin Packet
 * @module LevinPacket
 * @class
 */
class LevinPacket {
  /**
   * Initializes a new Levin Packet
   * @constructs
   * @param {string|number} [data] - the hexadecimal representation of an existing Levin Packet or the command number for a new packet
   */
  constructor (data) {
    /* Initialize default values */

    /**
     * The levin packet signature
     * @type {string}
     * @default 0101010101012101
     */
    this.signature = LevinPacketConstants.signature

    /**
     * Whether this packet is in response to a request
     * @type {boolean}
     * @default false
     */
    this.returnData = false

    /**
     * The command this packet is for
     * @type {number}
     * @default 0
     */
    this.command = 0

    /**
     * The return code of the packet
     * @type {number}
     * @default 0
     */
    this.returnCode = 0

    /**
     * The packet flag(s)
     * @type {number}
     * @default 0
     */
    this.flags = 0

    /**
     * The level protocol version
     * @type {number}
     * @default 1
     */
    this.protocolVersion = 1

    /**
     * The payload contained within the packet
     * @type {LevinPayload}
     */
    this.payload = null

    if (data && isHex(data) && data.length % 2 === 0) {
      /* If we were supplied initialization data, parse it and
         handle it to initialize our object */
      const reader = new Reader(data)

      if (reader.unreadBytes < 33) {
        throw new Error('Invalid input stream supplied')
      }

      this.signature = reader.nextBytes(8).swap64().toString('hex')

      if (this.signature !== LevinPacketConstants.signature) {
        throw new Error('Invalid Levin packet signature')
      }

      const bodyLength = reader.nextUInt64()
      this.returnData = (reader.nextUInt8() === 1)
      this.command = reader.nextUInt32()
      this.returnCode = reader.nextInt32()
      this.flags = reader.nextInt32()
      this.protocolVersion = reader.nextUInt32()

      if (reader.unreadBytes < bodyLength) {
        throw new Error('Incomplete input stream supplied')
      }

      switch (this.command) {
        case 1001:
          this.payload = new LevinPayload.Handshake(reader.nextBytes(bodyLength))
          break
        case 1002:
          this.payload = new LevinPayload.TimedSync(reader.nextBytes(bodyLength))
          break
        case 1003:
          this.payload = new LevinPayload.Ping(reader.nextBytes(bodyLength))
          break
        case 2001:
          this.payload = new LevinPayload.NewBlock(reader.nextBytes(bodyLength))
          break
        case 2002:
          this.payload = new LevinPayload.NewTransactions(reader.nextBytes(bodyLength))
          break
        case 2003:
          this.payload = new LevinPayload.RequestGetObjects(reader.nextBytes(bodyLength))
          break
        case 2004:
          this.payload = new LevinPayload.ResponseGetObjects(reader.nextBytes(bodyLength))
          break
        case 2005:
          throw new Error('Not implemented. Reserved for future use.')
        case 2006:
          this.payload = new LevinPayload.RequestChain(reader.nextBytes(bodyLength))
          break
        case 2007:
          this.payload = new LevinPayload.ResponseChainEntry(reader.nextBytes(bodyLength))
          break
        case 2008:
          this.payload = new LevinPayload.RequestTxPool(reader.nextBytes(bodyLength))
          break
        case 2009:
          this.payload = new LevinPayload.LiteBlock(reader.nextBytes(bodyLength))
          break
        case 2010:
          this.payload = new LevinPayload.MissingTransactions(reader.nextBytes(bodyLength))
          break
        default:
          throw new Error('Unknown COMMAND type')
      }
    } else if (!isNaN(data)) {
      /* If we were supplied constructor data and it's not
         enough to create a packet from it, chances are we
         are trying to create a new packet */
      data = parseInt(data)

      switch (data) {
        case 1001:
          this.payload = new LevinPayload.Handshake()
          break
        case 1002:
          this.payload = new LevinPayload.TimedSync()
          break
        case 1003:
          this.payload = new LevinPayload.Ping()
          break
        case 2001:
          this.payload = new LevinPayload.NewBlock()
          break
        case 2002:
          this.payload = new LevinPayload.NewTransactions()
          break
        case 2003:
          this.payload = new LevinPayload.RequestGetObjects()
          break
        case 2004:
          this.payload = new LevinPayload.ResponseGetObjects()
          break
        case 2005:
          throw new Error('Not implemented. Reserved for future use.')
        case 2006:
          this.payload = new LevinPayload.RequestChain()
          break
        case 2007:
          this.payload = new LevinPayload.ResponseChainEntry()
          break
        case 2008:
          this.payload = new LevinPayload.RequestTxPool()
          break
        case 2009:
          this.payload = new LevinPayload.LiteBlock()
          break
        case 2010:
          this.payload = new LevinPayload.MissingTransactions()
          break
        default:
          throw new Error('COMMAND ID not found')
      }

      this.command = data
    } else {
      throw new Error('Must supply contructor parameter')
    }
  }

  /**
   * The hexadecimal representation of the packet
   * @type {string}
   * @readonly
   */
  get blob () {
    return this.buffer.toString('hex')
  }

  /**
   * The packet as a Buffer
   * @type {Buffer}
   * @readonly
   */
  get buffer () {
    const writer = new Writer()
    writer.writeBytes(Buffer.from(this.signature, 'hex').swap64())
    if (this.payload) {
      writer.writeUInt64(this.payload.byteLength)
    } else {
      writer.writeUInt64(0)
    }
    writer.writeUInt8((this.returnData) ? 1 : 0)
    writer.writeUInt32(this.command)
    writer.writeInt32(this.returnCode)
    writer.writeUInt32(this.flags)
    writer.writeUInt32(this.protocolVersion)
    if (this.payload) {
      writer.writeHex(this.payload.toString())
    }
    return writer.buffer
  }

  /**
   * The length of the payload in bytes
   * @type {number}
   * @readonly
   */
  get payloadLength () {
    return this.payload.length
  }

  toString () {
    return this.blob
  }
}

function isHex (str) {
  const regex = new RegExp('^[0-9a-fA-F]+$')
  return regex.test(str)
}

module.exports = LevinPacket
