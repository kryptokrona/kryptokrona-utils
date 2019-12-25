// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Reader = require('./reader')
const Writer = require('./writer')

const PortableStorageConstants = {
  signatureA: 0x01011101,
  signatureB: 0x01020101,
  version: 1
}

class PortableStorage {
  constructor (hexData, skipHeader) {
    this.version = PortableStorageConstants.version
    this.signatures = {
      A: PortableStorageConstants.signatureA,
      B: PortableStorageConstants.signatureB
    }
    this.entries = {}

    if ((hexData && hexData % 2 === 0) || hexData instanceof Buffer || hexData instanceof Reader) {
      const reader = new Reader(hexData)

      if (!skipHeader) {
        this.signatures.A = reader.nextUInt32()
        this.signatures.B = reader.nextUInt32()

        if (this.signatures.A !== PortableStorageConstants.signatureA || this.signatures.B !== PortableStorageConstants.signatureB) {
          throw new Error('Portable storage signature failure')
        }

        this.version = reader.nextUInt8()
      }

      this.entries = blobToEntries(reader)

      if (!skipHeader && reader.unreadBytes !== 0) {
        throw new Error('Unstructured data found in the stream')
      }
    }
  }

  toString (skipHeader) {
    const writer = new Writer()
    if (!skipHeader) {
      writer.writeUInt32(this.signatures.A)
      writer.writeUInt32(this.signatures.B)
      writer.writeUInt8(this.version)
    }
    writer.writeHex(entriesToBlob(this.entries))
    return writer.blob
  }
}

function blobToEntries (reader) {
  const entryCount = reader.nextLevinVarint()
  const entries = {}

  for (var i = 0; i < entryCount; i++) {
    const keyLength = reader.nextUInt8()
    const keyName = reader.nextBytes(keyLength).toString()
    const type = reader.nextUInt8()

    var arrCount, j, value, valueLength

    switch (type) {
      case 0x00:
        entries[keyName] = { type, value: null }
        break

      case 0x01:
        throw new Error('int64_t detected')

      case 0x02:
        throw new Error('int_t detected')

      case 0x03:
        throw new Error('int16_t detected')

      case 0x04:
        throw new Error('sbyte detected')

      case 0x05:
        entries[keyName] = { type, value: reader.nextBytes(8).toString('hex') }
        break

      case 0x06:
        entries[keyName] = { type, value: reader.nextUInt32() }
        break

      case 0x07:
        entries[keyName] = { type, value: reader.nextUInt16() }
        break

      case 0x08:
        entries[keyName] = { type, value: reader.nextUInt8() }
        break

      case 0x09:
        throw new Error('double detected')

      case 0x0a:
        valueLength = reader.nextLevinVarint()
        entries[keyName] = { type, value: reader.nextBytes(valueLength).toString('hex') }
        break

      case 0x0b:
        value = reader.nextUInt8()
        entries[keyName] = { type, value: (value === 1) }
        break

      case 0x0c:
        entries[keyName] = { type, value: new PortableStorage(reader, true) }
        break

      case 0x0d:
        throw new Error('object array detected')

      case 0x0e:
        valueLength = reader.nextLevinVarint()
        entries[keyName] = { type, value: reader.nextBytes(valueLength) }
        break

      case 0x8a:
        arrCount = reader.nextLevinVarint()
        entries[keyName] = { type, value: [] }

        for (j = 0; j < arrCount; j++) {
          const stringLength = reader.nextLevinVarint()

          entries[keyName].value.push(reader.nextBytes(stringLength).toString('hex'))
        }
        break

      case 0x8c:
        arrCount = reader.nextLevinVarint()
        entries[keyName] = { type, value: [] }

        for (j = 0; j < arrCount; j++) {
          entries[keyName].value.push(new PortableStorage(reader, true))
        }
        break
      default:
        throw new Error(type + ' not implemented')
    }
  }

  return entries
}

function entriesToBlob (entries) {
  const writer = new Writer()

  const keys = Object.keys(entries)

  writer.writeLevinVarint(keys.length)

  keys.forEach(key => {
    const keyName = Buffer.from(key)
    writer.writeUInt8(keyName.length)
    writer.writeBytes(keyName)
    writer.writeUInt8(entries[key].type)

    var value

    switch (entries[key].type) {
      case 0x00:
      case 0x01:
      case 0x02:
      case 0x03:
      case 0x04:
        throw new Error(entries[key].type + ' not implemented')
      case 0x05:
        writer.writeHex(entries[key].value)
        break
      case 0x06:
        writer.writeUInt32(entries[key].value)
        break
      case 0x07:
        writer.writeUInt16(entries[key].value)
        break
      case 0x08:
        writer.writeUInt8(entries[key].value)
        break
      case 0x09:
        throw new Error(entries[key].type + ' not implemented')
      case 0x0a:
        value = Buffer.from(entries[key].value, 'hex')
        writer.writeLevinVarint(value.length)
        writer.writeBytes(value)
        break
      case 0x0b:
        writer.writeUInt8((entries[key].value) ? 1 : 0)
        break
      case 0x0c:
        writer.writeHex(entries[key].value.toString(true))
        break
      case 0x0d:
        throw new Error(entries[key].type + ' not implemented')
      case 0x0e:
        writer.writeLevinVarint(entries[key].value.length)
        writer.writeBytes(entries[key].value)
        break
      case 0x8a:
        writer.writeLevinVarint(entries[key].value.length)
        entries[key].value.forEach(_value => {
          value = Buffer.from(_value, 'hex')
          writer.writeLevinVarint(value.length)
          writer.writeBytes(value)
        })
        break
      case 0x8c:
        writer.writeLevinVarint(entries[key].value.length)
        entries[key].value.forEach(_value => {
          writer.writeHex(_value.toString(true))
        })
        break
      default:
        throw new Error(entries[key].type + ' not implemented')
    }
  })

  return writer.blob
}

module.exports = PortableStorage
