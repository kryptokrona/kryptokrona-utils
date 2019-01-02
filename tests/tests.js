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

const testPrivateKey = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'
const testPublicKey = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac'

const derivedPublicKey = cnUtil.privateKeyToPublicKey(testPrivateKey)

console.log('')
console.log('In Test Private Key: ', testPrivateKey)
console.log('In Test Public Key: ', testPublicKey)
console.log('Out Derived Public Key: ', derivedPublicKey)

assert(derivedPublicKey === testPublicKey)

const mnemonicPrivateSpendKey = 'd504a4ed95d0534567ee8f6f3a5b846f5e7b5dee7cadf660485b1bfbc4fbbb0d'
const mnemonicPrivateViewKey = 'd84afbfbb76b2a16d6f9e869b9844a394aaf7d726b8f374f09d1d688cb81d001'
const mnemonicAddressByKey = cnUtil.createAddressFromKeys(mnemonicPrivateSpendKey, mnemonicPrivateViewKey)

console.log('')
console.log('In Mnemonic Private Spend Key: ', mnemonicPrivateSpendKey)
console.log('In Mnemonic Private View Key: ', mnemonicPrivateViewKey)
console.log('In Mnemonic Seed: ', mnemonicAddressByKey.mnemonic)

assert(mnemonicAddressByKey.mnemonic === 'gypsy guarded faulty jeers hazard paper equip dime oyster rotate hobby summon junk anchor wobbly baptism huge shyness july unplugs tumbling toolbox affair atom hazard')

const nonMnemonicPrivateSpendKey = '7a4a9a5b174e5713433fb5735a35b8fe8ce5bf411d5f6a587002e455a2b33703'
const nonMnemonicPrivateViewKey = '3c986487d9b85e979e4f30eca56558874d2792ec73326d7aa0b2cf24c099ad0f'
const nonMnemonicAddressByKey = cnUtil.createAddressFromKeys(nonMnemonicPrivateSpendKey, nonMnemonicPrivateViewKey)

console.log('')
console.log('In Non Mnemonic Private Spend Key: ', nonMnemonicPrivateSpendKey)
console.log('In Non Mnemonic Private View Key: ', nonMnemonicPrivateViewKey)
console.log('In Non Mnemonic Seed: ', nonMnemonicAddressByKey.mnemonic)

assert(nonMnemonicAddressByKey.mnemonic === null)

const keyImagePublicKey = 'de80940143b344f95bd09046a3c4afa77a1875e588cfa7905cda9d607c7ff0f5'
const keyImagePrivateKey = 'd2598f31daf1b3c515180d103cd9508139824d001f4260e42a297666305a7308'
const expectedKeyImage = '79668204508e0ca29820d1bc1bad4e988b71a3c7b007fe52735e1526e4f30217'
const keyImage = cnUtil.generateKeyImagePrimitive(keyImagePublicKey, keyImagePrivateKey)

console.log('')
console.log('Public Key: ', keyImagePublicKey)
console.log('Private Key: ', keyImagePrivateKey)
console.log('Key Image: ', keyImage)

assert(keyImage === expectedKeyImage)

var amount = 1234567
console.log('')
console.log('Creating outputs for amount %s to %s', amount, newAddress.address)
var transfers = cnUtil.createTransactionOutputs(newAddress.address, amount)
var amounts = []
transfers.forEach((elem) => {
  amounts.push(elem.amount)
})
console.log('Created %s outputs [%s]', transfers.length, amounts.join(','))

assert(transfers.length === 7)

amount = 101010
console.log('')
console.log('Creating outputs for amount %s to %s', amount, newAddress.address)
transfers = cnUtil.createTransactionOutputs(newAddress.address, amount)
amounts = []
transfers.forEach((elem) => {
  amounts.push(elem.amount)
})
console.log('Created %s outputs [%s]', transfers.length, amounts.join(','))

assert(transfers.length === 3)

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
