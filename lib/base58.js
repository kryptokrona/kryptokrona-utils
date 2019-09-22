// Copyright (c) 2014-2018, MyMonero.com
// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

const alphabet = (function () {
  const alphabetStr = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const arr = []
  for (var i = 0; i < alphabetStr.length; i++) {
    arr.push(alphabetStr.charCodeAt(i))
  }
  return arr
})()
const alphabetSize = alphabet.length
const BigInteger = require('./biginteger.js')
const encodedBlockSizes = [0, 2, 3, 5, 6, 7, 9, 10, 11]
const fullBlockSize = 8
const fullEncodedBlockSize = 11
const UINT64_MAX = new BigInteger(2).pow(64)

class Base58 {
  static bintohex (bin) {
    return bintohex(bin)
  }

  static bintostr (bin) {
    return bintostr(bin)
  }

  static decode (enc) {
    return decode(enc)
  }

  static encode (hex) {
    return encode(hex)
  }

  static hextobin (hex) {
    return hextobin(hex)
  }

  static hextostr (hex) {
    return hextostr(hex)
  }

  static strtobin (str) {
    return strtobin(str)
  }

  static strtohex (str) {
    return strtohex(str)
  }
}

function bintohex (bin) {
  var out = []
  for (var i = 0; i < bin.length; ++i) {
    out.push(('0' + bin[i].toString(16)).slice(-2))
  }
  return out.join('')
}

function bintostr (bin) {
  var out = []
  for (var i = 0; i < bin.length; i++) {
    out.push(String.fromCharCode(bin[i]))
  }
  return out.join('')
}

function decode (enc) {
  enc = strtobin(enc)
  if (enc.length === 0) {
    return ''
  }
  var fullBlockCount = Math.floor(enc.length / fullEncodedBlockSize)
  var lastBlockSize = enc.length % fullEncodedBlockSize
  var lastBlockDecodedSize = encodedBlockSizes.indexOf(lastBlockSize)
  if (lastBlockDecodedSize < 0) {
    throw new Error('Invalid encoded length')
  }
  var dataSize = fullBlockCount * fullBlockSize + lastBlockDecodedSize
  var data = new Uint8Array(dataSize)
  for (var i = 0; i < fullBlockCount; i++) {
    data = decodeBlock(enc.subarray(i * fullEncodedBlockSize, i * fullEncodedBlockSize + fullEncodedBlockSize), data, i * fullBlockSize)
  }
  if (lastBlockSize > 0) {
    data = decodeBlock(enc.subarray(fullBlockCount * fullEncodedBlockSize, fullBlockCount * fullEncodedBlockSize + lastBlockSize), data, fullBlockCount * fullBlockSize)
  }
  return bintohex(data)
}

function decodeBlock (data, buf, index) {
  if (data.length < 1 || data.length > fullEncodedBlockSize) {
    throw new Error('Invalid block length: ' + data.length)
  }

  var resSize = encodedBlockSizes.indexOf(data.length)
  if (resSize <= 0) {
    throw new Error('Invalid block size')
  }
  var resNum = new BigInteger(0)
  var order = new BigInteger(1)
  for (var i = data.length - 1; i >= 0; i--) {
    var digit = alphabet.indexOf(data[i])
    if (digit < 0) {
      throw new Error('Invalid symbol')
    }
    var product = order.multiply(digit).add(resNum)
    if (product.compare(UINT64_MAX) === 1) {
      throw new Error('Overflow')
    }
    resNum = product
    order = order.multiply(alphabetSize)
  }
  if (resSize < fullBlockSize && (new BigInteger(2).pow(8 * resSize).compare(resNum) <= 0)) {
    throw new Error('Overflow 2')
  }
  buf.set(uint64To8be(resNum, resSize), index)
  return buf
}

function encode (hex) {
  var data = hextobin(hex)
  if (data.length === 0) {
    return ''
  }
  var fullBlockCount = Math.floor(data.length / fullBlockSize)
  var lastBlockSize = data.length % fullBlockSize
  var resSize = fullBlockCount * fullEncodedBlockSize + encodedBlockSizes[lastBlockSize]

  var res = new Uint8Array(resSize)
  var i
  for (i = 0; i < resSize; ++i) {
    res[i] = alphabet[0]
  }
  for (i = 0; i < fullBlockCount; i++) {
    res = encodeBlock(data.subarray(i * fullBlockSize, i * fullBlockSize + fullBlockSize), res, i * fullEncodedBlockSize)
  }
  if (lastBlockSize > 0) {
    res = encodeBlock(data.subarray(fullBlockCount * fullBlockSize, fullBlockCount * fullBlockSize + lastBlockSize), res, fullBlockCount * fullEncodedBlockSize)
  }
  return bintostr(res)
}

function encodeBlock (data, buf, index) {
  if (data.length < 1 || data.length > fullEncodedBlockSize) {
    throw new Error('Invalid block length: ' + data.length)
  }
  var num = uint8BeTo64(data)
  var i = encodedBlockSizes[data.length] - 1
  while (num.compare(0) === 1) {
    var div = num.divRem(alphabetSize)
    var remainder = div[1]
    num = div[0]
    buf[index + i] = alphabet[remainder.toJSValue()]
    i--
  }
  return buf
}

function hextobin (hex) {
  if (hex.length % 2 !== 0) throw new Error('Hex string has invalid length!')
  var res = new Uint8Array(hex.length / 2)
  for (var i = 0; i < hex.length / 2; ++i) {
    res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return res
}

function hextostr (hex) {
  var h2b = hextobin(hex)
  var res = ''
  for (var i = 0; i < h2b.length; i++) {
    res = res + String.fromCharCode(h2b[i])
  }
  return res
}

function strtobin (str) {
  var res = new Uint8Array(str.length)
  for (var i = 0; i < str.length; i++) {
    res[i] = str.charCodeAt(i)
  }
  return res
}

function strtohex (str) {
  return bintohex(strtobin(str))
}

function uint8BeTo64 (data) {
  if (data.length < 1 || data.length > 8) {
    throw new Error('Invalid input length')
  }
  var res = BigInteger.ZERO
  var twopow8 = new BigInteger(2).pow(8)
  var i = 0
  switch (9 - data.length) {
    case 1:
      res = res.add(data[i++])
      /* falls through */
    case 2:
      res = res.multiply(twopow8).add(data[i++])
      /* falls through */
    case 3:
      res = res.multiply(twopow8).add(data[i++])
      /* falls through */
    case 4:
      res = res.multiply(twopow8).add(data[i++])
      /* falls through */
    case 5:
      res = res.multiply(twopow8).add(data[i++])
      /* falls through */
    case 6:
      res = res.multiply(twopow8).add(data[i++])
      /* falls through */
    case 7:
      res = res.multiply(twopow8).add(data[i++])
      /* falls through */
    case 8:
      res = res.multiply(twopow8).add(data[i++])
      break
    default:
      throw new Error('Impossible condition')
  }
  return res
}

function uint64To8be (num, size) {
  var res = new Uint8Array(size)
  if (size < 1 || size > 8) {
    throw new Error('Invalid input length')
  }
  var twopow8 = new BigInteger(2).pow(8)
  for (var i = size - 1; i >= 0; i--) {
    res[i] = num.remainder(twopow8).toJSValue()
    num = num.divide(twopow8)
  }
  return res
}

module.exports = Base58
