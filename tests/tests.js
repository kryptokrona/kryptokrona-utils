// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const assert = require('assert')
const CryptoNoteUtils = require('../')

const config = require('../config.json')
const cnUtil = new CryptoNoteUtils(config)

const rawSeed = 'dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c'
const rawMnemonic = 'teeming taken piano ramped vegan jazz earth enjoy suture quick lied awkward ferry python often exotic cube hexagon ionic joyous cage abnormal hull jigsaw lied'

console.log('')
console.log('In Seed:          ', rawSeed)
console.log('In Mnemonic:      ', rawMnemonic)

const outputMnemonic = cnUtil.createAddressFromSeed(rawSeed)
const outputSeed = cnUtil.createAddressFromMnemonic(rawMnemonic)

console.log('')
console.log('Out Seed:         ', outputSeed.seed)
console.log('Out Mnemonic:     ', outputMnemonic.mnemonic)

assert(rawSeed === outputSeed.seed)
assert(rawMnemonic === outputMnemonic.mnemonic)

const testAddress = 'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX'
const testAddressRaw = '9df6ee01f71e440f9a5aab08dbdab0f4f36bba813660a0600f109b1371dc53be33f23c99f0ba225065e1b9c2e43165b3e41f10fcb768853126dfa7e612a3df2deb332492cc073a66'

console.log('')
console.log('In  Test Address: ', testAddress)
console.log('In  Raw Address:  ', testAddressRaw)

const outputAddress = cnUtil.encodeRawAddress(testAddressRaw)
const outputRaw = cnUtil.decodeAddress(testAddress)

console.log('')
console.log('Out Test Address: ', outputAddress)
console.log('Out Raw Address:  ', outputRaw.rawAddress)

assert(testAddressRaw === outputRaw.rawAddress)
assert(testAddress === outputAddress)

const newAddress = cnUtil.createNewAddress(testAddress, 'english')
const newAddressByKey = cnUtil.createAddressFromKeys(newAddress.spend.privateKey, newAddress.view.privateKey)

console.log('')
console.log('New Address: ', newAddress.address)
console.log('New Address Keys: ', newAddress.spend.privateKey, newAddress.view.privateKey)
console.log('New Address By Keys: ', newAddressByKey.address)

assert(newAddress.address === newAddressByKey.address)

console.log('')
console.log('Validating prefix detection for alternate chain...')
console.log('')

const athenaAddress = 'athena28QHa49cTHWjRLYN1XW46Xj8D2mPiu7bovQ67V4z1C84R16VSJvbHmD2Yfq5Yvw5GKVTnfuS5pX3LXH3LNPezfLhhe5Lc27'
const athenaPrefix = { prefix: 'ca9f97c218',
  base58: 'athena',
  decimal: 6581243850,
  hexadecimal: '18845cfca' }

const calculatedPrefix = cnUtil.decodeAddressPrefix(athenaAddress)

console.log('Athena Address: ', athenaAddress)
console.log('Athena Calculated Prefix: ', calculatedPrefix.base58)
assert(athenaPrefix.base58 === calculatedPrefix.base58)

console.log('Athena Calculated Raw Prefix: ', calculatedPrefix.decimal)
assert(athenaPrefix.decimal === calculatedPrefix.decimal)

const newAthenaAddress = cnUtil.encodeAddress(newAddress.view.publicKey, newAddress.spend.publicKey, false, athenaPrefix.decimal)
const newAthenaAddressByKey = cnUtil.createAddressFromKeys(newAddress.spend.privateKey, newAddress.view.privateKey, athenaPrefix.decimal)

console.log('New Athena Address: ', newAthenaAddress)
console.log('New Athena Address By Keys: ', newAthenaAddressByKey.address)

assert(newAthenaAddress === newAthenaAddressByKey.address)
