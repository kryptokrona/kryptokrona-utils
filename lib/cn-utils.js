// Copyright (c) Lucas Jones
// Copyright (c) 2014-2017, MyMonero.com
// Copyright (c) 2016, Paul Shapiro
// Copyright (c) 2017, Luigi111
// Copyright (c) 2018, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./biginteger.js')
const Mnemonic = require('./mnemonic.js')
const Base58 = require('./base58.js')
const moment = require('moment')
const Module = require('./crypto.js')
const Sha3 = require('./sha3.js')
const NACL = require('./nacl-fast-cn.js')
const Buffer = require('safe-buffer').Buffer
const VarintDecoder = require('varint-decoder')

function cnUtil (initConfig) {
  var config = {}// shallow copy of initConfig

  for (var key in initConfig) {
    config[key] = initConfig[key]
  }

  config.feePerKB = new BigInteger(config.feePerKB)
  config.dustThreshold = new BigInteger(config.dustThreshold)
  config.coinUnits = new BigInteger(10).pow(config.coinUnitPlaces)

  // var HASH_STATE_BYTES = 200
  var HASH_SIZE = 32
  var ADDRESS_CHECKSUM_SIZE = 4
  var INTEGRATED_ID_SIZE = 8
  var ENCRYPTED_PAYMENT_ID_TAIL = 141
  var CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = config.addressPrefix
  var CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX = config.integratedAddressPrefix
  var CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX = config.subAddressPrefix
  if (config.testnet === true) {
    CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = config.addressPrefixTestnet
    CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX = config.integratedAddressPrefixTestnet
    CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX = config.subAddressPrefixTestnet
  }
  var UINT64_MAX = new BigInteger(2).pow(64)
  var CURRENT_TX_VERSION = 1
  var OLD_TX_VERSION = 1
  var RCTTypeFull = 1
  var RCTTypeSimple = 2
  var TX_EXTRA_NONCE_MAX_COUNT = 255
  var TX_EXTRA_TAGS = {
    PADDING: '00',
    PUBKEY: '01',
    NONCE: '02',
    MERGE_MINING: '03'
  }
  var TX_EXTRA_NONCE_TAGS = {
    PAYMENT_ID: '00',
    ENCRYPTED_PAYMENT_ID: '01'
  }
  var KEY_SIZE = 32
  var STRUCT_SIZES = {
    GE_P3: 160,
    GE_P2: 120,
    GE_P1P1: 160,
    GE_CACHED: 160,
    EC_SCALAR: 32,
    EC_POINT: 32,
    KEY_IMAGE: 32,
    GE_DSMP: 160 * 8, // ge_cached * 8
    SIGNATURE: 64 // ec_scalar * 2
  }

  // RCT vars
  var H = '8b655970153799af2aeadc9ff1add0ea6c7251d54154cfa92c173a0dd39c1f94' // base H for amounts
  var l = BigInteger('7237005577332262213973186563042994240857116359379907606001950938285454250989') // curve order (not RCT specific)
  var I = '0100000000000000000000000000000000000000000000000000000000000000' // identity element
  var Z = '0000000000000000000000000000000000000000000000000000000000000000' // zero scalar
  // H2 object to speed up some operations
  var H2 = ['8b655970153799af2aeadc9ff1add0ea6c7251d54154cfa92c173a0dd39c1f94', '8faa448ae4b3e2bb3d4d130909f55fcd79711c1c83cdbccadd42cbe1515e8712',
    '12a7d62c7791654a57f3e67694ed50b49a7d9e3fc1e4c7a0bde29d187e9cc71d', '789ab9934b49c4f9e6785c6d57a498b3ead443f04f13df110c5427b4f214c739',
    '771e9299d94f02ac72e38e44de568ac1dcb2edc6edb61f83ca418e1077ce3de8', '73b96db43039819bdaf5680e5c32d741488884d18d93866d4074a849182a8a64',
    '8d458e1c2f68ebebccd2fd5d379f5e58f8134df3e0e88cad3d46701063a8d412', '09551edbe494418e81284455d64b35ee8ac093068a5f161fa6637559177ef404',
    'd05a8866f4df8cee1e268b1d23a4c58c92e760309786cdac0feda1d247a9c9a7', '55cdaad518bd871dd1eb7bc7023e1dc0fdf3339864f88fdd2de269fe9ee1832d',
    'e7697e951a98cfd5712b84bbe5f34ed733e9473fcb68eda66e3788df1958c306', 'f92a970bae72782989bfc83adfaa92a4f49c7e95918b3bba3cdc7fe88acc8d47',
    '1f66c2d491d75af915c8db6a6d1cb0cd4f7ddcd5e63d3ba9b83c866c39ef3a2b', '3eec9884b43f58e93ef8deea260004efea2a46344fc5965b1a7dd5d18997efa7',
    'b29f8f0ccb96977fe777d489d6be9e7ebc19c409b5103568f277611d7ea84894', '56b1f51265b9559876d58d249d0c146d69a103636699874d3f90473550fe3f2c',
    '1d7a36575e22f5d139ff9cc510fa138505576b63815a94e4b012bfd457caaada', 'd0ac507a864ecd0593fa67be7d23134392d00e4007e2534878d9b242e10d7620',
    'f6c6840b9cf145bb2dccf86e940be0fc098e32e31099d56f7fe087bd5deb5094', '28831a3340070eb1db87c12e05980d5f33e9ef90f83a4817c9f4a0a33227e197',
    '87632273d629ccb7e1ed1a768fa2ebd51760f32e1c0b867a5d368d5271055c6e', '5c7b29424347964d04275517c5ae14b6b5ea2798b573fc94e6e44a5321600cfb',
    'e6945042d78bc2c3bd6ec58c511a9fe859c0ad63fde494f5039e0e8232612bd5', '36d56907e2ec745db6e54f0b2e1b2300abcb422e712da588a40d3f1ebbbe02f6',
    '34db6ee4d0608e5f783650495a3b2f5273c5134e5284e4fdf96627bb16e31e6b', '8e7659fb45a3787d674ae86731faa2538ec0fdf442ab26e9c791fada089467e9',
    '3006cf198b24f31bb4c7e6346000abc701e827cfbb5df52dcfa42e9ca9ff0802', 'f5fd403cb6e8be21472e377ffd805a8c6083ea4803b8485389cc3ebc215f002a',
    '3731b260eb3f9482e45f1c3f3b9dcf834b75e6eef8c40f461ea27e8b6ed9473d', '9f9dab09c3f5e42855c2de971b659328a2dbc454845f396ffc053f0bb192f8c3',
    '5e055d25f85fdb98f273e4afe08464c003b70f1ef0677bb5e25706400be620a5', '868bcf3679cb6b500b94418c0b8925f9865530303ae4e4b262591865666a4590',
    'b3db6bd3897afbd1df3f9644ab21c8050e1f0038a52f7ca95ac0c3de7558cb7a', '8119b3a059ff2cac483e69bcd41d6d27149447914288bbeaee3413e6dcc6d1eb',
    '10fc58f35fc7fe7ae875524bb5850003005b7f978c0c65e2a965464b6d00819c', '5acd94eb3c578379c1ea58a343ec4fcff962776fe35521e475a0e06d887b2db9',
    '33daf3a214d6e0d42d2300a7b44b39290db8989b427974cd865db011055a2901', 'cfc6572f29afd164a494e64e6f1aeb820c3e7da355144e5124a391d06e9f95ea',
    'd5312a4b0ef615a331f6352c2ed21dac9e7c36398b939aec901c257f6cbc9e8e', '551d67fefc7b5b9f9fdbf6af57c96c8a74d7e45a002078a7b5ba45c6fde93e33',
    'd50ac7bd5ca593c656928f38428017fc7ba502854c43d8414950e96ecb405dc3', '0773e18ea1be44fe1a97e239573cfae3e4e95ef9aa9faabeac1274d3ad261604',
    'e9af0e7ca89330d2b8615d1b4137ca617e21297f2f0ded8e31b7d2ead8714660', '7b124583097f1029a0c74191fe7378c9105acc706695ed1493bb76034226a57b',
    'ec40057b995476650b3db98e9db75738a8cd2f94d863b906150c56aac19caa6b', '01d9ff729efd39d83784c0fe59c4ae81a67034cb53c943fb818b9d8ae7fc33e5',
    '00dfb3c696328c76424519a7befe8e0f6c76f947b52767916d24823f735baf2e', '461b799b4d9ceea8d580dcb76d11150d535e1639d16003c3fb7e9d1fd13083a8',
    'ee03039479e5228fdc551cbde7079d3412ea186a517ccc63e46e9fcce4fe3a6c', 'a8cfb543524e7f02b9f045acd543c21c373b4c9b98ac20cec417a6ddb5744e94',
    '932b794bf89c6edaf5d0650c7c4bad9242b25626e37ead5aa75ec8c64e09dd4f', '16b10c779ce5cfef59c7710d2e68441ea6facb68e9b5f7d533ae0bb78e28bf57',
    '0f77c76743e7396f9910139f4937d837ae54e21038ac5c0b3fd6ef171a28a7e4', 'd7e574b7b952f293e80dde905eb509373f3f6cd109a02208b3c1e924080a20ca',
    '45666f8c381e3da675563ff8ba23f83bfac30c34abdde6e5c0975ef9fd700cb9', 'b24612e454607eb1aba447f816d1a4551ef95fa7247fb7c1f503020a7177f0dd',
    '7e208861856da42c8bb46a7567f8121362d9fb2496f131a4aa9017cf366cdfce', '5b646bff6ad1100165037a055601ea02358c0f41050f9dfe3c95dccbd3087be0',
    '746d1dccfed2f0ff1e13c51e2d50d5324375fbd5bf7ca82a8931828d801d43ab', 'cb98110d4a6bb97d22feadbc6c0d8930c5f8fc508b2fc5b35328d26b88db19ae',
    '60b626a033b55f27d7676c4095eababc7a2c7ede2624b472e97f64f96b8cfc0e', 'e5b52bc927468df71893eb8197ef820cf76cb0aaf6e8e4fe93ad62d803983104',
    '056541ae5da9961be2b0a5e895e5c5ba153cbb62dd561a427bad0ffd41923199', 'f8fef05a3fa5c9f3eba41638b247b711a99f960fe73aa2f90136aeb20329b888']

  // begin rct new functions
  // creates a Pedersen commitment from an amount (in scalar form) and a mask
  // C = bG + aH where b = mask, a = amount

  function validHex (hex) {
    var exp = new RegExp('[0-9a-fA-F]{' + hex.length + '}')
    return exp.test(hex)
  }

  function commit (amount, mask) {
    if (!validHex(mask) || mask.length !== 64 || !validHex(amount) || amount.length !== 64) {
      throw new Error('invalid amount or mask!')
    }
    var C = this.ge_double_scalarmult_base_vartime(amount, H, mask)
    return C
  }

  function zeroCommit (amount) {
    if (!validHex(amount) || amount.length !== 64) {
      throw new Error('invalid amount!')
    }
    var C = this.ge_double_scalarmult_base_vartime(amount, H, I)
    return C
  }

  this.zeroCommit = zeroCommit

  this.decode_rct_ecdh = function (ecdh, key) {
    var first = this.hash_to_scalar(key)
    var second = this.hash_to_scalar(first)
    return {
      mask: this.sc_sub(ecdh.mask, first),
      amount: this.sc_sub(ecdh.amount, second)
    }
  }

  this.encode_rct_ecdh = function (ecdh, key) {
    var first = this.hash_to_scalar(key)
    var second = this.hash_to_scalar(first)
    return {
      mask: this.sc_add(ecdh.mask, first),
      amount: this.sc_add(ecdh.amount, second)
    }
  }

  // switch byte order for hex string
  function swapEndian (hex) {
    if (hex.length % 2 !== 0) { return 'length must be a multiple of 2!' }
    var data = ''
    for (var i = 1; i <= hex.length / 2; i++) {
      data += hex.substr(0 - 2 * i, 2)
    }
    return data
  }

  // switch byte order charwise
  function swapEndianC (string) {
    var data = ''
    for (var i = 1; i <= string.length; i++) {
      data += string.substr(0 - i, 1)
    }
    return data
  }

  // for most uses you'll also want to swapEndian after conversion
  // mainly to convert integer "scalars" to usable hexadecimal strings
  function d2h (integer) {
    if (typeof integer !== 'string' && integer.toString().length > 15) { throw new Error('integer should be entered as a string for precision') }
    var padding = ''
    for (var i = 0; i < 63; i++) {
      padding += '0'
    }
    return (padding + BigInteger(integer).toString(16).toLowerCase()).slice(-64)
  }

  // integer (string) to scalar
  function d2s (integer) {
    return swapEndian(d2h(integer))
  }

  this.d2s = d2s

  // scalar to integer (string)
  function s2d (scalar) {
    return BigInteger.parse(swapEndian(scalar), 16).toString()
  }

  // convert integer string to 64bit "binary" little-endian string
  function d2b (integer) {
    if (typeof integer !== 'string' && integer.toString().length > 15) { throw new Error('integer should be entered as a string for precision') }
    var padding = ''
    for (var i = 0; i < 63; i++) {
      padding += '0'
    }
    var a = new BigInteger(integer)
    if (a.toString(2).length > 64) { throw new Error('amount overflows uint64!') }
    return swapEndianC((padding + a.toString(2)).slice(-64))
  }

  this.valid_hex = function (hex) {
    var exp = new RegExp('[0-9a-fA-F]{' + hex.length + '}')
    return exp.test(hex)
  }

  // simple exclusive or function for two hex inputs
  this.hex_xor = function (hex1, hex2) {
    if (!hex1 || !hex2 || hex1.length !== hex2.length || hex1.length % 2 !== 0 || hex2.length % 2 !== 0) { throw new Error('Hex string(s) is/are invalid!') }
    var bin1 = hextobin(hex1)
    var bin2 = hextobin(hex2)
    var xor = new Uint8Array(bin1.length)
    for (var i = 0; i < xor.length; i++) {
      xor[i] = bin1[i] ^ bin2[i]
    }
    return bintohex(xor)
  }

  function hextobin (hex) {
    if (hex.length % 2 !== 0) throw new Error('Hex string has invalid length!')
    var res = new Uint8Array(hex.length / 2)
    for (var i = 0; i < hex.length / 2; ++i) {
      res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
    return res
  }

  function bintohex (bin) {
    var out = []
    for (var i = 0; i < bin.length; ++i) {
      out.push(('0' + bin[i].toString(16)).slice(-2))
    }
    return out.join('')
  }
  this.bintohex = bintohex
  this.hextobin = hextobin

  function strtobin (str) {
    var res = new Uint8Array(str.length)
    for (var i = 0; i < str.length; i++) {
      res[i] = str.charCodeAt(i)
    }
    return res
  }
  this.strtobin = strtobin

  function bintostr (bin) {
    var out = []
    for (var i = 0; i < bin.length; i++) {
      out.push(String.fromCharCode(bin[i]))
    }
    return out.join('')
  }
  this.bintostr = bintostr

  // Generate a 256-bit / 64-char / 32-byte crypto random
  this.rand_32 = function () {
    return Mnemonic.random(256)
  }

  // Generate a 128-bit / 32-char / 16-byte crypto random
  this.rand_16 = function () {
    return Mnemonic.random(128)
  }

  // Generate a 64-bit / 16-char / 8-byte crypto random
  this.rand_8 = function () {
    return Mnemonic.random(64)
  }

  this.encode_varint = function (i) {
    i = new BigInteger(i)
    var out = ''
    // While i >= b10000000
    while (i.compare(0x80) >= 0) {
      // out.append i & b01111111 | b10000000
      out += ('0' + ((i.lowVal() & 0x7f) | 0x80).toString(16)).slice(-2)
      i = i.divide(new BigInteger(2).pow(7))
    }
    out += ('0' + i.toJSValue().toString(16)).slice(-2)
    return out
  }

  this.decode_varint = function (hex) {
    const buffer = new Buffer(hex, 'hex')
    return parseInt(VarintDecoder(buffer))
  }

  this.sc_reduce = function (hex) {
    var input = hextobin(hex)
    if (input.length !== 64) {
      throw new Error('Invalid input length')
    }
    var mem = Module._malloc(64)
    Module.HEAPU8.set(input, mem)
    Module.ccall('sc_reduce', 'void', ['number'], [mem])
    var output = Module.HEAPU8.subarray(mem, mem + 64)
    Module._free(mem)
    return bintohex(output)
  }

  this.sc_reduce32 = function (hex) {
    var input = hextobin(hex)
    if (input.length !== 32) {
      throw new Error('Invalid input length')
    }
    var mem = Module._malloc(32)
    Module.HEAPU8.set(input, mem)
    Module.ccall('sc_reduce32', 'void', ['number'], [mem])
    var output = Module.HEAPU8.subarray(mem, mem + 32)
    Module._free(mem)
    return bintohex(output)
  }

  this.cn_fast_hash = function (input, inlen) {
    if (input.length % 2 !== 0 || !this.valid_hex(input)) {
      throw new Error('Input invalid')
    }
    return Sha3.keccak_256(hextobin(input))
  }

  this.sec_key_to_pub = function (sec) {
    if (sec.length !== 64) {
      throw new Error('Invalid sec length')
    }
    return bintohex(NACL.ll.geScalarmultBase(hextobin(sec)))
  }

  this.ge_scalarmult_base = function (sec) {
    return this.sec_key_to_pub(sec)
  }

  this.ge_scalarmult = function (pub, sec) {
    if (pub.length !== 64 || sec.length !== 64) {
      throw new Error('Invalid input length')
    }
    return bintohex(NACL.ll.geScalarmultBase(hextobin(pub), hextobin(sec)))
  }

  this.pubkeys_to_string = function (spend, view) {
    var prefix = this.encode_varint(CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX)
    var data = prefix + spend + view
    var checksum = this.cn_fast_hash(data)
    return Base58.encode(data + checksum.slice(0, ADDRESS_CHECKSUM_SIZE * 2))
  }

  this.get_account_integrated_address = function (address, paymentId) {
    var decodedAddress = this.decode_address(address)

    var prefix = this.encode_varint(CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX)
    var data = prefix + decodedAddress.spend + decodedAddress.view + paymentId

    var checksum = this.cn_fast_hash(data)

    return Base58.encode(data + checksum.slice(0, ADDRESS_CHECKSUM_SIZE * 2))
  }

  this.decrypt_payment_id = function (paymentId, txPublicKey, accPrvViewKey) {
    if (paymentId.length !== 16) throw new Error('Invalid input length2!')

    var keyDerivation = this.generate_key_derivation(txPublicKey, accPrvViewKey)

    var pidKey = this.cn_fast_hash(keyDerivation + ENCRYPTED_PAYMENT_ID_TAIL.toString(16)).slice(0, INTEGRATED_ID_SIZE * 2)

    var decryptedPaymentId = this.hex_xor(paymentId, pidKey)

    return decryptedPaymentId
  }

  this.poorMansKdf = function (str) {
    var hex = this.bintohex(this.strtobin(str))
    for (var n = 0; n < 10000; ++n) {
      hex = Sha3.keccak_256(hextobin(hex))
    }
    return hex
  }

  this.createNewAddress = function (entropy, lang) {
    var seed = this.sc_reduce32(this.poorMansKdf(entropy + this.rand_32()))
    var keys = this.create_address(seed)
    var passPhrase = Mnemonic.encode(seed, lang)

    var publicAddress = keys.public_addr
    delete keys.public_addr

    return {
      keys: keys,
      public_addr: publicAddress,
      mnemonic: passPhrase
    }
  }

  // Generate keypair from seed
  this.generate_keys_old = function (seed) {
    if (seed.length !== 64) throw new Error('Invalid input length!')
    var sec = this.sc_reduce32(seed)
    var pub = this.sec_key_to_pub(sec)
    return {
      'sec': sec,
      'pub': pub
    }
  }

  // Generate keypair from seed 2
  // as in simplewallet
  this.generate_keys = function (seed) {
    if (seed.length !== 64) throw new Error('Invalid input length!')
    var sec = this.sc_reduce32(seed)
    var pub = this.sec_key_to_pub(sec)
    return {
      'sec': sec,
      'pub': pub
    }
  }

  this.random_keypair = function () {
    return this.generate_keys(this.rand_32())
  }

  // Random 32-byte ec scalar
  this.random_scalar = function () {
    return this.sc_reduce32(this.rand_32())
  }

  this.create_address = function (seed) {
    var keys = {}
    var first
    var second
    if (seed.length !== 64) {
      first = this.cn_fast_hash(seed)
    } else {
      first = seed
    }

    keys.spend = this.generate_keys(first)
    if (seed.length !== 64) {
      second = this.cn_fast_hash(first)
    } else {
      second = this.cn_fast_hash(keys.spend.sec)
    }

    keys.view = this.generate_keys(second)
    keys.public_addr = this.pubkeys_to_string(keys.spend.pub, keys.view.pub)
    return keys
  }

  this.create_addr_prefix = function (seed) {
    var first
    if (seed.length !== 64) {
      first = this.cn_fast_hash(seed)
    } else {
      first = seed
    }
    var spend = this.generate_keys(first)
    var prefix = this.encode_varint(CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX)
    return Base58.encode(prefix + spend.pub).slice(0, 44)
  }

  this.decode_address = function (address) {
    var dec = Base58.decode(address)
    var expectedPrefix = this.encode_varint(CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX)
    var expectedPrefixInt = this.encode_varint(CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX)
    var expectedPrefixSub = this.encode_varint(CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX)
    var prefix = dec.slice(0, expectedPrefix.length)
    if (prefix !== expectedPrefix && prefix !== expectedPrefixInt && prefix !== expectedPrefixSub) {
      throw new Error('Invalid address prefix')
    }
    dec = dec.slice(expectedPrefix.length)
    var spend = dec.slice(0, 64)
    var view = dec.slice(64, 128)
    var checksum, expectedChecksum
    if (prefix === expectedPrefixInt) {
      var intPaymentId = dec.slice(128, 128 + (INTEGRATED_ID_SIZE * 2))
      checksum = dec.slice(128 + (INTEGRATED_ID_SIZE * 2), 128 + (INTEGRATED_ID_SIZE * 2) + (ADDRESS_CHECKSUM_SIZE * 2))
      expectedChecksum = this.cn_fast_hash(prefix + spend + view + intPaymentId).slice(0, ADDRESS_CHECKSUM_SIZE * 2)
    } else {
      checksum = dec.slice(128, 128 + (ADDRESS_CHECKSUM_SIZE * 2))
      expectedChecksum = this.cn_fast_hash(prefix + spend + view).slice(0, ADDRESS_CHECKSUM_SIZE * 2)
    }
    if (checksum !== expectedChecksum) {
      throw new Error('Invalid checksum')
    }

    if (intPaymentId) {
      return {
        spend: spend,
        view: view,
        prefix: prefix,
        prefixInt: this.decode_varint(prefix),
        intPaymentId: intPaymentId
      }
    } else {
      return {
        spend: spend,
        view: view,
        prefix: prefix,
        prefixInt: this.decode_varint(prefix)
      }
    }
  }

  this.is_subaddress = function (addr) {
    var decoded = Base58.decode(addr)
    var subaddressPrefix = this.encode_varint(CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX)
    var prefix = decoded.slice(0, subaddressPrefix.length)

    return (prefix === subaddressPrefix)
  }

  this.valid_keys = function (viewPub, viewSec, spendPub, spendSec) {
    var expectedViewPub = this.sec_key_to_pub(viewSec)
    var expectedSpendPub = this.sec_key_to_pub(spendSec)
    return (expectedSpendPub === spendPub) && (expectedViewPub === viewPub)
  }

  this.hash_to_scalar = function (buf) {
    var hash = this.cn_fast_hash(buf)
    var scalar = this.sc_reduce32(hash)
    return scalar
  }

  this.generate_key_derivation = function (pub, sec) {
    if (pub.length !== 64 || sec.length !== 64) {
      throw new Error('Invalid input length')
    }
    var P = this.ge_scalarmult(pub, sec)
    return this.ge_scalarmult(P, d2s(8)) // mul8 to ensure group
  }

  this.derivation_to_scalar = function (derivation, outputIndex) {
    var buf = ''
    if (derivation.length !== (STRUCT_SIZES.EC_POINT * 2)) {
      throw new Error('Invalid derivation length!')
    }
    buf += derivation
    var enc = this.encode_varint(outputIndex)
    if (enc.length > 10 * 2) {
      throw new Error("outputIndex didn't fit in 64-bit varint")
    }
    buf += enc
    return this.hash_to_scalar(buf)
  }

  this.derive_secret_key = function (derivation, outputIndex, sec) {
    if (derivation.length !== 64 || sec.length !== 64) {
      throw new Error('Invalid input length!')
    }
    var scalarM = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    var scalarB = hextobin(this.derivation_to_scalar(derivation, outputIndex))
    Module.HEAPU8.set(scalarB, scalarM)
    var baseM = Module._malloc(KEY_SIZE)
    Module.HEAPU8.set(hextobin(sec), baseM)
    var derivedM = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    Module.ccall('sc_add', 'void', ['number', 'number', 'number'], [derivedM, baseM, scalarM])
    var res = Module.HEAPU8.subarray(derivedM, derivedM + STRUCT_SIZES.EC_SCALAR)
    Module._free(scalarM)
    Module._free(baseM)
    Module._free(derivedM)
    return bintohex(res)
  }

  this.derive_public_key = function (derivation, outputIndex, pub) {
    if (derivation.length !== 64 || pub.length !== 64) {
      throw new Error('Invalid input length!')
    }
    var s = this.derivation_to_scalar(derivation, outputIndex)
    return bintohex(NACL.ll.geAdd(hextobin(pub), hextobin(this.ge_scalarmult_base(s))))
  }

  this.hash_to_ec = function (key) {
    if (key.length !== (KEY_SIZE * 2)) {
      throw new Error('Invalid input length')
    }
    var hM = Module._malloc(HASH_SIZE)
    var pointM = Module._malloc(STRUCT_SIZES.GE_P2)
    var point2M = Module._malloc(STRUCT_SIZES.GE_P1P1)
    var resM = Module._malloc(STRUCT_SIZES.GE_P3)
    var hash = hextobin(this.cn_fast_hash(key, KEY_SIZE))
    Module.HEAPU8.set(hash, hM)
    Module.ccall('ge_fromfe_frombytes_vartime', 'void', ['number', 'number'], [pointM, hM])
    Module.ccall('ge_mul8', 'void', ['number', 'number'], [point2M, pointM])
    Module.ccall('ge_p1p1_to_p3', 'void', ['number', 'number'], [resM, point2M])
    var res = Module.HEAPU8.subarray(resM, resM + STRUCT_SIZES.GE_P3)
    Module._free(hM)
    Module._free(pointM)
    Module._free(point2M)
    Module._free(resM)
    return bintohex(res)
  }

  // returns a 32 byte point via "ge_p3_tobytes" rather than a 160 byte "p3", otherwise same as above;
  this.hash_to_ec_2 = function (key) {
    if (key.length !== (KEY_SIZE * 2)) {
      throw new Error('Invalid input length')
    }
    var hM = Module._malloc(HASH_SIZE)
    var pointM = Module._malloc(STRUCT_SIZES.GE_P2)
    var point2M = Module._malloc(STRUCT_SIZES.GE_P1P1)
    var resM = Module._malloc(STRUCT_SIZES.GE_P3)
    var hash = hextobin(this.cn_fast_hash(key, KEY_SIZE))
    var res2M = Module._malloc(KEY_SIZE)
    Module.HEAPU8.set(hash, hM)
    Module.ccall('ge_fromfe_frombytes_vartime', 'void', ['number', 'number'], [pointM, hM])
    Module.ccall('ge_mul8', 'void', ['number', 'number'], [point2M, pointM])
    Module.ccall('ge_p1p1_to_p3', 'void', ['number', 'number'], [resM, point2M])
    Module.ccall('ge_p3_tobytes', 'void', ['number', 'number'], [res2M, resM])
    var res = Module.HEAPU8.subarray(res2M, res2M + KEY_SIZE)
    Module._free(hM)
    Module._free(pointM)
    Module._free(point2M)
    Module._free(resM)
    Module._free(res2M)
    return bintohex(res)
  }

  this.generate_key_image_2 = function (pub, sec) {
    if (!pub || !sec || pub.length !== 64 || sec.length !== 64) {
      throw new Error('Invalid input length')
    }
    var pubM = Module._malloc(KEY_SIZE)
    var secM = Module._malloc(KEY_SIZE)
    Module.HEAPU8.set(hextobin(pub), pubM)
    Module.HEAPU8.set(hextobin(sec), secM)
    if (Module.ccall('sc_check', 'number', ['number'], [secM]) !== 0) {
      throw new Error('sc_check(sec) != 0')
    }
    var pointM = Module._malloc(STRUCT_SIZES.GE_P3)
    var point2M = Module._malloc(STRUCT_SIZES.GE_P2)
    var pointB = hextobin(this.hash_to_ec(pub))
    Module.HEAPU8.set(pointB, pointM)
    var imageM = Module._malloc(STRUCT_SIZES.KEY_IMAGE)
    Module.ccall('ge_scalarmult', 'void', ['number', 'number', 'number'], [point2M, secM, pointM])
    Module.ccall('ge_tobytes', 'void', ['number', 'number'], [imageM, point2M])
    var res = Module.HEAPU8.subarray(imageM, imageM + STRUCT_SIZES.KEY_IMAGE)
    Module._free(pubM)
    Module._free(secM)
    Module._free(pointM)
    Module._free(point2M)
    Module._free(imageM)
    return bintohex(res)
  }

  this.generate_key_image = function (txPub, viewSec, spendPub, spendSec, outputIndex) {
    if (txPub.length !== 64) {
      throw new Error('Invalid txPub length')
    }
    if (viewSec.length !== 64) {
      throw new Error('Invalid viewSec length')
    }
    if (spendPub.length !== 64) {
      throw new Error('Invalid spendPub length')
    }
    if (spendSec.length !== 64) {
      throw new Error('Invalid spendSec length')
    }
    var recvDerivation = this.generate_key_derivation(txPub, viewSec)
    var ephemeralPub = this.derive_public_key(recvDerivation, outputIndex, spendPub)
    var ephemeralSec = this.derive_secret_key(recvDerivation, outputIndex, spendSec)
    var kImage = this.generate_key_image_2(ephemeralPub, ephemeralSec)
    return {
      ephemeral_pub: ephemeralPub,
      key_image: kImage
    }
  }

  this.generate_key_image_helper_rct = function (keys, txPubKey, outIndex, encMask) {
    var recvDerivation = this.generate_key_derivation(txPubKey, keys.view.sec)
    if (!recvDerivation) throw new Error('Failed to generate key image')

    var mask

    if (encMask === I) {
      // this is for ringct coinbase txs (rct type 0). they are ringct tx that have identity mask
      mask = encMask // encMask is idenity mask returned by backend.
    } else {
      // for other ringct types or for non-ringct txs to this.
      mask = encMask ? this.sc_sub(encMask, this.hash_to_scalar(this.derivation_to_scalar(recvDerivation, outIndex))) : I // decode mask, or d2s(1) if no mask
    }

    var ephemeralPub = this.derive_public_key(recvDerivation, outIndex, keys.spend.pub)
    if (!ephemeralPub) throw new Error('Failed to generate key image')
    var ephemeralSec = this.derive_secret_key(recvDerivation, outIndex, keys.spend.sec)
    var image = this.generate_key_image_2(ephemeralPub, ephemeralSec)
    return {
      in_ephemeral: {
        pub: ephemeralPub,
        sec: ephemeralSec,
        mask: mask
      },
      image: image
    }
  }

  this.ge_neg = function (point) {
    if (point.length !== 64) {
      throw new Error('expected 64 char hex string')
    }
    return point.slice(0, 62) + ((parseInt(point.slice(62, 63), 16) + 8) % 16).toString(16) + point.slice(63, 64)
  }

  this.ge_add = function (p1, p2) {
    if (p1.length !== 64 || p2.length !== 64) {
      throw new Error('Invalid input length!')
    }
    return bintohex(NACL.ll.geAdd(hextobin(p1), hextobin(p2)))
  }

  this.ge_sub = function (point1, point2) {
    var point2n = this.ge_neg(point2)
    return this.ge_add(point1, point2n)
  }

  this.sc_add = function (scalar1, scalar2) {
    if (scalar1.length !== 64 || scalar2.length !== 64) {
      throw new Error('Invalid input length!')
    }
    var scalar1M = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    var scalar2M = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    Module.HEAPU8.set(hextobin(scalar1), scalar1M)
    Module.HEAPU8.set(hextobin(scalar2), scalar2M)
    var derivedM = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    Module.ccall('sc_add', 'void', ['number', 'number', 'number'], [derivedM, scalar1M, scalar2M])
    var res = Module.HEAPU8.subarray(derivedM, derivedM + STRUCT_SIZES.EC_SCALAR)
    Module._free(scalar1M)
    Module._free(scalar2M)
    Module._free(derivedM)
    return bintohex(res)
  }

  this.sc_sub = function (scalar1, scalar2) {
    if (scalar1.length !== 64 || scalar2.length !== 64) {
      throw new Error('Invalid input length!')
    }
    var scalar1M = Module.Malloc(STRUCT_SIZES.EC_SCALAR)
    var scalar2M = Module.Malloc(STRUCT_SIZES.EC_SCALAR)
    Module.HEAPU8.set(hextobin(scalar1), scalar1M)
    Module.HEAPU8.set(hextobin(scalar2), scalar2M)
    var derivedM = Module.Malloc(STRUCT_SIZES.EC_SCALAR)
    Module.ccall('sc_sub', 'void', ['number', 'number', 'number'], [derivedM, scalar1M, scalar2M])
    var res = Module.HEAPU8.subarray(derivedM, derivedM + STRUCT_SIZES.EC_SCALAR)
    Module._free(scalar1M)
    Module._free(scalar2M)
    Module._free(derivedM)
    return bintohex(res)
  }

  // fun mul function
  this.sc_mul = function (scalar1, scalar2) {
    if (scalar1.length !== 64 || scalar2.length !== 64) {
      throw new Error('Invalid input length!')
    }
    return d2s(BigInteger(s2d(scalar1)).multiply(BigInteger(s2d(scalar2))).remainder(l).toString())
  }

  // res = c - (ab) mod l; argument names copied from the signature implementation
  this.sc_mulsub = function (sigc, sec, k) {
    if (k.length !== KEY_SIZE * 2 || sigc.length !== KEY_SIZE * 2 || sec.length !== KEY_SIZE * 2 || !this.valid_hex(k) || !this.valid_hex(sigc) || !this.valid_hex(sec)) {
      throw new Error('bad scalar')
    }
    var secM = Module._malloc(KEY_SIZE)
    Module.HEAPU8.set(hextobin(sec), secM)
    var sigcM = Module._malloc(KEY_SIZE)
    Module.HEAPU8.set(hextobin(sigc), sigcM)
    var kM = Module._malloc(KEY_SIZE)
    Module.HEAPU8.set(hextobin(k), kM)
    var resM = Module._malloc(KEY_SIZE)

    Module.ccall('sc_mulsub', 'void', ['number', 'number', 'number', 'number'], [resM, sigcM, secM, kM])
    var res = Module.HEAPU8.subarray(resM, resM + KEY_SIZE)
    Module._free(kM)
    Module._free(secM)
    Module._free(sigcM)
    Module._free(resM)
    return bintohex(res)
  }

  this.ge_double_scalarmult_base_vartime = function (c, P, r) {
    if (c.length !== 64 || P.length !== 64 || r.length !== 64) {
      throw new Error('Invalid input length!')
    }
    return bintohex(NACL.ll.geDoubleScalarmultBaseVartime(hextobin(c), hextobin(P), hextobin(r)))
  }

  this.ge_double_scalarmult_postcomp_vartime = function (r, P, c, I) {
    if (c.length !== 64 || P.length !== 64 || r.length !== 64 || I.length !== 64) {
      throw new Error('Invalid input length!')
    }
    var Pb = this.hash_to_ec_2(P)
    return bintohex(NACL.ll.geDoubleScalarmultPostcompVartime(hextobin(r), hextobin(Pb), hextobin(c), hextobin(I)))
  }

  // begin RCT functions

  // xv: vector of secret keys, 1 per ring (nrings)
  // pm: matrix of pubkeys, indexed by size first
  // iv: vector of indexes, 1 per ring (nrings), can be a string
  // size: ring size
  // nrings: number of rings
  // extensible borromean signatures
  this.genBorromean = function (xv, pm, iv, size, nrings) {
    if (xv.length !== nrings) {
      throw new Error('wrong xv length ' + xv.length)
    }
    if (pm.length !== size) {
      throw new Error('wrong pm size ' + pm.length)
    }
    for (var i = 0; i < pm.length; i++) {
      if (pm[i].length !== nrings) {
        throw new Error('wrong pm[' + i + '] length ' + pm[i].length)
      }
    }
    if (iv.length !== nrings) {
      throw new Error('wrong iv length ' + iv.length)
    }
    for (i = 0; i < iv.length; i++) {
      if (iv[i] >= size) {
        throw new Error('bad indices value at: ' + i + ': ' + iv[i])
      }
    }
    // signature struct
    var bb = {
      s: [],
      ee: ''
    }
    // signature pubkey matrix
    var L = []
    // add needed sub vectors (1 per ring size)
    for (i = 0; i < size; i++) {
      bb.s[i] = []
      L[i] = []
    }
    // compute starting at the secret index to the last row
    var index
    var alpha = []
    for (i = 0; i < nrings; i++) {
      index = parseInt(iv[i])
      alpha[i] = this.random_scalar()
      L[index][i] = this.ge_scalarmult_base(alpha[i])
      for (var j = index + 1; j < size; j++) {
        bb.s[j][i] = this.random_scalar()
        var c = this.hash_to_scalar(L[j - 1][i])
        L[j][i] = this.ge_double_scalarmult_base_vartime(c, pm[j][i], bb.s[j][i])
      }
    }
    // hash last row to create ee
    var ltemp = ''
    for (i = 0; i < nrings; i++) {
      ltemp += L[size - 1][i]
    }
    bb.ee = this.hash_to_scalar(ltemp)
    // compute the rest from 0 to secret index
    for (i = 0; i < nrings; i++) {
      var cc = bb.ee
      for (j = 0; j < iv[i]; j++) {
        bb.s[j][i] = this.random_scalar()
        var LL = this.ge_double_scalarmult_base_vartime(cc, pm[j][i], bb.s[j][i])
        cc = this.hash_to_scalar(LL)
      }
      bb.s[j][i] = this.sc_mulsub(xv[i], cc, alpha[i])
    }
    return bb
  }

  // proveRange
  // proveRange gives C, and mask such that \sumCi = C
  //   c.f. http://eprint.iacr.org/2015/1098 section 5.1
  //   and Ci is a commitment to either 0 or s^i, i=0,...,n
  //   thus this proves that "amount" is in [0, s^n] (we assume s to be 4) (2 for now with v2 txes)
  //   mask is a such that C = aG + bH, and b = amount
  // commitMaskObj = {C: commit, mask: mask}
  this.proveRange = function (commitMaskObj, amount, nrings, encSeed, exponent) {
    var size = 2
    var C = I // identity
    var mask = Z // zero scalar
    var indices = d2b(amount) // base 2 for now
    var sig = {
      Ci: []
      // exp: exponent //doesn't exist for now
    }
    var ai = []
    var PM = []
    for (var i = 0; i < size; i++) {
      PM[i] = []
    }
    var j
    // start at index and fill PM left and right -- PM[0] holds Ci
    for (i = 0; i < nrings; i++) {
      ai[i] = this.random_scalar()
      j = indices[i]
      PM[j][i] = this.ge_scalarmult_base(ai[i])
      while (j > 0) {
        j--
        PM[j][i] = this.ge_add(PM[j + 1][i], H2[i]) // will need to use i*2 for base 4 (or different object)
      }
      j = indices[i]
      while (j < size - 1) {
        j++
        PM[j][i] = this.ge_sub(PM[j - 1][i], H2[i]) // will need to use i*2 for base 4 (or different object)
      }
      mask = this.sc_add(mask, ai[i])
    }

    // copy commitments to sig and sum them to commitment
    for (i = 0; i < nrings; i++) {
      // if (i < nrings - 1) //for later version
      sig.Ci[i] = PM[0][i]
      C = this.ge_add(C, PM[0][i])
    }

    sig.bsig = this.genBorromean(ai, PM, indices, size, nrings)
    commitMaskObj.C = C
    commitMaskObj.mask = mask
    return sig
  }

  function arrayHashToScalar (array) {
    var buf = ''
    for (var i = 0; i < array.length; i++) {
      if (typeof array[i] !== 'string') { throw new Error('unexpected array element') }
      buf += array[i]
    }
    return this.hash_to_scalar(buf)
  }

  // Gen creates a signature which proves that for some column in the keymatrix "pk"
  //   the signer knows a secret key for each row in that column
  // we presently only support matrices of 2 rows (pubkey, commitment)
  // this is a simplied MLSAG_Gen function to reflect that
  // because we don't want to force same secret column for all inputs
  this.MLSAG_Gen = function (message, pk, xx, kimg, index) {
    var cols = pk.length // ring size
    if (index >= cols) { throw new Error('index out of range') }
    var rows = pk[0].length // number of signature rows (always 2)
    if (rows !== 2) { throw new Error('wrong row count') }
    for (var i = 0; i < cols; i++) {
      if (pk[i].length !== rows) { throw new Error('pk is not rectangular') }
    }
    if (xx.length !== rows) { throw new Error('bad xx size') }

    var cOld = ''
    var alpha = []

    var rv = {
      ss: [],
      cc: null
    }
    for (i = 0; i < cols; i++) {
      rv.ss[i] = []
    }
    var toHash = [] // holds 6 elements: message, pubkey, dsRow L, dsRow R, commitment, ndsRow L
    toHash[0] = message

    // secret index (pubkey section)
    alpha[0] = this.random_scalar() // need to save alphas for later
    toHash[1] = pk[index][0] // secret index pubkey
    toHash[2] = this.ge_scalarmult_base(alpha[0]) // dsRow L
    toHash[3] = this.generate_key_image_2(pk[index][0], alpha[0]) // dsRow R (key image check)
    // secret index (commitment section)
    alpha[1] = this.random_scalar()
    toHash[4] = pk[index][1] // secret index commitment
    toHash[5] = this.ge_scalarmult_base(alpha[1]) // ndsRow L

    cOld = arrayHashToScalar(toHash)

    i = (index + 1) % cols
    if (i === 0) {
      rv.cc = cOld
    }
    while (i !== index) {
      rv.ss[i][0] = this.random_scalar() // dsRow ss
      rv.ss[i][1] = this.random_scalar() // ndsRow ss

      //! secret index (pubkey section)
      toHash[1] = pk[i][0]
      toHash[2] = this.ge_double_scalarmult_base_vartime(cOld, pk[i][0], rv.ss[i][0])
      toHash[3] = this.ge_double_scalarmult_postcomp_vartime(rv.ss[i][0], pk[i][0], cOld, kimg)
      //! secret index (commitment section)
      toHash[4] = pk[i][1]
      toHash[5] = this.ge_double_scalarmult_base_vartime(cOld, pk[i][1], rv.ss[i][1])
      cOld = arrayHashToScalar(toHash) // hash to get next column c
      i = (i + 1) % cols
      if (i === 0) {
        rv.cc = cOld
      }
    }
    for (i = 0; i < rows; i++) {
      rv.ss[index][i] = this.sc_mulsub(cOld, xx[i], alpha[i])
    }
    return rv
  }

  // prepares for MLSAG_Gen
  this.proveRctMG = function (message, pubs, inSk, kimg, mask, Cout, index) {
    var cols = pubs.length
    if (cols < 3) { throw new Error('cols must be > 2 (mixin)') }
    var xx = []
    var PK = []
    // fill pubkey matrix (copy destination, subtract commitments)
    for (var i = 0; i < cols; i++) {
      PK[i] = []
      PK[i][0] = pubs[i].dest
      PK[i][1] = this.ge_sub(pubs[i].mask, Cout)
    }
    xx[0] = inSk.x
    xx[1] = this.sc_sub(inSk.a, mask)
    return this.MLSAG_Gen(message, PK, xx, kimg, index)
  }

  this.get_pre_mlsag_hash = function (rv) {
    var hashes = ''
    hashes += rv.message
    hashes += this.cn_fast_hash(this.serialize_rct_base(rv))
    var buf = serializeRangeProofs(rv)
    hashes += this.cn_fast_hash(buf)
    return this.cn_fast_hash(hashes)
  }

  function serializeRangeProofs (rv) {
    var buf = ''
    for (var i = 0; i < rv.p.rangeSigs.length; i++) {
      for (var j = 0; j < rv.p.rangeSigs[i].bsig.s.length; j++) {
        for (var l = 0; l < rv.p.rangeSigs[i].bsig.s[j].length; l++) {
          buf += rv.p.rangeSigs[i].bsig.s[j][l]
        }
      }
      buf += rv.p.rangeSigs[i].bsig.ee
      for (j = 0; j < rv.p.rangeSigs[i].Ci.length; j++) {
        buf += rv.p.rangeSigs[i].Ci[j]
      }
    }
    return buf
  }

  // message is normal prefix hash
  // inSk is vector of x,a
  // kimg is vector of kimg
  // destinations is vector of pubkeys (we skip and proxy outAmounts instead)
  // inAmounts is vector of strings
  // outAmounts is vector of strings
  // mixRing is matrix of pubkey, commit (dest, mask)
  // amountKeys is vector of scalars
  // indices is vector
  // txnFee is string
  this.genRct = function (message, inSk, kimg, /* destinations, */inAmounts, outAmounts, mixRing, amountKeys, indices, txnFee) {
    if (outAmounts.length !== amountKeys.length) { throw new Error('different number of amounts/amount_keys') }
    for (var i = 0; i < mixRing.length; i++) {
      if (mixRing[i].length <= indices[i]) { throw new Error('bad mixRing/index size') }
    }
    if (mixRing.length !== inSk.length) { throw new Error('mismatched mixRing/inSk') }
    if (inAmounts.length !== inSk.length) { throw new Error('mismatched inAmounts/inSk') }
    if (indices.length !== inSk.length) { throw new Error('mismatched indices/inSk') }

    var rv = {
      type: inSk.length === 1 ? RCTTypeFull : RCTTypeSimple,
      message: message,
      outPk: [],
      p: {
        rangeSigs: [],
        MGs: []
      },
      ecdhInfo: [],
      txnFee: txnFee.toString(),
      pseudoOuts: []
    }

    var sumout = Z
    var cmObj = {
      C: null,
      mask: null
    }
    var nrings = 64 // for base 2/current
    // compute range proofs, etc
    for (i = 0; i < outAmounts.length; i++) {
      var teststart = new Date().getTime()
      rv.p.rangeSigs[i] = this.proveRange(cmObj, outAmounts[i], nrings, 0, 0)
      var testfinish = new Date().getTime() - teststart
      console.log('Time take for range proof ' + i + ': ' + testfinish)
      rv.outPk[i] = cmObj.C
      sumout = this.sc_add(sumout, cmObj.mask)
      rv.ecdhInfo[i] = this.encode_rct_ecdh({ mask: cmObj.mask, amount: d2s(outAmounts[i]) }, amountKeys[i])
    }

    // simple
    console.log('-----------rv type', rv.type)
    if (rv.type === 2) {
      var ai = []
      var sumpouts = Z
      // create pseudoOuts
      for (i = 0; i < inAmounts.length - 1; i++) {
        ai[i] = this.random_scalar()
        sumpouts = this.sc_add(sumpouts, ai[i])
        rv.pseudoOuts[i] = commit(d2s(inAmounts[i]), ai[i])
      }
      ai[i] = this.sc_sub(sumout, sumpouts)
      rv.pseudoOuts[i] = commit(d2s(inAmounts[i]), ai[i])
      var fullMessage = this.get_pre_mlsag_hash(rv)
      for (i = 0; i < inAmounts.length; i++) {
        rv.p.MGs.push(this.proveRctMG(fullMessage, mixRing[i], inSk[i], kimg[i], ai[i], rv.pseudoOuts[i], indices[i]))
      }
    } else {
      var sumC = I
      // get sum of output commitments to use in MLSAG
      for (i = 0; i < rv.outPk.length; i++) {
        sumC = this.ge_add(sumC, rv.outPk[i])
      }
      sumC = this.ge_add(sumC, this.ge_scalarmult(H, d2s(rv.txnFee)))
      fullMessage = this.get_pre_mlsag_hash(rv)
      rv.p.MGs.push(this.proveRctMG(fullMessage, mixRing[0], inSk[0], kimg[0], sumout, sumC, indices[0]))
    }
    return rv
  }

  // end RCT functions

  this.add_pub_key_to_extra = function (extra, pubkey) {
    if (pubkey.length !== 64) throw new Error('Invalid pubkey length')
    // Append pubkey tag and pubkey
    extra += TX_EXTRA_TAGS.PUBKEY + pubkey
    return extra
  }

  this.add_nonce_to_extra = function (extra, nonce) {
    // Append extra nonce
    if ((nonce.length % 2) !== 0) {
      throw new Error('Invalid extra nonce')
    }
    if ((nonce.length / 2) > TX_EXTRA_NONCE_MAX_COUNT) {
      throw new Error('Extra nonce must be at most ' + TX_EXTRA_NONCE_MAX_COUNT + ' bytes')
    }
    // Add nonce tag
    extra += TX_EXTRA_TAGS.NONCE
    // Encode length of nonce
    extra += ('0' + (nonce.length / 2).toString(16)).slice(-2)
    // Write nonce
    extra += nonce
    return extra
  }

  this.get_payment_id_nonce = function (paymentId, pidEncrypt) {
    if (paymentId.length !== 64 && paymentId.length !== 16) {
      throw new Error('Invalid payment id')
    }
    var res = ''
    if (pidEncrypt) {
      res += TX_EXTRA_NONCE_TAGS.ENCRYPTED_PAYMENT_ID
    } else {
      res += TX_EXTRA_NONCE_TAGS.PAYMENT_ID
    }
    res += paymentId
    return res
  }

  this.abs_to_rel_offsets = function (offsets) {
    if (offsets.length === 0) return offsets
    for (var i = offsets.length - 1; i >= 1; --i) {
      offsets[i] = new BigInteger(offsets[i]).subtract(offsets[i - 1]).toString()
    }
    return offsets
  }

  this.getTxPrefixHash = function (tx) {
    var prefix = this.serialize_tx(tx, true)
    return this.cn_fast_hash(prefix)
  }

  this.get_tx_hash = function (tx) {
    if (typeof (tx) === 'string') {
      return this.cn_fast_hash(tx)
    } else {
      return this.cn_fast_hash(this.serialize_tx(tx))
    }
  }

  this.serialize_tx = function (tx, headeronly) {
    // tx: {
    //  version: uint64,
    //  unlock_time: uint64,
    //  extra: hex,
    //  vin: [{amount: uint64, k_image: hex, key_offsets: [uint64,..]},...],
    //  vout: [{amount: uint64, target: {key: hex}},...],
    //  signatures: [[s,s,...],...]
    // }
    if (headeronly === undefined) {
      headeronly = false
    }
    var buf = ''
    buf += this.encode_varint(tx.version)
    buf += this.encode_varint(tx.unlock_time)
    buf += this.encode_varint(tx.vin.length)
    var i, j
    for (i = 0; i < tx.vin.length; i++) {
      var vin = tx.vin[i]
      switch (vin.type) {
        case 'input_to_key':
          buf += '02'
          buf += this.encode_varint(vin.amount)
          buf += this.encode_varint(vin.key_offsets.length)
          for (j = 0; j < vin.key_offsets.length; j++) {
            buf += this.encode_varint(vin.key_offsets[j])
          }
          buf += vin.k_image
          break
        default:
          throw new Error('Unhandled vin type: ' + vin.type)
      }
    }
    buf += this.encode_varint(tx.vout.length)
    for (i = 0; i < tx.vout.length; i++) {
      var vout = tx.vout[i]
      buf += this.encode_varint(vout.amount)
      switch (vout.target.type) {
        case 'txout_to_key':
          buf += '02'
          buf += vout.target.key
          break
        default:
          throw new Error('Unhandled txout target type: ' + vout.target.type)
      }
    }
    if (!this.valid_hex(tx.extra)) {
      throw new Error('Tx extra has invalid hex')
    }
    buf += this.encode_varint(tx.extra.length / 2)
    buf += tx.extra
    if (!headeronly) {
      if (tx.vin.length !== tx.signatures.length) {
        throw new Error('Signatures length != vin length')
      }
      for (i = 0; i < tx.vin.length; i++) {
        for (j = 0; j < tx.signatures[i].length; j++) {
          buf += tx.signatures[i][j]
        }
      }
    }
    return buf
  }

  this.serialize_rct_tx_with_hash = function (tx) {
    var hashes = ''
    var buf = ''
    buf += this.serialize_tx(tx, true)
    hashes += this.cn_fast_hash(buf)
    var buf2 = this.serialize_rct_base(tx.rct_signatures)
    hashes += this.cn_fast_hash(buf2)
    buf += buf2
    var buf3 = serializeRangeProofs(tx.rct_signatures)
    // add MGs
    for (var i = 0; i < tx.rct_signatures.p.MGs.length; i++) {
      for (var j = 0; j < tx.rct_signatures.p.MGs[i].ss.length; j++) {
        buf3 += tx.rct_signatures.p.MGs[i].ss[j][0]
        buf3 += tx.rct_signatures.p.MGs[i].ss[j][1]
      }
      buf3 += tx.rct_signatures.p.MGs[i].cc
    }
    hashes += this.cn_fast_hash(buf3)
    buf += buf3
    var hash = this.cn_fast_hash(hashes)
    return {
      raw: buf,
      hash: hash,
      prvkey: tx.prvkey
    }
  }

  this.serialize_rct_base = function (rv) {
    var buf = ''
    buf += this.encode_varint(rv.type)
    buf += this.encode_varint(rv.txnFee)
    if (rv.type === 2) {
      for (var i = 0; i < rv.pseudoOuts.length; i++) {
        buf += rv.pseudoOuts[i]
      }
    }
    if (rv.ecdhInfo.length !== rv.outPk.length) {
      throw new Error('mismatched outPk/ecdhInfo!')
    }
    for (i = 0; i < rv.ecdhInfo.length; i++) {
      buf += rv.ecdhInfo[i].mask
      buf += rv.ecdhInfo[i].amount
    }
    for (i = 0; i < rv.outPk.length; i++) {
      buf += rv.outPk[i]
    }
    return buf
  }

  this.generate_ring_signature = function (prefixHash, kImage, keys, sec, realIndex) {
    if (kImage.length !== STRUCT_SIZES.KEY_IMAGE * 2) {
      throw new Error('invalid key image length')
    }
    if (sec.length !== KEY_SIZE * 2) {
      throw new Error('Invalid secret key length')
    }
    if (prefixHash.length !== HASH_SIZE * 2 || !this.valid_hex(prefixHash)) {
      throw new Error('Invalid prefix hash')
    }
    if (realIndex >= keys.length || realIndex < 0) {
      throw new Error('realIndex is invalid')
    }
    var _GeToBytes = Module.cwrap('ge_tobytes', 'void', ['number', 'number'])
    var _geP3ToBytes = Module.cwrap('ge_p3_tobytes', 'void', ['number', 'number'])
    var _GeScalarmultBase = Module.cwrap('ge_scalarmult_base', 'void', ['number', 'number'])
    var _GeScalarmult = Module.cwrap('ge_scalarmult', 'void', ['number', 'number', 'number'])
    var _ScAdd = Module.cwrap('sc_add', 'void', ['number', 'number', 'number'])
    var _ScSub = Module.cwrap('sc_sub', 'void', ['number', 'number', 'number'])
    var _ScMulsub = Module.cwrap('sc_mulsub', 'void', ['number', 'number', 'number', 'number'])
    var _Sc0 = Module.cwrap('sc_0', 'void', ['number'])
    var _GeDoubleScalarmultBaseVartime = Module.cwrap('ge_double_scalarmult_base_vartime', 'void', ['number', 'number', 'number', 'number'])
    var _GeDoubleScalarmultPrecompVartime = Module.cwrap('ge_double_scalarmult_precomp_vartime', 'void', ['number', 'number', 'number', 'number', 'number'])
    var _GeFrombytesVartime = Module.cwrap('ge_frombytes_vartime', 'number', ['number', 'number'])
    var _GeDsmPrecomp = Module.cwrap('ge_dsm_precomp', 'void', ['number', 'number'])

    var bufSize = STRUCT_SIZES.EC_POINT * 2 * keys.length
    var bufM = Module._malloc(bufSize)
    var sigSize = STRUCT_SIZES.SIGNATURE * keys.length
    var sigM = Module._malloc(sigSize)

    // Struct pointer helper functions
    function bufA (i) {
      return bufM + STRUCT_SIZES.EC_POINT * (2 * i)
    }
    function bufB (i) {
      return bufM + STRUCT_SIZES.EC_POINT * (2 * i + 1)
    }
    function sigC (i) {
      return sigM + STRUCT_SIZES.EC_SCALAR * (2 * i)
    }
    function sigR (i) {
      return sigM + STRUCT_SIZES.EC_SCALAR * (2 * i + 1)
    }
    var imageM = Module._malloc(STRUCT_SIZES.KEY_IMAGE)
    Module.HEAPU8.set(hextobin(kImage), imageM)
    var i
    var imageUnpM = Module._malloc(STRUCT_SIZES.GE_P3)
    var imagePreM = Module._malloc(STRUCT_SIZES.GE_DSMP)
    var sumM = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    var kM = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    var hM = Module._malloc(STRUCT_SIZES.EC_SCALAR)
    var tmp2M = Module._malloc(STRUCT_SIZES.GE_P2)
    var tmp3M = Module._malloc(STRUCT_SIZES.GE_P3)
    var pubM = Module._malloc(KEY_SIZE)
    var secM = Module._malloc(KEY_SIZE)
    Module.HEAPU8.set(hextobin(sec), secM)
    if (_GeFrombytesVartime(imageUnpM, imageM) !== 0) {
      throw new Error('failed to call ge_frombytes_vartime')
    }
    _GeDsmPrecomp(imagePreM, imageUnpM)
    _Sc0(sumM)
    for (i = 0; i < keys.length; i++) {
      if (i === realIndex) {
        // Real key
        var rand = this.random_scalar()
        Module.HEAPU8.set(hextobin(rand), kM)
        _GeScalarmultBase(tmp3M, kM)
        _geP3ToBytes(bufA(i), tmp3M)
        var ec = this.hash_to_ec(keys[i])
        Module.HEAPU8.set(hextobin(ec), tmp3M)
        _GeScalarmult(tmp2M, kM, tmp3M)
        _GeToBytes(bufB(i), tmp2M)
      } else {
        Module.HEAPU8.set(hextobin(this.random_scalar()), sigC(i))
        Module.HEAPU8.set(hextobin(this.random_scalar()), sigR(i))
        Module.HEAPU8.set(hextobin(keys[i]), pubM)
        if (Module.ccall('ge_frombytes_vartime', 'void', ['number', 'number'], [tmp3M, pubM]) !== 0) {
          throw new Error('Failed to call ge_frombytes_vartime')
        }
        _GeDoubleScalarmultBaseVartime(tmp2M, sigC(i), tmp3M, sigR(i))
        _GeToBytes(bufA(i), tmp2M)
        ec = this.hash_to_ec(keys[i])
        Module.HEAPU8.set(hextobin(ec), tmp3M)
        _GeDoubleScalarmultPrecompVartime(tmp2M, sigR(i), tmp3M, sigC(i), imagePreM)
        _GeToBytes(bufB(i), tmp2M)
        _ScAdd(sumM, sumM, sigC(i))
      }
    }
    var bufBin = Module.HEAPU8.subarray(bufM, bufM + bufSize)
    var scalar = this.hash_to_scalar(prefixHash + bintohex(bufBin))
    Module.HEAPU8.set(hextobin(scalar), hM)
    _ScSub(sigC(realIndex), hM, sumM)
    _ScMulsub(sigR(realIndex), sigC(realIndex), secM, kM)
    var sigData = bintohex(Module.HEAPU8.subarray(sigM, sigM + sigSize))
    var sigs = []
    for (var k = 0; k < keys.length; k++) {
      sigs.push(sigData.slice(STRUCT_SIZES.SIGNATURE * 2 * k, STRUCT_SIZES.SIGNATURE * 2 * (k + 1)))
    }
    Module._free(imageM)
    Module._free(imageUnpM)
    Module._free(imagePreM)
    Module._free(sumM)
    Module._free(kM)
    Module._free(hM)
    Module._free(tmp2M)
    Module._free(tmp3M)
    Module._free(bufM)
    Module._free(sigM)
    Module._free(pubM)
    Module._free(secM)
    return sigs
  }

  this.construct_tx = function (keys, sources, dsts, feeAmount, paymentId, pidEncrypt, realDestViewKey, unlockTime, rct) {
    // we move payment ID stuff here, because we need txkey to encrypt
    var txkey = this.random_keypair()
    console.log(txkey)
    var extra = ''
    if (paymentId) {
      if (pidEncrypt && paymentId.length !== INTEGRATED_ID_SIZE * 2) {
        throw new Error('payment ID must be ' + INTEGRATED_ID_SIZE + ' bytes to be encrypted!')
      }
      console.log('Adding payment id: ' + paymentId)
      if (pidEncrypt) { // get the derivation from our passed viewkey, then hash that + tail to get encryption key
        var pidKey = this.cn_fast_hash(this.generate_key_derivation(realDestViewKey, txkey.sec) + ENCRYPTED_PAYMENT_ID_TAIL.toString(16)).slice(0, INTEGRATED_ID_SIZE * 2)
        console.log('Txkeys:', txkey, 'Payment ID key:', pidKey)
        paymentId = this.hex_xor(paymentId, pidKey)
      }
      var nonce = this.get_paymentId_nonce(paymentId, pidEncrypt)
      console.log('Extra nonce: ' + nonce)
      extra = this.add_nonce_to_extra(extra, nonce)
    }
    var tx = {
      unlock_time: unlockTime,
      version: rct ? CURRENT_TX_VERSION : OLD_TX_VERSION,
      extra: extra,
      prvkey: '',
      vin: [],
      vout: []
    }
    if (rct) {
      tx.rct_signatures = {}
    } else {
      tx.signatures = []
    }
    tx.prvkey = txkey.sec

    var inContexts = []
    var inputsMoney = BigInteger.ZERO
    var i, j

    console.log('Sources: ')
    // run the for loop twice to sort ins by key image
    // first generate key image and other construction data to sort it all in one go
    for (i = 0; i < sources.length; i++) {
      console.log(i + ': ' + this.formatMoneyFull(sources[i].amount))
      if (sources[i].real_out >= sources[i].outputs.length) {
        throw new Error('real index >= outputs.length')
      }
      // inputsMoney = inputsMoney.add(sources[i].amount);

      // sets res.mask among other things. mask is identity for non-rct transactions
      // and for coinbase ringct (type = 0) txs.
      var res = this.generate_key_image_helper_rct(keys, sources[i].real_out_tx_key, sources[i].real_out_in_tx, sources[i].mask) // mask will be undefined for non-rct
      // inContexts.push(res.in_ephemeral);

      // now we mark if this is ringct coinbase txs. such transactions
      // will have identity mask. Non-ringct txs will have  sources[i].mask set to null.
      // this only works if beckend will produce masks in get_unspent_outs for
      // coinbaser ringct txs.
      // is_rct_coinbases.push((sources[i].mask ? sources[i].mask === I : 0));

      console.log('res.in_ephemeral.pub', res, res.in_ephemeral.pub, sources, i)
      if (res.in_ephemeral.pub !== sources[i].outputs[sources[i].real_out].key) {
        throw new Error('in_ephemeral.pub != source.real_out.key')
      }
      sources[i].key_image = res.image
      sources[i].in_ephemeral = res.in_ephemeral
    }
    // sort ins
    sources.sort(function (a, b) {
      return (
        BigInteger.parse(a.key_image, 16).compare(
          BigInteger.parse(b.key_image, 16)
        ) * -1
      )
    })
    // copy the sorted sources data to tx
    for (i = 0; i < sources.length; i++) {
      inputsMoney = inputsMoney.add(sources[i].amount)
      inContexts.push(sources[i].in_ephemeral)
      var inputToKey = {}
      inputToKey.type = 'input_to_key'
      inputToKey.amount = sources[i].amount
      inputToKey.k_image = sources[i].key_image
      inputToKey.key_offsets = []
      for (j = 0; j < sources[i].outputs.length; ++j) {
        console.log('add to key offsets', sources[i].outputs[j].index, j, sources[i].outputs)
        inputToKey.key_offsets.push(sources[i].outputs[j].index)
      }
      console.log('key offsets before abs', inputToKey.key_offsets)
      inputToKey.key_offsets = this.abs_to_rel_offsets(inputToKey.key_offsets)
      console.log('key offsets after abs', inputToKey.key_offsets)
      tx.vin.push(inputToKey)
    }
    var outputsMoney = BigInteger.ZERO
    var outIndex = 0
    var amountKeys = [] // rct only
    for (i = 0; i < dsts.length; ++i) {
      if (new BigInteger(dsts[i].amount).compare(0) < 0) {
        throw new Error('dst.amount < 0') // amount can be zero if no change
      }
      dsts[i].keys = this.decode_address(dsts[i].address)

      // R = rD for subaddresses
      if (this.is_subaddress(dsts[i].address)) {
        txkey.pub = this.ge_scalarmult(dsts[i].keys.spend, txkey.sec)
      }
      var outDerivation
      // send change to ourselves
      if (dsts[i].keys.view === keys.view.pub) {
        outDerivation = this.generate_key_derivation(txkey.pub, keys.view.sec)
      } else {
        outDerivation = this.generate_key_derivation(dsts[i].keys.view, txkey.sec)
      }

      if (rct) {
        amountKeys.push(this.derivation_to_scalar(outDerivation, outIndex))
      }
      var outEphemeralPub = this.derive_public_key(outDerivation, outIndex, dsts[i].keys.spend)
      var out = {
        amount: dsts[i].amount.toString()
      }
      // txout_to_key
      out.target = {
        type: 'txout_to_key',
        key: outEphemeralPub
      }
      tx.vout.push(out)
      ++outIndex
      outputsMoney = outputsMoney.add(dsts[i].amount)
    }

    // add pub key to extra after we know whether to use R = rG or R = rD
    tx.extra = this.add_pub_key_to_extra(tx.extra, txkey.pub)

    if (outputsMoney.add(feeAmount).compare(inputsMoney) > 0) {
      throw new Error('outputs money (' + this.formatMoneyFull(outputsMoney) + ') + fee (' + this.formatMoneyFull(feeAmount) + ') > inputs money (' + this.formatMoneyFull(inputsMoney) + ')')
    }
    if (!rct) {
      for (i = 0; i < sources.length; ++i) {
        var srcKeys = []
        for (j = 0; j < sources[i].outputs.length; ++j) {
          srcKeys.push(sources[i].outputs[j].key)
        }
        var sigs = this.generate_ring_signature(this.getTxPrefixHash(tx), tx.vin[i].k_image, srcKeys, inContexts[i].sec, sources[i].real_out)
        tx.signatures.push(sigs)
      }
    } else { // rct
      var txnFee = feeAmount
      var keyimages = []
      var inSk = []
      var inAmounts = []
      var mixRing = []
      var indices = []
      for (i = 0; i < tx.vin.length; i++) {
        keyimages.push(tx.vin[i].k_image)
        inSk.push({
          x: inContexts[i].sec,
          a: inContexts[i].mask
        })
        inAmounts.push(tx.vin[i].amount)
        if (inContexts[i].mask !== I) {
          // if input is rct (has a valid mask), 0 out amount
          tx.vin[i].amount = '0'
        }
        mixRing[i] = []
        for (j = 0; j < sources[i].outputs.length; j++) {
          mixRing[i].push({
            dest: sources[i].outputs[j].key,
            mask: sources[i].outputs[j].commit
          })
        }
        indices.push(sources[i].real_out)
      }
      var outAmounts = []
      for (i = 0; i < tx.vout.length; i++) {
        outAmounts.push(tx.vout[i].amount)
        tx.vout[i].amount = '0' // zero out all rct outputs
      }
      console.log('rc signature----')
      var txPrefixHash = this.getTxPrefixHash(tx)
      tx.rct_signatures = this.genRct(txPrefixHash, inSk, keyimages, /* destinations, */inAmounts, outAmounts, mixRing, amountKeys, indices, txnFee)
    }
    console.log(tx)
    return tx
  }

  this.create_transaction = function (pubKeys, secKeys, dsts, outputs, mixOuts, fakeOutputsCount, feeAmount, paymentId, pidEncrypt, realDestViewKey, unlockTime, rct) {
    unlockTime = unlockTime || 0
    mixOuts = mixOuts || []
    var i, j
    if (dsts.length === 0) {
      throw new Error('Destinations empty')
    }
    if (mixOuts.length !== outputs.length && fakeOutputsCount !== 0) {
      throw new Error('Wrong number of mix outs provided (' + outputs.length + ' outputs, ' + mixOuts.length + ' mix outs)')
    }
    for (i = 0; i < mixOuts.length; i++) {
      if ((mixOuts[i].outputs || []).length < fakeOutputsCount) {
        throw new Error('Not enough outputs to mix with')
      }
    }
    var keys = {
      view: {
        pub: pubKeys.view,
        sec: secKeys.view
      },
      spend: {
        pub: pubKeys.spend,
        sec: secKeys.spend
      }
    }
    if (!this.valid_keys(keys.view.pub, keys.view.sec, keys.spend.pub, keys.spend.sec)) {
      throw new Error('Invalid secret keys!')
    }
    var neededMoney = BigInteger.ZERO
    for (i = 0; i < dsts.length; ++i) {
      neededMoney = neededMoney.add(dsts[i].amount)
      if (neededMoney.compare(UINT64_MAX) !== -1) {
        throw new Error('Output overflow!')
      }
    }
    var FoundMoney = BigInteger.ZERO
    var sources = []
    console.log('Selected transfers: ', outputs)
    for (i = 0; i < outputs.length; ++i) {
      FoundMoney = FoundMoney.add(outputs[i].amount)
      if (FoundMoney.compare(UINT64_MAX) !== -1) {
        throw new Error('Input overflow!')
      }
      var src = {
        outputs: []
      }
      src.amount = new BigInteger(outputs[i].amount).toString()
      if (mixOuts.length !== 0) {
        // Sort fake outputs by global index
        console.log('mix outs before sort', mixOuts[i].outputs)
        mixOuts[i].outputs.sort(function (a, b) {
          return new BigInteger(a.global_index).compare(b.global_index)
        })
        j = 0

        console.log('mix outs sorted', mixOuts[i].outputs)

        while ((src.outputs.length < fakeOutputsCount) && (j < mixOuts[i].outputs.length)) {
          var out = mixOuts[i].outputs[j]
          console.log('checking mixin', out, outputs[i])
          if (out.global_index === outputs[i].global_index) {
            console.log('got mixin the same as output, skipping')
            j++
            continue
          }
          var oe = {}
          oe.index = out.global_index.toString()
          oe.key = out.public_key
          if (rct) {
            if (out.rct) {
              oe.commit = out.rct.slice(0, 64) // add commitment from rct mix outs
            } else {
              if (outputs[i].rct) { throw new Error('mix rct outs missing commit') }
              oe.commit = zeroCommit(d2s(src.amount)) // create identity-masked commitment for non-rct mix input
            }
          }
          src.outputs.push(oe)
          j++
        }
      }
      var realOe = {}
      console.log('OUT FOR REAL:', outputs[i].global_index)
      realOe.index = new BigInteger(outputs[i].global_index || 0).toString()
      realOe.key = outputs[i].public_key
      if (rct) {
        if (outputs[i].rct) {
          realOe.commit = outputs[i].rct.slice(0, 64) // add commitment for real input
        } else {
          console.log('ZERO COMMIT')
          realOe.commit = zeroCommit(d2s(src.amount)) // create identity-masked commitment for non-rct input
        }
      }
      var realIndex = src.outputs.length
      for (j = 0; j < src.outputs.length; j++) {
        if (new BigInteger(realOe.index).compare(src.outputs[j].index) < 0) {
          realIndex = j
          break
        }
      }
      // Add realOe to outputs
      console.log('inserting real ouput at index', realIndex, realOe, outputs[i], i)
      src.outputs.splice(realIndex, 0, realOe)
      src.real_out_tx_key = outputs[i].tx_pub_key
      // Real output entry index
      src.real_out = realIndex
      src.real_out_in_tx = outputs[i].index
      console.log('check mask', outputs, rct, i)
      if (rct) {
        if (outputs[i].rct) {
          src.mask = outputs[i].rct.slice(64, 128) // encrypted or idenity mask for coinbase txs.
        } else {
          console.log('NULL MASK')
          src.mask = null // will be set by generate_key_image_helper_rct
        }
      }
      sources.push(src)
    }
    console.log('sources: ', sources)
    var change = {
      amount: BigInteger.ZERO
    }
    var cmp = neededMoney.compare(FoundMoney)
    if (cmp < 0) {
      change.amount = FoundMoney.subtract(neededMoney)
      if (change.amount.compare(feeAmount) !== 0) {
        throw new Error('early fee calculation != later')
      }
    } else if (cmp > 0) {
      throw new Error('Need more money than found! (have: ' + cnUtil.formatMoney(FoundMoney) + ' need: ' + cnUtil.formatMoney(neededMoney) + ')')
    }
    return this.construct_tx(keys, sources, dsts, feeAmount, paymentId, pidEncrypt, realDestViewKey, unlockTime, rct)
  }

  this.estimateRctSize = function (inputs, mixin, outputs) {
    var size = 0
    size += outputs * 6306
    size += ((mixin + 1) * 4 + 32 + 8) * inputs // key offsets + key image + amount
    size += 64 * (mixin + 1) * inputs + 64 * inputs // signature + pseudoOuts/cc
    size += 74 // extra + whatever, assume long payment ID
    return size
  }

  function trimRight (str, char) {
    while (str[str.length - 1] === char) str = str.slice(0, -1)
    return str
  }

  function padLeft (str, len, char) {
    while (str.length < len) {
      str = char + str
    }
    return str
  }

  this.printDsts = function (dsts) {
    for (var i = 0; i < dsts.length; i++) {
      console.log(dsts[i].address + ': ' + this.formatMoneyFull(dsts[i].amount))
    }
  }

  this.formatMoneyFull = function (units) {
    units = units.toString()
    var symbol = units[0] === '-' ? '-' : ''
    if (symbol === '-') {
      units = units.slice(1)
    }
    var decimal
    if (units.length >= config.coinUnitPlaces) {
      decimal = units.substr(units.length - config.coinUnitPlaces, config.coinUnitPlaces)
    } else {
      decimal = padLeft(units, config.coinUnitPlaces, '0')
    }
    return symbol + (units.substr(0, units.length - config.coinUnitPlaces) || '0') + '.' + decimal
  }

  this.formatMoneyFullSymbol = function (units) {
    return this.formatMoneyFull(units) + ' ' + config.coinSymbol
  }

  this.formatMoney = function (units) {
    var f = trimRight(this.formatMoneyFull(units), '0')
    if (f[f.length - 1] === '.') {
      return f.slice(0, f.length - 1)
    }
    return f
  }

  this.formatMoneySymbol = function (units) {
    return this.formatMoney(units) + ' ' + config.coinSymbol
  }

  this.parseMoney = function (str) {
    if (!str) return BigInteger.ZERO
    var negative = str[0] === '-'
    if (negative) {
      str = str.slice(1)
    }
    var decimalIndex = str.indexOf('.')
    if (decimalIndex === -1) {
      if (negative) {
        return BigInteger.multiply(str, config.coinUnits).negate()
      }
      return BigInteger.multiply(str, config.coinUnits)
    }
    if (decimalIndex + config.coinUnitPlaces + 1 < str.length) {
      str = str.substr(0, decimalIndex + config.coinUnitPlaces + 1)
    }
    if (negative) {
      return new BigInteger(str.substr(0, decimalIndex)).exp10(config.coinUnitPlaces)
        .add(new BigInteger(str.substr(decimalIndex + 1)).exp10(decimalIndex + config.coinUnitPlaces - str.length + 1)).negate
    }
    return new BigInteger(str.substr(0, decimalIndex)).exp10(config.coinUnitPlaces)
      .add(new BigInteger(str.substr(decimalIndex + 1)).exp10(decimalIndex + config.coinUnitPlaces - str.length + 1))
  }

  this.decompose_amount_into_digits = function (amount) {
    amount = amount.toString()
    var ret = []
    while (amount.length > 0) {
      // check so we don't create 0s
      if (amount[0] !== '0') {
        var digit = amount[0]
        while (digit.length < amount.length) {
          digit += '0'
        }
        ret.push(new BigInteger(digit))
      }
      amount = amount.slice(1)
    }
    return ret
  }

  this.decompose_tx_destinations = function (dsts, rct) {
    var out = []
    if (rct) {
      for (var i = 0; i < dsts.length; i++) {
        out.push({
          address: dsts[i].address,
          amount: dsts[i].amount
        })
      }
    } else {
      for (i = 0; i < dsts.length; i++) {
        var digits = this.decompose_amount_into_digits(dsts[i].amount)
        for (var j = 0; j < digits.length; j++) {
          if (digits[j].compare(0) > 0) {
            out.push({
              address: dsts[i].address,
              amount: digits[j]
            })
          }
        }
      }
    }
    return out.sort(function (a, b) {
      return a['amount'] - b['amount']
    })
  }

  this.is_tx_unlocked = function (unlockTime, blockchainHeight) {
    if (!config.maxBlockNumber) {
      throw new Error('Max block number is not set in config!')
    }
    if (unlockTime < config.maxBlockNumber) {
      // unlock time is block height
      return blockchainHeight >= unlockTime
    } else {
      // unlock time is timestamp
      var currentTime = Math.round(new Date().getTime() / 1000)
      return currentTime >= unlockTime
    }
  }

  this.tx_locked_reason = function (unlockTime, blockchainHeight) {
    if (unlockTime < config.maxBlockNumber) {
      // unlock time is block height
      var numBlocks = unlockTime - blockchainHeight
      if (numBlocks <= 0) {
        return 'Transaction is unlocked'
      }
      var unlockPrediction = moment().add(numBlocks * config.avgBlockTime, 'seconds')
      // return "Will be unlocked in " + numBlocks + " blocks, ~" + unlockPrediction.fromNow(true) + ", " + unlockPrediction.calendar() + "";
      return 'Will be unlocked in ' + numBlocks + ' blocks, ~' + unlockPrediction.fromNow(true)
    } else {
      // unlock time is timestamp
      var currentTime = Math.round(new Date().getTime() / 1000)
      var timeDifference = unlockTime - currentTime
      if (timeDifference <= 0) {
        return 'Transaction is unlocked'
      }
      var unlockMoment = moment(unlockTime * 1000)
      // return "Will be unlocked " + unlockMoment.fromNow() + ", " + unlockMoment.calendar();
      return 'Will be unlocked ' + unlockMoment.fromNow()
    }
  }
}

module.exports = cnUtil
