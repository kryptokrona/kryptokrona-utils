// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const assert = require('assert')
const LevinPacket = require('../').LevinPacket

const samplePacket = '0121010101010101560000000000000001ea030000000000000100000001000000011101010101020101040c7061796c6f61645f646174610c080e63757272656e745f686569676874060fce1b0006746f705f69640a80ba6aee8fe65ea9ef3c1618d5598e546e1806fb9561f4d3b518af2a001cbd5e2b'

const packet = new LevinPacket(samplePacket)

console.log('')
console.log('P2P Tests')
console.log('')
console.log('Input  Packet: ', samplePacket)
console.log('Output Packet: ', packet.blob)

assert(samplePacket === packet.blob)
