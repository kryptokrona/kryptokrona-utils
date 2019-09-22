// Copyright by Undiclosed Author(s) of Unknown Origin
// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const crc = require('crc')
const defaultWordset = 'english'
const GetRandomValues = require('get-random-values')
const words = require('./mnemonicWords')

class Mnemonic {
  static encode (str, wordsetName) {
    return encode(str, wordsetName)
  }

  static decode (str, wordsetName) {
    return decode(str, wordsetName)
  }

  static random (bits) {
    return random(bits)
  }

  static get words () {
    return words
  }

  static get languages () {
    return Object.keys(words)
  }
}

function getChecksumIndex (words, prefixLength) {
  var trimmerWords = ''
  for (var i = 0; i < words.length; i++) {
    trimmerWords += words[i].slice(0, prefixLength)
  }
  var checksum = crc.crc32(trimmerWords)
  var index = checksum % words.length
  return index
}

function encode (str, wordsetName) {
  wordsetName = wordsetName || defaultWordset
  var wordset = words[wordsetName]
  var out = []
  var n = wordset.words.length
  for (var j = 0; j < str.length; j += 8) {
    str = str.slice(0, j) + swapEndian4byte(str.slice(j, j + 8)) + str.slice(j + 8)
  }
  for (var i = 0; i < str.length; i += 8) {
    var x = parseInt(str.substr(i, 8), 16)
    var w1 = (x % n)
    var w2 = (Math.floor(x / n) + w1) % n
    var w3 = (Math.floor(Math.floor(x / n) / n) + w2) % n
    out = out.concat([wordset.words[w1], wordset.words[w2], wordset.words[w3]])
  }
  if (wordset.prefixLength > 0) {
    out.push(out[getChecksumIndex(out, wordset.prefixLength)])
  }
  return out.join(' ')
}

function swapEndian4byte (str) {
  if (str.length !== 8) throw new Error('Invalid input length: ' + str.length)
  return str.slice(6, 8) + str.slice(4, 6) + str.slice(2, 4) + str.slice(0, 2)
}

function decode (str, wordsetName) {
  wordsetName = wordsetName || defaultWordset
  var wordset = words[wordsetName]
  var out = ''
  var n = wordset.words.length
  var wlist = str.toLowerCase().split(' ')
  var checksumWord = ''
  if (wlist.length < 12) throw new Error("You've entered too few words, please try again")
  if ((wordset.prefixLength === 0 && (wlist.length % 3 !== 0)) ||
    (wordset.prefixLength > 0 && (wlist.length % 3 === 2))) throw new Error("You've entered too few words, please try again")
  if (wordset.prefixLength > 0 && (wlist.length % 3 === 0)) throw new Error('You seem to be missing the last word in your private key, please try again')
  if (wordset.prefixLength > 0) {
    // Pop checksum from mnemonic
    checksumWord = wlist.pop()
  }
  // Decode mnemonic
  for (var i = 0; i < wlist.length; i += 3) {
    var w1, w2, w3
    if (wordset.prefixLength === 0) {
      w1 = wordset.words.indexOf(wlist[i])
      w2 = wordset.words.indexOf(wlist[i + 1])
      w3 = wordset.words.indexOf(wlist[i + 2])
    } else {
      w1 = wordset.trunc_words.indexOf(wlist[i].slice(0, wordset.prefixLength))
      w2 = wordset.trunc_words.indexOf(wlist[i + 1].slice(0, wordset.prefixLength))
      w3 = wordset.trunc_words.indexOf(wlist[i + 2].slice(0, wordset.prefixLength))
    }
    if (w1 === -1 || w2 === -1 || w3 === -1) {
      throw new Error('invalid word in mnemonic')
    }
    var x = w1 + n * (((n - w1) + w2) % n) + n * n * (((n - w2) + w3) % n)
    if (x % n !== w1) throw new Error('Something went wrong when decoding your private key, please try again')
    out += swapEndian4byte(('0000000' + x.toString(16)).slice(-8))
  }
  // Verify checksum
  if (wordset.prefixLength > 0) {
    var index = getChecksumIndex(wlist, wordset.prefixLength)
    var expectedChecksumWord = wlist[index]
    if (expectedChecksumWord.slice(0, wordset.prefixLength) !== checksumWord.slice(0, wordset.prefixLength)) {
      throw new Error('Your private key could not be verified, please try again')
    }
  }
  return out
}

function random (bits) {
  if (bits % 32 !== 0) throw new Error('Something weird went wrong: Invalid number of bits - ' + bits)
  var array = new Uint8Array(bits / 8)

  var i = 0

  function arrIsZero () {
    for (var j = 0; j < bits / 8; ++j) {
      if (array[j] !== 0) return false
    }
    return true
  }

  do {
    GetRandomValues(array)

    ++i
  } while (i < 5 && arrIsZero())
  if (arrIsZero()) {
    throw new Error('Something went wrong and we could not securely generate random data for your account')
  }
  // Convert to hex
  var out = ''
  for (var j = 0; j < bits / 8; ++j) {
    out += ('0000000' + array[j].toString(16)).slice(-8)
  }
  return out
}

module.exports = Mnemonic
