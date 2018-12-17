// Copyright (c) Lucas Jones
// Copyright (c) 2014-2017, MyMonero.com
// Copyright (c) 2016, Paul Shapiro
// Copyright (c) 2017, Luigi111
// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./lib/biginteger.js')
const Base58 = require('./lib/base58.js')
const CNCrypto = require('./lib/crypto.js')
const Mnemonic = require('./lib/mnemonic.js')
const NACL = require('./lib/nacl-fast-cn.js')
const Sha3 = require('./lib/sha3.js')
const VarintDecoder = require('varint-decoder')
const SecureRandomString = require('secure-random-string')
const Numeral = require('numeral')

const SIZES = {
  HASH: 64,
  KEY: 64,
  PAYMENTID_HEX: 64,
  CHECKSUM: 8,
  ECPOINT: 32,
  GEP3: 160,
  GEP2: 120,
  GEP1P1: 160,
  GECACHED: 160,
  ECSCALAR: 32,
  KEYIMAGE: 32,
  GEDSMP: 160 * 8,
  SIGNATURE: 64
}
const TX_EXTRA_NONCE_MAX_COUNT = 255
const TX_EXTRA_TAGS = {
  PADDING: '00',
  PUBKEY: '01',
  NONCE: '02',
  MERGE_MINING: '03'
}
const TX_EXTRA_NONCE_TAGS = {
  PAYMENT_ID: '00',
  ENCRYPTED_PAYMENT_ID: '01'
}
const UINT64_MAX = BigInteger(2).pow(64)
const CURRENT_TX_VERSION = 1

function CryptoNote (config) {
  config = config || require('./config.json')
  if (!(this instanceof CryptoNote)) return new CryptoNote(config)
  this.config = config
}

/* These are our exposed functions */

CryptoNote.prototype.createNewSeed = function (entropy) {
  /* If you don't supply us with entropy, we'll go find our own */
  entropy = entropy || SecureRandomString({ length: 256 })

  /* We're going to take that entropy, throw a random value on
     to it, feed it through a poor very simple PBKDF2 implementation
     to create a seed using the supplied entropy */
  return scReduce32(simpleKdf(entropy + rand32()))
}

CryptoNote.prototype.createNewAddress = function (entropy, lang) {
  /* Let's create our new seed */
  const seed = this.createNewSeed(entropy)

  /* Using that seed, let's create our new CryptoNote address */
  return this.createAddressFromSeed(seed, lang)
}

CryptoNote.prototype.createAddressFromSeed = function (seed, lang) {
  /* When we have a seed, then we can create a new key
     pair based on that seed */
  lang = lang || 'english'
  var keys = {}

  /* First we create the spend key pair; however,
     if the seed we were supplied isn't 64 characters
     long, we'll pass it through the CN Fast Hash function
     to turn it into 64 characters */
  var first = seed
  if (first.length !== 64) {
    first = cnFastHash(seed)
  }
  keys.spend = generateKeys(first)

  /* If our seed was less than 64 characters, then we
     hash our seed again to get us the necessary data
     to compute our view key pair; otherwise, we use
     the privateSpendKey we just created */
  var second
  if (seed.length !== 64) {
    second = cnFastHash(first)
  } else {
    second = cnFastHash(keys.spend.privateKey)
  }
  keys.view = generateKeys(second)

  /* Once we have our keys, then we can encode the public keys
     out of our view and spend pairs to create our public address */
  keys.address = this.encodeAddress(keys.view.publicKey, keys.spend.publicKey)

  /* As we know the seed, we can encode it to a mnemonic string */
  keys.mnemonic = Mnemonic.encode(seed, lang)

  /* Put the seed in there for good measure */
  keys.seed = seed

  return keys
}

CryptoNote.prototype.createAddressFromMnemonic = function (mnemonic, lang) {
  /* The mnemonic is just a string representation of the seed
     that was initially used to create our key set */
  lang = lang || 'english'
  const seed = Mnemonic.decode(mnemonic, lang)

  /* As long as we have the seed we can recreate the key pairs
     pretty easily */
  return this.createAddressFromSeed(seed, lang)
}

CryptoNote.prototype.createAddressFromKeys = function (privateSpendKey, privateViewKey) {
  /* We have our private keys so we can generate everything for use
     later except the mnemonic as we don't have the seed */
  const keys = {
    spend: {
      privateKey: privateSpendKey,
      publicKey: privateKeyToPublicKey(privateSpendKey)
    },
    view: {
      privateKey: privateViewKey,
      publicKey: privateKeyToPublicKey(privateViewKey)
    },
    address: '',
    mnemonic: null,
    seed: null
  }

  /* As we now have all of our keys, we can find out what our
     public address is */
  keys.address = this.encodeAddress(keys.view.publicKey, keys.spend.publicKey)

  return keys
}

CryptoNote.prototype.decodeAddressPrefix = function (address) {
  /* First we decode the address from Base58 into the raw address */
  var decodedAddress = Base58.decode(address)

  /* Now we need to work in reverse, starting with chopping off
     the checksum which is always the same */
  decodedAddress = decodedAddress.slice(0, -(SIZES.CHECKSUM))

  /* Now we find out how many extra characters there are
     in what's left after we find all of the keys in the address.
     Remember, this works because payment IDs are the same size as keys */
  var prefixLength = decodedAddress.length % SIZES.KEY

  var prefixDecoded = decodedAddress.slice(0, prefixLength)
  var prefixVarint = decodeVarint(prefixDecoded)

  /* This block of code is a hack to figure out what the human readable
     address prefix is. While it has been tested with a few different
     cryptonote addresses from different projects, it is by no means
     guaranteed to work with every project. The reason for this is that
     due to the block encoding used in Base58, it's nearly impossible
     to reliably find out the Base58 version of just the prefix as it
     is not actually long enough to be encoded on its own and get the
     prefix we expect. */

  /* First we need the need to know how long the varint representation
     of the prefix is, we're going to need it later */
  var prefixVarintLength = prefixVarint.toString().length

  /* This is where it starts to get funny. If the length is an even
     number of characters, we'll need to grab the one extra character
     from the address we passed in to get the prefix that we all know
     and love */
  var offset = (prefixVarintLength % 2 === 0) ? 1 : 0

  /* Using all of that above, we can chop off the first couple of
     characters from the supplied address and get something that looks
     like the Base58 prefix we expected. */
  var prefixEncoded = address.slice(0, Math.ceil(prefixVarintLength / 2) + offset)

  return {
    prefix: prefixDecoded,
    base58: prefixEncoded,
    decimal: prefixVarint,
    hexadecimal: prefixVarint.toString(16)
  }
}

CryptoNote.prototype.decodeAddress = function (address, addressPrefix) {
  addressPrefix = addressPrefix || this.config.addressPrefix

  /* First, we decode the base58 string to hex */
  var decodedAddress = Base58.decode(address)

  /* We need to encode the address prefix from our config
     so that we can compare it later */
  const encodedPrefix = encodeVarint(addressPrefix)

  /* Let's chop off the prefix from the address we decoded */
  var prefix = decodedAddress.slice(0, encodedPrefix.length)

  /* Do they match? They better... */
  if (prefix !== encodedPrefix) {
    throw new Error('Invalid address prefix')
  }

  /* We don't need the prefix in our working space any more */
  decodedAddress = decodedAddress.slice(encodedPrefix.length)

  var paymentId = ''

  /* If the decoded address is longer than a
    public spend key + public view key + checksum
    then it's very likely an integrated address and as
    such, we need to get the payment ID out of there for
    use later otherwise the resulting data does not make
    any sense whatsoever */
  if (decodedAddress.length > ((SIZES.KEY * 2) + SIZES.CHECKSUM)) {
    paymentId = decodedAddress.slice(0, (SIZES.KEY * 2))
    decodedAddress = decodedAddress.slice((SIZES.KEY * 2))
  }

  /* Finish decomposing the decoded address */
  const publicSpend = decodedAddress.slice(0, SIZES.KEY)
  const publicView = decodedAddress.slice(SIZES.KEY, (SIZES.KEY * 2))
  const expectedCheckum = decodedAddress.slice(-(SIZES.CHECKSUM))

  var checksum
  /* Calculate our address checksum */
  if (paymentId.length === 0) {
    /* If there is no payment ID it's pretty simple */
    checksum = cnFastHash(prefix + publicSpend + publicView).slice(0, SIZES.CHECKSUM)
  } else {
    /* If there is a payment ID it's pretty simple as well */
    checksum = cnFastHash(prefix + paymentId + publicSpend + publicView).slice(0, SIZES.CHECKSUM)

    /* As goofy as this sounds, we need to convert the payment
       ID from hex into a string representation so that it returns
       to a human readable form */
    paymentId = Base58.hextostr(paymentId)
  }

  /* If the checksum we found in the address doesn't match the
     checksum that we just computed, then the address is bad */
  if (expectedCheckum !== checksum) {
    throw new Error('Could not parse address: checksum mismatch')
  }

  return {
    publicViewKey: publicView,
    publicSpendKey: publicSpend,
    paymentId: paymentId,
    encodedPrefix: prefix,
    prefix: addressPrefix,
    rawAddress: Base58.decode(address)
  }
}

CryptoNote.prototype.encodeRawAddress = function (rawAddress) {
  return Base58.encode(rawAddress)
}

CryptoNote.prototype.encodeAddress = function (publicViewKey, publicSpendKey, paymentId, addressPrefix) {
  addressPrefix = addressPrefix || this.config.addressPrefix
  paymentId = paymentId || false

  if (!isHex64(publicViewKey)) {
    throw new Error('Invalid public view key format')
  }

  if (!isHex64(publicSpendKey)) {
    throw new Error('Invalid public spend key format')
  }

  /* If we included a payment ID it needs to be
     64 hexadecimal characters */
  if (paymentId && !isHex64(paymentId)) {
    throw new Error('Invalid payment ID format')
  }

  var rawAddress = []

  /* Encode our configured address prefix so that we can throw
     it on the front of our address */
  const encodedPrefix = encodeVarint(addressPrefix)
  rawAddress.push(encodedPrefix)

  /* Is there a payment ID? If so, that comes next */
  if (paymentId) {
    paymentId = Base58.strtohex(paymentId)
    rawAddress.push(paymentId)
  }

  /* Then toss on our publicSpendKey followed by our public
     view key */
  rawAddress.push(publicSpendKey.toString())
  rawAddress.push(publicViewKey.toString())
  rawAddress = rawAddress.join('')

  /* Generate the checksum and toss that on the end */
  const checksum = cnFastHash(rawAddress).slice(0, 8)
  rawAddress += checksum

  /* Finally, encode all that to Base58 */
  return Base58.encode(rawAddress)
}

CryptoNote.prototype.createIntegratedAddress = function (address, paymentId) {
  /* Decode our address */
  var addr = this.decodeAddress(address)
  /* Encode the address but this time include the payment ID */
  return this.encodeAddress(addr.publicViewKey, addr.publicSpendKey, paymentId)
}

CryptoNote.prototype.scanTransactionOutputs = function (transactionPublicKey, outputs, privateViewKey, publicSpendKey, privateSpendKey) {
  /* Given the transaction public key and the array of outputs, let's see if
     any of the outputs belong to us */

  var ourOutputs = []

  for (var i = 0; i < outputs.length; i++) {
    var output = outputs[i]

    /* Check to see if this output belongs to us */
    var ourOutput = this.isOurTransactionOutput(transactionPublicKey, output, privateViewKey, publicSpendKey, privateSpendKey)
    if (ourOutput) {
      ourOutputs.push(ourOutput)
    }
  }

  return ourOutputs
}

CryptoNote.prototype.isOurTransactionOutput = function (transactionPublicKey, output, privateViewKey, publicSpendKey, privateSpendKey) {
  privateSpendKey = privateSpendKey || false
  output = output || {}

  if (!isHex64(transactionPublicKey)) {
    throw new Error('Invalid transaction public key format')
  }

  if (!isHex64(privateViewKey)) {
    throw new Error('Invalid private view key format')
  }

  if (!isHex64(publicSpendKey)) {
    throw new Error('Invalid public spend key format')
  }

  if (privateSpendKey && !isHex64(privateSpendKey)) {
    throw new Error('Invalid private spend key format')
  }

  if (typeof output.index === 'undefined' || typeof output.key === 'undefined') {
    throw new Error('Output object not of correct type')
  }

  /* Generate the key deriviation from the random transaction public key and our private view key */
  const derivedKey = generateKeyDerivation(transactionPublicKey, privateViewKey)

  /* Derive the transfer public key from the derived key, the output index, and our public spend key */
  const publicEphemeral = derivePublicKey(derivedKey, output.index, publicSpendKey)

  /* If the derived transfer public key matches the output key then this output belongs to us */
  if (output.key === publicEphemeral) {
    output.input = {}
    output.input.publicEphemeral = publicEphemeral

    if (privateSpendKey) {
      /* Derive the key image private key from the derived key, the output index, and our spend secret key */
      const privateEphemeral = deriveSecretKey(derivedKey, output.index, privateSpendKey)

      /* Generate the key image */
      const keyImage = generateKeyImage(publicEphemeral, privateEphemeral)

      output.input.privateEphemeral = privateEphemeral
      output.keyImage = keyImage
    }

    return output
  }

  return false
}

CryptoNote.prototype.generateKeyImage = function (transactionPublicKey, privateViewKey, publicSpendKey, privateSpendKey, outputIndex) {
  if (!isHex64(transactionPublicKey)) {
    throw new Error('Invalid transaction public key format')
  }

  if (!isHex64(privateViewKey)) {
    throw new Error('Invalid private view key format')
  }

  if (!isHex64(publicSpendKey)) {
    throw new Error('Invalid public spend key format')
  }

  if (!isHex64(privateSpendKey)) {
    throw new Error('Invalid private spend key format')
  }

  /* Generate the key deriviation from the random transaction public key and our private view key */
  const recvDerivation = generateKeyDerivation(transactionPublicKey, privateViewKey)

  /* Derive the transfer public key from the derived key, the output index, and our public spend key */
  const publicEphemeral = derivePublicKey(recvDerivation, outputIndex, publicSpendKey)

  /* Derive the key image private key from the derived key, the output index, and our spend secret key */
  const privateEphemeral = deriveSecretKey(recvDerivation, outputIndex, privateSpendKey)

  /* Generate the key image */
  const keyImage = generateKeyImage(publicEphemeral, privateEphemeral)

  return {
    input: {
      publicEphemeral: publicEphemeral,
      privateEphemeral: privateEphemeral
    },
    keyImage: keyImage
  }
}

CryptoNote.prototype.createTransaction = function (ourKeys, transfers, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime) {
  return createTransaction(ourKeys, transfers, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime)
}

CryptoNote.prototype.serializeTransaction = function (transaction) {
  return serializeTransaction(transaction, false)
}

CryptoNote.prototype.formatMoney = function (amount) {
  var places = ''
  for (var i = 0; i < this.config.coinUnitPlaces; i++) {
    places += '0'
  }
  return Numeral(amount / Math.pow(10, this.config.coinUnitPlaces)).format('0,0.' + places)
}

/* Internal support functions */
function isHex (str) {
  const regex = new RegExp('^[0-9a-fA-F]{' + str.length + '}$')
  return regex.test(str)
}

function isHex64 (str) {
  const regex = new RegExp('^[0-9a-fA-F]{64}$')
  return regex.test(str)
}

function swapEndian (hex) {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string length must be a multiple of 2!')
  }
  var result = ''

  var loopCount = hex.length / 2
  for (var i = 1; i <= loopCount; i++) {
    result += hex.substr(0 - 2 * i, 2)
  }

  return result
}

/*
function swapEndianC (str) {
  var result = ''

  for (var i = 1; i <= str.length; i++) {
    result += str.substr(0 - i, 1)
  }
  return result
}
*/

function d2h (integer) {
  if (typeof integer !== 'string' && integer.toString().length > 15) {
    throw new Error('Integer should be entered as a string for precision')
  }

  var padding = ''
  for (var i = 0; i < 64; i++) {
    padding += '0'
  }

  const result = (padding + BigInteger(integer).toString(16).toLowerCase()).slice(-(SIZES.KEY))
  return result
}

function d2s (integer) {
  return swapEndian(d2h(integer))
}

/*
function d2b (integer) {
  if (typeof integer !== 'string' && integer.toString().length > 15) {
    throw new Error('Integer should be entered as a string for precision')
  }

  var padding = ''
  for (var i = 0; i < 64; i++) {
    padding += '0'
  }

  var a = BigInteger(integer)
  if (a.toString(2).length > 64) {
    throw new Error('Amount overflows uint64')
  }

  return swapEndianC((padding + a.toString(2)).slice(-(SIZES.KEY)))
}
*/

/*
function s2d (scalar) {
  return BigInteger.parse(swapEndian(scalar), 16).toString()
}
*/

function hex2bin (hex) {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string has invalid length')
  }

  var result = new Uint8Array(hex.length / 2)
  var hexLength = hex.length / 2
  for (var i = 0; i < hexLength; i++) {
    result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }

  return result
}

function bin2hex (bin) {
  var result = []
  for (var i = 0; i < bin.length; ++i) {
    result.push(('0' + bin[i].toString(16)).slice(-2))
  }

  return result.join('')
}

function str2bin (str) {
  var result = new Uint8Array(str.length)
  for (var i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i)
  }

  return result
}

/*
function bin2str (bin) {
  var result = []
  for (var i = 0; i < bin.length; i++) {
    result.push(String.fromCharCode(bin[i]))
  }

  return result.join('')
}
*/

function rand32 () {
  /* Go get 256-bits (32 bytes) of random data */
  return Mnemonic.random(256)
}

/*
function rand16 () {
  /* Go get 128-bits (16 bytes) of random data */
/*
  return Mnemonic.random(128)
}
*/

/*
function rand8 () {
  /* Go get 64-bits (8 bytes) of random data */
/*
  return Mnemonic.random(64)
}
*/

function encodeVarint (i) {
  i = BigInteger(i)

  var result = ''
  while (i.compare(0x80) >= 0) {
    result += ('0' + ((i.lowVal() & 0x7f) | 0x80).toString(16)).slice(-2)
    i = i.divide(BigInteger(2).pow(7))
  }
  result += ('0' + i.toJSValue().toString(16)).slice(-2)

  return result
}

function decodeVarint (hex) {
  const buffer = Buffer.from(hex, 'hex')
  return parseInt(VarintDecoder(buffer))
}

function scReduce (hex, size) {
  size = size || 64
  var input = hex2bin(hex)
  if (input.length !== size) {
    throw new Error('Invalid input length')
  }

  var memory = CNCrypto._malloc(size)
  CNCrypto.HEAPU8.set(input, memory)
  CNCrypto.ccall('sc_reduce32', 'void', ['number'], [memory])

  var result = CNCrypto.HEAPU8.subarray(memory, memory + size)
  CNCrypto._free(memory)

  return bin2hex(result)
}

function scReduce32 (hex) {
  return scReduce(hex, 32)
}

/*
function scReduce64 (hex) {
  return scReduce(hex, 64)
}
*/

function geScalarMult (publicKey, privateKey) {
  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  return bin2hex(NACL.ll.geScalarmult(hex2bin(publicKey), hex2bin(privateKey)))
}

function getScalarMultBase (privateKey) {
  return privateKeyToPublicKey(privateKey)
}

function generateKeyDerivation (publicKey, privateKey) {
  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  var p = geScalarMult(publicKey, privateKey)
  return geScalarMult(p, d2s(8))
}

function derivePublicKey (derivation, outputIndex, publicKey) {
  if (derivation.length !== (SIZES.ECPOINT * 2)) {
    throw new Error('Invalid derivation length')
  }

  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  var s = derivationToScalar(derivation, outputIndex)
  return bin2hex(NACL.ll.geAdd(hex2bin(publicKey), hex2bin(getScalarMultBase(s))))
}

function deriveSecretKey (derivation, outputIndex, privateKey) {
  if (derivation.length !== (SIZES.ECPOINT * 2)) {
    throw new Error('Invalid derivation length')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  var m = CNCrypto._malloc(SIZES.ECSCALAR)
  var b = hex2bin(derivationToScalar(derivation, outputIndex))
  CNCrypto.HEAPU8.set(b, m)

  var baseM = CNCrypto._malloc(SIZES.ECSCALAR)
  CNCrypto.HEAPU8.set(hex2bin(privateKey), baseM)

  var derivedM = CNCrypto._malloc(SIZES.ECSCALAR)
  CNCrypto.ccall('sc_add', 'void', ['number', 'number', 'number'], [derivedM, baseM, m])

  var result = CNCrypto.HEAPU8.subarray(derivedM, derivedM + SIZES.ECSCALAR)
  CNCrypto._free(m)
  CNCrypto._free(baseM)
  CNCrypto._free(derivedM)

  return bin2hex(result)
}

function generateKeyImage (publicKey, privateKey) {
  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  var pubM = CNCrypto._malloc(SIZES.KEYIMAGE)
  var secM = CNCrypto._malloc(SIZES.KEYIMAGE)
  CNCrypto.HEAPU8.set(hex2bin(publicKey), pubM)
  CNCrypto.HEAPU8.set(hex2bin(privateKey), secM)

  if (CNCrypto.ccall('sc_check', 'number', ['number'], [secM]) !== 0) {
    throw new Error('sc_check(privateKey) != 0')
  }

  var pointM = CNCrypto._malloc(SIZES.GEP3)
  var point2M = CNCrypto._malloc(SIZES.GEP2)
  var pointB = hex2bin(hashToEc(publicKey))
  CNCrypto.HEAPU8.set(pointB, pointM)

  var imageM = CNCrypto._malloc(SIZES.KEYIMAGE)
  CNCrypto.ccall('ge_scalarmult', 'void', ['number', 'number', 'number'], [point2M, secM, pointM])
  CNCrypto.ccall('ge_tobytes', 'void', ['number', 'number'], [imageM, point2M])

  var result = CNCrypto.HEAPU8.subarray(imageM, imageM + SIZES.KEYIMAGE)
  CNCrypto._free(pubM)
  CNCrypto._free(secM)
  CNCrypto._free(pointM)
  CNCrypto._free(point2M)
  CNCrypto._free(imageM)

  return bin2hex(result)
}

function hashToScalar (buf) {
  const hash = cnFastHash(buf)
  return scReduce32(hash)
}

function derivationToScalar (derivation, outputIndex) {
  var buf = ''

  if (derivation.length !== (SIZES.ECPOINT * 2)) {
    throw new Error('Invalid derivation length')
  }

  buf += derivation

  var enc = encodeVarint(outputIndex)
  if (enc.length > (10 * 2)) {
    throw new Error('outputIndex does not fit in 64-bit varint')
  }

  buf += enc
  return hashToScalar(buf)
}

function privateKeyToPublicKey (privateKey) {
  if (privateKey.length !== SIZES.KEY) {
    throw new Error('Invalid secret key length')
  }

  return bin2hex(NACL.ll.geScalarmultBase(hex2bin(privateKey)))
}

function cnFastHash (input) {
  if (input.length % 2 !== 0 || !isHex(input)) {
    throw new Error('Invalid input')
  }

  return Sha3.keccak_256(hex2bin(input))
}

function simpleKdf (str) {
  /* This is a very simple implementation of a
     psuedo PBKDF2 function */
  var hex = bin2hex(str2bin(str))
  for (var n = 0; n < 10000; ++n) {
    hex = Sha3.keccak_256(hex2bin(hex))
  }
  return hex
}

function hashToEc (key) {
  if (key.length !== (SIZES.KEY)) {
    throw new Error('Invalid key length')
  }

  var hM = CNCrypto._malloc(SIZES.KEYIMAGE)
  var pointM = CNCrypto._malloc(SIZES.GEP2)
  var point2M = CNCrypto._malloc(SIZES.GEP1P1)
  var resM = CNCrypto._malloc(SIZES.GEP3)
  var hash = hex2bin(cnFastHash(key, SIZES.KEYIMAGE))
  CNCrypto.HEAPU8.set(hash, hM)
  CNCrypto.ccall('ge_fromfe_frombytes_vartime', 'void', ['number', 'number'], [pointM, hM])
  CNCrypto.ccall('ge_mul8', 'void', ['number', 'number'], [point2M, pointM])
  CNCrypto.ccall('ge_p1p1_to_p3', 'void', ['number', 'number'], [resM, point2M])

  var result = CNCrypto.HEAPU8.subarray(resM, resM + SIZES.GEP3)
  CNCrypto._free(hM)
  CNCrypto._free(pointM)
  CNCrypto._free(point2M)
  CNCrypto._free(resM)

  return bin2hex(result)
}

function generateKeys (seed) {
  if (seed.length !== 64) {
    throw new Error('Invalid seed length')
  }

  var privateKey = scReduce32(seed)
  var publicKey = privateKeyToPublicKey(privateKey)

  return {
    privateKey: privateKey,
    publicKey: publicKey
  }
}

function randomKeypair () {
  /* Generate a random key pair */
  return generateKeys(rand32())
}

function randomScalar () {
  return scReduce32(rand32())
}

/* This method calculates our relative offset positions for
   the globalIndexes for inclusion in a new transaction */
function absoluteToRelativeOffsets (offsets) {
  if (offsets.length === 0) {
    return offsets
  }

  for (var i = offsets.length - 1; i >= 1; --i) {
    offsets[i] = BigInteger(offsets[i]).subtract(offsets[i - 1]).toString()
  }

  return offsets
}

function addTransactionPublicKeyToExtra (extra, transactionPublicKey) {
  if (!isHex64(transactionPublicKey)) {
    throw new Error('Invalid Transaction Public Key Format')
  }

  extra += TX_EXTRA_TAGS.PUBKEY
  extra += transactionPublicKey

  return extra
}

function getPaymentIdNonce (paymentId) {
  if (!isHex64(paymentId)) {
    throw new Error('Payment ID must be 64 hexadecimal characters')
  }

  return TX_EXTRA_NONCE_TAGS.PAYMENT_ID + paymentId
}

function addNonceToExtra (extra, nonce) {
  if ((nonce.length % 2) !== 0) {
    throw new Error('Invalid extra nonce')
  }

  if ((nonce.length / 2) > TX_EXTRA_NONCE_MAX_COUNT) {
    throw new Error('Extra nonce must be at most ' + TX_EXTRA_NONCE_MAX_COUNT + ' bytes')
  }

  /* Add the NONCE tag */
  extra += TX_EXTRA_TAGS.NONCE

  /* Encode the length of the NONCE */
  extra += ('0' + (nonce.length / 2).toString(16)).slice(-2)

  /* Add the NONCE */
  extra += nonce

  return extra
}

function generateRingSignature (transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex) {
  if (!isHex64(keyImage)) {
    throw new Error('Invalid Key Image format')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  if (!isHex64(transactionPrefixHash)) {
    throw new Error('Invalid transaction prefix hash format')
  }

  if (realIndex >= inputKeys.length || realIndex < 0) {
    throw new Error('Invalid realIndex supplied')
  }

  /* Set up our external methods */
  const _GeToBytes = CNCrypto.cwrap('ge_tobytes', 'void', ['number', 'number'])
  const _geP3ToBytes = CNCrypto.cwrap('ge_p3_tobytes', 'void', ['number', 'number'])
  const _GeScalarmultBase = CNCrypto.cwrap('ge_scalarmult_base', 'void', ['number', 'number'])
  const _GeScalarmult = CNCrypto.cwrap('ge_scalarmult', 'void', ['number', 'number', 'number'])
  const _ScAdd = CNCrypto.cwrap('sc_add', 'void', ['number', 'number', 'number'])
  const _ScSub = CNCrypto.cwrap('sc_sub', 'void', ['number', 'number', 'number'])
  const _ScMulsub = CNCrypto.cwrap('sc_mulsub', 'void', ['number', 'number', 'number', 'number'])
  const _Sc0 = CNCrypto.cwrap('sc_0', 'void', ['number'])
  const _GeDoubleScalarmultBaseVartime = CNCrypto.cwrap('ge_double_scalarmult_base_vartime', 'void', ['number', 'number', 'number', 'number'])
  const _GeDoubleScalarmultPrecompVartime = CNCrypto.cwrap('ge_double_scalarmult_precomp_vartime', 'void', ['number', 'number', 'number', 'number', 'number'])
  const _GeFrombytesVartime = CNCrypto.cwrap('ge_frombytes_vartime', 'number', ['number', 'number'])
  const _GeDsmPrecomp = CNCrypto.cwrap('ge_dsm_precomp', 'void', ['number', 'number'])

  /* Allocate space for our keys */
  const bufSize = SIZES.ECPOINT * 2 * inputKeys.length
  var bufM = CNCrypto._malloc(bufSize)

  /* Allocate space for the signatures */
  const sigSize = SIZES.SIGNATURE * inputKeys.length
  var sigM = CNCrypto._malloc(sigSize)

  /* Struct pointer helper functions */
  function bufA (i) {
    return bufM + SIZES.ECPOINT * (2 * i)
  }
  function bufB (i) {
    return bufM + SIZES.ECPOINT * (2 * i)
  }
  function sigC (i) {
    return sigM + SIZES.ECSCALAR * (2 * i)
  }
  function sigR (i) {
    return sigM + SIZES.ECSCALAR * (2 * i + 1)
  }

  /* Now we start allocating a whole bunch of memory */
  var imageM = CNCrypto._malloc(SIZES.KEY_IMAGE)
  CNCrypto.HEAPU8.set(hex2bin(keyImage), imageM)
  var i
  var imageUnpM = CNCrypto._malloc(SIZES.GE_P3)
  var imagePreM = CNCrypto._malloc(SIZES.GE_DSMP)
  var sumM = CNCrypto._malloc(SIZES.EC_SCALAR)
  var kM = CNCrypto._malloc(SIZES.EC_SCALAR)
  var hM = CNCrypto._malloc(SIZES.EC_SCALAR)
  var tmp2M = CNCrypto._malloc(SIZES.GE_P2)
  var tmp3M = CNCrypto._malloc(SIZES.GE_P3)
  var pubM = CNCrypto._malloc(SIZES.KEYIMAGE)
  var secM = CNCrypto._malloc(SIZES.KEYIMAGE)
  CNCrypto.HEAPU8.set(hex2bin(privateKey), secM)
  if (_GeFrombytesVartime(imageUnpM, imageM) !== 0) {
    throw new Error('failed to call ge_frombytes_vartime')
  }
  _GeDsmPrecomp(imagePreM, imageUnpM)
  _Sc0(sumM)

  /* Loop through the input keys so that we can start
     signing all of them */
  for (i = 0; i < inputKeys.length; i++) {
    if (i === realIndex) {
      /* This is our real input */
      var rand = randomScalar()
      CNCrypto.HEAPU8.set(hex2bin(rand), kM)
      _GeScalarmultBase(tmp3M, kM)
      _geP3ToBytes(bufA(i), tmp3M)
      var ec = hashToEc(inputKeys[i])
      CNCrypto.HEAPU8.set(hex2bin(ec), tmp3M)
      _GeScalarmult(tmp2M, kM, tmp3M)
      _GeToBytes(bufB(i), tmp2M)
    } else {
      /* These are fake inputs */
      CNCrypto.HEAPU8.set(hex2bin(randomScalar()), sigC(i))
      CNCrypto.HEAPU8.set(hex2bin(randomScalar()), sigR(i))
      CNCrypto.HEAPU8.set(hex2bin(inputKeys[i]), pubM)

      if (CNCrypto.ccall('ge_frombytes_vartime', 'void', ['number', 'number'], [tmp3M, pubM]) !== 0) {
        throw new Error('Failed to call ge_frombytes_vartime')
      }

      _GeDoubleScalarmultBaseVartime(tmp2M, sigC(i), tmp3M, sigR(i))
      _GeToBytes(bufA(i), tmp2M)
      ec = hashToEc(inputKeys[i])
      CNCrypto.HEAPU8.set(hex2bin(ec), tmp3M)
      _GeDoubleScalarmultPrecompVartime(tmp2M, sigR(i), tmp3M, sigC(i), imagePreM)
      _GeToBytes(bufB(i), tmp2M)
      _ScAdd(sumM, sumM, sigC(i))
    }
  }

  /* Now that they are all signed let's get this organized */
  var bufBin = CNCrypto.HEAPU8.subarray(bufM, bufM + bufSize)
  var scalar = hashToScalar(transactionPrefixHash + bin2hex(bufBin))
  CNCrypto.HEAPU8.set(hex2bin(scalar), hM)
  _ScSub(sigC(realIndex), hM, sumM)
  _ScMulsub(sigR(realIndex), sigC(realIndex), secM, kM)
  var sigData = bin2hex(CNCrypto.HEAPU8.subarray(sigM, sigM + sigSize))
  var sigs = []

  /* Push our signatures in place for each one of the inputs */
  for (var k = 0; k < inputKeys.length; k++) {
    sigs.push(sigData.slice(SIZES.SIGNATURE * 2 * k, SIZES.SIGNATURE * 2 * (k + 1)))
  }

  /* Free the memory we allocated */
  CNCrypto._free(imageM)
  CNCrypto._free(imageUnpM)
  CNCrypto._free(imagePreM)
  CNCrypto._free(sumM)
  CNCrypto._free(kM)
  CNCrypto._free(hM)
  CNCrypto._free(tmp2M)
  CNCrypto._free(tmp3M)
  CNCrypto._free(bufM)
  CNCrypto._free(sigM)
  CNCrypto._free(pubM)
  CNCrypto._free(secM)

  return sigs
}

function isValidKeys (publicViewKey, privateViewKey, publicSpendKey, privateSpendKey) {
  /* Let's create our own copies of the public keys based on the supplied
     private keys and then compare them to what we were given */
  var expectedPublicViewKey = privateKeyToPublicKey(privateViewKey)
  var expectedPublicSpendKey = privateKeyToPublicKey(privateSpendKey)
  return ((expectedPublicSpendKey === publicSpendKey) && (expectedPublicViewKey === publicViewKey))
}

function createTransaction (ourKeys, transfers, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime) {
  unlockTime = unlockTime || 0
  randomOuts = randomOuts || []

  /* Make sure that we're actually trying to send somewhere */
  if (transfers.length === 0) {
    throw new Error('No transfers specified')
  }

  /* We need at least as many sets of random outputs as we have our own
     outputs to be able to generate the requested ring size */
  if (randomOuts.length !== ourOutputs.length && mixin !== 0) {
    throw new Error('Not enough mixins supplied with transaction')
  }

  /* Loop through each set of random outputs and make sure that
     we got enough back to be able to generate the requested ring
     size for each amount */
  for (var i = 0; i < randomOuts.length; i++) {
    if ((randomOuts[i].outputs || []).length < mixin) {
      throw new Error('Not enough outputs to mix with')
    }
  }

  /* Check to make sure that we have a valid set of keys */
  if (!isValidKeys(ourKeys.view.publicKey, ourKeys.view.privateKey, ourKeys.spend.publicKey, ourKeys.spend.privateKey)) {
    throw new Error('Invalid keys supplied')
  }

  /* Check to make sure that we're not sending more money than
     is actually possible considering a 64-bit number */
  var neededMoney = BigInteger.ZERO
  for (i = 0; i < transfers.length; i++) {
    neededMoney = neededMoney.add(transfers[i].amount)
    if (neededMoney.compare(UINT64_MAX) !== -1) {
      throw new Error('Total output amount overflows UINT64_MAX')
    }
  }

  /* Check to make sure that we're not grabbing more outputs
     than is actually possible considering a 64-bit number */
  var foundMoney = BigInteger.ZERO
  var inputs = []
  for (i = 0; i < ourOutputs.length; ++i) {
    foundMoney = foundMoney.add(ourOutputs[i].amount)
    if (foundMoney.compare(UINT64_MAX) !== -1) {
      throw new Error('Total input amount overflows UINT64_MAX')
    }

    /* While we're in here, let's build the inputs for later */
    const src = {
      outputs: [],
      amount: BigInteger(ourOutputs[i].amount).toString()
    }

    /* We've got to handle the random outputs here */
    if (randomOuts.length !== 0) {
      /* First we need to sort the random outputs by
         their global indexes */
      randomOuts[i].outputs.sort(function (a, b) {
        return BigInteger(a.globalIndex).compare(b.globalIndex)
      })
      var j = 0

      /* Let's start mixing */
      while ((src.outputs.length < mixin) && (j < randomOuts[i].outputs.length)) {
        /* Get the mixin */
        var out = randomOuts[i].outputs[j]

        /* We can't mix ourself with ourself */
        if (out.globalIndex === ourOutputs.globalIndex) {
          j++
          continue
        }

        /* Build out our new output object */
        var oe = {
          index: out.globalIndex.toString(),
          key: out.key
        }

        /* Push our new output on to the outputs stack */
        src.outputs.push(oe)
        j++
      }
    }

    /* Build our real output entry */
    var realOe = {
      index: BigInteger(ourOutputs[i].globalIndex || 0).toString(),
      key: ourOutputs[i].key
    }

    /* The real one is at the end, so far */
    var realIndex = src.outputs.length

    /* Find where we should insert this bad boy at */
    for (j = 0; j < src.outputs.length; j++) {
      if (BigInteger(realOe.index).compare(src.outputs[j].index) < 0) {
        realIndex = j
        break
      }
    }

    /* Let's go ahead and insert the real output (input)
       in to the middle of the deck (so to speak) */
    src.outputs.splice(realIndex, 0, realOe)

    /* We have to know where this bad boy actually lives */
    src.realOutputIndex = realIndex

    /* Now push all that into the input stack for later */
    inputs.push(src)
  }

  var change = BigInteger.ZERO
  var cmp = neededMoney.compare(foundMoney)

  if (cmp < 0) {
    change = foundMoney.subtract(neededMoney)
    if (change.compare(feeAmount) !== 0) {
      throw new Error('We have not spent all of what we have passed in')
    }
  } else if (cmp > 0) {
    throw new Error('We need more money than was currently supplied for the transaction')
  }

  return constructTransaction(ourKeys, inputs, transfers, feeAmount, paymentId, unlockTime)
}

function constructTransaction (ourKeys, inputs, transfers, feeAmount, paymentId, unlockTime) {
  /* Every transaction needs a one-time key pair */
  const transactionKeys = randomKeypair()
  var extra = ''

  /* If we have to payment ID we need to add it to extra */
  if (isHex64(paymentId)) {
    const nonce = getPaymentIdNonce(paymentId)
    extra = addNonceToExtra(extra, nonce)
  }

  /* Set up our transaction structure */
  const tx = {
    unlockTime: unlockTime,
    version: CURRENT_TX_VERSION,
    extra: extra,
    prvkey: transactionKeys.privateKey,
    vin: [],
    vout: [],
    signatures: []
  }

  var inContexts = []
  var inputsMoney = BigInteger.ZERO

  /* Sort our inputs by Key Image */
  inputs.sort(function (a, b) {
    return (BigInteger.parse(a.keyImage, 16).compare(BigInteger.parse(b.keyImage, 16)) * -1)
  })

  /* Copy the sorted inputs to the transaction */
  for (var i = 0; i < inputs.length; i++) {
    inputsMoney = inputsMoney.add(inputs[i].amount)
    inContexts.push(inputs[i].input)

    /* Set up the structure for our new input */
    var inputToKey = {
      type: 'input_to_key',
      amount: inputs[i].amount,
      keyImage: inputs[i].keyImage,
      keyOffsets: []
    }

    /* Add our random output offsets to the new input */
    for (var j = 0; j < inputs[i].outputs.length; ++j) {
      inputToKey.keyOffsets.push(inputs[i].outputs[j].index)
    }

    /* Convert the absolute offsets to relative offsets */
    inputToKey.keyOffsets = absoluteToRelativeOffsets(inputToKey.keyOffsets)

    tx.vin.push(inputToKey)
  }

  var outputsMoney = BigInteger.ZERO
  var outIndex = 0

  /* Copy the outputs into the transfaction after setting up the images */
  for (i = 0; i < transfers.length; ++i) {
    /* We can't have amounts smaller than 0 */
    if (BigInteger(transfers[i].amount).compare(0) < 0) {
      throw new Error('dst.amount < 0')
    }

    var outDerivation
    if (transfers[i].keys.publicViewKey === ourKeys.view.publicKey) {
      /* If we are sending change to ourself, then we need to be able
         to find the resulting output on the other side */
      outDerivation = generateKeyDerivation(transactionKeys.publicKey, ourKeys.view.privateKey)
    } else {
      /* Sending anywhere else and this works like normal */
      outDerivation = generateKeyDerivation(transfers[i].keys.publicViewKey, transactionKeys.privateKey)
    }

    /* Generate the one-time output */
    const outEphemeralPub = derivePublicKey(outDerivation, outIndex, transfers[i].keys.publicSpendKey)

    /* Construct the output */
    const out = {
      amount: transfers[i].amount.toString(),
      target: {
        type: 'txout_to_key',
        key: outEphemeralPub
      }
    }

    /* Push the output into the transaction */
    tx.vout.push(out)
    ++outIndex
    outputsMoney = outputsMoney.add(transfers[i].amount)
  }

  /* Add the transaction key to extra */
  tx.extra = addTransactionPublicKeyToExtra(tx.extra, transactionKeys.publicKey)

  /* Make sure we aren't spending more than we have inputs for */
  if (outputsMoney.add(feeAmount).compare(inputsMoney) > 0) {
    throw new Error('Trying to spend ' + outputsMoney.toString() + ' but only supplied ' + inputsMoney.toString())
  }

  /* Now to generate the ring signatures */
  for (i = 0; i < inputs.length; ++i) {
    const srcKeys = []

    for (j = 0; j < inputs[i].outputs.length; ++j) {
      srcKeys.push(inputs[i].outputs[j].key)
    }

    /* Generate the ring signature */
    const sigs = generateRingSignature(getTransactionPrefixHash(tx), tx.vin[i].keyImage, srcKeys, inContexts[i].privateKey, inputs[i].realOutputIndex)

    /* Push the signatures into the transaction */
    tx.signatures.push(sigs)
  }

  return tx
}

function getTransactionPrefixHash (tx) {
  /* Serialize the transaction as a string (blob) but
     do not include the signatures */
  var prefix = serializeTransaction(tx, true)

  /* Hash it */
  return cnFastHash(prefix)
}

/*
function getTransactionHash (tx) {
  /* Check to see if we already serialized the transaction */
/*
  if (typeof tx === 'string') {
    return cnFastHash(tx)
  } else {
    return cnFastHash(serializeTransaction(tx))
  }
}
*/

function serializeTransaction (tx, headerOnly) {
  headerOnly = headerOnly || false

  var buf = ''
  buf += encodeVarint(tx.version)
  buf += encodeVarint(tx.unlockTime)

  /* Loop through the transaction inputs and put them in the buffer */
  buf += encodeVarint(tx.vin.length)
  for (var i = 0; i < tx.vin.length; i++) {
    var vin = tx.vin[i]
    switch (vin.type.toLowerCase()) {
      case 'input_to_key':
        buf += '02'
        buf += encodeVarint(vin.amount)
        buf += encodeVarint(vin.keyOffsets.length)
        for (var j = 0; j < vin.keyOffsets.length; j++) {
          buf += encodeVarint(vin.keyOffsets[j])
        }
        buf += vin.keyImage
        break
      default:
        throw new Error('Unhandled transaction input type: ' + vin.type)
    }
  }

  /* Loop through the transaction outputs and put them in the buffer */
  buf += encodeVarint(tx.vout.length)
  for (i = 0; i < tx.vout.length; i++) {
    var vout = tx.vout[i]
    buf += encodeVarint(vout.amount)
    switch (vout.target.type.toLowerCase()) {
      case 'txout_to_key':
        buf += '02'
        buf += vout.target.key
        break
      default:
        throw new Error('Unhandled transacount output type: ' + vout.target.type)
    }
  }

  /* If we supplied extra data, it needs to be hexadecimal */
  if (!isHex(tx.extra)) {
    throw new Error('Transaction extra has invalid hexadecimal data')
  }

  buf += encodeVarint(tx.extra.length / 2)
  buf += tx.extra

  /* Loop through the transaction signatures if this is a full transaction payload
     and put them in the buffer */
  if (!headerOnly) {
    if (tx.vin.length !== tx.signatures.length) {
      throw new Error('Number of signatures supplied does not equal the number of inputs used')
    }
    for (i = 0; i < tx.vin.length; i++) {
      for (j = 0; j < tx.signatures[i].length; j++) {
        buf += tx.signatures[i][j]
      }
    }
  }

  return buf
}

module.exports = CryptoNote
