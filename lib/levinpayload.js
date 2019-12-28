// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Block = require('./block')
const PortableStorage = require('./portablestorage')
const Reader = require('./reader')
const Transaction = require('./transaction')
const Writer = require('./writer')

/**
 * Class representing a Levin Payload
 * @module LevinPayload
 * @class
 */
class LevinPayload {
  /**
   * Initializes a new Levin Payload
   * @constructs
   * @param {string} [data] - the hexadecimal representation of an existing Levin Packet
   */
  constructor (data) {
    if ((data && data.length % 2 === 0) || data instanceof Buffer || data instanceof Reader) {
      this._payload = new PortableStorage(data)
    }
  }

  get length () {
    return this.toString().length
  }

  get byteLength () {
    return this.length / 2
  }
}

class Handshake extends LevinPayload {
  constructor (data) {
    super(data)

    this.nodeData = {
      networkId: '00000000000000000000000000000000',
      version: 0,
      localTime: '0000000000000000',
      myPort: 0,
      peerId: '0000000000000000'
    }
    this.payloadData = {
      currentHeight: 0,
      topId: '0000000000000000000000000000000000000000000000000000000000000000'
    }
    this.peerList = []

    if (this._payload) {
      this.nodeData = {
        networkId: this._payload.entries.node_data.value.entries.network_id.value,
        version: this._payload.entries.node_data.value.entries.version.value,
        localTime: this._payload.entries.node_data.value.entries.local_time.value,
        myPort: this._payload.entries.node_data.value.entries.my_port.value,
        peerId: this._payload.entries.node_data.value.entries.peer_id.value
      }

      this.payloadData = {
        currentHeight: this._payload.entries.payload_data.value.entries.current_height.value,
        topId: this._payload.entries.payload_data.value.entries.top_id.value
      }

      if (this._payload.entries.local_peerlist) {
        this.peerList = deserializePeerList(this._payload.entries.local_peerlist.value)
      }

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    const nodeData = new PortableStorage()
    nodeData.entries.network_id = { type: 0x0a, value: Buffer.from(this.nodeData.networkId, 'hex') }
    nodeData.entries.version = { type: 0x08, value: this.nodeData.version }
    nodeData.entries.peer_id = { type: 0x05, value: this.nodeData.peerId }
    nodeData.entries.local_time = { type: 0x05, value: this.nodeData.localTime }
    nodeData.entries.my_port = { type: 0x06, value: this.nodeData.myPort }
    payload.entries.node_data = { type: 0x0c, value: nodeData }

    const payloadData = new PortableStorage()
    payloadData.entries.current_height = { type: 0x06, value: this.payloadData.currentHeight }
    payloadData.entries.top_id = { type: 0x0a, value: Buffer.from(this.payloadData.topId, 'hex') }
    payload.entries.payload_data = { type: 0x0c, value: payloadData }

    if (Array.isArray(this.peerList) && this.peerList.length !== 0) {
      payload.entries.local_peerlist = { type: 0x0a, value: serializePeerList(this.peerList) }
    }

    return payload.toString()
  }
}

class LiteBlock extends LevinPayload {
  constructor (data) {
    super(data)

    this.blockTemplate = new Block()
    this.currentBlockchainHeight = 0
    this.hop = 0

    if (this._payload) {
      this.currentBlockchainHeight = this._payload.entries.current_blockchain_height.value
      this.hop = this._payload.entries.hop.value
      this.blockTemplate = new Block(this._payload.entries.blockTemplate.value)

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    payload.entries.current_blockchain_height = { type: 0x06, value: this.currentBlockchainHeight }
    payload.entries.hop = { type: 0x06, value: this.hop }
    payload.entries.blockTemplate = { type: 0x0a, value: this.blockTemplate.blob }

    return payload.toString()
  }
}

class MissingTransactions extends LevinPayload {
  constructor (data) {
    super(data)

    this.currentBlockchainHeight = 0
    this.blockHash = '0000000000000000000000000000000000000000000000000000000000000000'
    this.missingTransactions = []

    if (this._payload) {
      this.currentBlockchainHeight = this._payload.entries.current_blockchain_height.value
      this.blockHash = this._payload.entries.blockHash.value

      if (this._payload.entries.missing_txs) {
        const reader = new Reader(this._payload.entries.missing_txs.value)

        if (reader.length % 32) throw new Error('Error parsing txs')

        while (reader.unreadBytes > 0) {
          this.missingTransactions.push(reader.nextHash())
        }
      }

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    payload.entries.current_blockchain_height = { type: 0x06, value: this.currentBlockchainHeight }
    payload.entries.blockHash = { type: 0x0a, value: this.blockHash }

    const writer = new Writer()

    this.missingTransactions.forEach(hash => writer.writeHash(hash))

    payload.entries.missing_txs = { type: 0x0a, value: writer.blob }

    return payload.toString()
  }
}

class NewBlock extends LevinPayload {
  constructor (data) {
    super(data)

    this.block = { block: new Block(), transactions: [] }
    this.currentBlockchainHeight = 0
    this.hop = 0

    if (this._payload) {
      if (this._payload.entries.block) {
        const block = this._payload.entries.block.value

        const transactions = []

        if (block.entries.txs && Array.isArray(block.entries.txs.value)) {
          block.entries.txs.value.forEach(tx => transactions.push(new Transaction(tx)))
        }

        this.block = {
          block: new Block(block.entries.block.value),
          transactions: transactions
        }
      }

      this.currentBlockchainHeight = this._payload.entries.current_blockchain_height.value

      this.hop = this._payload.entries.hop.value

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    if (this.block) {
      const blockPayload = new PortableStorage()

      blockPayload.entries.block = { type: 0x0a, value: this.block.block.blob }

      if (this.block.transactions.length !== 0) {
        blockPayload.entries.txs = { type: 0x8a, value: [] }

        this.block.transactions.forEach(tx => blockPayload.entries.txs.value.push(tx.blob))
      }

      payload.entries.block = { type: 0x0c, value: blockPayload }
    }

    payload.entries.current_blockchain_height = { type: 0x06, value: this.currentBlockchainHeight }

    payload.entries.hop = { type: 0x06, value: this.hop }

    return payload.toString()
  }
}

class NewTransactions extends LevinPayload {
  constructor (data) {
    super(data)

    this.transactions = []

    if (this._payload) {
      this._payload.entries.txs.value.forEach(tx => {
        this.transactions.push(new Transaction(tx))
      })

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    payload.entries.txs = { type: 0x8a, value: [] }

    this.transactions.forEach(tx => payload.entries.txs.value.push(tx.blob))

    return payload.toString()
  }
}

class Ping extends LevinPayload {
  constructor (data) {
    super(data)

    this.status = ''
    this.peerId = '0000000000000000'

    if (this._payload) {
      if (this._payload.entries.status) this.status = Buffer.from(this._payload.entries.status.value, 'hex').toString()
      if (this._payload.entries.peer_id) this.peerId = this._payload.entries.peer_id.value

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    if (this.status.length !== 0) payload.entries.status = { type: 0x0a, value: Buffer.from(this.status).toString('hex') }
    if (this.peerId !== '0000000000000000') payload.entries.peer_id = { type: 0x05, value: this.peerId }

    return payload.toString()
  }
}

class RequestChain extends LevinPayload {
  constructor (data) {
    super(data)

    this.blockIds = []

    if (this._payload) {
      const reader = new Reader(this._payload.entries.block_ids.value)

      if (reader.length % 32 !== 0) throw new Error('Error parsing block_ids')

      while (reader.unreadBytes > 0) {
        this.blockIds.push(reader.nextHash())
      }

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    const writer = new Writer()

    this.blockIds.forEach(hash => writer.writeHash(hash))

    payload.entries.block_ids = { type: 0x0a, value: writer.blob }

    return payload.toString()
  }
}

class ResponseChainEntry extends LevinPayload {
  constructor (data) {
    super(data)

    this.startHeight = 0
    this.totalHeight = 0
    this.blockIds = []

    if (this._payload) {
      this.startHeight = this._payload.entries.start_height.value
      this.totalHeight = this._payload.entries.total_height.value

      const reader = new Reader(this._payload.entries.m_block_ids.value)

      if (reader.length % 32 !== 0) throw new Error('Error parsing block_ids')

      while (reader.unreadBytes > 0) {
        this.blockIds.push(reader.nextHash())
      }

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    payload.entries.start_height = { type: 0x06, value: this.startHeight }
    payload.entries.total_height = { type: 0x06, value: this.totalHeight }

    const writer = new Writer()

    this.blockIds.forEach(hash => writer.writeHash(hash))

    payload.entries.m_block_ids = { type: 0x0a, value: writer.blob }

    return payload.toString()
  }
}

class RequestGetObjects extends LevinPayload {
  constructor (data) {
    super(data)

    this.transactions = []
    this.blocks = []

    if (this._payload) {
      if (this._payload.entries.txs) {
        const reader = new Reader(this._payload.entries.txs.value)

        if (reader.length % 32) throw new Error('Error parsing transaction hashes')

        while (reader.unreadBytes > 0) {
          this.transactions.push(reader.nextHash())
        }
      }

      if (this._payload.entries.blocks) {
        const reader = new Reader(this._payload.entries.blocks.value)

        if (reader.length % 32) throw new Error('Error parsing block hashes')

        while (reader.unreadBytes > 0) {
          this.blocks.push(reader.nextHash())
        }
      }

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    if (Array.isArray(this.transactions) && this.transactions.length !== 0) {
      const writer = new Writer()

      this.transactions.forEach(tx => writer.writeHash(tx))

      payload.entries.txs = { type: 0x0a, value: writer.blob }
    }

    if (Array.isArray(this.blocks) && this.blocks.length !== 0) {
      const writer = new Writer()

      this.blocks.forEach(hash => writer.writeHash(hash))

      payload.entries.blocks = { type: 0x0a, value: writer.blob }
    }

    return payload.toString()
  }
}

class RequestTxPool extends LevinPayload {
  constructor (data) {
    super(data)

    this.transactions = []

    if (this._payload && this._payload.entries.txs) {
      const reader = new Reader(this._payload.entries.txs.value)

      if (reader.length % 32) throw new Error('Error parsing txs')

      while (reader.unreadBytes > 0) {
        this.transactions.push(reader.nextHash())
      }

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    const writer = new Writer()

    this.transactions.forEach(hash => writer.writeHash(hash))

    payload.entries.txs = { type: 0x0a, value: writer.blob }

    return payload.toString()
  }
}

class ResponseGetObjects extends LevinPayload {
  constructor (data) {
    super(data)

    this.transactions = []
    this.blocks = []
    this.missedIds = []
    this.currentBlockchainHeight = 0

    if (this._payload) {
      if (this._payload.entries.txs && Array.isArray(this._payload.entries.txs.value)) {
        this._payload.entries.txs.value.forEach(tx => {
          this.transactions.push(new Transaction(tx))
        })
      }

      if (this._payload.entries.blocks && Array.isArray(this._payload.entries.blocks.value)) {
        this._payload.entries.blocks.value.forEach(block => {
          const transactions = []

          if (block.entries.txs && Array.isArray(block.entries.txs.value)) {
            block.entries.txs.value.forEach(tx => transactions.push(new Transaction(tx)))
          }

          this.blocks.push({
            block: new Block(block.entries.block.value),
            transactions: transactions
          })
        })
      }

      if (this._payload.entries.missed_ids) {
        const reader = new Reader(this._payload.entries.missed_ids.value)

        if (reader.length % 32 !== 0) throw new Error('Error parsing missed_ids')

        while (reader.unreadBytes > 0) {
          this.missedIds.push(reader.nextHash())
        }
      }

      if (this._payload.entries.current_blockchain_height) this.currentBlockchainHeight = this._payload.entries.current_blockchain_height.value

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    if (Array.isArray(this.transactions) && this.transactions.length !== 0) {
      payload.entries.txs = { type: 0x8a, value: [] }

      this.transactions.forEach(tx => payload.entries.txs.value.push(tx.blob))
    }

    if (Array.isArray(this.blocks) && this.blocks.length !== 0) {
      payload.entries.blocks = { type: 0x8c, value: [] }

      this.blocks.forEach(obj => {
        const blockPayload = new PortableStorage()

        blockPayload.entries.block = { type: 0x0a, value: obj.block.blob }

        if (obj.transactions.length !== 0) {
          blockPayload.entries.txs = { type: 0x8a, value: [] }

          obj.transactions.forEach(tx => blockPayload.entries.txs.value.push(tx.blob))
        }

        payload.entries.blocks.value.push(blockPayload)
      })
    }

    if (Array.isArray(this.missedIds) && this.missedIds.length !== 0) {
      const writer = new Writer()

      this.missedIds.forEach(hash => writer.writeHash(hash))

      payload.entries.missed_ids = { type: 0x0a, value: writer.blob }
    }

    payload.entries.current_blockchain_height = { type: 0x06, value: this.currentBlockchainHeight }

    return payload.toString()
  }
}

class TimedSync extends LevinPayload {
  constructor (data) {
    super(data)

    this.localTime = '0000000000000000'
    this.payloadData = {
      currentHeight: 0,
      topId: '0000000000000000000000000000000000000000000000000000000000000000'
    }
    this.peerList = []

    if (this._payload) {
      if (this._payload.entries.local_time) {
        this.localTime = this._payload.entries.local_time.value
      }

      this.payloadData = {
        currentHeight: this._payload.entries.payload_data.value.entries.current_height.value,
        topId: this._payload.entries.payload_data.value.entries.top_id.value
      }

      if (this._payload.entries.local_peerlist) {
        this.peerList = deserializePeerList(this._payload.entries.local_peerlist.value)
      }

      delete this._payload
    }
  }

  toString () {
    const payload = new PortableStorage()

    if (this.localTime !== '0000000000000000') payload.entries.local_time = { type: 0x05, value: this.localTime }

    const payloadData = new PortableStorage()
    payloadData.entries.current_height = { type: 0x06, value: this.payloadData.currentHeight }
    payloadData.entries.top_id = { type: 0x0a, value: Buffer.from(this.payloadData.topId, 'hex') }
    payload.entries.payload_data = { type: 0x0c, value: payloadData }

    if (Array.isArray(this.peerList) && this.peerList.length !== 0) {
      payload.entries.local_peerlist = { type: 0x0a, value: serializePeerList(this.peerList) }
    }

    return payload.toString()
  }
}

function deserializePeerList (hex) {
  const peerListReader = new Reader(hex)

  if (peerListReader.length % 24 !== 0) throw new Error('Error parsing local_peerlist')

  const tmp = []
  while (peerListReader.unreadBytes > 0) {
    tmp.push({
      ip: int2ip(peerListReader.nextUInt32()),
      port: peerListReader.nextUInt32(),
      id: peerListReader.nextBytes(8).toString('hex'),
      last_seen: peerListReader.nextBytes(8).toString('hex')
    })
  }

  return tmp
}

function serializePeerList (peers) {
  const writer = new Writer()

  peers.forEach(peer => {
    writer.writeUInt32(ip2int(peer.ip))
    writer.writeUInt32(peer.port)
    writer.writeHex(peer.id)
    writer.writeHex(peer.last_seen)
  })

  return writer.blob
}

function int2ip (ipInt) {
  if (ipInt > 4294967295) throw new Error('Integer value exceeds 32-bit bounds')

  return ((ipInt >>> 24) + '.' + (ipInt >> 16 & 255) + '.' + (ipInt >> 8 & 255) + '.' + (ipInt & 255))
}

function ip2int (ip) {
  const tmp = ip.split('.')

  if (tmp.length !== 4) throw new Error('Does not appear to be a valid IP address')

  tmp.forEach(octet => {
    if (isNaN(octet)) throw new Error('Non-numeric value found in octet')

    if (parseInt(octet) > 255 || parseInt(octet) < 0) throw new Error('Invalid value found in octet')
  })

  return tmp.reduce(function (ipInt, octet) { return (ipInt << 8) + parseInt(octet, 10) }, 0) >>> 0
}

module.exports = {
  Handshake,
  LiteBlock,
  MissingTransactions,
  NewBlock,
  NewTransactions,
  RequestGetObjects,
  RequestTxPool,
  ResponseChainEntry,
  ResponseGetObjects,
  RequestChain,
  Ping,
  TimedSync
}
