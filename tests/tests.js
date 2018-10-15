// Copyright (c) 2018, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const assert = require('assert')
const Base58 = require('../').Base58
const Mnemonics = require('../').Mnemonics
const CryptoNoteUtils = require('../').CryptoNoteUtils

const config = require('../config.json')
const cnUtil = new CryptoNoteUtils(config)

const rawSeed = 'dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c'
const rawMnemonic = 'teeming taken piano ramped vegan jazz earth enjoy suture quick lied awkward ferry python often exotic cube hexagon ionic joyous cage abnormal hull jigsaw lied'

console.log('')
console.log('In Seed:          ', rawSeed)
console.log('In Mnemonic:      ', rawMnemonic)

const outputMnemonic = Mnemonics.encode(rawSeed)
const outputSeed = Mnemonics.decode(rawMnemonic)

console.log('')
console.log('Out Seed:         ', outputSeed)
console.log('Out Mnemonic:     ', outputMnemonic)

assert(rawSeed === outputSeed)
assert(rawMnemonic === outputMnemonic)

const testAddress = 'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX'
const testAddressRaw = '9df6ee01f71e440f9a5aab08dbdab0f4f36bba813660a0600f109b1371dc53be33f23c99f0ba225065e1b9c2e43165b3e41f10fcb768853126dfa7e612a3df2deb332492cc073a66'

console.log('')
console.log('In  Test Address: ', testAddress)
console.log('In  Raw Address:  ', testAddressRaw)

const outputAddress = Base58.encode(testAddressRaw)
const outputRaw = Base58.decode(testAddress)

console.log('')
console.log('Out Test Address: ', outputAddress)
console.log('Out Raw Address:  ', outputRaw)

assert(testAddressRaw === outputRaw)
assert(testAddress === outputAddress)

const newAddress = cnUtil.createNewAddress(testAddress, 'english')

console.log('')
console.log(newAddress)

const keys = cnUtil.decode_address(newAddress.public_addr)

console.log('')
console.log(keys)
