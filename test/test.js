// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const assert = require('assert')
const Address = require('../').Address
const AddressPrefix = require('../').AddressPrefix
const Crypto = require('../').Crypto
const describe = require('mocha').describe
const it = require('mocha').it
const Transaction = require('../').Transaction
const LevinPacket = require('../').LevinPacket
const TurtleCoinCrypto = new Crypto()
const TurtleCoinUtils = require('../').CryptoNote
const cnUtil = new TurtleCoinUtils(require('../config.json'))

if (process.env.FORCE_JS) {
  if (TurtleCoinCrypto.forceJSCrypto()) {
    console.warn('Performing tests with JS Cryptographic library')
  } else {
    console.warn('Could not activate JS Cryptographic library')
    process.exit(1)
  }
} else {
  console.warn('Performing tests with C++ Cryptographic library')
}

describe('Cryptography', function () {
  this.timeout(10000)

  it('Generate Random Keys', () => {
    const keys = TurtleCoinCrypto.generateKeys()

    assert(keys)
  })

  it('Check Key - Public Key', () => {
    const key = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac'

    assert(TurtleCoinCrypto.checkKey(key) === true)
  })

  it('Check Key - Private Key', () => {
    const key = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'

    assert(TurtleCoinCrypto.checkKey(key) === false)
  })

  it('Tree Hash', () => {
    const expectedTreeHash = 'dff9b4e047803822e97fb25bb9acb8320648954e15a6ddf6fa757873793c535e'
    const treeHash = TurtleCoinCrypto.tree_hash([
      'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0',
      '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f',
      'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122',
      '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
    ])
    assert(treeHash === expectedTreeHash)
  })

  it('Tree Branch', () => {
    const expectedTreeBranch = [
      'f49291f9b352701d97dffad838def8cefcc34d1e767e450558261b161ab78cb1',
      '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f'
    ]

    const treeBranch = TurtleCoinCrypto.tree_branch([
      'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0',
      '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f',
      'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122',
      '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
    ])

    assert.deepStrictEqual(treeBranch, expectedTreeBranch)
  })

  const testdata = '0100fb8e8ac805899323371bb790db19218afd8db8e3755d8b90f39b3d5506a9abce4fa912244500000000ee8146d49fa93ee724deb57d12cbc6c6f3b924d946127c7a97418f9348828f0f02'

  const algos = [
    {
      name: 'CryptoNight Fast Hash',
      func: 'cn_fast_hash',
      hash: 'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0'
    },
    {
      name: 'CryptoNight v0',
      func: 'cn_slow_hash_v0',
      hash: '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f'
    },
    {
      name: 'CryptoNight v1',
      func: 'cn_slow_hash_v1',
      hash: 'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122'
    },
    {
      name: 'CryptoNight v2',
      func: 'cn_slow_hash_v2',
      hash: '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
    },
    {
      name: 'CryptoNight Lite v0',
      func: 'cn_lite_slow_hash_v0',
      hash: '28a22bad3f93d1408fca472eb5ad1cbe75f21d053c8ce5b3af105a57713e21dd'
    },
    {
      name: 'CryptoNight Lite v1',
      func: 'cn_lite_slow_hash_v1',
      hash: '87c4e570653eb4c2b42b7a0d546559452dfab573b82ec52f152b7ff98e79446f'
    },
    {
      name: 'CryptoNight Lite v2',
      func: 'cn_lite_slow_hash_v2',
      hash: 'b7e78fab22eb19cb8c9c3afe034fb53390321511bab6ab4915cd538a630c3c62'
    },
    {
      name: 'CryptoNight Dark v0',
      func: 'cn_dark_slow_hash_v0',
      hash: 'bea42eadd78614f875e55bb972aa5ec54a5edf2dd7068220fda26bf4b1080fb8'
    },
    {
      name: 'CryptoNight Dark v1',
      func: 'cn_dark_slow_hash_v1',
      hash: 'd18cb32bd5b465e5a7ba4763d60f88b5792f24e513306f1052954294b737e871'
    },
    {
      name: 'CryptoNight Dark v2',
      func: 'cn_dark_slow_hash_v2',
      hash: 'a18a14d94efea108757a42633a1b4d4dc11838084c3c4347850d39ab5211a91f'
    },
    {
      name: 'CryptoNight Dark Lite v0',
      func: 'cn_dark_lite_slow_hash_v0',
      hash: 'faa7884d9c08126eb164814aeba6547b5d6064277a09fb6b414f5dbc9d01eb2b'
    },
    {
      name: 'CryptoNight Dark Lite v1',
      func: 'cn_dark_lite_slow_hash_v1',
      hash: 'c75c010780fffd9d5e99838eb093b37c0dd015101c9d298217866daa2993d277'
    },
    {
      name: 'CryptoNight Dark Lite v2',
      func: 'cn_dark_lite_slow_hash_v2',
      hash: 'fdceb794c1055977a955f31c576a8be528a0356ee1b0a1f9b7f09e20185cda28'
    },
    {
      name: 'CryptoNight Turtle v0',
      func: 'cn_turtle_slow_hash_v0',
      hash: '546c3f1badd7c1232c7a3b88cdb013f7f611b7bd3d1d2463540fccbd12997982'
    },
    {
      name: 'CryptoNight Turtle v1',
      func: 'cn_turtle_slow_hash_v1',
      hash: '29e7831780a0ab930e0fe3b965f30e8a44d9b3f9ad2241d67cfbfea3ed62a64e'
    },
    {
      name: 'CryptoNight Turtle v2',
      func: 'cn_turtle_slow_hash_v2',
      hash: 'fc67dfccb5fc90d7855ae903361eabd76f1e40a22a72ad3ef2d6ad27b5a60ce5'
    },
    {
      name: 'CryptoNight Turtle Lite v0',
      func: 'cn_turtle_lite_slow_hash_v0',
      hash: '5e1891a15d5d85c09baf4a3bbe33675cfa3f77229c8ad66c01779e590528d6d3'
    },
    {
      name: 'CryptoNight Turtle Lite v1',
      func: 'cn_turtle_lite_slow_hash_v1',
      hash: 'ae7f864a7a2f2b07dcef253581e60a014972b9655a152341cb989164761c180a'
    },
    {
      name: 'CryptoNight Turtle Lite v2',
      func: 'cn_turtle_lite_slow_hash_v2',
      hash: 'b2172ec9466e1aee70ec8572a14c233ee354582bcb93f869d429744de5726a26'
    },
    {
      name: 'Chukwa',
      func: 'chukwa_slow_hash',
      hash: 'c0dad0eeb9c52e92a1c3aa5b76a3cb90bd7376c28dce191ceeb1096e3a390d2e'
    }
  ]

  algos.forEach((algo) => {
    it(algo.name, () => {
      const hash = TurtleCoinCrypto[algo.func](testdata)
      assert(algo.hash === hash)
    })
  })
})

describe('Wallets', () => {
  const rawSeed = 'dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c'
  const rawMnemonic = 'teeming taken piano ramped vegan jazz earth enjoy suture quick lied awkward ferry python often exotic cube hexagon ionic joyous cage abnormal hull jigsaw lied'
  const testAddress = 'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX'

  describe('Mnemonics', () => {
    it('address from mnemonic phrase has matching seed', () => {
      const result = Address.fromMnemonic(rawMnemonic)

      assert(rawSeed === result.seed)
    })

    it('address from seed has matching mnemonic phrase', () => {
      const result = Address.fromSeed(rawSeed)

      assert(rawMnemonic === result.mnemonic)
    })

    it('address from keys and seed have matching mnemonic phrases', () => {
      const result = Address.fromMnemonic(rawMnemonic)

      const result2 = Address.fromKeys(result.spend.privateKey, result.view.privateKey)

      assert(result.mnemonic === result2.mnemonic)
    })

    it('cannot create mnemonic phrase from non-deterministic keys', () => {
      const nonMnemonicPrivateSpendKey = '7a4a9a5b174e5713433fb5735a35b8fe8ce5bf411d5f6a587002e455a2b33703'
      const nonMnemonicPrivateViewKey = '3c986487d9b85e979e4f30eca56558874d2792ec73326d7aa0b2cf24c099ad0f'

      const result = Address.fromKeys(nonMnemonicPrivateSpendKey, nonMnemonicPrivateViewKey)

      assert(!result.mnemonic)
    })
  })

  describe('Wallet Creation', () => {
    const result = Address.fromEntropy(testAddress, 'english')

    const result2 = Address.fromKeys(result.spend.privateKey, result.view.privateKey)

    it('create new address', () => {
      assert(result)
    })

    it('create new address from keys', () => {
      assert(result.address === result2.address)
    })
  })

  describe('Message Signing', () => {
    it('sign a string message', () => {
      return cnUtil.signMessage('this is a test message', 'd4c7e338d7efe0468b6498dd2f96620fad6b103d1a70dea76bab4de9db9c0a0b')
    })

    it('sign an object-based message', () => {
      return cnUtil.signMessage({
        mac: 'deadbeef',
        amount: 10
      }, 'd4c7e338d7efe0468b6498dd2f96620fad6b103d1a70dea76bab4de9db9c0a0b')
    })

    it('verify signature - string message', () => {
      return cnUtil.verifyMessageSignature('this is a test message', '013099b244d5d86194f3bbf7a50772b50e6c73675a6866dc2f278139e35ba8e8', '9ef44c5b3ffe86e31b126e284227953bdb78714b40af4e43c66d4e4a72a3150096b2b8e6a974e5fbc5a6ed700381f5356e6f80ad0ca62b020382f37b00d4d401')
    })

    it('verify signature - object-based message', () => {
      return cnUtil.verifyMessageSignature({
        mac: 'deadbeef',
        amount: 10
      }, '013099b244d5d86194f3bbf7a50772b50e6c73675a6866dc2f278139e35ba8e8', 'f111faac9365c62eaf016364e9db6ec50060f379e9b0e480ba1dc41993c3380f55a6f4b10bb3e1d18ee0aa139157ee657a451746e5f6358199a7425e4f65af0c')
    })

    it('fail to verify signature - string message', () => {
      return cnUtil.verifyMessageSignature('this is a test message', '013099b244d5d86194f3bbf7a50772b50e6c73675a6866dc2f278139e35ba8e8', '9ef44c5b3ffe86e31b126e284227953bdb78714b40af4e43c66d4e4a72a3150096b2b8e6a974e5fbc5a6ed700381f5356e6f80ad0ca62b020382f37b00d4d401')
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })
  })
  describe('Keys', () => {
    const testPrivateKey = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'
    const testPublicKey = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac'

    it('create public key from private key', () => {
      return cnUtil.privateKeyToPublicKey(testPrivateKey)
        .then(publicKey => {
          assert(publicKey === testPublicKey)
        })
    })
  })

  describe('Prefix Detection', () => {
    const athenaAddress = 'athena28QHa49cTHWjRLYN1XW46Xj8D2mPiu7bovQ67V4z1C84R16VSJvbHmD2Yfq5Yvw5GKVTnfuS5pX3LXH3LNPezfLhhe5Lc27'
    const athenaPrefix = {
      prefix: 'ca9f97c218',
      base58: 'athena',
      decimal: 6581243850,
      hexadecimal: '18845cfca'
    }
    const calculatedPrefix = AddressPrefix.from(athenaAddress)

    it('detects proper Base58 prefix', () => {
      assert(athenaPrefix.base58 === calculatedPrefix.base58)
    })

    it('detects proper decimal prefix', () => {
      assert(athenaPrefix.decimal === calculatedPrefix.decimal)
    })

    it('encodes an existing address with an alternate prefix', () => {
      const newAddress = Address.fromEntropy(testAddress, 'english')
      const newAthenaAddress = Address.fromPublicKeys(newAddress.spend.publicKey, newAddress.view.publicKey, false, athenaPrefix.decimal)
      const newAthenaAddressByKey = Address.fromKeys(newAddress.spend.privateKey, newAddress.view.privateKey, athenaPrefix.decimal)

      assert(newAthenaAddress.address === newAthenaAddressByKey.address)
    })
  })
})

describe('SubWallets', () => {
  const baseWallet = Address.fromSeed('dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c')
  const subWallets = [
    Address.generateSubwallet(baseWallet.spend.privateKey, 0),
    Address.generateSubwallet(baseWallet.spend.privateKey, 1),
    Address.generateSubwallet(baseWallet.spend.privateKey, 2),
    Address.generateSubwallet(baseWallet.spend.privateKey, 64),
    Address.generateSubwallet(baseWallet.spend.privateKey, 65)
  ]

  it('creates subwallets', () => {
    assert((subWallets[0]) && (subWallets[1]) && (subWallets[2]) && (subWallets[3]) && (subWallets[4]))
  })

  it('Subwallet #0 matches base wallet', () => {
    assert(baseWallet.spend.privateKey, subWallets[0].spend.privateKey)
  })

  it('SubWallets #1 is correct', () => {
    assert(subWallets[1].spend.privateKey === 'c55cbe4fd1c49dca5958fa1c7b9212c2dbf3fd5bfec84de741d434056e298600')
  })

  it('SubWallets #2 is correct', () => {
    assert(subWallets[2].spend.privateKey === '9813c40428ed9b380a2f72bac1374a9d3852a974b0527e003cbc93afab764d01')
  })

  it('SubWallets #64 is correct', () => {
    assert(subWallets[3].spend.privateKey === '29c2afed13271e2bb3321c2483356fd8798f2709af4de3906b6627ec71727108')
  })

  it('SubWallets #65 is correct', () => {
    assert(subWallets[4].spend.privateKey === '0c6b5fff72260832558e35c38e690072503211af065056862288dc7fd992350a')
  })

  it('Subwallet #0 does not match any other subwallets', () => {
    for (var i = 1; i < subWallets.length; i++) {
      assert(subWallets[0].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #1 does not match any other subwallets', () => {
    for (var i = 2; i < subWallets.length; i++) {
      assert(subWallets[1].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #2 does not match any other subwallets', () => {
    for (var i = 3; i < subWallets.length; i++) {
      assert(subWallets[2].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #64 does not match any other subwallets', () => {
    for (var i = 4; i < subWallets.length; i++) {
      assert(subWallets[3].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #2 not found from Subwallet #1', () => {
    var key = TurtleCoinCrypto.cn_fast_hash(subWallets[1].spend.privateKey)
    assert(key !== subWallets[2].spend.privateKey)
    assert(TurtleCoinCrypto.scReduce32(key) !== subWallets[2].spend.privateKey)
  })

  it('Subwallet #64 not found from Subwallet #1', () => {
    var key = subWallets[1].spend.privateKey
    for (var i = 0; i < 63; i++) {
      key = TurtleCoinCrypto.cn_fast_hash(key)
    }
    assert(key !== subWallets[3].spend.privateKey)
    assert(TurtleCoinCrypto.scReduce32(key) !== subWallets[3].spend.privateKey)
  })

  it('Subwallet #65 not found from Subwallet #1', () => {
    var key = subWallets[1].spend.privateKey
    for (var i = 0; i < 64; i++) {
      key = TurtleCoinCrypto.cn_fast_hash(key)
    }
    assert(key !== subWallets[4].spend.privateKey)
    assert(TurtleCoinCrypto.scReduce32(key) !== subWallets[4].spend.privateKey)
  })

  it('Subwallet #64 not found from Subwallet #2', () => {
    var key = subWallets[2].spend.privateKey
    for (var i = 0; i < 62; i++) {
      key = TurtleCoinCrypto.cn_fast_hash(key)
    }
    assert(key !== subWallets[3].spend.privateKey)
    assert(TurtleCoinCrypto.scReduce32(key) !== subWallets[3].spend.privateKey)
  })

  it('Subwallet #65 not found from Subwallet #2', () => {
    var key = subWallets[2].spend.privateKey
    for (var i = 0; i < 63; i++) {
      key = TurtleCoinCrypto.cn_fast_hash(key)
    }
    assert(key !== subWallets[4].spend.privateKey)
    assert(TurtleCoinCrypto.scReduce32(key) !== subWallets[4].spend.privateKey)
  })
})

describe('Transactions', function () {
  this.timeout(10000)

  describe('Create Transaction Outputs', () => {
    it('Amount: 1234567', () => {
      const amount = 1234567
      const transfers = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 7)
    })

    it('Amount: 101010', () => {
      const amount = 101010
      const transfers = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 3)
    })

    it('Amount: 500000000000', () => {
      const amount = 500000000000
      const transfers = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 5)
    })

    it('Amount: 555555555555', () => {
      const amount = 955555555555
      const transfers = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 20)
    })
  })

  describe('Output Discovery', () => {
    const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
    const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
    const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'
    const derivation = TurtleCoinCrypto.generateKeyDerivation(txPublicKey, walletPrivateViewKey)
    const ourOutputIndex = 2

    it('underive public spend key (no match)', () => {
      const publicSpendKey1 = TurtleCoinCrypto.underivePublicKey(derivation, 0, 'aae1b90b4d0a7debb417d91b7f7aa8fdfd80c42ebc6757e1449fd1618a5a3ff1')
      assert(publicSpendKey1 !== walletPublicSpendKey)
    })

    it('underive public spend key (match)', () => {
      const publicSpendKey2 = TurtleCoinCrypto.underivePublicKey(derivation, ourOutputIndex, 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d')
      assert(publicSpendKey2 === walletPublicSpendKey)
    })

    it('scan output (no match)', () => {
      return cnUtil.isOurTransactionOutput(
        txPublicKey,
        {
          key: 'aae1b90b4d0a7debb417d91b7f7aa8fdfd80c42ebc6757e1449fd1618a5a3ff1',
          index: 0,
          amount: 1,
          globalIndex: 0
        },
        walletPrivateViewKey,
        walletPublicSpendKey)
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })

    it('scan output (match)', () => {
      return cnUtil.isOurTransactionOutput(
        txPublicKey,
        {
          key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
          index: ourOutputIndex,
          amount: 1,
          globalIndex: 0
        },
        walletPrivateViewKey,
        walletPublicSpendKey)
    })
  })

  describe('Key Images', () => {
    const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
    const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
    const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
    const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'
    const derivation = TurtleCoinCrypto.generateKeyDerivation(txPublicKey, walletPrivateViewKey)
    const ourOutputIndex = 2
    const expectedKeyImage = '5997cf23543ce2e05c327297a47f26e710af868344859a6f8d65683d8a2498b0'

    it('generate keyImage', () => {
      return cnUtil.generateKeyImage(txPublicKey, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex)
        .then(keyImage => {
          assert(keyImage === expectedKeyImage)
        })
    })

    it('generate keyImage primitive', () => {
      return cnUtil.generateKeyImagePrimitive(walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex, derivation)
        .then(keyImagePrimitive => {
          assert(keyImagePrimitive === expectedKeyImage)
        })
    })
  })

  describe('Input Offsets', () => {
    const idx = ['53984', '403047', '1533859', '1595598']
    const expectedIdx = ['53984', '349063', '1130812', '61739']
    const calculatedRelativeOffsets = cnUtil.absoluteToRelativeOffsets(idx)
    const calculatedAbsoluteOffsets = cnUtil.relativeToAbsoluteOffsets(calculatedRelativeOffsets)

    it('absolute to relative offsets', () => {
      for (let i = 0; i < expectedIdx.length; i++) {
        assert(parseInt(expectedIdx[i], 10) === calculatedRelativeOffsets[i])
      }
    })

    it('relative to absolute offsets', () => {
      for (let i = 0; i < idx.length; i++) {
        assert(parseInt(idx[i], 10) === calculatedAbsoluteOffsets[i])
      }
    })
  })

  describe('Creation', () => {
    it('generate a transaction', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, false, 0)
    })

    it('generate a fusion transaction', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 13080)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const inputs = []
      for (var i = 0; i < 12; i++) {
        inputs.push(madeInput)
      }

      const randomOutput = [
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]

      const randomOutputs = []
      for (i = 0; i < 12; i++) {
        randomOutputs.push(randomOutput)
      }

      return cnUtil.createTransaction(madeOutputs, inputs, randomOutputs, 3, 0, undefined, 0)
    })

    it('generate a transaction with arbitrary data payload', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      const message = { msg: '001100010010011110100001101101110011', paradoxResolution: true }

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, '', 0, message)
        .then(tx => {
          const data = JSON.parse(tx.extraData.toString())

          assert.deepStrictEqual(message, data)
        })
    })

    it('generate a transaction with close input keys', async function () {
      const expectedPrefix = '01000102904e04c9c8940101013f86a1c38f2f1b712b8ed1c0b9db5108d37469cee287b345c301e0d6298ad1011c0501027c58ce140c54108f92d088f345e2693f04e01d76221913af7ee5863d4ec88502090227b5375a8ec6037a2d2901b654e345c1134c11baf3c85fa29014b0dc9fecaaf15a0215140ab1db83d1cfbdfd240a869aa3e16e2b78913bea0b09cb469129e85a2f42900302ecda72c450d12342baf6e44dffdad2e99004e42cdc9cded7e88a3dcea9fc63eec03e0255b88b9cc6649a5bbee45bfeeaaad6e90150fe1951ead6486c1c044a90590cee2101980aaff7df61f7c8e52c8cec71c3c558b86a4f753886e44ed489e15c5c1e04a3'

      const tx = new Transaction()

      const KeyInput = require('../').KeyInput

      tx.inputs.push(new KeyInput(10000, [2434121, 1, 1, 63], '86a1c38f2f1b712b8ed1c0b9db5108d37469cee287b345c301e0d6298ad1011c'))

      const KeyOutput = require('../').KeyOutput

      tx.outputs = [
        new KeyOutput(1, '7c58ce140c54108f92d088f345e2693f04e01d76221913af7ee5863d4ec88502'),
        new KeyOutput(9, '27b5375a8ec6037a2d2901b654e345c1134c11baf3c85fa29014b0dc9fecaaf1'),
        new KeyOutput(90, '15140ab1db83d1cfbdfd240a869aa3e16e2b78913bea0b09cb469129e85a2f42'),
        new KeyOutput(400, 'ecda72c450d12342baf6e44dffdad2e99004e42cdc9cded7e88a3dcea9fc63ee'),
        new KeyOutput(8000, '55b88b9cc6649a5bbee45bfeeaaad6e90150fe1951ead6486c1c044a90590cee')]

      tx.addPublicKey('980aaff7df61f7c8e52c8cec71c3c558b86a4f753886e44ed489e15c5c1e04a3')

      assert(tx.prefix === expectedPrefix)
    })

    it('generate a transaction using payment Id', async function () {
      const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373506'
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, paymentId, 0)
          .then(tx => {
            assert(tx.paymentId === paymentId)
          })
    })

    it('generate a transaction using integrated address', async function () {
      const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373506'
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9ZnDBrCj846SpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzPs6LiD', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, '', 0)
          .then(tx => {
            assert(tx.paymentId === paymentId)
          })
    })

    it('generate a transaction using integrated address and matching payment ID',  async function () {
      const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373506'
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9ZnDBrCj846SpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzPs6LiD', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, paymentId, 0)
          .then(tx => {
            assert(tx.paymentId === paymentId)
          })
    })

    it('fail to generate a fusion transaction when not enough inputs are used', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 13080)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const inputs = []
      for (var i = 0; i < 6; i++) {
        inputs.push(madeInput)
      }

      const randomOutput = [
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]

      const randomOutputs = []
      for (i = 0; i < 6; i++) {
        randomOutputs.push(randomOutput)
      }

      return cnUtil.createTransaction(madeOutputs, inputs, randomOutputs, 3, 0, '', 0)
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })

    it('fail to generate a fusion transaction when not enough outputs are created', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 12000)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1000,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const inputs = []
      for (var i = 0; i < 12; i++) {
        inputs.push(madeInput)
      }

      const randomOutput = [
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]

      const randomOutputs = []
      for (i = 0; i < 12; i++) {
        randomOutputs.push(randomOutput)
      }

      return cnUtil.createTransaction(madeOutputs, inputs, randomOutputs, 3, 0, '', 0)
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })

    it('fail to generate a transaction when network fee is incorrect', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 100,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0)
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })

    it('fail to generate a transaction with an excessive number of outputs', async function () {
      const madeOutputs = []

      for (var i = 0; i < 100; i++) {
        cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90).forEach(out => madeOutputs.push(out))
      }

      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 16500,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 7500, '', 0)
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })

    it('fail to generate a transaction with too much extra data', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 100,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      const message = {
        msg: '001100010010011110100001101101110011',
        paradoxResolution: true,
        random: '5a4f86e32ab8533a7073eff7e321394a8751ab2b2f6e3219733eb5ccdb37974e8e67e9b95a285d3fffff862e6c1fbe281212d4bea1594f05824471f98ea76e51622c79c0f88ac8e3ffdfa9225a72973eabe0db8d5ce93034f67d7f334bfe74771e6b59e1d90b6539cc53482fe34a8de0ce7eb2875329ec7069b73a8cfe87dd33eeeffd38aa84c96d2e5878e0b17410c81c581a2c88c09a908953c2ef442efe26708ed0fdd7612f23b0002421193e4cceb6838e1b9fb2da8776ff3cbd414fcec5c8fe7bbbd9d011326317bc063a8fda6b4116622cca752732ec0574f2010caff279d369d0de930c9ad14e9f87b0697429d2ebedfe5bc4b909d5e31319eacfd24998739315efdfca2d06dee1297c51130d989f904583f80f92ce5b167a435b43d1a5ab3730a9fa55020c2374dbf2fa4e89b3e0e911acd86591c3129050cda4651292a38628be548e27f74f0453146ebff3479ab6031a8eeb4c83e027f935972b993a52df953ffdb14530a561fc4b05eb3c0af2cf913730815ec1b1ee79f4acbdea46b220e9571080ccbe684ea777611c743bdb4848b26d04ab877f1293f160bc1811ab5077a63c0838550e7fe3584f2ac5a11f87952580f522ac8bb44b8f96c3f0bb71b0ca8eeba64eb761ae9f6c671117a1391a5ad56a43f3f6483a9c4438c6f8cb53163754296469c40b5764e258240c0f8ce1f8b91b1a0f3a60a5794b55bf04c68aa616ea59cfbda4a79929af254c1b581ce65592a4814830dd72c125e6d834298fc96348b5be20129f15b61f8bb38c8f6766a097b03a4fa010eb26a7a3844f6813e97b413eb1dd3d36192b6f147fc7cded87ed3fa0c75d3551d9a86e92f92f5b0b5cb87d46c8fe7ff84ef73ceafb8ada54f08718333c4afa948f982649178b6832345f6368d42f4828739925b4b0b75930279157fb91498d7f37153402f48527e9eebc87e6cd5638da4af41be019df3592da344bb0bfa1919f54bcc25764c3f521cbb15f3e6cee84f1a9004884a5828ea7c5518a365c23535a604471a33da3b906c360b7b63b722cbbc4fc9f42891e157257390db6dd5c3176442eb087fd38fd69c1fa14ff40189ff036c2d85e5e19963d82f877a1b419b7627eedd1d7fdad07aa001bd31e71aa07329a4814b8c39a1ef741baffaa60c67095a2eeea9b5c9ec34dc13aa7748f7f5ac42793861f59ac2ce612341a6807256e8154734b98b15ee9d814c777e788f9008ed009b98550c472016836235517a4d13195af3aef51f277993fee9e0cde6fa843903e78b151d7298cf04f59350db1203423a455b3c20d571b7a2c0251fe345781b2d365e5fccae4ae3a0e25e6e3d15f00eef15ac8095ad0c1c0cda119b4bb19dd67b717619564143f08d106dd22686b37b0c4f29f6b70572996170755ed16157a13ce1468ee15a127cf6d19caa176aa47f67f4f13ad3e'
      }

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0, message)
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })

    it('fail to generate a transaction when output too large', async function () {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      madeOutputs[0].amount = 200000000000

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 100,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0)
        .then(() => {
          assert(false)
        })
        .catch(() => {
          assert(true)
        })
    })

    it('fail to generate transaction when payment ID does not match payment ID in integrated address', async function() {
      const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373505'
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9ZnDBrCj846SpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzPs6LiD', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1090,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, paymentId, 0)
          .then(() => { assert(false) })
          .catch(() => { assert(true)})
    })

    it('fail to generate transaction using two destinations with differing payment IDs', async function() {
      const madeOutputs = cnUtil.generateTransactionOutputs('TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9ZnDBrCj846SpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzPs6LiD', 90)
      const madeOutputs2 = cnUtil.generateTransactionOutputs('TRTLuxp8RkjA5TMvFWhSoz94bwe9fHbFpCb1f669XiNc95D7s7CShfW9unmPq2M3nS9jbdbx37dnH9unntNPGVmqA5LbzVL4HQrSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzPembYH', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 1180,
        globalIndex: 1595598
      }

      const madeInput = await cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

      const randomOutputs = [[
        {
          globalIndex: 53984,
          key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
        },
        {
          globalIndex: 403047,
          key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
        },
        {
          globalIndex: 1533859,
          key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
        }
      ]]

      return cnUtil.createTransaction(madeOutputs.concat(madeOutputs2), [madeInput], randomOutputs, 3, 1000, '', 0)
          .then(() => { assert(false) })
          .catch(() => { assert(true)})
    })
  })

  describe('Parsing', () => {
    it('Parse a transaction with a max unlock time', () => {
      const raw = '01feffffffffffffffff010102e80705a101b3094bee0afe0ecfbb15ec01455949cfb1969da686948ed1babb761b45b053f8db505bcce50645035a02144da66c147cb413b99504fecf2d23a23b605ca98327043208d1d0658dc7fc8e6402038e86bd155a518d9810c7b9c568ce665a4078df99b826007aac3bf43dd94edaa00602488c123065769f6017340d93f349f084afa805695034e4da6cb640b9fdfeda9544022100cad826dac837aa45954bd48e66173f0cf6ff653e42055855b88ccb34d074324a011c4fadf9225eed74d3953e388c74c227803336d2f0f0939b153617c0c86deff7692d63c7db269107e3b6842d9a31b5dbe4a7ebc3ab4ede9318c8089df0d9a7069d84f5bc9e15826c3e30cbf6386bbfe4936afd1967f41011e14f0a662207550ebf4dd5d7100e6100bdfdd4503d456dbc7a70593eeeb941e41cc0618e55c43505d2cb5619eb83c1e22a309143a826dcaeac84d8a8648d4ba86d1976d05c7384029c894d3b4ece9c9c6dfd5c699c38e3f90dc010ee1fd57930a9f38e744ade500ad7ca6418cdcf55ec0570f8cd22fe40a04a19ae55ccbdb0833fc41e2d62f06802fd65a556b2a187c2c115a0acf8b1b934c1efb9ec383f5de33f8b981803e45d09f63cb1c7dfa239e15df9c122b636899d93641e1e1a61ad8d8ceb5759a8dcad03dd7e0e459aa6d623ab9052b29e228bacd3bb89cdbdc82bd3a8b99615cdc4f309df7e33650eab865674672d381d38774351dc1e9db66492d4c1863ca30b0e8105'

      const tx = Transaction.from(raw)

      assert(raw === tx.toString())
    })
  })
})

describe('Blocks', function () {
  this.timeout(10000)

  const Block = require('../').Block
  const BlockTemplate = require('../').BlockTemplate

  describe('Structures', () => {
    const BlockTemplateSample = require('./template.json')
    const genesisBlockRaw = '010000000000000000000000000000000000000000000000000000000000000000000046000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500'
    const miningBlob = '0100b5f9abe605b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b01c93d9c621ab80000000004b27c162bc89b0bdfa0db8b5c99977943caf754bb6181d8e1bafc6af2ab0b0bb01'

    it('deserializes and reserializes block template', () => {
      const testBlock = Block.from(BlockTemplateSample.blocktemplate)

      assert(BlockTemplateSample.blocktemplate === testBlock.toString())
    })

    it('deserializes and serializes block', () => {
      const testBlock = Block.from(genesisBlockRaw)

      assert(genesisBlockRaw === testBlock.toString())
    })

    it('calculates mining blob', () => {
      const testBlockTemplate = BlockTemplate.from(BlockTemplateSample)
      const convertedTemplate = testBlockTemplate.convert()

      assert(convertedTemplate.toHashingString(true) === miningBlob)
    })

    it('merges blocks', () => {
      const testBlockTemplate = BlockTemplate.from(BlockTemplateSample)
      const mergedBlobResult = testBlockTemplate.construct(0x1c64)
      const expectedMergedBlob = '0500b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b01c93d9c621ab800100b5f9abe605b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b01c93d9c621ab80641c00000101000000230321008a7f7239a53ead2db2fc1062a898c1af301e919e2f26e13a568176ba7f1a0e1f01b9fe5801ff91fe58070802959f9d01c4cbd664e7c937687e7ae847f75745614ba4a11a6f5c0b25a5ca42c314026840ba5dc6c84a533d005f0a6f9758c4eb4d19bffa3b4a73547596dac17b7d169003022f88b7b85f42c789721e7ee44bded4b6e1e48f7fb9bb73dc87cda264adf06a54f02e02175cea7cf09b914749c650b9321678d3f0e4390cad20ac6896be7ac14ba4f31ab0ea01021192fdc86fd815642850c0f50bc11df8ba1d39581d2c0642aa83f72f1c3fb22580ea3002c28a03fb9b3b7f6e4f9cdf2e74e93c8282580d8134722302b9978cdc3a35f39980897a02a4978ee1742da6f77791f065326922ff8c713687d2b52215ce7911b08922a7602901296929051bf0b258b717ffdca80c8b0822063c9d3f70f0dbed9b3f2e0aca2fa1020600000000000012f6b48f1800c368e046252e50165620fbb155176d17ddfdb98fd3227237760cf579af90593ec64a4a5549bd219969dc9aa1aac2dc3eab529c90b2f8c20221f99f02bdfb9a7efb5e5e85b710ef442b3cc82431173db142947a4f755a22f45915e5f2d53027a4aee505305c7cde822f960578417779ef71c1c8b611e95f1643fd125a39df66f40ce82794c9debc342381f26763c80968f8bf8e5378b433c583a6078348457ebe6ad61e5487ac3bebe22e03c46d9c894a511561ffbe9612809c17207493941d607b152f4ce193f828085ee8afcc0a351a9cecac0f01b2729df67af831637f76a8430848d86beb643df918af6cc554a8d0b42899671ee02cfbe64905b4458647a90a50aa307be48f3db57ff7f5446926ee70cee0c0cf7ad9021de727b2f97b5e2f0fd0103b24725d0c11ddd876de27a7b837bdd43eb4d9ca479883ad2dcd853ece92e6a7544b24e44051411e6b913760b9d997ca986985b92d51ccbc5708f0cd93c0ce2d1aea46a6744cc81a3df394cd099518cb3c3a5fa43e187c9d72bc3a245256fa60b450411b56d2258d4001b6133f58a5d48af0cc12af652c202b3c9de3f426026500c493c075340ca713a49843db16bda542fd76fb597914e1c975a70d12971baf70b8f7f6f452fd669f3cc00d0a0f36a3312f7c51cadf24cac9c24841eeaa742b5d1e74a750e5763afbd2a75e341edb4439801ac665dd0a3b16cc648a651546c7a3633f0a0274bb3815d6bda05e12fb7cbb908ceb582590a84a30ba6043178279343f5107713390b8e2ca2a8723ee7e5855c6af674bbd9b5a'

      assert(mergedBlobResult.toString() === expectedMergedBlob)
    })

    it('sets miner transaction nonce', () => {
      const testBlockTemplate = BlockTemplate.from(BlockTemplateSample)
      testBlockTemplate.minerNonce++

      assert(testBlockTemplate.minerNonce === 1)
    })
  })

  describe('Hashing', () => {
    const blocks = [
      {
        block: '010000000000000000000000000000000000000000000000000000000000000000000046000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500',
        hash: '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c',
        pow: 'c47674de70b0f4b4dafcd5b3e423ee301de6c16093e57e93c7997c28c18a1b92',
        nonce: 70
      },
      {
        block: '0100b483aed1057fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c5f59fbb6012901ff01060202c88b97a816870f3179e4f963d2c3876ab28cbd685776e67af79294f4072bedb31e02db599739f69f2590687a5247508745254c04aa4e367866a91bc79bea9c456857c801021f46687138e0b9d29be92fe8d6ee8ea46c4dc9e57b050554039e7b3fc38712c580f10402fbd7a33c704ede0403a134fbcdf23bd3c74ffee8929aa0e6c81f08e2bad4718ca0f736028490517006f93c79bf19edaa2edde725bc3b1cb2b2e5422287c8c20ad1550e2880897a0243a264e0e9ef291c8bf6310e98adfd52a42eeaea791d2f4eb2304a181a3270d72101bcdd0d175a90ce8514f6832833461afec5c5e4d373400a5783b8b66ae38d59e000',
        hash: '8c9738f961a278486f27ce214d1e4d67e08f7400c8b38fe00cdd571a8d302c7d',
        pow: '5dc80c7f5b2266396999f746105ec6550b25f3d87b1eb52c0c05c5777d2e8392',
        nonce: 3069925727
      },
      {
        block: '02008c9738f961a278486f27ce214d1e4d67e08f7400c8b38fe00cdd571a8d302c7d0000b483aed10500000000000000000000000000000000000000000000000000000000000000004948e0db010000000023032100c65b39cd7039298b9694e6178a5a55364ca7b7cb1f4fb35b388a1bd5e4825ea3012a01ff0206020227ea00051423f6aace07448a2eb0eb4e8ae4006299c74a536ce8f2682069751a1e026eed7794fc693bfe1ba83b5e72a3277607a7e20c8c2ab1d5a6b951bd6be1e170c8010258d9f4894ce20ca17b214f1680a870677a0824a4dad75a12d4a06ba4db94060780f10402269f6c470b756eaaa7fd8fd3c56bef281714d82b1eb48877a6faadd77448b1ffa0f736022542809be833811cca2457bc677a909b64f101b1369a086e2448ba3f4f2198cf80897a02dfd6722b4bf027c5bc72885360a8e50ee2be4215d0dc17c9834cc84ab1ba6ac32101ead62bb586940d823e1a83e141340bc301be99c49f38c9847f6d1b7e0653d2b600',
        hash: '2ef060801dd27327533580cfa538849f9e1968d13418f2dd2535774a8c494bf4',
        pow: 'b771c7fe88088b77651b3513deda116b80cf8c31236e090cafd5d60275146c8a',
        nonce: 3688908873
      },
      {
        block: '03002ef060801dd27327533580cfa538849f9e1968d13418f2dd2535774a8c494bf40000b483aed1050000000000000000000000000000000000000000000000000000000000000000455b91ef0100000000230321009935291e2efc4565b0673cf18d1d4f33a4e5d18d86b26ceb2f577beb1dc3406f012b01ff03060102c5e55545994dbcc3b31efd8f777bafa0cad9e4f02971bbe69ef90abdc170dfe91e0295a4d62f2135b414437182009787171d9c27fa473f901cc569725e085b9e0f12c8010218779d15ab8e8da072470bd36ca052e6043451672c26d37e54b4d5bf50b9d42f80f1040216f65d51d576c1e452846da20dfedc42a26b7bb7fb8e2af919c380bc6cd759a7a0f73602ded1b8199cc98e413ebb22333c0a9681f1a26f3b1f2aee3c0129f50afafdcc7c80897a02384c3d8166770d32f9e61769b4f0aa8716ad7dacae24a631f5283d68158d33e621010ada647cf3319792b664ac3d01fc88c4b7df7aa3266da8895fe3dd33c7d6676b00',
        hash: '3ac40c464986437dafe9057f73780e1a3a6cd2f90e0c5fa69c5caab80556a68a',
        pow: 'a05b313e45a8f265d7fd88d9ea588d876a9802a2f0358914a23c7c0136a33b04',
        nonce: 4019280709
      },
      {
        block: '03003ac40c464986437dafe9057f73780e1a3a6cd2f90e0c5fa69c5caab80556a68a0000b683aed10500000000000000000000000000000000000000000000000000000000000000004adf3dd2010000000023032100743b609f508fd60bafbe7b01a3bd3915bbca5a306f453c133b8d2a99722cb585012c01ff04060102a4c328c97ba559a9bd9341a5499bfb1b1b053423b417174ef239db2be9e85b261e02dd1f0ea9176d8f292119b403687c9958193d15d0d16ae91c6ee799bcafd026c6c80102723cc40778b0bacb0c5103eec244c948a0b5322feda932b8040848358c0ae5e680f10402fe91b1c79a8eeb14605142227a45a47fb99815c8d806b9c54264bbe6ba67838ea0f73602e382cff75fe1190458773b5b7e1c7b2ab1183f18859878b9e71de78f1e608d4880897a02d3ded0758382ef5595626c38678a104775c9a0f6c709499a6322d153988b9ba72101316936a3fceb3c29f00cab5275d709dfac738648a3da75ae7720fdff4d1b19e000',
        hash: 'ac821fcb9e9c903abe494bbd2c8f3333602ebdb2f0a98519fc84899906a7f52b',
        pow: 'e03427d8a040555482976f6715976e67cf897e8f7c73bccc8d39b7286e6a0d00',
        nonce: 3527270218
      },
      {
        block: '040045aaec7312e7b85ae1c05408fbf4fe88ee44a72b85d9c9277f17596a0da84bfd010097c2a5d60545aaec7312e7b85ae1c05408fbf4fe88ee44a72b85d9c9277f17596a0da84bfd8cd10200010100000023032100a24280b42fc645a74a2079a30edf754ac383ed76711e061b3ddd98977199ede401d9ae1501ffb1ae15060102eb87270abf0d0c6a181d667b18df2ed7b3e63668fef4bc0111c9182a2e5c9ff41402d75e91fa351a3c3b7d5e5cde7dce9e153a250d774c8f016f4ff4ed28cbd9b427c80102099c7669c14c63fee2644e8e7e2e3fb8d6e7cdbc022e95ec83790a7d9310dc46d08603028df7d2197f9973232c02185af8eba79d525a19c74ca7538cd46af287fbca195fa0f73602a0a1327dc8c7b19770030cf74092e4e8f72b75286945f44f7d2d9f00e5ab5b7680897a02bdc3bb642bf881ed6722c438dd9d6193a162fb525936d07e08a81a4f658c6b742b01db6449146a051995398f26a99b633890c934782ce72a5f3030dc42b4676a5363020800000002059f142546a2a2bb6a81f85b550cf0464688d9ed5a574d74a5ba6c6da1cb7de96dd6d7c93b82b3f82fca90d167697e0557840aebe2b20ab2ca3a53ac689a42d49d2f5ba12523b884357a1f8f11d575358353925b5e6ed574fc1791e58f757d8bc2578c908eb45da6b5a2328e42baf36be97b5054ab340e114603f91a2030418189d48fbeb789fbd871ab800dee6bf3e0eba1e47ee0e05924af8d19e2c91f00bebd6c83b588614ef32963f8863057048703a64d03240e607c029d70d2ffca887cd2f7a5d7443f4c2de847005df443b060524d1e2f88fcad78ff9ec6648f42a6a6b765c67bb0bfe5c736a919dc20101350aadda3a1f7b92d2bcaa0eb353e6e47343702c7cb923532d64ae5c5678e2be69985b3b949fb1833ee28ef638c1d209cf127bd16dfbe5e62563324c01528d41fe7a4bae138658181b5a3f7c30d9bb447d4c2bafaf712078e531bbd256c1ad3bfa35460f2d29ed8ee513ce615fe27066632623e88ffaffc90a7710da52a92a10b35df1fc4815bf6d35c740f8418461a37523fb959f97b432827d80401503bf47ed30129981b3ddb4ca68c0072bb93606f2d7c67879b2fa56c42c5393af5d5dda280feef8f8061353fab02a09cb38b59b29cb635fa3411dda747c6e0cac34e36b70e8bef2f639d0d633ce469205131510da612c6db4a1fd668c6498bd81c2db66826da4693c7b6c3164755204bee16757bfd37af99ff374dcfb2f1d0431bf21db8bf51e1d00ffe36e12bf3bf20fdcd35a0711d0133827583e913995ff12376c520f7c5d8f32f08f026443027ee267b8525b26c224fef0a112600edd08457f2d7df07c169ac593d4fcbb6cbac0c429b7c3916d516f4dea3bf8fc31269369dac5378c716c67b82c3135110e34d5d2c61166b1bdd5c4825aafb5836d578881d081de120ec99663323ad1a751773e7cdc1d0d5cf319edb5f4fe1077490db89a6060f115bb5001048c35e9a74a9ab45fa7baa595baaf5312c775ef446ca2a4e362b623ca580fcd1e59f9932facdf2e8775c24162b62a81d8b35b9a52eaf301d211e92d713060b9c65efb28e95fd2faec8b9b3649e2bd27a3b0778efeebb03e2b1b2b35a3232e674c35ba48898f5df10a364e2142ea15e3e85622a14682c1c713139dc609e6bbe4527be4ef474ab00c86f2f591ef4f84884e4e3a034021599d12cd14fa810137b4262501e02d5cf3c3556a62b4f1912c295bb1aa01feda6b726515d107fed26596a922b068171290474a3e61700830e882d59c02f8c04a6e7477b1af2db438a831472b2a5c39b24d1092f9d0e5a0f11445693661081be52869bfb20730f7f24cd851d303af253b2d113b966d64caa3bd05749e4b2941dfa53460ee4a74c3735655f5b5eac2e9521f417dd8a5a48ea1712ca3b61b2a88f009870e3d3611d90561499aff37bf1b77befe4c9ffa6fcea7289081524ddb929deb7d17e46d3da640d366e7be3b75e4465e85594805e75e2474decf3bbff0ca31591ce4d254799452b0a117e9258b57c917f50776b505e32dbf01d69cc435175fb188ec90db58239fa9b5f6d064ae00aff0d133b987c8638163b0c7c27dd96c2a4ff6af6a2166df60f8414488d184cee8b8681266f9113aa0b5fa61de3e0a3fc282500b29087d4737f36fdfacf3380ea902edea57ed75726ed92dbfd1661eb8510167193f7841f45e697b39169771c028cfb96672d44ddd7653f957863a3954c1124ed06ec314dad0675c1bc8046aabb90bf60ff7a23b9e4d1aaaa88089cf2f9c7066f77100d669e0012854e090fef570addf017fb9f1a6ac305916dee424488d5e491d3438fa777d9407d826c9a07334757ae4147a8eaa8518b19ae7b74ccd2d1eb5c0dee7a033978baadb4c0e8ab7aa03c47ce78c49aa1aa875633d6022f0b673bfc38e3c67ef2b51ae6e345815f597e7b42bb6aadc401bc23a6018e1910e21a65f03833189ce6e5bb237c1275f107a860e4526d66d97acae92a8cc5e5df41671f99c972c84c14af27ceca3764d0c1da6fbad378c6b56e0e2fdadb35c1700fb9a825b068d7aee660f16f02057d5d6c9b398010ec412dde146942b1c240be90494adde04308e4314c7c015faa28940d2cc6a5c0e99f3e2a5ff60c802a46ba27fb82cbef7e24043af228efd94dc12d680c51a48c2e010446196c2e254da9e10bcc7b2b5149f2d62c4cb735118c1feb6b4ee46ae2d1bd62563536575c544f1eb1f5aa7124783109919c6ba6a7efecb5f1ece475129ef9922d0dee841c5282bb6e9887254dc3944618604368099e13567e05e23cba76d1620fb33b8c47af75750b9d8d011319bf267de13c9c5e3fc0c7ec2e5f1bf26d2e7bdf0aa3d905b83876f6fdf788e4590421081e884aa6c0885a0d8aa60a9aeaf868a96d9b1022d7d53da2320b64f75b9ef86f3d180de260b7a544458fa0532705a37bc1b2b4dd8c80e520abc0e25bb6e09335f94c963a68dd6f005d87b4ac4e35619fd19717d7529d6a43e92a01c6a5a626240b2a15ecc5d593b744b7c6aac3c7ff0a978baa06b491c3e4a4fd9d8a05f1138304946d70894654adc1eed99274795036bc4e33fefba79791fe0899d05ce5dbeb67cd1f50f770e8de1b9fc2d3af1337ba2f49823d964dbc3685600a0e0508c0b3938e6eeb4087ea2815fdbbba43d522c07c06962addafbceb508d042e479de24d812fe75a53f52d36a9b053d10237c56a4010a1dc1a2f5282f7cb8c41d9572de7003c3ee3c2fc4fafe4f5d10911bb1f6d367d660bf65a2fd03bbc68ea143a51d312832bb16ffd0add9d6d2b0895a9f33c3cb5ee62aa9cc969a9034af73f00f84200821d13919921c23ec278a4219b5dd767347b694903ad407eb08f99490e4145ea8f082114c07930a7fad52c323e592fb2d7d0e53015a9aef1985ae75ad67b999434efb5f3f9dce25c66ec850640a12d4ba0390b633348073808c665d54ea65e2a2ca4cdc519ef7c921d90f7237c601c0d68cf9e8e830203ecfecd2d9ae4118b235a3ff990070ae0f1f67d071794ad2273e9951cca1c5e10cf4c999e409e21206e172d6ff3e96b652f9b545ab1851efd620ae1dadf99287d607bde39443e569d5cf90a714c5f7cc72a2260b636185fe0e35754300afde859c7f555f7993e138b6c70aa9e31181a067760f3bf397187882139597831',
        hash: '8f5c66c16672df146cb3f87b98bacca4236e812a9ef77fee6b53fbac24064257',
        pow: 'aad3691b189910385c28e3059caf90ffd59b53a89b8eeac55de80e760c000000',
        nonce: 184716
      },
      {
        block: '0500fcab13ae0b430433292f9b164f7de8e2d2caaff6e9d6bc82d1c0c1c77a1d66260100d6a0d1e205fcab13ae0b430433292f9b164f7de8e2d2caaff6e9d6bc82d1c0c1c77a1d662633b0c3dc010100000023032100297edb5fdd48f84577660842669c987d25bd83642374199886cbfc3e4e78d44a01a99f4901ff819f49070402a2975cc08c184d221c40d2d14a14df86c0460cd6b1fa0af4dc2cddf5d591ced35a022af8e4cd46e23f7f31e205803f70560577cde0972981e98be19532d73816cb8ebc05020caf3c45e57dfaa0db15a6286c2d59f6599df516a90488bb41fb8352ff4b1b5c882702791aaee06868b3a837130ace69ad6ab50330371cf65b74782b97ee642f303757f0a20402be34547ccf220c7963b5315961685482c5bbab993dc1e77869c8d9c5deaae06580ea3002637995ccb18f7fe806ca253d4e5ca7262961e5d45995b0e5d1612688b20c14af80897a0217ca5563e2f020a48f128b0447a733636c0c4e0ff49848baf2aec48c1baa21b82b01b84f3f3be5f750959b14be5bffbc3f904d5e2f9ba302fb94028821cb5451563802080000000119b4415703e7e80f2fd9a3db2a75c6e01cbd9aff31ed609fb52d4837e50e942fe8e645aa53a21cf744edf3854a342cf1d20dfd9d269d1790c0f99630c925f8c8b5a98e03972901ced6052db4b6e8e8315d235df8a95bc1f737e608ca36c99a07fa01989013',
        hash: 'dd173a8c7f78e101f1bb2221b53bfb3f8017498fb36294f7af9f83159dfed31b',
        pow: 'f0d7f894b7c2c1aab4aca6f5c0ac3522abd07b6392bb313827643a0300000000',
        nonce: 3703812147
      },
      {
        block: '0500ac7321caded24a7ca51aacf2a8395bb5d42207921c22be17f82eb53a2271bb850b0bd4a9c1e5059330ec585ef39e68554fd764860cd739a7f55e750733a01bf75cab0bcf692500a82d000001029f8e0f01ff818e0f02868298e73a02a0270275c455df54cbf63183722a42bce9712298240d8bba8e32e9f735e7da42f8acc5ab4102ae8d54c2c17d05c015f2452ae2d08784a5f1b81232b58611856af53ef6c96f21990101002d97816230888fdf9f2342bfaecd083d0ea834637b355ec734e203c30e3483021100000017f0110400000000000000000000032100043a2898114043d0a97fb7e98c184478053389d130e53121252609c6648ce4e10170f612462afb3036f1aaf187234a362161b459455729ab9704e7ba1b6ae61f2b7228151c14dcd396a8bec782608fd3ef452b4511e96fac238ac85a904a196bee090001e9b95501ffc1b955060802ec6fbfc404ca3a6fd81507ba1ba52bdd33c249a59d84f987af03be7be507939ed80402686743715b84dc455a6ec873d4badb21800c0d248c4666da75bc3bbbd22e8aa9c03e02f5d167e58799c2630919776c9afef3c43fdb49b179e66a9a5b7641709fea54bed086030207f92bfa570fafe4af045db82a4e2be673b93db26a00acbe1b55d5341c3aa13a80ea30029c8581d7dda7bb883d12f3f7391f183cc9223ff330aa29063f47156e6f312e3080897a025b18f50404513945c5dfd08d5391a5dbf60b7555dadc3209952169d979999f153401936efde8a9a11a4fcfc109314ab69c1ab356c2edc8bec0a3634f1e7b52ce5c1302110000000000d9110400000000000000000005248e6fdc2921fd5f4a35ccd18dcc6d748b5d30125bf47bd717ccdb35ab59dea895a059a4cbe61c46f76e88cec2436bade1ef60dcfedbbf445237b16506e124ea08e013043337c920796f4cf9776d5c1c98173ef2e99fbe08fd0ad9df80170bdd11b52abbb4aee93fca1a8db75eca1f15769b3cf0f1efb0407ac119837fe3de9de2a63e8b090f69a71c9edf278c40c37d971b06404ef4c380aae3e91090694eee',
        hash: 'ab3e530a46ca48220b29e04fe879d9415fb69384b0108aa9a3239a355a07458d',
        pow: '29d6ffea58e90391362481dd6f0c9d711bbfc778aee3798bcb1b777b00000000',
        nonce: 11688
      },
      {
        block: '050001e1822b9b3badaef93046468e2af8c9a5987ab1daa7af67ce4d5c9b32dc88b30b0bc1c9f9e6051e0eba88e7725bf12ba6e2e9c6c90a3bd4fdf87786bce7d882cc1b8e6e31cdfacaaaaa410102b6d21001ff98d21002a4b2af813802030da8cfdb8a901c7002638c50ce5ffdfffd93a696adf8af054e0d459b626bc3c3e2fb9d3e029ee970bc6eb30635874040e96606b76fa8d11d83f9e1501610eb3b93ef476ece99010179cceedaca9daaca1a34822bda0b1f227d21bb7e79ab3e0b154a299a981a58b602110000005598b0b6e000000000000000000003210013947d83d1f19567fbd96ee799d30cb3f03df186594bde16b4ffe10da4ce5a4c016c90b23d1b64929c4a1feb8815950c5c776c95595af7fa14434d8a9b812fc92a7299b12db8025b98b1b623ace323b3f936dffe1eadfff1c03f845811ac1a24c8f1000188c75b01ffe0c65b0403024a9f3d528ae30cd2fded80d1b230492707dd1d061c563cfb557cfc19e0cdc689d086030291c127d1e174bd68108bb353cd249786881fc6453b23efd11c012edbc925257d80ea300292135ee96769f626943cfba205171185c96c96a6b2d5abc7e2ff1468b02bbe3480897a027789b25f7133d4ce91cfb27422dad5e15221317b9a04ed272f9f0a65cf88616734019f8fd8a6dbf36a2e7f35b11234fae5b2d3b5d77d51dd4fd7877e55f179e19df602110000000098b0b6e00000000000000000000380a31720ddd7dd06a46c73c3dc5bed3d32b21322e505c908ef73358f1221d7a873a8b3ba4a06154f32c2b29ed5f056df7415706d84a26bb7f546696eed5c98d817cba3ece47666bab7b20715583f994768961d3484fecd335ff930f6cf4cfae4',
        hash: '9771396c7b1efe85c51340e216481a1e7e5686d0e9be3cab42015add2841abb4',
        pow: '39044ddbc57c4a19a14db1f16bc107ef120ddd5d3bccc0646baf8b2200000000',
        nonce: 1101703882
      },
      {
        block: '05009b5522ae9957a5b2ab402bd27e0f6bd00b723f6766f24fac359f7eb615eb5f780b0baebbd5e7050c0c13b39f25c6acdee4c2af656c1447daeee40c0f3ee673c3ebdc21eeeafd8873bdaa9201029db41101ffffb31102c7a9eaef36024dd4fd84736429878bb3fe834d7d9129b96391e52250d11bed84ee74c7639a0a86e7a0fc3c02bf007ec781a940b882ed83b912ab7946129aef098181d1ac3ac6aeb89ee29b1f990101da796c5020fdb4d6bf561474bb5977f94d52094168fa426e19364c9c23ed71c602110000008dca604e080000000000000000000321002040743ef5b7ce858df784fd355d5538b495ba6af88f5fd030758d554617e52a01534851b6f1c276fa603538b16b3a0238a5a8ab30c8dbe4b19b40c1c20f826cb872bdc5746454cda24471b2ff539192fba88c5f4d3eef995a8c7d556bda03edd1c60001d8cd5e01ffb0cd5e07010226985a5c0068948410222cda5743e16363e640a0ef2c4527d990f6eceb2ce8103c02ccd84de05b7c289317e3d34dbf251132c7c762f5baa66e228ef3c0127792196dbc05027cda310f1c41bb5a4eb43353b637caae883e9a264e422d0501f64f67b03308928827020b6a8a13ef7ec5b4812618d34513e35ca67f56c9104498da97810369177f6d4fc0b8020276f1cd96569520ddefc8e44d3c7bcf95a7cec9e8d68df57df30dec12670db4e980ea300267c3d999e7787ee02f417aff836c068ec610ad676c21682b710ac9750bc5039780897a02a1417c9063dadc400a158910e9084d1963515922cb35e56502a054fa4988cb5834017877cf0cbef600f8cb78ed078761736564f4d386909eb93da57daa357433013a021100000000ca604e0800000000000000000000',
        hash: 'c90be6e123d5a84e86287180bca1b5583104b80d037796fdf94a05cc39def650',
        pow: '84045f18b369818f4d24cc47bb77c675175f6d7490098df702f3786300000000',
        nonce: 2460663155
      },
      {
        block: '05007c893d22fee5b9894c158acca55c77134b939327fe0feac215ebefdcb28b4c940c0c94988be80574fc5e458e23ca15510fc4f598b2ad887c836b9f348cad4a6f2122c1729d975de2cdbbbb0102e68a0c01ffd48a0c01decbf4d84402904ade8f5d73dfbe43634d63122f3510e0d6fe677b7f6b50311550226f5490f1790172abece908bfdd8bfe1488a9f09b1a1af448567f1a6fe47e69512aa9c3306cb8032101fec53a51adee8564f1b6d060457a1efb2e13ed47ab32d4d067ae4cebe780877f0321005c81f49d031482c23c5fd2b417af3724b7e91d030ddd112301aa24fdd964d0e5021000000024d9370d000000000000000000009b90b9f46f10401fc0eb152e2c011c1edef01f54ac73e7a51c8331ae80be9ffc01e7b16001ffbfb160070602409fac372611af6ccdc657d5ddc5a43957fbb83b9acbd07613bae92ec03c55265002a4144652bd5fa644f45a3cf9d1c62edbe268c407e1c9a3559f010ea33a238b7ec80102bce0ded1c3f778ca6342cfd1871cb914a88430c95fab37b5773b96b30acb13dcb817026f0e9bcbd52e70d6406fdeeb21a445cdf8cdc2c89fdb7de9ebf38303436269abc0b8020278a194eea6ff669a626aa22e09202792165191c7ce2e7b73a9a465641cd8854780ea3002a93226f81d09f415934f025ba020a2f22d7692843de852c50ad5425c13f9e43480897a022f86f589c5748c453fc72ceda220ab25de3b18aeea5a194dce49608ca5c7b4c13401f821c09f01164e23fa8c75c840934987eece909cb4929c13acdcc406035479490211000000000000000000000000000000000000',
        hash: '28f21b7f39e736e5e3fe3a9665ba03276fbb677f0a52524bb164e807cfc9abde',
        pow: '128fd7bdc760f8c1ee001738ae0903f90e91570bc110defa993e991700000000',
        nonce: 3149647330
      },
      {
        block: '050060cb98d99969d134a55f89c13c36e3c9fe6579db219c22bb49056d98f05eec760b0baaf18fe805a96f08a3ffb8ef0abbb7421725eb5ef6f3064a309cfc3f4890f038aaccdad90544550028028f052a13d7c08069fc3175cfc6e9e04863127b22276a9291d49a5ba921e2085b02baf21101ff9cf21102fdcba39d3602e2d6771991fb81f468422f53995318ffd2c6bacf7b5a209df3a26ad030d67841af9f8ba03c02bfd8771443605f90d6b31530b7d08cb0023e6f3fd0bab505d4c939b9af8bb614a30101dfade3139169b90d73a3f22ac7b355d42a601bbaacc1450b41400be83b94bde5032100e52e1508b1a8c8baeab469bd392ced9b1d79ca7df66225ce05c6710d8ee22c41021b0000000000000000000000000abc51ca4a2e000000000000000000010de22ecadf5df4ed10e0bb4f319631d3c2240ca9f85d20ecdbb5dee1015b7aaf72f52f5102b31c1023d5519d777891ac68abc6dade0706ec24c52f7cdbf3cc51bb0001e7c56001ffbfc560070902cfa4dfe1870ab82478af67c4a9053edab50cb0a90e710dd9c76c653bd9c161130a02164c0e2e8e6cab4fbc51f128f7134d570aa7fc747e44b0532c4a357d9b9afda86402a10df923ea3f41bd9f977671b56e094b49082be2f37eea74aa02526951656f0db8170266286662b13eb95319249c28af61843bd81cd9ecbb804368584a6d5b7ac24967c0b80202d9689343b5923958f8485ad2e2512b973f06c8d3eb7b30fb7c25a03d04f7eefa80ea3002f38374d54bc6a7b737c926b07932c3463c31e90d40db2145509cc55f8ce8ad0380897a02785e176f3e718af0d19b7fc9648ce388c959814fd53dbf7dae0356f1e4d169416101da51e8e299dc61b694d42b4eb7c23ee03fffc9123d1d679735bfb031692d4cd4023e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000051ca4a2e0000000000000000010e7e1c479cb227e0986df0e5b58aa55b6b98396a54f11b97f8a3df7bc86f26f3',
        hash: '37f42da37103a7664b02ddeba85aff087ae0bf2025aa1d620b5fde7ff1dd89ae',
        pow: '9c8b39e766cce817e7d188956f1058a48da1a2e2a79451dd24dc295900000000',
        nonce: 671110468
      },
      {
        block: '0600372c032536432cbb8e6977bbd53a8f6b7a35fdbeb05fff16f41cdfbae1cfc8da0100d28c99ec05372c032536432cbb8e6977bbd53a8f6b7a35fdbeb05fff16f41cdfbae1cfc8daaab46c1c010100000023032100e0f912cdd518ed49c9839b51700e6ea48686266a68ecf0d547f50bd0c31e563b018ce87101ffe4e771060302200cc4fbea3668fb1e9c9c5f542b5e54176569b00ea9f43180204d2da3e2c24ac80102678f20794f73409c93435e1acbb281a48d3bc1ac230b61cce7d1772d9058abfca8460274cb0245ff3a89d95ad6be544441edd577d851c8ee3b9b629d2a034921bcac87904e0292f287fbf0bade1462642bd986aea318aa212dcdeed1cc0f898b3820e6e85c0880ea30025bbbc7fd4bc48d0bd5dc7039692bb07c9e70167eeb66de2c766a96436505157180897a02835daa0dd160c2822b0e0ed4d1ea9782d7df29ed755f4ea8d67c3be2ec5828b42b0168de92073d653fff40b7acc7bf59620141e99e061ed2adfe09054fdb1c77e4480208000500095013d9d600',
        hash: '460af45c885f064a0f0b199c17f8d79409d498b0856ed43894fc62834ed299f3',
        pow: 'ae6d9c3df0d2e9e4db7beeab3df4e2e14f63c472dcd9a9903f0b0c7900000000',
        nonce: 476886186
      }
    ]

    blocks.forEach((block) => {
      const testBlock = Block.from(block.block)

      describe('Test block v' + testBlock.majorVersion + '.' + testBlock.minorVersion + ' #' + testBlock.height, () => {
        it('serialization works', () => {
          assert(testBlock.toString() === block.block)
        })

        it('hash works', () => {
          assert(testBlock.hash === block.hash)
        })

        it('PoW hash works', () => {
          assert(testBlock.longHash === block.pow)
        })

        it('Nonce matches', () => {
          assert(testBlock.nonce === block.nonce)
        })
      })
    })
  })
})


describe('Peer-to-Peer', () => {
  describe('1001: COMMAND_HANDSHAKE', () => {
    it('Request', () => {
      const raw = '0121010101010101bb0000000000000001e903000000000000010000000100000001110101010102010108096e6f64655f646174610c140a6e6574776f726b5f69640a40b50c4a6ccf52574165f991a4b6c143e90776657273696f6e080707706565725f696405bce9496ec4e41dee0a6c6f63616c5f74696d65051c6a035e00000000076d795f706f727406792e00000c7061796c6f61645f646174610c080e63757272656e745f68656967687406ba95200006746f705f69640a807bfe736fc428c648a594910161dd6b0da13239910b1756aa0299d06fbdd12f19'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })

    it('Response', () => {
      const raw = '0121010101010101550600000000000000e90300000100000002000000010000000111010101010201010c096e6f64655f646174610c140a6e6574776f726b5f69640a40b50c4a6ccf52574165f991a4b6c143e90776657273696f6e080707706565725f696405542d8664299d78d90a6c6f63616c5f74696d65051c6a035e00000000076d795f706f727406792e00000c7061796c6f61645f646174610c080e63757272656e745f68656967687406bc95200006746f705f69640a80c52299465cfee1f83dc816e4b793d645c47c86e4cb8e9b8ac7dbb293d8fcf9320e6c6f63616c5f706565726c6973740a211645871d66792e0000bce9496ec4e41dee1c6a035e00000000adf9122b792e0000cf2721ff32fe52b81b6a035e000000008ac9818a792e000033075d6e8f762f85056a035e0000000062ef3198792e000022a0dcc4294a397b056a035e00000000b2eeecad792e00000ceabd39c685d365056a035e000000000d5c7b27792e0004b6736d781f1cf342056a035e0000000091831e9d792e0000c6b8a041b23beb0b056a035e000000005e82443e792e0000b5f27bb228765fa3056a035e000000005d6765fe792e000090d8e73ebb2389b1056a035e000000005e71777a792e0000119c1aaf3c25803e056a035e000000002d208a07792e00000be63f3a4838ff99ef69035e0000000052290cdc792e0000a244c02cce6a33a42969035e00000000c0796c46792e0000eb9ed16f2fbba7e35e65035e0000000090842375792e000062dd0060378387d67c5a035e0000000083994c82792e00006a4d75a05ca7479ccc58035e00000000af2284b3792e0000ef3af1827018f19f4358035e0000000005bda917b94d0000c8eade5d557e24cddf57035e00000000d5885681792e0000b690b58b9fe1587b9f57035e000000000d5c7b27792e0000b6736d781f1cf3424c57035e0000000079641803792e00007b8b5ce02b6d67e18653035e00000000a3ac0814792e00009edc58b7a92e23d64351035e00000000c0796ce5792e0000166161701b2375517d50035e000000002509031a792e0000022258a8c6b494d57150035e000000003344cca3792e0000abd9dff6912ad99f8e4f035e00000000c0792c6e792e0000f340535ff0ff11884e4f035e00000000c39a5187792e0000e0d12f4c70454d1a4e4f035e000000008ac924f9792e0000c3291299040841d9b64e035e00000000d588590a792e000089d67a44790d2b17484e035e000000005d2988c3792e0000bf0800100ad151c2584a035e0000000083993862792e0000ba2dcfa01efc9059324a035e00000000d588590ab94d0000f253d82c11ceb35f4928035e0000000050f1d2c0792e00001a91074d6981f4685122035e00000000905b6b9f792e0000983129994ce75c9f8d20035e0000000036254fb4792e000072d2f866506ae77a9f1e035e000000003353032a792e0000bc57a38abed554690514035e0000000005bda917d149000029de31e2d3f174f30ae0025e00000000cfb4f55f782e0000ad8ac53f4a6777a7cbd0025e0000000074cb5532792e000053f3a090da524d4f98c3025e000000002ff4af21792e0000a237ec017b1d658177bf025e0000000094fbb2ee792e0000ae6654a9353f8770d4a8025e0000000082b9ca9f792e0000abc1ea827251e188b292025e0000000005094169792e000094d599fa2efa0036aa81025e0000000040440e19792e0000de061d7a7801a48dfd73025e00000000adf92966792e00001a91074d6981f468486f025e0000000054c060a2792e00008a3e28aac868e3d3ce44025e0000000005bdb8a2792e00000b98d2af6c3c35628636025e00000000d58859fccea800001a91074d6981f468f81d025e0000000051f213a8792e0000760193dadd9cc6066c1d025e000000002d4d9c92792e00007b3c89bf57ee9d73c119025e00000000d588590ad1490000ab44c84909a1a4fb5519025e00000000c0796ce7792e0000cfaf992d3bce234bfa18025e0000000005c7857d792e0000f8c9afcf8d814356edfd015e000000008ac924f8792e0000af3428936416a77b65ad015e0000000018f7db97792e00005074f8d2f0888cd150ad015e000000002ed646c4792e000068e9e8f2140bd25f8ba9015e0000000051a9ca16792e0000713433f23b74e2a8cda6015e000000004d445ae6792e000032a6300c7c5ba7db6da6015e0000000005bda917792e00001be09ceac57e8be8e19a015e00000000c0792c6d792e0000502d258fb13be5578b9a015e00000000'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('1002: COMMAND_TIMED_SYNC', () => {
    it('Request', () => {
      const raw = '0121010101010101560000000000000001ea030000000000000100000001000000011101010101020101040c7061796c6f61645f646174610c080e63757272656e745f68656967687406bc95200006746f705f69640a80c52299465cfee1f83dc816e4b793d645c47c86e4cb8e9b8ac7dbb293d8fcf932'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })

    it('Response', () => {
      const raw = '01210101010101011c1800000000000000ea0300000100000002000000010000000111010101010201010c0a6c6f63616c5f74696d6505416a035e000000000c7061796c6f61645f646174610c080e63757272656e745f68656967687406bc95200006746f705f69640a80c52299465cfee1f83dc816e4b793d645c47c86e4cb8e9b8ac7dbb293d8fcf9320e6c6f63616c5f706565726c6973740a815e5d6765fe792e000090d8e73ebb2389b1246a035e000000005e71777a792e0000119c1aaf3c25803e246a035e0000000090842375792e000062dd0060378387d6236a035e00000000b2eeecad792e00000ceabd39c685d3651f6a035e0000000052290cdc792e0000a244c02cce6a33a41f6a035e000000009de6b31d792e0000542d8664299d78d91c6a035e00000000a5e3fc84792e0000542d8664299d78d91c6a035e00000000c0796ce5792e0000f1d4a486cd1625338969035e000000000d5c7b27792e0000b6736d781f1cf3428669035e000000002509031a792e0000022258a8c6b494d57469035e000000003353032a792e0000bc57a38abed554697469035e00000000c0796c46792e0000eb9ed16f2fbba7e37469035e000000002d4d9c92792e00007b3c89bf57ee9d737469035e0000000005bda917792e00001be09ceac57e8be8c068035e0000000083994c82792e00006a4d75a05ca7479cd558035e00000000c0792c6e792e0000f340535ff0ff1188f64f035e0000000036254fb4792e000072d2f866506ae77a3227035e00000000adf92966792e00001a91074d6981f468e841025e000000002d208a07792e00000be63f3a4838ff992a8f015e0000000049fe2753792e00003d01160ec44a29ba7d8d015e00000000c0792c6d792e0000502d258fb13be557a96e015e0000000040440e19792e0000de061d7a7801a48d0030015e00000000b078b42a792e0000b7f8a554616d7186b066005e0000000048c1ccd7792e0000da3a701b71127d74cf2c005e00000000d5885681792e0000b690b58b9fe1587bc428005e00000000af2284b3792e0000ef3af1827018f19f231f005e0000000059d2a336792e000096a6490800ec5168c867ff5d00000000c0796ce7792e0000cfaf992d3bce234bd945ff5d0000000074797d5e792e0000a9be9fc6d18436fddbb8fd5d0000000054c060a2792e00008a3e28aac868e3d3bb62fd5d0000000092c8db1d792e000031644604b14aba253514fd5d000000004e1f67d9792e00002aa549f7a6c59df348edfc5d000000009728c461792e00008d190b42d7a442b9396dfa5d000000004f732b1b792e000004728f6f4441bc9d2840fa5d00000000bdf4894c792e0000605f623602f01dbb4e76f95d000000004a6044a7792e0000c842b68682eaed0ded4ef95d00000000ae584bb3792e00001b3f6764c933e5342c8cf85d000000008a5e370a792e0000ced9415f67559884e562f85d000000005f1d9a85792e0000a4164d8ef238952376daf75d000000000537780e792e000096a6490800ec5168a55cf75d00000000496fe35d792e0000d0144f84d6be0c0558fef65d00000000c16f00ee792e000013d0b012c734617c157ef65d0000000058e8c00a792e0000c70ce7fedaa16d96316cf65d000000005d671086792e00006abf5eb2206f0c2aa904f65d00000000adf916eb792e00001a91074d6981f4680c11f55d000000005038f243792e0000a7ce1cf9658ec83391f2f45d000000005b27cea7792e0000400898ae9f8963d6b2a0f45d0000000049ba1277792e000099d894fbe6c436db7c73f45d00000000a8eb685c792e000068f5c99d45f0fe9bef59f45d00000000d58859fccea800001a91074d6981f468b5f5f35d00000000ae379d6c792e00007b05237e6cea3b1902c2f25d0000000044b779eb792e0000159dc728dbc24c66bd62f25d0000000080483ba2792e0000b7fc00b504c5286bb99df15d00000000ae1a55be792e00005be5b56f0fb9f258fe79f15d0000000005c7857d792e0000f8c9afcf8d814356e9e2ef5d000000005c3ff9ba792e0000b0224c150b6291d591a3ef5d000000005c8eb89c792e0000fadf3f08388d85ace972ef5d00000000488042b2792e00005dab95d94dac450e9967ef5d00000000bb831478792e0000eed6c0b57903a66a9d32ef5d000000001823ae96792e0000432857becf4c92946115ef5d0000000082b9ca9f792e0000abc1ea827251e188c2d7ee5d0000000048d222a8792e0000599bb40a5eb8ec776ca4ee5d000000002eb002e0792e000096a6490800ec5168e676ee5d000000005743b7c1792e00008216bad6c83f54aed82fee5d00000000cfb4f55f782e0000ad8ac53f4a6777a79ac4ed5d00000000626d214e792e000064c0c891249c6e4b4c56ed5d0000000041bfc064792e0000b6233cbd86b5cd8d848fec5d000000005a375cc2792e0000aa147437a89d7893c38dec5d00000000c87063ec792e00001cb135c0a97a2697b2feeb5d00000000518cff6b792e00003d77475757038f9f70b3eb5d000000002eb09970792e000096a6490800ec5168e3b1eb5d00000000b072df66792e0000f258d11b7fe6581ee4d4ea5d000000004bb7c67b792e000091ef5953ff2d2ba0f87bea5d000000002eb0281b792e000096a6490800ec51686a2bea5d00000000c9bcc59b792e00001cb135c0a97a26974a9ee95d00000000bdf454f6792e0000605f623602f01dbb8f5de95d0000000097e6466f792e00004c57dded547c553006ebe85d00000000bb163008792e00006eda22cf8c1397051417e85d00000000bdf49a68792e0000605f623602f01dbb530be85d000000008b637b736c4d00006f895c73f16c8fde242ee75d00000000ae386813792e00005532664b7e96e7855228e75d0000000098ede8f3792e0000ced9415f675598842cd8e65d0000000032643e2e792e00006f0b45d8294360ee9390e65d00000000935b902b792e000053e30307d592841a4089e65d00000000c3c968cf6c4d000022f3cfbdcf9dc4e3775ce65d00000000a77241c06c4d0000041d0dad5c3e8a62505ce65d0000000058820391792e0000b994e424f04dc8c9afd4e55d00000000577be750792e0000b994e424f04dc8c964d4e55d0000000018f526b4792e0000ad02a384a2f67bc00b58e55d0000000062ee0190792e00001c01b30fb35c98aeb837e55d000000008ac924f8792e0000af3428936416a77ba528e45d0000000059f762c7792e0000b994e424f04dc8c9aeeee35d00000000053311e9792e000030e05d2137fd8ee59aeee35d0000000062b4c477792e0000c2f414062ef6c47dfbabe35d0000000005094169792e000094d599fa2efa0036ba90e35d00000000dfa65d43792e0000565b6e20f2e911412f54e35d00000000dfa65ec9792e00005549822f0cbb7f8d3444e35d000000001b6672bf792e0000bd464394694ba3e27536e35d000000009de6f23b792e00004951d2c55031a978fc33e35d00000000905b6b9f792e0000983129994ce75c9fb00fe35d00000000b9729c9d792e0000ea3704ccab2c870928e1e25d00000000d13abfb3724d0000acc9f2674d136b45c2cee25d00000000053706f8792e0000cbd3e7d4d2f54be01396e25d00000000d13aaf0d724d000019593afdb7c4489ac934e25d00000000797a3b46792e000097f444558fcb52017cf7e15d00000000a758a1d0792e000014d15e1310034b504bf2e15d0000000005371b78792e0000a938bdd17d3311a16fe6e15d000000002e0400866c4d00007ca3e978c0ba2f4e21bde15d000000002f1984b5792e0000203207478733a211ecbbe15d0000000043a3dbf3792e00005c741483d9ad6a4b1cc4e05d000000008ac9d9286c4d0000f7fb80af7a0b7d4e151de05d00000000d588590ab94d0000f253d82c11ceb35f5612e05d0000000047c8bc70792e000055ec51464832e3f09802e05d0000000005bdb8a2792e00000b98d2af6c3c3562dbecdf5d0000000045f98cf2792e0000dd198ea3e7765793d5dedf5d000000005ec3adae792e00004c57dded547c5530b7addf5d00000000a75660f5792e0000cc4d1b0dd32c4fcc0f90df5d000000005fd82a556c4d0000ae3ccebd6f404d553c6fdf5d00000000adb1741a792e0000ef25a12a7c88aa7e6447df5d00000000bdf46ceb792e0000605f623602f01dbb4444df5d000000003ab36b00792e00004794799906a3e482a010df5d0000000058820888792e0000b994e424f04dc8c96b13de5d00000000adf9122b792e0000cf2721ff32fe52b85313de5d000000003344cca3792e0000abd9dff6912ad99f89e6dd5d000000004b28cf6e792e0000f48eb7cc3ac22ade33dfdd5d0000000083993862792e0000ba2dcfa01efc905973dddd5d000000008ac924f9792e0000c3291299040841d9eddcdd5d00000000599b9f1f792e00009ec56fb86d8548b3f2d0dd5d0000000074cb5532792e000053f3a090da524d4f24c7dd5d0000000095ca5c8b792e00003a26be0b03d5df9f5dbfdd5d00000000935b902c792e000066d04a45a0994f5b4b97dd5d0000000091ef05b67b2e00003a26be0b03d5df9f8a8fdd5d000000004d445ae6792e000032a6300c7c5ba7dbed5bdd5d00000000339e9704792e0000b8969a94931a2731461edd5d000000006dbef3cc792e0000ccc819f07decbd2f4f00dd5d00000000b844e1da792e0000f8c3aa4f9c5d98b6d2fadc5d0000000059f76cd6792e0000b994e424f04dc8c95de9dc5d00000000538741e5792e0000b994e424f04dc8c9a69bdc5d0000000018fe09d2792e00005e66b7a29f7bcb6f568edc5d0000000097e0ed4a792e0000bc9390b656fefbbe6953dc5d00000000334b91da792e0000d518ca79eda43ab77e29dc5d000000002fbae67a792e0000082cac589e164c6ec6fcdb5d000000002eb0261b792e0000433ae5243db67a607cc7db5d00000000bdf473b1792e0000605f623602f01dbbbc91db5d00000000d13abfb36c4d000043b84a23b1fab54acd84db5d000000005d2988c3792e0000bf0800100ad151c24a60db5d00000000577bed18792e0000b994e424f04dc8c9644adb5d00000000cb9697ba792e00002a2493b7ac96d26c6b3bdb5d00000000a4447a42792e00005e66b7a29f7bcb6fdd30db5d000000009f415c24792e00002b32f676b3ddd8042530db5d0000000051a9ca16792e0000340e9aaea982e85a98f2da5d00000000d4e9192b792e00003ab8b824274f4fcb8254da5d00000000d531cc3f792e00003ab8b824274f4fcba53ada5d00000000ca2cd476792e000066ea1e5a3be31ae370f8d95d000000005515084b792e000057eb63c36322349c00acd95d00000000b2eeecad772e0000236cdcc9ab6db6ac0019d95d000000002ff4af21792e0000a237ec017b1d6581e1f7d85d0000000062a2e179792e0000b96c9e1d354c898a7978d85d00000000055312fe792e000006f19f7add7710c2876cd85d0000000005bda917b94d0000c8eade5d557e24cd5921d85d00000000053722e6792e00000ef243a43785dd5ab3ced55d0000000050f1d2c0792e00001a91074d6981f46822cbd55d0000000051f213a8792e0000760193dadd9cc6069ebbd55d000000003406d558792e00005e66b7a29f7bcb6fbc6fd55d0000000079641803792e00007b8b5ce02b6d67e1636ad55d00000000a3ac0814792e00009edc58b7a92e23d641abd45d0000000094fbb2ee792e0000ae6654a9353f877037abd45d0000000018f7db97792e0000f13668f5cbe13a5a08abd45d00000000187eb04e792e00000557d2b04f5705f20b3fd45d0000000005377449792e00000ef243a43785dd5a4bf1d35d00000000b9a37588792e0000c4d4292d8cad1f662571d35d00000000a7564bea792e0000593fa6d7f6677ae69070d35d00000000180413ef792e0000693ff2142f483ec09fafd25d00000000bb704d8c792e00008eb4333e7f5e4947a7a5d15d00000000b161b8fe792e00008eb4333e7f5e4947f759d15d00000000bd1a88ad792e00008eb4333e7f5e4947453ad05d00000000d13aaf0d6c4d00004387c085f53b3cab362cd05d0000000005372fed792e00000ef243a43785dd5ab205d05d00000000c7f71f58792e00000dc101fc8cf73084aacbce5d000000001f252a8d792e0000552efa300851cfc7fc43ce5d00000000021eb66f792e0000355ea72e3dca4d56a3d2cd5d000000005e88099c792e0000b549ec91dce7a23162a1cd5d00000000b16097a8792e00008eb4333e7f5e49473f69cd5d000000005cb01438792e00009df1b7c73bd9139ac301cd5d00000000c7a866aa792e000042e0a6a27204503b1ee5cc5d0000000043d22044792e0000f64b48cd2f27d7e64851cc5d000000005f54a497792e00008d7bf84bd6427aa3434ecb5d000000005fd949536c4d0000a719c354b40cae48f13cca5d000000005e880925792e0000b549ec91dce7a23129e7c95d0000000002df3b04792e000015e9018896644fc069c8c95d000000005e8809f4792e0000b549ec91dce7a23179b1c95d000000005e88095f792e0000b549ec91dce7a231999cc95d00000000bb3b3860792e00008eb4333e7f5e49473491c95d00000000a75661d0792e0000b4d0ba4d3cc9af841575c95d00000000add4e9d2792e0000f4d82edc42ac8228b855c95d00000000ac72eeeb792e0000e82b838d601d4d7b6a81c85d00000000187eb1e7792e0000a09b6c67a58046a3e480c85d000000003c70d719792e00007f49e7cf9720b74bdf64c75d00000000973d2fa4792e00008d190b42d7a442b94d3cc75d0000000062ef3198792e000022a0dcc4294a397ba805c75d000000002eb05b53792e00000ef243a43785dd5a9facc65d00000000030da63c792e00002da947a7722f5d30744fc65d00000000a5168b09792e0000b6c85d148395757ca8c8c55d00000000d588590a792e000089d67a44790d2b17a03ac55d000000005e880930792e0000b549ec91dce7a231b8f5c45d000000005e8809df792e0000b549ec91dce7a2313cedc45d000000005e8809b8792e0000b549ec91dce7a23115d0c45d000000005e8809e4792e0000b549ec91dce7a231e9b5c45d00000000af226665792e0000ef3af1827018f19fb9a9c45d000000002eb03e21792e00000ef243a43785dd5a5116c45d00000000b0195002792e00004c57dded547c553074f7c35d000000003ab99b6d792e00008916a97c4ace2bb8d489c35d000000005e8809b1792e0000b549ec91dce7a2316c7dc35d000000005e8809cf792e0000b549ec91dce7a2312372c35d000000005e880901792e0000b549ec91dce7a231b259c35d000000005e88096b792e0000b549ec91dce7a2314745c35d00000000973c1e22792e00008986b6097971630c10eec25d000000005fb38a69792e00006f4b4fd8179f3da29aafc25d0000000049d5158a792e0000c278d5ffbf9e3808f0cbc15d0000000018579927792e0000e58e9ec45b21c6cd2fd7c05d0000000068f6860c792e0000a733202e2fe7e92cfbb8c05d0000000048adcd60792e0000ac400e0aec9e2935d5e4bf5d000000004b9ecffd792e0000d8324de9ddb8ef7ec7d9bf5d000000005d92e072792e0000072b3fce1f49753f37d7bf5d000000001883f46c792e0000d7e9016b87572f09237ebf5d00000000bb8f35a0792e00006f7d77046f760359a620bf5d0000000050c93590792e0000760193dadd9cc606521ebf5d00000000731c0747792e0000ad40343a101db6f9cff5be5d000000005e8809a7792e0000589e68b89ec0186437e3be5d000000004889220a792e0000c5606fd9c55af15800c3be5d000000005e8809a0792e0000589e68b89ec01864bdbbbe5d0000000097204945792e00006e81fbfe9c0064edaf9cbe5d00000000bdf4474d792e0000605f623602f01dbbc73fbe5d000000007a6ebf57792e0000fb6decc2c1ac2b1f2008be5d00000000972190cc792e00006e81fbfe9c0064ed8924bc5d0000000074574f8c792e00007d0792fd1841397f5dd2bb5d00000000973c1838792e00006e81fbfe9c0064ed993ebb5d000000009720075b792e00006e81fbfe9c0064ede661ba5d0000000005bda917d149000029de31e2d3f174f3e661ba5d000000006e169ee4792e0000fb6decc2c1ac2b1f37ffb95d000000004e39b45b792e0000f52899bf2bfcbbfc82e3b95d0000000048892262792e0000c5606fd9c55af15852f3b85d0000000058820f5a792e0000b994e424f04dc8c9a568b85d0000000053874a19792e0000b994e424f04dc8c92db5b75d0000000058820fdc792e0000b994e424f04dc8c9d263b65d0000000059f76713792e0000b994e424f04dc8c99a54b55d0000000058820a3f792e0000b994e424f04dc8c93112b55d000000005a59657b792e0000aa147437a89d78936b0eb55d00000000c39a531c792e0000564032fad126402232fdb35d00000000588209de792e0000b994e424f04dc8c9efc0b35d0000000053874446792e0000b994e424f04dc8c99fb2b35d000000005e880943792e0000b549ec91dce7a231cb5fb35d00000000'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('1003: COMMAND_PING', () => {
    it('Request', () => {
      const raw = '01210101010101010a0000000000000001eb03000000000000010000000100000001110101010102010100'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })

    it('Response', () => {
      const raw = '0121010101010101260000000000000000eb03000001000000020000000100000001110101010102010108067374617475730a084f4b07706565725f69640564ed59fd1073c44b'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2001: NOTIFY_NEW_BLOCK', () => {
    it('Request', () => {
      const raw = '01210101010101014b0300000000000000d10700000000000000000000010000000111010101010201010c05626c6f636b0c0405626c6f636b0a210c06007bfe736fc428c648a594910161dd6b0da13239910b1756aa0299d06fbdd12f1906009fd38df005a1c8110dbc634bba1b1a4011d47f8552b9deb91de4f54aef69ff80c1ee1512bf45de8f020101aedd0401fffcdc0409080275a46159d6179d8416351479c3ae28b962d686f25be6c2183c381f0b3c70c65b1e02c2dd7c04a41b3168db77525e4f8f038a4cc81e3a56d8e6289bfc123514a416439003029a596542123d0cc02816dbb98c29db2df352e2f40027e4bc40c0f5ec0612adb7f02e02e92135d4c6ab7267e3969457c826f0e4824dbffd95883b4a2b563d6778bdc8cd90bf0502f8e975ad224c5ee524e48a8ebf5fd02875786ab8c229f30d82e8625b8bf9ff7bc09a0c0292aa2c85638c4fd12a48f25f86aabfb770b864d0aebad21ef84ffe5476e22220c08db70102aa18b6a3cda889a052f6b412d21e73b969bd8776d73664a308246686088b3b818095f52a023acae7ab9b93145a16f88fde697122327d8acc9994afbe9f65c336f2e3d654b180cab5ee010299c4bf82145a32320f046ee481bd4a6c62869d8b85ff9c33ad975d58c568c90a57010d7fe19764b200321476fcf2245f9a285e76088d17cf347e26441b3bc038e0dc02110000001129225a44000000000000000000032100940eccecb99b93e0a0da75b8b4f70a86c4e4e2615752384da2a2c9603e23730601e2ab820101ffbaab820106020203b58238c0d48a0d3fd05788e0ef8bd697770eb1695cc3c28a147b3b93f6c675d80402492ce1e220ec192c3caa77039b67e88e995d28fccf240cfb85c2a47c6851a88ff02e025cde254676e04bd365758bc6cbd330beff96faef129882fba67880bb85a3d8ed90bf05027847d6ee4e437f927de857fdd8f19d15b194355ec3e15e46fdc087ce14697a84e0dc2a028d33f7edd7e47a94a4ff11f631652b6753f7c5934e5839d72d607612102113c480897a020ba825849d13a5e1db9d003df202033a8be8a839348c3acf2081af044ee0506a34018f3d2cac2bc6704a6b5bdf2f5b1977b3b668f75bb34267b81217aca8645c38a402110000000029225a44000000000000000000001963757272656e745f626c6f636b636861696e5f68656967687406bc95200003686f700602000000'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2002: NOTIFY_NEW_TRANSACTIONS', () => {
    it('Response', () => {
      const raw = '0121010101010101710e00000000000000d207000000000000010000000100000001110101010102010104037478738a047d3901000c021404e59926010159be5e48532e0dc32b3af21fe293480b127284392dc3cf786952bbb618435cd53d021e04e2bc2301019c01fa3a4add30796f0d1bb34082040238e1d668261a291b2dac793011d566cc9f4d021e04e2bc2301019d0174234e900b6041a4f51804a5fbf91b1abdeb295b3803cc3215760227a60ccde9022804d9972401018801a43bdd2137b24d0d8b430e555485f59d8e60e24d1d9b9597f09ab56b619717c5023c0493bd24010153c941809e46d9b964a7bca6e207d4211f038d867575856081883e0bdc23f641b9024604cde1250101436d1415819469cb898e5c6a756a7c213313bd670c4e143f2530eb3bf50b79912c024604cde125010142e4d0057ee76d84dd6ded03aa88dd1c7fcffd8cab1fb596c335f2515341fc0854025a04a8d4730101bc067518a348bf008106ec2ecf0ce5bd4420f8ad46e5717fa0d056f012977afd990a025a04a8d4730101ba069ef4d9dffd022e96c389c49b3777028de765eca2e01174d6d6c682eaac775922025a04a8d4730101b90628c0582d78ce98333c6f8c4bd7e340df3431528d4f2631c17d009b28ab5c3620025a04a8d4730101bd06a89560c737cbc778de9ec54bf370e6b919b3dc995c2dc2d2aac7920cf082cd22025a04a8d4730101bb06d43e78ae84eb1dff4dd2ed550ab6f2a13c83ed2594df6a7782b037a2abf79fc10246025d49cc297f70ae7c6fd1fb7b2cd70020275b97a08861bd9a4995e16d389aaa1bbc05021cea7872bcf65c3514e52502bbad8ecfa00a7ecc0783d93fcab619d3c9fb455f2101cfcab52234d227d6e50233b50dc8d64e769091037b06663d92a4dcff4dabc834f071fddee9a46a0c0e1b133e3511727c3b15abc78d94c5abb51b78f696dbbf014f4639363c1c3ae7c42406e6b5eeabdacb797e0b88492f56aa33633d3f501202a29f5ca6a676d521901c67ede9c077178d2fb43f3355d1ce0be57ba4d41f6004f89f12407f300a55e0abbc8967e8ad0179232edb5f5a91785844ccfeb74ac60a013d59d61bc6e99bf5dca99f5d8e2152b2fd6916ee6ea83490460976d12ed6060d1022b2aff8465b7ab73518ab4167cc22dc20fa7ba2e73a0a5f2125cda3090f20461ea0a46a617da77ac21c20a58c98e4fa8fb4ca7f00cafa9bd73d30650d06e5ad8bec44d02d14f65ca86ec756ea884290f024e07650a6e1c44762d19f7f00661d082218fa04ef7ea285d4fef8c1f136454d17a45e4453f15eac84b9aa1c0489f527aaa92dd4c06bd123a11c2427bbe09bb00dc4ec82bbf3213a3995c2b70848877742ad9ec58efeb9b7ec1733e9bf17d6e2729265bbbc11f493642ccf740dd7d9c761b7d410d7cc7e30e0c7c00b9057b6cafe48980277b89ce04c0742f70396f827fa51b4798270883320bdf3c06ccc0ddaebdd111501e4096af3de74ef051942bc37a3c16781a8c07346c8318c9822154f77463734b35be30c1600b4e9075ca328fa35ffbf7b0bfef6edb72d02f9bba5c5b58b5b4357d763df2eefecfa0ba453c50d2862a058fad87a4965a0e91aba89544ae4e4b1f9fc743f901ff052001be61d3f21e6963de0b66a6d58e4651d53e51a4c014687bf8ccfecb45d444305b0d9a67bce6d95692ccaa9432609518986141b5eac5e77314eeaa3ed8be2a702973e9cf5c48a740550475a241ed8683e8efe75a52572fd9e9a5583f03889a9037f0668310666b7f03d8e519f5f49326c67e136b39070cd45d1694b4ee75e4f02ba73dab4b52f0e8870ead2f535fcedd4471a1253bd765fbf4d7bb2d328f49903efe6947d036a462f61ec0d228017aa6d3560cf36d4272a5c3c39d529b7c1f10a24539a2990706ab55fd4fac489fdeabe10ba8c695165328ef706848a8328a80d9ed4f6a53460be6ac00be899525d83ef34ed7a9ce0fddf5c5c227d068a47200df5a7439788bb7c8a9737990bb49890e6dd7dfadd990c9091809bd523cf9c8a0caef5ccc79339f215b2741898cf11f90f7f549da6c3169f8a9de5fd5ed044900788e9b40811dcafdb37da891786eab537c2c188d31cf5a680d70ade0469a1bb0b6f0e28a6334eb010efa2fc91200dc907d992b3a61a0d6daf24a0b682f523f603f80d1b58bb5e8a6dba9897340e3d7b506be3c1b93a03743326e91b8f6754ea01a73ebced17b15e4d38fc3dfc4b3a7496c2bd740fbda69085420b311873666b081f32b4b74bc75b4d05fc5edb19107b6ef76fd497d56dfb4c09ea42d901699203e67dcbc405aa0f4473278e6644c60f058f96b7c600e734037a5bfddf8486940916502e849894ce39b405de7c88db4edfce45f0d0e03ab6019a0973fc66fd5d011ee37251cdcf333f7d57f2e305db0f89b3486e675ea05e08807d1e34d569b40ea06d0fe56c19e1ece95ca5b67aad26f7baeb5bb485d70ed2dfaeb40f5679f2010043e5be24ee376b1a785bdc563a3d451b2aac66ca14b15d859dcee63d69e90bea1804fd593c6a798b45ff5fe5b5ce3bebcb94390105f52e32ee3a2e204b4c0082031c50d3ce220bb49b868ddf1fd1661093b59a9502eab88e1fda9e25af840963f5f9f94b8702e22cc59ca4c0189329dd1c6ba895e47a234577063e3816800a307e9725722fb8c25994c8762a9c889575dedee537cabbc46683a85c7abdc605cd672b5361012b8a24dd88b5261aac7f4e425d50dc1b7a2857c685747e441105b1398ec822f2b4dfddc0cbbf060f3b1d0f61c494e33fd41570891a405295bf0b63a2f1584bc627bad0ae073ebee0b9a5d21853a9b959fd5c7ab6d91c9f735b06c39c65a4babe0ac58888c7012bf5d9ce90db71e86ae7def68425558a443c0304cb9650ad4fdaa839dde790e2db72c53a45276f9f3a19a93a550d78db93191505c95f4c2cc873f77f24a43895c45f764db0feda2887357e2b3e61c2ed0f37e70c8f40966c06b647eccfc0a7b0ad5c4b657dc6792db6069cae52a16d347451d10d195aafc389ce99e2ce0b9180c65d8b067b9f428554feb9c6514eb5d26c71510cb251b42ea2caebbbdb67cfba292399b4f684ad645c636bb0ca825e2763c266091b6276f2a200dde69955267e102b80d4943a53f9f8d623f4d58bf0e490c77d0a697e08fd8f892904b2f768e9634e3a9a44030168f5d15b1a211d4ffdba475f0fd41ac8b644afe9dbdceff386ef3d129d785daf9ecf4fdc1a3e6089143faba10f3db8af6c92b54bedac17cba545676b414a9e78af93cbc7853841785538b2be040972a3f66649baa48ee47068609acf7ea7b2a83d884b1245ff4f36c1d275600d13ecb3896467c5dd3dfc9a5c8a4a4eaab3ac3f9c87f46a997fbf250b0dffe20d77d9c1e29b13a8b64432405b586089c6a822ed34e033c72f3dce69987a9a8b0fd95d3d3d7d4d2ea861db3385a16fbabe76589a834ca8ad77ff8bac0389e5cd09f8844890a4de246d64f38fc91caebdd04c77e1f927dff321637455723be14c06d8bf5819d79bb536e4ca99c4ef1e6b6b709eb65e4767311f285c17e7d3e55b06da0f6ab25036901e8be1151dd534ab8d76eb5ed1db701d076eeb2d47ca42de028b4f2e48bfa0f3394835968589adc9a477c1cee4123ba46c592af8ff19a0c106d03b17ecc24b929b7d772de9cbc578b49a83f06071c94bfae163b93b159de20dfa3b0c3213d943468ce7412ad92aa56fc438624bcf7b2e50d1c54c709a0cd204c60f6b4c848b6ae964acc4d090f4465fe8ba9f0592f4b7d5f006bf5949423601798e57a233827bc004b740e712875a127472512a4ee24c1ebf7bcc040e563f0f8600520bae7114ea0b6f2464c14d6bfcf766f10ced9e2ce9f122390d9bb07900c05a8711b8a8caf4ae2b0e73d128b70ea275d94f9254c0ed0001e524ffb37205e7eb34866f7f83c4bd8bc5047a4de1b2329ea7ee57990687762e6e54b7fbbf0960d554b23989c6d416b6c137acbc5de25f01d22b0033a9b66b291ea65d4f500c3e0339ea240394c9625892221bc2ee9696c47cd7739ec6633b6a7625e1a1a50978b60cbdd194b2248e9eea1ed6c721d2e2fd7171f43916e41780f3dd1b0daa0a3cbde5e552451ea2925a3ffb5819b5a779307714da10c281c8b39ad463ca940bc1991450e42e3b35d02a006e9b1af72a815fa721e27783bdb7c72fe9a25c9009e186a6345f04f1486820858d9f3c23614ac0208153934bd80222eb549d638e09885efde847c17c654144e3bb99de3b0e8fb77aa02b48dce961e1f59ed8beca074941fb6c06d4964e7c131c19c7e1b6710eab0bded748b9674d934ac7ac48030b7cadaabc7ec5784a13051ffe8c8bd0462e1c19fa30355abfda65900a73b3f60f5712bc10258d9b3a7a08b5c77da6e69208a7a539747b0e0fba2ed4efd031290d56823dc59f76c6bbda4413827c611bfe414c311b3ca3116fc97e28e8866e740e4f0ff40983a9ad464304178f58eef6f12660d16cfd8a05270e1a8e2c7fd48d092aba6977377ba8ce793890171bbc37bf02c027b2bc195bea71df6de137a0420a5ba734660759ce0dd10ffd0f8f14417a7dc3f4e4dbb066e534776e978a7beb0266c78898ee4d9c1ba594e19f92b7d4e1c91a1ce5503e93f4c7cdf550cb642908647972671ddfc5ae8ef5143102b92968de42e1cf12807a4bcbf507488af4c40a8811b112d08e9c7dccdc1bea0e0e17c4492c4830a2aee7be0c852d1edefd8700825b002c8a5bf8ee138152009a4b4e151408cae360165c093b70fd2bc2f0390058bfc1df25b0e9f8629268a169003cf4dd25e1f0f7efdfc85a31fbd671c3290b2ea8d9c76ca99201449a292649a209c4453dd6602778642911aef554667b4e04d289660cb521431acb51d5e6b540f6cc24000363b51b4e8aa3299e51e19a44005aa1af7eb8d24cb2fd6600d3cfedbb5a408f02bca424af8ef556cd6d4a9dbb088605a5ab53f6e79b1bc87124b1d92a4bf407402e849ce4dcbcd8d9a1b7e30e03757bc60f9bda50ecbf4398eca143ed9f8439913be4270539b605cab1d3ba0904782b0074bf2c852646c1651c469770bfeec372bd95b2102c5a752ce278cb0b095577ccf51190cbdab33f7d0c9f50a6dc7d9bafc16e5119a38344946b589260098f116a477b2293f0e3c6dd5469b6ec53f33717fa6cc4133febc1303789068203d64de5fac73207097eff76df31ee40b2ae98d84febf2f1a7710c9e253962fc0a'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2003: NOTIFY_REQUEST_GET_OBJECTS', () => {
    it('Request', () => {
      const raw = '0121010101010101540000000000000000d30700000000000001000000010000000111010101010201010406626c6f636b730a0101d9405c2d64cbe139d58257eebee518ced64df14c5364cf63e753986c065eae14c52299465cfee1f83dc816e4b793d645c47c86e4cb8e9b8ac7dbb293d8fcf932'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2004: NOTIFY_RESPONSE_GET_OBJECTS', () => {
    it('Request', () => {
      const raw = '0121010101010101a07800000000000000d40700000000000001000000010000000111010101010201010806626c6f636b738c080405626c6f636b0a210c06007bfe736fc428c648a594910161dd6b0da13239910b1756aa0299d06fbdd12f1906009fd38df005a1c8110dbc634bba1b1a4011d47f8552b9deb91de4f54aef69ff80c1ee1512bf45de8f020101aedd0401fffcdc0409080275a46159d6179d8416351479c3ae28b962d686f25be6c2183c381f0b3c70c65b1e02c2dd7c04a41b3168db77525e4f8f038a4cc81e3a56d8e6289bfc123514a416439003029a596542123d0cc02816dbb98c29db2df352e2f40027e4bc40c0f5ec0612adb7f02e02e92135d4c6ab7267e3969457c826f0e4824dbffd95883b4a2b563d6778bdc8cd90bf0502f8e975ad224c5ee524e48a8ebf5fd02875786ab8c229f30d82e8625b8bf9ff7bc09a0c0292aa2c85638c4fd12a48f25f86aabfb770b864d0aebad21ef84ffe5476e22220c08db70102aa18b6a3cda889a052f6b412d21e73b969bd8776d73664a308246686088b3b818095f52a023acae7ab9b93145a16f88fde697122327d8acc9994afbe9f65c336f2e3d654b180cab5ee010299c4bf82145a32320f046ee481bd4a6c62869d8b85ff9c33ad975d58c568c90a57010d7fe19764b200321476fcf2245f9a285e76088d17cf347e26441b3bc038e0dc02110000001129225a44000000000000000000032100940eccecb99b93e0a0da75b8b4f70a86c4e4e2615752384da2a2c9603e23730601e2ab820101ffbaab820106020203b58238c0d48a0d3fd05788e0ef8bd697770eb1695cc3c28a147b3b93f6c675d80402492ce1e220ec192c3caa77039b67e88e995d28fccf240cfb85c2a47c6851a88ff02e025cde254676e04bd365758bc6cbd330beff96faef129882fba67880bb85a3d8ed90bf05027847d6ee4e437f927de857fdd8f19d15b194355ec3e15e46fdc087ce14697a84e0dc2a028d33f7edd7e47a94a4ff11f631652b6753f7c5934e5839d72d607612102113c480897a020ba825849d13a5e1db9d003df202033a8be8a839348c3acf2081af044ee0506a34018f3d2cac2bc6704a6b5bdf2f5b1977b3b668f75bb34267b81217aca8645c38a402110000000029225a44000000000000000000000805626c6f636b0a05120600d9405c2d64cbe139d58257eebee518ced64df14c5364cf63e753986c065eae14060087d48df00584542f721d4c1d6a75ba067a80c9cf213ba8c8419a6ce998e4b8c8140e8d742b26a809000101eb9c2101ffb99c21090402a9c7bb6bb4b3589de5ee2bf45d8a7ebdfac2906e1f419d4aacf7a9e8dd05e0874602e1a1c11f129f3993ed66825a6f30614ec3caff80de1a0abbed9589625913d639c8010283d21d4a013ce58b0f7bc64c45da106f50b54a652fe96d7ead62ccc607858054882702189d9541d19a965bcfc3c58eaaa87b987ccde0e21ee0c623c44e3258094ba590c0b8020230b42b390d576b5678f876521dfcd8ae3165eeb249566bf0eae302cb1a61c16480b51802fdedde021a2b64e2018b49ed678e7efefad62d84e315acf40a59869072cefb6e80a4e803024d626cb997324f8ef716596b67186b36b1cdb3746cdba553c41740a8e33b183180dac409020a131e742c77ade077d7867bcba41b72814251754b76d22d2cee1036a018121c8088debe01020921f52cbea2403609d5b1b5d444d76205c1bac88f57ac10445f87fb51616968610113fda91390e86557fa7ad74ada790a08e3e5e524c0e96c62be9839b1cefb21790321074a23a0cf24800583aafead1dee89609264eb2206102715b6238abf6b4ddd2b74021b00000000000000000000000000004da4c5530000000000000000005303d1918410a133c9982dd5254f01164701b65e587b30b0eee496ebc49d334b0eb01ebfc9ed27500cd4dfc979272d1f0913cc9f66540d7e8005811109e1cf2de58769b32a1beaf1ea27375a44095a0d1fb664ce2dd358e7fcbfb78c26a1934421ddb9a356815c3fac1026b6dec5df3124afbadb485c9ba5a3e3398a04b7ba85b4c11951957c6f8f642c4af61cd6b24640fec6dc7fc607ee8206a99e92410d30ad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5000000000000000000000000000000000000000000000000000000000000000001e3ab820101ffbbab820107010210317e3120f9246e5355d401d173f02b7b73390750003e569ac196a3459fc2ad0a02d2ecdfc981561c7f1a5a5f8e56ac380d66a2f4d0bbf817e273778523fdac23a5d804020df6e5432ea70e74714743bba166aea9e526282fd14392278f294c6881f22c8ff02e02d63cc9bf7ed05c86c102de35a835645bbb94d7e1e848302aea2d1a24650fbebf90bf0502fb8421aacce0f312eac0c1904881aad2fa578211340153cbfcd517c746efbc34e0dc2a0277fee11082e4f43bea1ebeae8cf78795c12f79d71c8b185461e2d69088ea9c7e80897a02421036566a2ba1a142bad3f1ce3f7577f986b10c4731910644067188086ea3686101dbb4c91b4103c67e5dd6fcc9ec3e3c878fa99fcdf7203451ce698dda72e347f6023e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4c5530000000000000000000259bab8f452a59eeca8e489e9a85e62dba195ac170dd8cf37235622fcb149841ac2671ce2649c5f98a6f8d179a14c75b539c16d0d6125a6974d50fa3750ae5ebd037478738a08750701000102a84604c5ee5af9e70d010189c8cdfbbc6f863ae6210d28917d37af38fcfe38cd040feec5adae9f9ee4bec5045a02aff8f0619b9f54274d40fd353180a1edb24f2b613658428a6a0354f65c99bb7eac020283a05c18c57ba42ed6c6f318f1317dd702ea3180856a593c1af6c69d65ff4c4ad8040286c6343027af6f1f8f1ac2f1a7357c3406dfd6364729c95e1b375f81ff6c3482c03e02d123eef408dd7aff99aed14721d040f663cfd17f9991a397603a9da7fabc107d21019587a325d15b8b1ea3c7d59bf0da99eda805ada5ceafdd7b821b0174b9885f9da5a24cc169ce14ce76fe548c698265c2e3f697017fb8f46b3bc682fc1cc1250c9b06ec4f23b1d50fff69f74055f6666fb045347326e9449172a10b595b197903ad206490bee4b89dcb3db0bcf04df5f625c03e4414622cade57efcf612a2470bf9dcd607944a311b03ad208e5592c0ffa7fb5d68fbe01a27fb62993c4e760b07e45b4f52364d4723825efd2c2fb988723e1b8b28c0ac457b55d96d0a52d9ca05fe618619a7a66361fec03cde13645d98dfec3c5c648003f7ea7882564b3d54003b85974584b2c53b1838bbcce0f6bab4c80c9eb525458550acaae16a8079a406c7c9a9172c64c7edeb1ec18942fa6164ff6026fc0536a536285a5b79f1c47e03a2bb010001005e02904e04addb9201b82101011403733d66826cd26c28551456c5f88e5d4d9496a00cc40fd928b38fac1284c402904e04ffa79101e6d4010101cacba693bb2004f9fb925337bb4f1d6819ea8d224b2b046e2df1080b0c1e38e502904e04e5fc92010101538a020f8a36a4947c021a4f787bc899c1ae8dec9fe5741dad14b01a959bd8720a02904e04a1cf9201c42d01011e2b4dcd6c4423464f9a9dfba58a67863341b3909f83f8cd72796ceee2b14f7302904e04a8a19201bd5b01018dc8db7fe88abaf2b1a7d49169b0871feb87c543008cc3c2162e72ed03cc02bd02904e04ae869101b7f601010168f8c9c30cb25146904f97a7a6da25635c84a6d757ea33574289e5a7cf1e4d1202904e04cee591019797010101648d8a28b23e3ee4f79cb43d2d26f4fbc928ed327baa3d138fc6b5b8550343ba02904e04a8ca9201bd320101c5a69763a0126b3d2bf22fab33767e349aafaf09d1d92d1ff2219a48fc49c3f502904e0489f49101dc880101017e9c8e8917fab6a454061bb0a1ea657c5d7e9230e9f97bfa4f58fa763a9f888802904e04acd89001b9a40201016700987f742c0c985f501eee308d63c7c0de79f98b17af7cba1536a5f29dcfb602904e04faa89101ebd30101019987d98d34c72b72b0f94b6828a52d60431a0f083f2529e5ec766e5ce550a34602a09c010495d260ed0f0101ab673e8e331b29a437f96cf2ec12a72d669b89300b5f049b8bf893d6f16d04f302a09c0104b09160d25001010c3d6a71b072117680f3c9aea7c2bee11b3603ca9cb43ae93342a3ba1178786f02a09c0104eeb760942a0101ec0676fdb2da0a761bf3bbc09dfdc00660f2fa5d69ee054fdfc611e2c5de300802a09c010494ec5eeef50101014484f8c36c25eac9ec8a06484bda4e6f4a7c0d49ed6ef3b520783ef28983f7a902a09c0104effb5f93660101a387a5deb5cb31cd7b6fab0e592339a0f2ff8897a242b2b3917f80a3827a64a202a09c0104ed9660954b01017cadfc569f55eab5cc8d2bfcc32b6293531b3eac9eba26187744dfe16b16776202a09c0104abc160d7200101cb0aba9aa4864845dc250cf4aa8fe501b0a742fc68343a54ae33399b3366b84c02a09c0104839960ff48010122ea5c3461926fb924b42f0cebe7a0698407270ab1a96731132c386190c8739b02a09c0104879a60fb470101b5704a5ec2abc6fc465f0ba6d0e0abcc0353a5d877d97c3cbea38fa787020ab402a09c0104e8d0609a11010123e2a07bdcc2ff0fb997c23211de7685bf215b29e80dc3eb75d34103b70d38b402b0ea0104d8e3509b0201010474bee53d7875a34cd3d681f97e7b8b41a257d6d0068132762badf4a32e5de902b0ea0104b4ec4ebff9010101ee435c4368d1a9363201890e05cde97245c33f7ec7cb5daf66e21f4e12649e5e02b0ea0104ecbc508729010113928eb6236b6a28678f4ed67a28bc07aa16d8cf22e7c1429676c866558ff0c002b0ea0104cce150a7040101cdff139e706c0c90c04c503f8bee0b8b81bc9178f72d48f0118d3e8c6a63237e02b0ea01048baf50e836010103fe56dda60c758a6bf1cf80e5442e30c555d7069a80949f730147f806720be102b0ea010481ed4ff278010187d972e012a515093b575299a2b27dd6ff994469ce0cc4bd9965807ae838f04c02c0b80204dd8b4bdc5501013387b9817c47154c66f58309385419811bc09f9e33f040ff857ef82916f3248502c0b80204edb74bcc29010180c4525bdc5b996813276aa4d4e62287a254b29e743ac4e9275b29971acfe50702c0b80204e7c94bd217010126809685904466843f77a50fd07b8658339557a3d815952159dcb62ec1221ef302c0b80204938b4ba65601014099aa4c6da6e0c0b4016a8b77ccc9e41e30012516d11ea1dabfb6f0b7a56c8a02c0b80204c7d74bf20901011dfaec81195278b22ced1d1c8f98edcf7c4d4ae4707221d85fe8eb83831373ab02c0b80204fe864bbb5a0101c9fe07d155eab6e4abad167c4f37a1c04bf24bb585d839019751d88b73ec62a402c0b80204c8ed4af17301017d2863c762f2cc4ea489d68dbd9866781ba270bf84307aea2925033452c8360402d0860304a4bf8302ca7e0101d5697250d70a16d027fcd3dc99762755c1332b47e85bbb2a7e821c28b6f2c35c02d0860304caff8202a4be01010157d409922c8a166612a70567d38d9b6f31cff81c3ad9d7adc9142884e7d68e1902d0860304aa858302c4b80101011b0dba206eaf57b1a1b76d1806eee2a3c9e5475e9ac74066cbc7c5760972fe2d02d0860304ffb18402ef0b01010a0b373c6ba5ad9e32509e3d582e5295e66f9a50df2b73e6c235c20d8baf756402d0860304c1ec8302ad510101b6d745be9d9d4dd4544570ff270c35d0a96f2674096cf2e6009e14eab10b7e4402d0860304a3968402cb2701011f80f59a19cea1f1c9e75c09ab0b99ab925ef6189b3be00e41c808200443cc4902d086030491b98402dd040101c954858145b1f51e4b391ca93aaa1830bf38b7659fe7033bc8f340438b649f1602d0860304ac988202c2a50201015791e21132b9c6af800d7c1d9c7acb7fb8dc667e6222de3ebac7e5a19780ed7402d0860304c3908302abad0101016372a4a4c0ee89496f68a6bbad6fd27c166cebd929f626bc709860ae03aa7f9602d0860304b9ab8402b5120101b12ab706f9d1e4a49a2395429e8ede441e5757194a0bd1856aa5d0077798e7e902d0860304848e8402ea2f01014b15e7a598dae1962789fea9d661eac957e87ea80114199f5b7cfff34ecdb4d902d0860304ece8830282550101e7975922eb40829c75be180ddd5adcae80b7a94149fa8e90785fa81ecad59b8702d086030484f68302ea470101f45bb5607026b7e474c5081de0280d659f931886b12d9f9b5f32d49fb0d409fa02e0d403048efc8001e450010144ac72e4cc44e8eb43fa087ae38825a56ce6fc8fd608077625d82016ec6fd37702e0d4030483ca8101ef020101956b95d5fd19fcaa80bf130a1caae942f2bedf7be2ed6ecec7478988c7f7bc1b02e0d40304f9cc7ff9ff010101afaecde01c3e353e5932bf63d923dac147fcab7009695cf8a10af871ec1dda5202e0d403049ba68101d7260101315543ec8f4be1bbb164232835e6f154a039344c2c6ecdf987b9ec66e94a2c0002e0d40304b6a18101bc2b010195f0307dc67cc924a8102cc00ca4d292700a4dd974a6db0cbbb6f58051be84b402e0d403049e908001d4bc010101325f754d86859679f5df576529c9308641ab4dd401fcff5661a9733087f3a27502e0d40304e7b280018b9a01010135890b5eb739e98d7d07ff3392d7a3c5e0c373525c0f052ead6783e50299405302e0d403048b9d8001e7af010101be8f86597e1cbc2fc18ebd9f113945675095484bf51ce42dfc2c3ea499b1946602e0d40304e1b680019196010101228626d6eb9af65218fed79717a0ff897f648795020d24df76938914c1f20b2302e0d4030485bd8101ed0f01014df771d7f8d4dc09134976506f61806864c74b5374e2ba4cc173b7e4c83854b902e0d40304b6e68001bc6601011b2e88891fa9ae13dc423c10786179f8b744a29f3f463320125cf79d5b009f9002e0d40304aaed8001c85f0101e755180a9b216924230c870460c9d5ad7f1cb8200407d6f209f68351b6018ddf02f0a20404e7c562c6640101cea05fd460194baeb705590545734cf2269382fe10d118db5bee5d7bd8ae766d02f0a20404adaa630101411dbc0eb808ba2ab26737400c7b2658fe140db275d8c3fa1b5a1bca9cc0b3b4d802f0a20404cfbd62de6c010175e72960a72b891e0a539e228929e6d6b6b655eee2292c31c834c73d8010748c02f0a20404cdb362e07601010573eca0d48a83440d16f2990b6f019fbe8b0ed02a0146bf47f0f3d2c2983ac002f0a20404f29563bb1401019bfe821d1f462a2bc65ce4fcfcb041dd315b1616a9fa2da572143aefde55404f02f0a2040489f462a43601011b5b36f394a44a5687da8ddf9a6ea7b8db38154c60087afd7d19dc586d3fdd5202f0a20404b68f63f71a0101655548dfc379c050e81589457b056a4a5a2275d14e73696f7b97aa0c846cc2b702f0a2040493f0629a3a01016ad04d96811cc8d6e76cda3ecb8dcf25ed21ede763834faebc3176f31e63991702f0a20404f59862b891010101c152485915d6c60f8326ca4bd8d5a9bf02716b87a4f7d8ea4a3a882dbaeeddf302f0a2040490d8629d520101430488b2d853915ddd41917f0a0bf77a527793dab1763789c6ccce7056601aa702f0a20404c9bb61e4ee010101b2f74ec38f4fda4cb1b8d89740b4bcba861a1b2ede6403d91d10b59f159eb7db02f0a20404d29463db1501010e3d99da1bf01257353592024c4d62d4aab3bbd63becf4860bf9d715c92b778d02f0a2040484d762a95301012419bc4df29f2b5942613380e096a85eae829d6691ac641c1ca73190ec86370a02f0a20404d8ac62d57d010137dcabf5bcb66a51b91f01b39c6f4d6371d915afff345af5c40905f66e98340602f0a2040491ca629c6001011226dabc2ce8fcdfb504b5c4e229786e9fd01cd65d1a644a70f81021b33e2b1202f0a20404dd9d63d00c01011cfa1eeca6107f0cb7d04832be90caa8660043353ff0cf1d858a09bbc05cb1970280f10404c9e74d8b020101b3988f7bde3c64faeb4a13e24bba29558b33610044b43a7bd04a02dc54d905e80280f1040498cc4dbc1d0101745454e9f8d8e63b8c38ef383058f4ff18c9ccef7698b5b7a97065e070c37b490280f10404c8be4d8c2b01018ab2d8c0d4347d2b01531b60c066ce43c6f85d36b1365104871ebf255554b5e10280f10404aac54daa240101640edf3c3bd4067d1bcd86af5b69433fde90cbbdb97f551e0348fd55ebd0be6a0280f10404f7a54ddd430101d412dd5bc6e4d18b2c2828760723b7a452d6143d1c31853b63d90026ce23629e0280f10404eb894de95f010185f2782a34feb245a3c5aae3e23c9d20674ca0716360767f486c98220c2db4090280f1040483a84dd14101015eac49f3327ad95d1c4ba4f332803ba90862b5df326f64f28d7a936ed0bfd29d0280f10404e0c84df420010151d90066d70081d94f3863bf2dbb9dd294712d6f8a15163e5da59605f1b281480290bf050496b04a9e1c0101e793d90d01c3b8a1a87c624558230ccb818111a9a1f61e06a59ae1de99ca35390290bf0504b69249feb901010110ac628e32c58e6aa5ae59f523db38e2ce3f488311a2e179e535dbba732ff2150290bf05049e954a96370101f528244a74ec97a39c2ed19e45c3438bb8068d2734536dd32253f98e0cdc797d0290bf050491ad4aa31f0101b05178882dae075043fb41453d1a6d90a5d86a8d259cddd5339e01c9f355a4090290bf0504a9814a8b4b0101dc7d0f5e48b842e203811968e49c0e87221eed39728dc0b290d2c09cba8343ee0290bf050490ab49a4a1010101fa49e8546313f2ae13f26b8a792751e7a14f70e7cff289cf4b81d2020db069650290bf0504aad1498a7b0101903b38766b7edf32100efe64d0813c1ab4c97b69a1cdaa96a6be2c84b8ec6d460290bf0504d5a44adf2701019731c3fb4f8d7627b4ab0809b15c2f6209bd0926252117fb041423867a4be0830290bf05049f914895bb020101237b41318039cb47164f02ef8119603b461f92d1173f8921c8dc757110121fe30290bf0504c3f349f1580101ede4d9568fe11063d9b2bf3d36aacb8d5e862bab2f635a7108435be31f24d4a40290bf0504ecad48c89e02010179b08a7fd17b5972ed43746249ff991b9abe2db7f2be259cdd919895290d2db10390bf0502dbac162eaccc6cfeb54ec689b98ab6f683ff39d9c36d043148fad935b14d1a2180ea30025af229a348b69e74e450d03732e1045fa70c64cc2aed4f74e06c739d2532b2408092f401021c1197ce3f03ef8b5adc33181aea40b1014fcfb6707e556eb45844ba35da810b2101211ec715562fbece95c5ef8eb8813b116a8703792bbad2dc63584bf1e6fcd7a8b7ecb6eddab3eef4ec212c53f0275b5d83348de21bdd8ebdbcbab63a5f7f8d0e12b6384b023532377c08d3932137711e173a55eb222ccbdf69d531a19ef23b053c298f55903c11dfe0d07328acbdeee8b206ab4f6fbb722bc3181448bf9fcf0954349e201bb88c07fae352400228d392905ed52b4ba97e5fa2979e9e797407093b0448a4e19466617b58647c16c9bf184bb16a0a8aee99f9f41072509062d30dd76e2df5cd951eb035b9cee987ac266ed0cbfbcca5a7cc6b0adc429e08f2570226fab879ef7c1fd600080ff77dca1b96c1c52426f64fc30a213c2c41bc14670996f6610248b96323d9d89d0ac64225f90ba1e342a023ac415718c6ade4f8b30a21990f4fff9cdd747673135830578cbb2b4318a6931bb2090368deb145c19c0ba4d04870a093dc587f4c051ea344733b593c6047189107f08207894d7f627706acfd88174c33d72268887ddb9526082517a5be6dadb347a04b4affe68f3db900d7d479e2fce47438ba818f337313402f7ba234a0dcf01c6a373bd55906ce13088e40f9a4dbcbf3207d5237ecc7ac453a6be9b9a0a64538384e98231df72ea00c66d78d58f9743b8873170663067c54202828dc272cbd4216e5337f551cd2de0af6bed8538fd138fe8044d5a77472699d6e99f4c3c5f209660f16361474a93c07cb4dcf787457dd6237cb245fc104399f53ffa41558ae87929370b994e00dcc03288df56f757c2bd2f57615ab6ca05b97f46e74228106e020876f0cb2eb2b68036ff0e95aa12f0a3880f0c35af4e2a724e5b56a03044bec043a00d7961007ec0e6f79ef6620393c49c224d41203f130f3b37955455f765f142243e35b151f290fd43a297e1aba034e3aad165e1d512a2ad9e40a1e4aa5b2d5061ee6bd077dbd08ea7270828f4980ba0d0b27a1ff8ad1641dfe554a47e824b24c497f955527a30922fc3fc0ea2046ea218230d1ec49686d30b6b1966219916165a3fde54e308f087a5fb36a5cd0af38681fdb892ef97516b654e3cc58b2859f8070a77d883f7304f361f2ef18d33899116779c4710b471b6ca9a9302c15c1cef9226db711850409663a346d767f5f743adbdbc0dbe2c2af3de8d277bfba81b22f6be846f509480f6b4f82aced65da778cd62596882ebb018933d5cc119bf4ffa36d23b05fb6070d91c23eb3c0d288e73ff65263e4b3618c33a6fb8dcb0837eab81687a6b1e0b20b519a9d6dd1e3e56ad7e4e4491217d37cd2d90c887d80a45e2f9e3221710d0b04834f741ffe2e0d4f238206c941bcab39a339e80cf679368009366dd02347a60185e5b25eaddc1370ea9b3edd067333d19a8daee973145228c68a53937ae3710dd9ef2a31fc2cc1adeeea69145358bced48759ec9d67137b0c2025049b364b70c454421374a305e99773404e83e3dd979ff2476c6ee7dd0820e713f8f8f40fd02892749e27a664913226196788a011c3107c958f96335a93876045542a1c45009f129cceb29286fa916e67de3083630b67cfd0fe7b3d1dd7d72c5ff712e041600b5f17c60545abb909a0d6bcb128e58240f2c68609218726fe4c64a5e69be0f090fe266382b7d1e3788244b715f81c343587dde32617e89751ba894e65f37cd01778269e45689f2f2341899e801db5fe75c04c4e80108adf5191b3935ea350d0d55f38c2d51fda821c5c94661f1155f065b23f0ece2252c54edebe5debebb0f08bae861f1d134f41a585099019bf1039c34595951d20f27eb0f9b27508d1e290a2f347b00f2feb826c757237694cf8a6014c88a6c44c1d0cfb346df2970b3120182afeebddbe40dfbb5d7523d80a2d037208fd287468a553656bc57c2005a5705a6ed519c625bfacb6ab6de654c9720881efefc0874cafe1be1d24118fdb6dd04061c8eca453ac69129e9f27ff64e406baf9980e998becdb307f36a42a48f72036111ce25ca094e118c1ef81a468f8df3e67e328984aa76b04ef0543c1226b40ac31e2f10b94a3d35d83747663d9707565c42495f7b0daa9dfed30add1669e903d9bb7a0a5db22d23052211b2da9dae53a881c4b3a7d922d98ac4cda7ec25950203c77b0fdae61f86ba5d3e7dd9de03e4a2795a26162e3084d4884504cfd3b90f85759969dc87ae7341ee19388a12b4d5eba6b170c76925a2048e1c639faaa803ffec180bd63c974ce03761bb6d47c4c8c219e1b3aa86e924c9e9dd94c96a2c0862b8db638e0f660e0e7d0bccdcef2336953a232c48d8221e4d1d6b10b7eb1d01b339a79044eb08252e894d6711ae167adfd5259f3d0fca894ceb76939a4a320f51d6056d83112e811d3d7a87333bb405a90e0a520ec888a5db3641c6b03105020f577666c27dc6978784b70960e7b35edf5f06eb562d0cf7939fcab6ac565b0e01688bc4771cf58927e0ab81d9f56e690a5fa9ae7a56dd44432b019f476bb406382922ddf8dc71c1469101a56943e2e0954a65995db5d2b1d899bf3c8f67fd062fcecc65c040b23f84995af766976a4925958abfd8cd7ec1003b6216a4da3d0f3118bd465f3bc90384ee4c12bc15f48b646a9559d462c51e65343d38ae34a105ca28bb02823fbda61165a35434a8278dcaffa175b70900bc165f37c08bab9b03c690c011840b9c6a6991a3acf3455bacf3f1b3d07904013eefc2b8b7088a360163653ed277cd41da6fd615ede62ea4bbfc02a08518595d123ed93a893c511c023dd79afec9e465a9b13bd7fe92c3df09022e08977b68a06e99f241ec78b9fc0c5615c5a4ef1591d4f37e5e0874aa12a2af5e0329eb18e8c304f726b500a4ef0811fa4f542c6e88e0b81d0d6accc35000b89cbeb95a48630cdec1656cf1434f08210744cc264ceab8fc64ca736389159f5ef360bc8127dac06b8205ab9e405b0e45a8f2ac9951eb213b5eb817a38fc162a377cb57c864aa66bf52ba9fec91ca0099741d1d3ae75f8dd81b357c817c001c3a90310af0f434db21c455f9b27cd907ab78b05cac56760bf2a3135d8fa6896e0bf248c90db8db14a756fa2531e8c40b0e33fdce9bca0b30312e96d62404ac81bc82f19a8749a8a78755bbc998d06d0e50d3b0e776142668a316b68fcc92c83ac1011d915ef52b3e74b2fd3ebd56610f4d145785282636ac6524db73f309a92921075cca9b8692981b2d461b0765fa02804152fb0f8ec28adfa686f3af42d330d1fd1af14269064400311e6119b43c077d1cfd9e4f2d26565f0b6cb3c438d339b77639eb0242e74d13cefe1a3e30310362616504b62fadc074f0b1e7c9c72a35d2c821ce945fd80660a45edc2fe04b07bef981f8fdf4f9db76a96a899f1083e736ed0e9eefc1d68783d33e7d58a6600d3325e2c952e832f254600364f90001cd3bb16c0f858d0ec57f14fb06cb7967032f6e23be9623d948aa42b7984aaae6871398e5e14e469f9df0e654171b9e740b73bcc0d6709c70d3efb2fa719081b79543552a61ad3c21a560306ea5f32d3802165e9f6d69ec9c62b3bc16e450610e14ccdb01b155dbfbd4c6721b21750c65024c3af1135272edd8a2e43e2727fd489d315730c1c9f556dcacce63ef1c59db0c98a22eff7c1f5334e7274acb1a5c887c66e0de20e71b082301f7e5da2b2a2002f9acfe20e6c95f96ab95536a4ea16b54f4ad2112181f0d3d1985c8b8bc94b30136879ee7182ea907244b07323426ca6fccb7b001a8f772f5b951296d34d67c02c580d5de6a4cf883ffecf67699f079e03faa562f5371b6c7ab6640410d3ee00bee595cced33e45509baeebca1e7c3e2684b735c63ae0307946232474c35214032dee3851119d020b4043b80ca515752d90a7f55034661c68e414586fd80434042738d5568cb6469a59b7d6e9556f3fa8fcaed0e08a0d3a654bc480519362f107936602149fcb1dee42058f6b7d03afe0353ebd0e24fc7485a4da0d641a94440c053c99d004268e454dc70f50d299302d599f06583425c9a1fbf759caf2914a0a92a1ec3f61129e49991c79c509c1048553ab8ca576898316eb36d477d90d600624a10687c71baccd6a30561fe80342f9540b3ae81d34fa6f4b82f5f5d6dc71019193f4df445cef935ee0df0caaa69c403aa83e15fe7aa5448d41314bef935c05f9b1dbb1e9d75e47565ba6436c3bd253c48708b8ac8590e4730d375b708bb50a3b7e7ea23a3adaca1ecaee18317ba6d1c9ff128f5b98d0b77f9a89a0e18fe60b95ad4ae1f9bb729a4ab336211c1b23f4f1ffcd0df53aa13c91e123510e48cf07086ed687a0ec8a639a68dc4f886423ceab36a3c605195b10d6b34c0525e6cd0513019d17a45ab999946659f63e113583ad9b8ce4082501bbb79b0c19bf02bd0ab10bc952a207b5acd81cf2cf1b31264c9b046ef1a45bfac614d9aba91e150501d23cf58f603911a56f25c2fd77377dbe80969a63f87707a5c8ecf514163e2f0e1e3faabb2088e4b1ea873d42efd9afd1942291c9456fcdd51ab08cc0638b7b04018049aa1807ba90d7daa07f28d45802d3996c9d2e45ab1a256fad49432f980152f71d40c454ce52970a09e0f057e1cc6a7f5d69806a3d66fe2fb985371a3c01ffe11bd1ead19d6817958dd29f88077509cc5fd4c96ef8f85e66d1ddfa0499020b2891d2d96affeb6457f73e49ef2822f284a482cc0f9d0f0b98487b749cb70cebc13300fc806ca5595872d67bc6d277369de3bc3e03b77c58d2791f830ac30093ab8139e8b1fe56f1f5664ae3a7058385e816f9ed56d839324aa50d3a210b0aa37aac91e80be6874678141518af20c9ffc3ba5e89f3100ef618bcfb3debff0563263f97bbaa236828f3ca65a1413851b9759639629147a579fadbff2bf0fc0ccf063247886ffb2a3577319843a792b8f51b3fb4458b9fc501ebfb9d7117970c6d55b28172d5b38d2159603b2703eaefb9448237a23012c6e8efb9ea5b8cc80d3e7f2468c534393e647669639887f1e2d3ddcfc15d3517804cf5a9251061530568834d00b5a8eb37ccd1eff2f6a3799c13520506efac07a8f97ea8e63b0e2a00e7b7e153c453b9d31bd7a5bb9309f7501c2decdcdce56ae249a985d5b9f6e50e156d9bf92fa3348527863cfa8dc1f756227bdfcdc73009a536738d0d198fb501225cca4b488544efed65276132b6afc0832d17c2ef9ff1a1b41ed663db19f80e976dd9f8c033d9a1eda8d89e3a7874b740a3081ef3b2682b96273d571b25ac0e0fbed49d21acb5e902abe581ea6d5f64a6b985e05d2b502d4e3925e8fe078707b00cf93e5c56503a98658c31835c97c5bbb710969acdd8b4a6a3b1f19326e60407c54acc6c89fab2e8ee274ce704ad4c2f28a140e25afda886d9814a21417801dbf27e52fb16e673561706e2ff3fcc1e961a5c94e46cc1b89f0e13171d32550652ed49f1ce7d3c7225d072adc54e29c34fdc95e1fd8253199497e99091b87306989adf64b3079cd3a0ef9e969519ae6da4f0af9a5fdeecacf2980f1df9e4460ff0b31ddfb16da4968c0fd3508e1c4a3119a922a0917b2360e43217ac3e1f8d02bd53f57abc4eee1ea401885aa622797d451ecd5efb1f393c25093996c4d51705730517f8071edb4446ec1afcfab567c11bdc74b57a57a87d5a14f218810a3409954230558b8d0bd242541e56cfe75ce3fb124d7115e62dd272f4ce31c016d302391549d10c0f965f8ab0ab4f7010f88c0fba9f7e7e8ccebf47b41df51bbacd03a60ae56ea0b970cf89a95b3f8b9065500ebe1cd33b6ae48255b85e48cbbc9209869200e6c211337503c4b7e7aa7a82fa2dc09d097d3c3a254c7f16b6f09f660e4d6a52827216173b5a4275dc9e8db7bd08043c7c219061f10267ebcd709b44009ad11612e2e09ad3e13b769321cd9246723f605862f90e9a71d07cbf29a1fc0ad3f5c7340eb510d40ffe46983333790e89f4aa3ae64da8ec037b3211c629be0cc8730065677d4404941228ef284c9cdc4aa59829cdb2b1ca5808991dfde13606c48f43aa755c121194d896f99bffc2b3fc8049a342668c000425affca6992402d6e269364bf1d0511b0a95d6b3a125c6bddde4b46b8ec63c70f764ac530c9e04e34ae0824155bfd35940235de64e826e2ece050e3c9dda8458f490bf69b3710ecfa1d907794eed12692e0bbfbe5c0fbd4d0f7865f5a254139701a22a27b1d50e5d1247b34fcc65d976d6905582937e227c299df070728b8958ce51c0be1f5302cb89e990662f0df24fb34ec1047d29bdc18a8af1adb016077aa9c830a92d060951cd08b1751ea432ed83a5ee1103d1dcfb2089a11e9b9698f6ce839694c623004a0df4d53c2fb35a64d9ec5d44d0aed25b7bfbbcc39c4a61eccd09c21558b40c3a6ebd0ba361f91e0f218b2cdc4893f5f8799e3ded49ede1cf3833ab2a697107aa8f9eae52842db8eee3d69f6a5beca3efc6b45cc88ba8a54c81731e054e620b637a0a34c39333e493b0ecbb36b9937238116665a2080152a697e924400a4f00c22211fe175903f466947c5740d7e51ae21647601be8c34b5712809c459db60a4fed24b2e2200d0c4f3e40464ebfdbadf210abe4bb09b8185525a580def4e7011ef5a9df4264c06173aacbe88323d9ad8e50d27c76a7b324a4aef26774923e0f17ae8c5c3a8f842f6c1ab3ba2f0587d1b3c65f5c8112c0660326832d08bf3301dc46c05a40cf521d2a8cc3b4e7dc2a444ca8baff7de818d675123137b044dd05fdcc882ea60affcedbab83707d1ce8cb21582c711ef4553adf46468939602800f18ced7588e3e4d9b5e39cee3615b09176192d8ac092b0df5ebed611c1266c0ad38909ab8d22945239267ec3294b7068daebec3fb680ae842f1992ce467d0c0e88d8bd2f6d6424b9326266d016625797ece3d5ecf3cb4641e5d2471d66b8a10abb3b9daf5eea724061bbcf4fc0080b6ec189ed1591c2b8f50012e67f1948f80d3b8930c93de17b6988f1b4102a55cd0d31cafaefc44f7486894ea771e4dc3a030c1ec12f74878bf96b91abf7095e39b75a2a435ac4f0b505067a4c2bca307d0c60f0bd52bae0f0ed37184926d8bb5baad414fb5606137ddf30bf6246b3f8430d3e7c65fd21b7b3d4fddbfee73332568e70dbf37e4eb21108957a6ffe04b1fe068aaf7ceced14d063943fde8ca1aed58f8955e7f1699dabeeef0b5ea527d1be087ced3994f6e477a3b168e48de36e84662e30ed7933b7e7b782c51c33aa74050e2ad237475fbb814b4af9e6b18da503594b8933ca58afc35c4cd5e668c2ff800440b3f42682dba16e7b33a48cf308e278831c95606655e73cfa5951d48357ab0b6327f605cf720d402bedb488baddf0ead8a68648c22e58d5781cb68dcdf3920c100a9c3fa9d26ab0247bc232bf553b93d21cbe7be6c621c54b99742bda358f0263e31639c4a0a3d89b87bcad5f9a815255d8c5b71206245757bc64eb48bb4b051f6f8131d91e7f376b273cd2fa2f8dff129278fa0d85f0c5c9703e4ed6ccd505dd9f53fcc834ed8bb8cf689b05cc3a6544449be19845ed97e1e1ef812b507d0c5e52a05740c4d86e9b08246842036d1e26d52d94889d5ca939f42e86ef208d0e6497a6c8b81f6ea96c0a23e113ea3a414693f9264d43d4f1d6fd03b00623240536e2b865abf26204bf7a2f516ea1cd6830f0e1cd1d882ac9750823504c3c06054da817a386b22397da0fd2bb3e49853141a08ecea95feec6fc24447154dbaf04566d171d37c56463da381ce7db7d3ed1084bc1475eaea490c44e62963fb83a0e68c9e30449c935955fbe07fb30e955f65c97095edc252bf4302b3b12e604610f062d3b6fca43eccec187e6e096ee2084b8b654d6b107059f06b3d5a7efb39b0ba1b75f8d3f4f7992c77b3197346a1904af38418bc99c7dd1a2efc8dc66ce170af41c5e66c10a3fb819df5fe7f87b4c4a52d3385ee84aebb2033c0845dad53b0372f27ed8dfee3aea99705cd42b4be0637cdd6e22926006191301386e776c7a0bf80fc59ceb1b6e91433e827addbedfa97b2c8c6abd4f7e95094f290e4eda620fd8750c7f602a3569798460c80d90730dcb4c4f579542cf2b353b49bba7aba109f9f423364840e0bfafb247c55a07ee916a046e204642769c22c3a49f57929a047069ea316ff595e38b30537bd1e9d384c6298cc14063b11ebcf6dcd048dac001741d42c204d97ab72b0c39b5888c0eda06cd147bdd071d18005e29f728a3e40a7ceb9eb83afbfbec129191478ff002130aa2da45055fdaecef1211d9b2782605197c4ea89f1d2621d374115b9a8aa687787dcb0f6586369eeda277e99a95c8041fa0eb4bd7b29dc75f7a942424ac164652316fc3d6d2145d3524a321a033090c88feddc488a61ad7dac47c6be709939331f4aaab94121806807a121dcfd73108736059893043d1c3dd93be31ec86d624bd73344bdd87c43aa86545210e31f1010056f3bc5d99abff1a2b4227259b592de9325e8477f83c7d48a076ad5ee15903f6e1ba4a70b560b65a374041222bc5fda79553e893a7e4fc796a048ef8d72505b527e22811b7f34563f731b435125e4e570a6b9b3b422f209cea35f5ce6880078530b520ea6197477f043fa074f7fc8fe627f32e9e09ced6a99b363bd2c35104513b77e81ec1b4d24d40c44173dcdacc2cf02dcccecc14aabf993ef7ea97990ca0abdfc902a7a00e274a80057f03fccc7a093bf0b5106cfd8ddefc2682aeb40a021e22ab8814732dc1633c3bc2a3047df4a7633cb185abf621da347200c3be02058a8d8f7c15364a5cf1dd3141b044c7ae4613d0f41ca21e0efd559002a92a0199201e7ec867b218ee9228bdcd986021b21923d8aaba9e8985a7c76792756d0ee342138970ddd344b6cfc7b62306fcb8038dfeb489eddd9a9a88a1422937fd04b7233a308ac42e79c9b6650618b67391bf611d7f98d8941754770f5315d4540a4526e9e1a99b5c38d09c8ed5996d4cebd75db9019cbf05b067b75348ac46960c71ac48b3a5345ff7844704cd85b64e6e1d1b07ba54bed1c42ff70deaa7b0810af2edc237bfe82a95a628f81bea50a28bd03cc7d4c8614570acf25416fb34a2084b3105f58f4179a879f39bd921144133198ac8dfead2e47e272e4bb5aaac46047863bf802a2557fa22e1ae5347024023161b5e401ee8f7e64f458ac127b4b60c7bdf089ddf4e239d109e09c3bb6d9f8f0417b359fa3c8d7be6b5114ef64f020817bd63a46778340d5467ffcf977fca32b99912dc3e53676df2f5f41d983a9c0751de24de7f5ecb93a370aa511983889a11e4236381e6919819ea8bcafaa449033db1bcb109298b61a9aa05860074b4e8c5993fc5406ea0e7f9ed1972c004f5013498edf9be3863c2c236f8362467f3ba76d867391b2c705c649d57dfb6e1ca0d7a1f68c8f812f966804096a0418769d3c701872b69bfe56de4f6f816ce9c7803170271451c88b4765f01c2b255d2c48d4b73ec9257529f451391c2d7b836ac024e3b74b91cbc4164877510ff9c3803bde3a5f2291c830d6fb7c0f231ebfda505c5458fe7c0cc7cf4153c6aa6d858d64bd9a5f4753f99061b1868fc76dd5f330b97bce686085629a5a75b4d9073281ff6e713fb513b02043c2849ebcb75c4ba02bee0430fcbd12c4fda1d4b39a13198d35f0632ac2d206b2d2489583e8a4e6009d2c074bdcba3e4857d92c59e9f7a37662632e17099698c7b0527f75ca348700eb69d9430b11b5c0afe30eaa1fc661a5be4acdff44c770677d302ea1a10b65506aa527fea6ac95e9c4de74b33068230a834a79f70d9c4d58a03acdac27c37f70df54ad3dfaf0a4917cf9ea5738c944b20eb3dda012d3deca9e5604cbb66a93e0f3f6ea82f11881f4a408b38c88320b62fc09c28fae75cb2e43b74e94301a3ba0df228721cd56499167ecf7fa989a22c319e53118c273363027e684f900dc3750fedb77fa36103d33fb5f35653e556aa377581dde8699fa6fd62d4bfe8fa993a05b7c9682c78ee54597ed69a26a0d4f71bf4dcf8f9dd9d371f94b9ce4f7dd72b04a861e196949290178c2b64c25f5bfaaef97fa530840a7c21eff64fa01dfc52068680ecf81adf204da24648c6049ff11d8af6598d41f660ff0a511fcf3e532c05f79d7adda4920fe951dbca3c9a9f3bb37eae3921079377679c98a88deb8cbf02fca999bb4610430be82a1d51aa16f401ea94d5aa114fbc2270107e200c4d80034dcfb5d5b976bba90c66514b66be45d5f263c169e027bd1c0402606d8c0ed8007aaae9004bcad684524d9f6eec5dbd1d2c1172965a479b9b460189fde2b05c0d1273fcf7e38cb23df7c96d490364f8568b9ca82a2bb94b088afc4b4e00b4130537223ac7fa8421838d4a80a7721bc74042316dce6362c23eaef3674e456f7d09467d8a9dbbd50b950721fe747874a4525acebb2c7952747ac977915a95e27707b4c2b52570b13bf090304297dbfc86ecccdacc8ed7ef24db6240ada7387a0e03e5085adbfab701e739d7eb0c966264ce0304a4ae6117d0e93f41c0313ba84d0fbde342dbbc43a0c701a7e721df9491255fef17542eb72754ea7de3ecc4255c0d04867ec64ac3b4b65d482166367be2e0ed5f38b6a092b1bbddb6e19b59eb8a0537927c5cfb2f3a1976666bab57984777d62c48442ab1b44a72bbe88c1d239009c57505a7400c7bf5c4d1c73fc6eaa47555f21e5346c2cb29c4dc99e7f19ed6056cc636a1e3e41efe2491c4d70422eaf381009e52ff974646ffdfbd0bf4cc030ac55940b713f2b9f48431547fe80c915f3f5867f06f1a747c09a732023b03dc06a759cf0d028f7791850046edd3ce6c2d1f5dce3c2ea9aae4cc84a4172937680d3de6602f3551ce7278c746971e3bc6ec3d38597d958307056898cdb48443570168fd771556bd18169d6356ab1d5125651b06304e1c0a471aeeb6de3cad3480045bded9dae8a76719f427613f72111162734d95e9658cb8008bf32b8e42468101d9952a697445ee39e4dfba7e8af6d6b0673c16b8f290e4815c692a611281b30adc48c2ce0a0ef32ef2a9129d165900a9a67aa918c3033beaf873a07f3cd8220f5e6d9aff113b034b200eed8419924bd5782a6a94adf22aa2214fc136fe697007b04117c2e366cabfb91d763139dd34bc0c82d6b7ad3b597682309574a232b9021bc0f226273ab9a1fc2204989d4d4b92492241cd66f06e95ba2286d1655d600a4533821a0851d8cc087477826e651a77770ebdbb892a1c8e463e0b2eaa8f43061a6fbac940ed5e9e35830a65158415ed92efbbbb7e548f3441ec46dee65faa0901c62e36066dfa104817d0d1d52952990a7f2c2b3b47c629caf733bf214d0d015ca0059b9180e8612383d67f78fb5d94a2b525b936f697b1d9aced2d265212044e519e63218f98ec1a3fed2072597dfc9dd4e63122bc1d78f52cea03b0e93209d9e0aaf9b11785f848f0e7bb78be663de3824187a836954a3a4ddf967d7aac0b0e6cb28881c92c11825a479a9fb3bb70dd66316403bc41f15d7490551d15b706b2b335f9a3924e760c72f71640be047adf2c92dc25513187f645163f40c1ef0aa3ab32b3c40e583478f2cb3738f1fd67a45bee08ebeaa7f56c562321381d960da486b2041857546c0a34d1c41f220e6c4e4c872e99b1b9632b18bf77b2fb4b044a2b481dc33d8c4124a95269c4c0e5ea05cd4476fc57b9281cf248d100f2ed0fb6f4a49e9ba03614107c09704180433f8c3a48a2873c8aa94a70f60310dd77070a7798d03d29a361f780285cbb5b1a0780dbd90d47195be8694e11224c9cde0979a2dd900d8e42f4876d161b0b292d21fbc2e63527e9bcde9230091de48fc60f2058ea9985c2e5c463115528dad075bbdefa2ad3bc02085aaa8e85aa1c0e6508db2d0768b2c4b18baf5f963a27aae0c540fc357448ff3363b7aa555d76249300d655cd3c45f9a1b179ef67175ab5db8ae8aa8a8cd2ec9365e0ed982a3310d70af97a3641aa333b66a564b669fcf225d05767c5703553e6f8e82413c57db2190b5274f3e7727562bd7eacfb80f9ec562d7820b5269b04898d0d276f602fe8160d154c49aac0916a82d85bbf7c38c6eb589cc1e8b35fdc10dd19025fab745b7d02b77862c06b97cdd69893ed1cc1c8d54d55bb54652b001aed8ee28272eca07500cbaea5dfa308c8c985835adf98cd201ad1a7661c54241e42ff1e7f27f2821c00bc37075ffc24589962481500972f51d32b320b99ef85cbb780b91fa909d1e10fee9340243a53fa005fbea5091acbe921de0c27b62f956bf5bcd79c3e02a04a002862524b0db4b998ee48b6a0a49a290dbd8add817ad6d449fe2a5d195dd9e1030d966500149e5bc7407b3907672a08799a8e8110c5645a790850bcdf8ef61406b3b29b9a4c7952f1438eeaed759781d414fa82419c8ea35ec47052cfcbb6fb0bd6d1416cd4c7061a7ea18d7b48ad451485da99c3903ede70d9eb3fd0123d7e0e427db2bc2a1693cf747390981508c108fcec2198e045e8718c7cd4c28d44dc01accdbca858f9340318cf5790e1e78f53661ea2133490d3d195028471e78cd60a590fa70ffffced0708143282310d8e0607eaab05e6bb748b57f09488bc8d5208b381a4b91df7c3347372f28445c8a7643d3e3753958644aa85df80b5362f5505ff3a8b1e81524d2131659489400361616f16f717affac28be45118c6c18ad40ad280e1545afc270fc053629308bd328ff09cb167bea0d3a82f4fa26af54cf20ae3a6875cb96f101ff5939e8a231dc792a6a6ef5a90715c8e861a745092c1310dcf9489d4d2eab2b9a875a53d1aea24e901faf7bc99ea011b8afabe155315320760a8c031a96188a8fedc7fb5de9e13b2b53c4ffb8b215ecc40ecca277f638f03a911632eacaa5812dab15af9108ff1c2563b2ffb340505c194ee2f26289c980a8f53f137d16068ae9b98dc0cc659d7b221b2c5ade4e868bb80a0870ed9bfa00b08a43749abb252b980f909938e7a5e94e43a139d5de3358eda435a0070095708e19cbcc3ab6902a493b0720fd75b9eef24c131ca07fcc6cf599662e296f6680c5af3924f649af9e0933550d6bf70fb057762ae5d6362c914ae9e28b6df9e6a027b14f536ebaa29f6dc3b5c6318543f0737dff64bfdc5144383c568cec07fa60d92a644ca828e2f1c76d4d2da3c8c5310226a8cc8aed479903f1bc806dc2844069e71a5498faacc604ccbbd5ba73fb2829b9c2ab9b467753d6d9db18ba9be8a03d12f17dc9d83d3a72e0d1ecb8eaaaa9d3588db176e3ca997502d6e5260cf9805f8bb1ea7a1bc040b334b6bf72fe452511e008d28a5c052392305db411e397d0231f0700f610b3425411f3033363ea43d4820d0c6018046f0da1a07f058e5710d894cb018b265aa2a3fae575eadd530558b652b28753d6cb4b8bbb0051993db090818e0fbeaab2891ad6f42d288c09d9fcd46732932a36142ebb41849109ad202233ac3d109f934d87577aa066d8b6b646f748f411da5be8d99b813d54ff18707d334243716913d6321c422ceb31b00bcae1f738a701b2b8b5a8e252a68ca16027244dc2b489757aa289f875637ab48a71b9555a4b584998c00be9d2dee1eb203ed852cc45b31e73408676b699cb6d6869a7a5cc8d6c33da1e9494a2a47c7d709e0d796e256e4ad2d72785db0202dc882ea8f2eec0747edaf93eb6280a2e9300049afa91e9cef32052dc83bdb641b27c9ecf9378c7bc411b56bb52be4cbfd9e0b492d4af69d259ad4885abe93c99b9d7414d11fdc3cdc302cfdbd2fd9136aa9086e13245588cc5874e1b7a3db0388dfc42f5c5714fd21345c0bfaf196517d0a0dc4f3918e9defc9b13be7b5dc88a827d5e299c54c015c283c70d2215d0eb5460a82af7e7a72f0560cac27d2d42d8941c8eb5e5dad9a09d43c4a6f21b32da09a0f9dffaf7b0522f2f3bd8375ba7bc060c55610eb6d33172c8a5d32cd268baa91034e03b9aa9edc1868292361f3233dee2273ee5e969e4bc28c1d6938835d1c440fe4749ed9ec982a4fcb6a48493b48c60984f65b47afc060af029916c9580f040bd811709f1229d17d8f0a21b56ff37fcf9c316f93e6c1b5e599d92d8411d7710cf471f8ecc1899074cdfc7c11e5d55bbac1267f642cd1e49e2eb18f829cee6806da889d9ffc04b16762a1708d2fc2bd6fb96010365664f5bdf2a85c59b67a3808be16dee240118d0d185939715fb857f77f13818adb8111e64add0a9ce5f4630ef89c80928a56d70c5819423d578455487844c01f6aca06fe2d29a5eb2d38b1054b6f4f1b838b7f7194607582caac2cc4dab23b8a400e07759055c0df32f83c0d9bbb014c19dbc5f8818324060110df9ff015f24e89cbf04c013b2c67ef36680a07f41626b2b1e5ea36c201558ad4d328a213cf8f55dceb1dc2fb42c8aa6bbf0fda3e84c386f9468a17e06f5ba0f61f513ab5720a5d72b796f8867bedeaaceb0d54541888a7d1d915f059ad93dddc1a41b184b9534677446c967830e26f5cc7046cd3e04f1e7a718194dcc623696b412522e6071ce533f753ba9771e8843bcd0f957ba72d05e03881dce02e6731a238d624c95330d51ed2400eac8c624fbd360cac42a6f0fa385cc810443073acc0bf93bc803a08c128c673cd4b6fb197a8aa0ed640d47a1b1c46c4aa730aa0e09591e09af955b6ee3443af0424ce4d09344b03ae2d8c472224358ee6079d46898cff49bb1e9de01749cb7b51b4ae4f0dd42504fc580fdc270eb2b7c42395e807001f99714ff14240fd2ebf9ca8f93881e8300d9279b9207735b9dd4b0cde80a72d6041286557f5de2df307a617e80ce411370a901ae283a361f1bfbd61d67b0c0d85c605ef20936f97b71c9a5ac73870b2d60eb32fc6711dffecefd8962aa19f2f35e2ff5b5ed6462f09d0a3784ade97699a07ceda65fabc262c0e7e6e86851dbd957bf2d3ba53665d4cf6acbbdc123066ab084f660e69df6bd94dd3baff6f5b28c98264a88da3ab648bba9c3e7efeb54c3309cb6a1964a8dbf7d377857a17ccdb3c9a20fab80a0273bf5ea97e2e3e4efcf306b6657cc710d7c298cc2a499cbd48fe9e2b4947d417e3ce5c3a46ea118fcd9d0835711aa920bea3a7dd602129b027bc44818509523583bae1973abc0b94341d0f8bf677b3b1d5c81fbe99410cfa8e37244f34402da55e1e34a162d3fbe331e500f831de5b8461aa0f515b669bfcba0f9b19e23d89e5a3508238e4eb0d7252b106b5212440d4154e18c133d994cca04fcf53fa2e132a13edc5aaeb7db704e9050cc608483af17fe4bc5118f01d3373e54df1e2793b122f051141702cd27757b60ab1900f02b2a7087d31d9ecd9584ef5f26373e7fa7e1d052b8519cb14a56b760494e499cc0a35b1a563bada5916532c024ce707de1d52aab68d05ee39ab1bc207e37077b13c628ffebb33faebe2ee67e03daafae3a0f25a2a45f9b68043435d0a666c6454545e6574653e8950fbfd960764feb9ff01cd1cc82d1c58d089e3c3077ef6a5bd076f1464ac4354e3b9f43a49361267fe097a1338710149201d491200b762f8ac8d19e5abee63c5ef0a89954c49741cae4a50839d2a7b2762782c10051622758644ce82a1ad6101040e75fb5adb42edf4ef045283626502610c55a00e5cb72f98f60be9b7e93fd720d4dfacb2ee524dd18c7a935cf7db84beb208c60f0129907360835a9523b04c7276d279d1947f93d956bec5163d5d6ff0f831180b259cf7ff7ddefd1259ceccf37dbf87352b18e8c0e0eb39e90eba31796c89ec059c49f2f720436ce63886b12f2fdadb93e01133c20529b0fbf206baf08425dc02edddff1082d4d72bebc32ee700b48d2f5aaa527b0d4bdd9ea4120c585ed3520c1b4cfdeccf6adcf64d944f892a77ca4797c1f2cb7c9edef85c5b8402f468d402a122cfa5c474adceb5dbf41fe5c6ab8c9d9eb41f42300be89fbd62d3dc4a4304ad7fcef9b33fb1ce108a7636d668afa3f53975e2be8036a5d79fc0271a3a6f0a0d905c0129d74c8c66976fd384eab7f06a61a21fc94521e78fd4203d2fec980777de17b7f8b7311933ff96fd262baf0652c8669aff76594b9c5e298f8aeec408ddc0e7d0bf064b9887e3615bef5b1dc5c13cbb4dca31070d2994abdc939e240b850248d2d7da17490bbd1e5ca45fa6027c335c75354d891dcd5543d0c0556c0a539a4ea9a705b72be58a9fcd207d218679bfd0f878d56bba604ae0ef51f96e0b10b789504514be38b854581e96512aed9f5b768ef3645aadb09ae0f7186b8602b7bccee74f6b502e91307ddb6ce1f0f62def1f4efe209ba782214e3fcde65c08d94a08f5a0d22275e3e49ee643447777206346a5c9250e27ab987b3bc42dcd0ac50d6dcc8688aaed910bda5ba050c66f73f67091b39d2dd8d1f5ec569422040a77e87dc011f8c4339c137f12b685470953ed9ca0b7d4f57efc0966ec6ccbf00d5cc934d7889575b641d005557d3334e489a88f8449b41c49d9062cb181c61b030541e4ece5de675081b941bf810493d1c2158a72a6cfa621387272b1a803130c1c45119f91fea8f2716e56652c1dfbaa2b17ad5c91d0001ddc190456f4696303d76133d423019e8051fd9226790ef860edb65a9a661e96b06cb7cd56d4f1250122e6f4278e457ecdf68b9c336e193b78637186bced9134c30eecb420be91fa03ea3bc73474bc64f7c4d1b3366d13f8ba8b0bfe4eba06c21edd0c081538fbe40ad6e8e0d240ef932b25e9145bbeb496313112ca744132ffbf72a3a3a29837d901998546bec6681eeff6dbe8ef36ebdb2d56f8d5ed6ab5a924d10063aad3dda7006dd094aeeb9452d5ed9635509060c9d84e8bd1ce32f39ac4f331f354233b4f094a848110c8712d3a0a8a2d7a5520e5f6bb2bb921610c2b1553a4bd979345250a9042d7686337a68cbf212226cfc839f6373fb5fc6736c96c318d13f2561418089193b8675754c54d5d57821f2c2b29cb857ff4b446858aee1fa8454fbc268707b3f331d074e0dbef42155f2c39a5839288c4c2d5267c18d67c606e39d768d302b5b7a245db074dd439e4da02771af5df82ed756fb24f2bec66773653e8d5bd0b5418cc3595da36308c2715ba4763559c068b98943118c999e69d5d90f133b00c7721a6c89c5b73bd4bf77827aa2af77f41a4cd2ca1f4bb4c1ae660b35647ef0e6852c592a6b71bb5f16126766f44e1cbbd2c31396809f8049e65da158b9b3c04a1e0942ca737ee0439b2b12a9f720804abdf3f1dfd0a8c01d5488bfe5fff420a4a141a5c2846e18eadf298ba991fb10dbe3a9c34353771e2f9d330ccc9ebf20143b213bad102853cc09678bf74250da73c99c60355ee9a36afc64534d4ca9509be68c7f24aa288791b4092ff683f79aaaa44e8ba2dd2f3afd06894cee6219b0a29c326e5786833cf749c27b39e2d5ce64c31884297fbe837ad76c030ab88e20d33048e336694da1f7918bf23624e1eb3467a953a48970a39b11d6b1e55ed53068c7da5bb39fbd5553690b037caf6d70a3941077be409af792f7112487f8f170509e5d20dcfac9b44e2c2a92b923cf090d30f807b90558ba901812d59af00950e0f9aea48ad1b10538c274c7467e84839327d8d694470909b39ed9f7fd2d55b0049fb26aa888dd4b4c9883cf25a21c6b288e7f05c78790f6d51c8a4c8df503a093507d7e99fd0e7678b37f38d61ef0cedcbdd9b669a27eee07d2d0f5b4c69b202c5e2b74bc36b46d2b9324bd19429896a737ee6e5038f451cc3432e36cae0970b542a1e5d96205c5ad9c0b456f00233a830aa334ddde738b5c17abec89422680695970b3d877bdaae2cc8d859b1a2e541b1669c5207f8f797581dbf77bb5d9204a8bfcab7ac845511c31f04cb63b9726b3e6de85c597fcb6d52f17ba227bdec07ee2f4bef6c49e9d12e97bfb9f5a4bf8c583426d1effbcc72b6b364e8ca629502ca63e3c17b3fbd24d8c318a0f6f97a9036b665b660a684711aa76239e8e6e509a760c617c50571a3ff9fc5151492c5f46ef75fa3b2135677a02e7d58f20f520d580f45623800c3e3fe76171646051ffe9a74a9c32af5f2efd8cad7565f09ad08f21a5ec5cb87e140732aa18f73093ef8b2531b80386dcece9fa6bc04b49bb308e8d2c4de74b34a2029ba91b221b7300ec7c3469c9fe8609d1e02290b2902a507c5cf878e50dd1c9c02c744afa7130c030eaae01dbe15fdc07f614b29db9321055b0973f7b2d99f0b59419aaa7dd31492e99d03006bc7730d3e7d8eb97223bb07f69eb1054fb054af0bf543682ae598b9ba7c7164a88d8e33c834c6c1f6c24d03cd39d5c0d07a4711fde5b2af90c3dbd46074861ea9d216cfdcd018b6373be90399f46aa93f29fe93aa035e3b83a06251eb6bac32825f26199c79526fe9301c0ef8f8ee547ef60374b6e3972630ddeb9687bc0e67464b5fd59c67f30ff790610163610ba1e68ba8ab0fb77b3ad704382b6631f6b4a0e824bbd0d6a6de25a3580577d0f7412f0804c12073661411007df4c81d687597c950b7e4b2a8695b873003cc7aab4b1d7c11c77458e088bd1b2d43dddefb31ac4f704b60b9c1b186d958027cee62e03413b413ba0783e8e9a6d209b2b17a1166a5a084d5f42f88c4a1180a3c45b1757e10ea834bf14b0ee9e2b577d43f45bd0c122d196d7ab33bc8cb78063780c3d1edbae23a6d87f7fc6e8df9bf4617227a98e02574b96d39b93ff0880c6936ee7c58dee6a3b3f6ad522cdecf11f56edb02f990eb57af8befd4e2d8c90560c6c9629c1c143866fd6b034ad2b0cc3d6eae7a1abb23ddc43a117f83dd5204fe04cade5685dd13abd8bbcd27674ea144f1860ded34b7a83478b78670ec12092e29af4658635080db83331b5b143da7ab2f97598693839a8a7a3e3a0c878705dea8f1d30358bfcdb83676ba54ec79b8215cadb97829d0212c70d26cc74767026c2fbd69069ada865814bde71a5fc1e0bd2f14483b75e8dc92f09eab705e8a0e7f30a63185c31d245d39ff47e37718cf868d31da54c89fc090d44338c1cfa60ada146870b8a3eb09838d4cb170e807d0e419a2da4751605dca1943b73011b3081f90e421e94f6322bd2b5697c748fcb2b5df7b9aa18f623192d6771b8ca489085ece2c5ec8ea1d45ef20349b70f72fa0c511a22d1e8a60d13bfd5ec43e32c90a7e2416afb8b3ba05f42defa830807bb313b9ce6ffcc7bb8dedf7b464b2d50809ece2ebe30331020d047a364ff6bcf8d6dc21b1600c5ecc64899f88f972f952044fbddd9d705ed4159d4c5934b4d22838130caa4d6ade82a0334cfa60848af805034fdc8bbd1a67780c9208fee68ca53f6fe5a5a71803495fc819bf8ff6fe01002ba92540027b9d8dc433c29db2214e8ae20dfd13c2ffb6ea8eed0014e7ec10060ac71a6847b379596a85c5e092a97c777e1d3bba3a9c5bf0e4f4438c99d7690a91207ba843070c8cf93c1ff22d33f06c55f17bc92b28883139cd21f6bb56c4057ec88ebe49e2247e2d1ecd68a0c50c39211e4b746e0afd6865feca5ccc618e0cd96e5626c1e8a53c5f27171a8bd620119f06bde79cc82cf676bb545ad2081c00c90161489b54851db5ec558a8e777161ca9f6b0bdd65047092c45cc29d56120fbe8b0f12057902941eed59f52168824fe7dc08eedd01d41b3d58358c7f315207bc7b8c588443678522cc32531d618ac985a7955bf283aec241d3f263501a710296f9b9e3d89a4fcff80f7d8cf32e38e506d73a43c76414d8e53812d9b0c9a501adbb88c36f706d063f6a40a9d3689ff97d6127db38f829748f908da50bc23406c87a7da7ae7c076bbfdfbe2fe2cc1ba5f98eefa396a80ecfe89d0aa7b1da8602e59d638468fd9fa64325839d6240a4f234ee42654292493798ecf14c5554060fea4431f00b1b4fb4b330c1b2b48255ee7ec462af27b34da1315a6e3b38529c040bd5bd1d932cd2c768756bcf0d66fb34122a5893338fb56176e0bf84d49a660ffb4e605f3764fab82207042ac1cbb81d2eab47a52b0dec1763ff2d540b7fd3045ca7a5d8af19caa41968bf7ea01bf66c3b64e9f40b7b56a2ea2ca358d723660965f1a45b1cea0737757dd84cb31c28bc0c2ee82f6873f14d3b3f01d36158ce043227ce819c5e096295622212de129bb7f88bd58b6835c340783725cd816e38007d298ad756db7710fcf0d8f9fbc7a893f199a3b9258e0f42d1dafe5c67938c09ca807001bc74f8819729784cdacfe05dddf109721007ac3c8cc7ada4f172230c401c436ea0236dd173af87ba8cddd22a07df59ab5f7b5eb0338bcffbb1ae720b1d0fc0019c38a17bf0e1dcaa88a42a93f40e5be5d0e0c5ab817fe106a6aa16009fbdcfbf278e2e3952497d8226a0051db112d83e6cb8584b4eec8cb77575e001f7327871e10f7b65e667f584b780eaf704c0ed2d9f29084e5b04bdb77f8b0104d2b9a46b4656561b64d1baa6037f61a4415c997ecc4a5d60c624d88a0cf8100ff8ad4a8415baeaf0aab118a71d962c062b44877dc4d5d6ae465989ccf2d4dd02273f93847d0a796140df5010f0dcb84e37d8406ebb2c85463264bd5de465d80f27232a3b2d8fe014da5cfab23d9041b2158d8cd7444495319620981243bc55026e61ae5b38bb991e7c78c1c89208d4155b81b34f32cf43ed87d542dc409d160aa7f19ca825cf59cee0a85c686ecdbc877c88ac92300a78a525f6366d3c9467040871c9e536a9bf4c6b80211f02e4fc6f68b79ec5b0b5e504ff786ef83137650e3d4cfcaca0fff13fcbbacbad3e3207c3cf3e3ef67c3ddead1dd4e879d51bed085dfe73976f7fd9476e0acd4dfbf132a95369fc44dd2275099c4a7507fca0550d1c6e1fd77085887aa3909cc4944daff30f74e143e8ded27897f75a778b67810691bd4be15a67cae7c373e650d79f985faa0db7551d1d0ec63ccc30a377a32f0b3572806c1de62fd337d8aee53fc3c317eb00cc56a4161206f6054b781233dd023d553174873049447da23ace7a337de87d7ebb6fcee20ac1383aae1be3834e0ee77edb7e3c45c7cacaa2a0a18e0d5568dd34e6ee7404b6d1fac5070a4435310c6ee1d25bde0d218c6d064922dc600cdfe845dd2062547e17e9bbb4d9307805015edcb16520406f987b31a281fbb39d956dc0d6b3d8e6d8c26183688086db7204e4ef9a1c822b21457340d53e3f7b81c6535e03d68205a30fa0f83a640a8ab40b6bdc0d25d0fbd1a10a08f85e39af54ca4215313be47aa2e74c75004f26ac2e09bc94e0900cd3008d2c9006d1093bcb729fb681995410172f42665f8b8803220d3b958ba2660846e71eeb8e5d4a8cf0600c2e945778bbc09ff3933b58bfdf1f020a736ee4e871f653541f0d261975e10cd38863655caf8ac5424de4cb7158dc0e872849ac1b938ab6ed5d728a95246527695b8a1ab1c64107ed82145af1f51c03d734ab3a06d4570b9f5100f1434bbc0271e82cf922adaa212099d2c60c118b0590ee80992b2d7095f0cfd11c39997af567c3006030247135d389ca061aa8c605678efd0be77f2a2601b169b28e1575806e7c27d2f0914090694e76106a389504b6e2cdc05b9f3930b73ff3ea42ae8aeddf261056d8246d9722b6103fa6114b04b119d3a0a8bf19cfc96e76198f324fbbcbb6d673dd5d306fa85d5174bee0740354c830aa10b4f342ba0c673f18b6eda563bd19179518dc9d3c63492b0bf14c04455628e8b9e0a0bb0f5d877ff3c0bfb3c4ecd47c396ccda357c19f95ef3fac0784cbf7efe0920b107c3ae8079dace7fb8c831ea26c7f379c7ca20c3172155c092fb3671a554b48826742315f2eda2482b63b18b71336388821f323a40b634a0bbe20f3740b4e51958d93df30f95592a85c4d3f2e0e13e7ae277da90e5fe96a0165355f82af2b74d3a5d600bd5092e25c7eb4824b1d97ed940916eb54f29b180699c4e0767b2a542496c4a01ddc63b01f8ad657d47c5afb8b9964691285c7120a5b5d260dcbcf0553dd3f5e17d3c9fd018ec26fc657a317408f01e9623ba4f9057e1912b8db266f7b6c41ad0df4c31c266eca0f20c500c7a439087abe5134c301067565ae718b5a44b0c49c4763039de845979a56c2a517cb10197701d9384d088771a10b57e43ad1a9ad81110c1e23e3797f57b749f902a7b9afe732189c3c0313278be63416f2514d81675dd62069d2111a80836e482e283a7eb5d4412cc20df54c6f5dc70878ce78f14ed71ea3f81466378f0e398370bc258c6b48ec90c003c4ffab135e833b1b3ea45b960ba3db39dc7cc4f02d562cc56f9c6f51d89a2b0d7d805649e2ae6d9814527513fb8c87c92ea4c38f37f671a9ca92f94c9de8eb081b4b0770d06d0b98ec971c01ef90acbd7d07c9546733aa1c3984faeffeae1a02945e376f73fd20a0381cd2f3c9f667fdcb5344989d72b7616e90b13c715e0206d2d6ae9430de1c85fcb97cc6fbf798075d3db216f0152d22c606ec6fba5cf702be4406b155c1201e68391484e1f2432a05100015b86a3a217943da8d58301f01f13501f2540f8299ac3627666a73cd62b85fa58968b2ecd5bdc8ecf4f9f22f0d780db0dbe6cefb0132afbecc054fcafb8adade9c8fa8ee4772d074a9f7d17e0927d97574b73639a729ea8aab5c63d480d91357c708b7a61fa480b380000dd5026875d9923e17837fbe87a8604728cb08b05de8c48a1c421024559000a5c38904b1c828ffa8d460353dda3b23c3a83d3d0b187b94109cbe9c2a42e551916e5d019d20e1b31d8aa69ee6e86055393a2e9ba9e301ec47b5938c6fcf50f5d3fd550f9731e033b9ca7715ca6bbb7776c0f8c27ac192d67169bf825c9b145681aa3f0349a235e4ab38fa0501c44c6e328ac9caf0bb676cbaec4d538e8b80a68a21d10d0ec316cd4e7a6f1ea2ff788a498b020380afa038bbb601e40b12a8e3eae97902ba9c1211e6b27ae40ac40042e2f792c98e1c1e2faa87fd9a15afd547f6e806053b3a57a1fa2eb51140d9add11f473a380b13e431d2b5777d16f6f9d178e20502b100da5f8611c3af1ab775a0045bb24d07f6bce9d596cbb55201cc2f7096e9040e58b9a0a1e6a8431a864ff2fb1513f90c000b0d81e62db4f08edf2fb1577e01149b6c686ba243ea1bb9280fb3cebae522caedf03f92bfcb6f07db0ea4454507537ef173fb65bd2244b6de0c5f31991375866d77ab5cad066ee2cbc61533e50d38b409b0bce1ffabd5d9b40238a27b2ee740040b631608b18fd1065e6e6f4600f7f4b79f17e339308036c3d3decd2241b92cb9295724bf1e09acac11321bc407c7c8782f76cb48a60c7328c1279d9be4b8303a3aaeddcb4d4d510acca5812101563e0394693d428c08893e3793dc580bb01e1738ac72b586fe1b483aa2c3d50adfbd3f6a0c0049f5f3fccdeb9eaea98555f6448f1c396629d9d5cd1703e0350733b099c5e8e41efbe266143f42c122d7d1d6287218856e87c73243bc6428cd0c66be5d0b6ba63f4a1331147a91d70cc31befbbc37c47e597c66af1e1f994d304d14a06dca9a48761dd310aa58cd51490ee4ea16f045f27a643fec81556c42907f8527aaddd23135afdb9e4a4a632d82339cdcc887e92818b28b1f3c49909ea0c81cff0136e3ab932dc2f2d525b3d6eb95f0afc767500658167d437faecc04c05f7dd46ec437771c917dabe78b981c768ba5e5c4c854d405f2d8fe1011dda0a0a6dce150ff0cb0d5137f78936347104b80aea0fb30ad569a3803a1d338bd25f0d52ce384543c4001a6042dee7ad0194dfb24a99d8092dc9b2d76b555a02a586060d254053af2df6b24e1ed813d4fb4742bfe55efd28c698f241469f606775820459f7587e4d2f182e2657c0a9aed514931ad332d09486b3295483eebb09bb750ce67028353319e036c0c544aefaa7757dcf33c650eb737e96ebfcc351f5c0bf044a7c9b920414f942333f71eab8f9b47384935786dba9493f5c3a6531d9b41c0518cc9dee6f897a5ecc3b23fdfbdf0c2512ca2560f6ecc461b14169176256f607c3238a98e549e1437d450f77948d569136524a2b8153677160456280a8fa74088f34525abf159385701c57a0a33b107d9cc83b8b9161868f1423134e5d446708db561b902808f2450dd35b811ca08b2aeb7e1118abb29f445216e5975b70a00744ec339da2f51eba74a52dd5308378339ede6f288c426b98d3ac6d16a8196505c6e5c7313daa983302bc046235dceb2be6454facc60e7cf5d05272af3e9e7d01e1fb820a506fe01672212e61dbdf815a5f6d016fe2810cdefa2e85a90e0b1209df12eb5b98b2944eca01a848109558aa4694cb6af5db1d8d1a4a6a74ecef1806e7950653120ebaee5027a001568aa394ec250a55d6aa95c0cef7d77e4e72b50f8c84cb7be338e9e37f23843f10f63ab7c22deeb67fbdeffc37f871894c023306dc863aa46d4066cd41066f19d13fc4d84d5e99eec49c2560a30853004e740609f627dd08d7e2c8d0e64fa1aa441b52cb69a501286aa076c56e6047fd9b0895081c222fce53ba63e43511617482020f8668f9e58b8ca1f50655fbb0e087b96803b2fe3ca9c66856ee3a742bf262123d101993aa74b6f42258723faedfbda1d20da3c86902072121c044de200eb82ccd8f73fd30fe519a0c145f48209f3bdc4e0eb57b28fa4b39d3ec4885966d2ff94b6d9b7af94b016b69a5f09d457778f81e0b83097c93a3f9d86f3c73371191b25c6d254b5d829ee1f8990bee21b6fcaf650c23df26bea4484e3aaa42e2e87aeb393d5f5ecdec120c00ddd1cf7d9d25dc5304d2589d09638c247870cf53973c87816e8514df413b13c356777edc4400c6e609b4d29df7bdf4d0fb345630591cc30b4b19319f499a75f2b6f2956bb14632db0048f44bc8b789a309cd58d7b1537ad4fc6bcc1a7360a48e67b1a6422f6bb1e602a9c0667c5f6abfcbcc25029c3b25c985d42f20e4048a18d430295122c2dbae05f44fc7e75b495c77793ef39ed733e9f8cc171daa4bdc6dcd927b1b48d80a3f0ad2e204ad77bbf382d2c6cbd45b9c7460dcc80e9d2c43c16407e857eee12af7023010488e635f8cb9804f63ddccaafbc07e4e2f11ebeef7a932c892192a06c10b77fe1623fb31465d549c94261a59571306a14b8b1b7d1197a46813aa2bfc04019c2d6e70d1199a078f74bf8eaa5904ec38c105ebec20eb051cc7d32868ad8909545aaed34ca5d196fad073273d8eb1d944cd3e9ea8b529ec2f11c0edf7719900e5aa7b598d526b4d42b906b007b3f710a7c0e527f67b7d70201fb99aeb4ec60bc47ad25aa080edd7daa0f3e4eee9a5049f1a6206a2e9a3601778548cbbbc4a0d40c32f013e3c8a28fec9fdfb2c1b8b2bcb517ed9cba5ee298c33082feceefe022fcc32ca64d44f8405e3a6f5d732505f9e0c76dc2e136514baa86bb94cc6ce01025b02b2dc917074865b38dc42f5bfc22435d3d6d8f8289d4f69cc2f8085f804bb488851153fc763742eab805f20d0aa15460ebdf9ce8b6314137deec4dc1c0bd64d30b33165e3f4bd3ce793d466cc0f67c600e947d3c191cdad8e3d76514e099c7171cb5efb56ae0724b609153621f64a3e10bfbd7d857209261fa42940730c33f4688e5febf9a84f47b330760f53d68db36e75206fb7fe683b1fb5b128960e35e31fbe697023ea0551984451eedc05c91ea23c5c877548a526861df822060b329f9c83b2ffdfa1703c485ae46d48c8b58eaba244579ee6984a0c3f037e7503dde37cff27e37acae966236d4712db9f7ac1d711a7aa328464ffeaae76a6950008fc6eb24ea6a66faca26a31a9215333ce7038e2ef11ecfb6e366d033c99b701d2d93a50473095ead10f87fc85f9667f6303e90cef28a08b939142ccdebb43083ee913290d9451f2db9f6ac8c9018ff192c2f3d3ba7ab35d927b1f8fa72d7e0398467d9e063d9c8888b5bd152b58dad4ede105ae76ed9237717c39102e4cfe08f9a7413a6964e43fda1f05145065edcdf55ff2f35e0d145998720abeabce4400653ea7e7d9518bd7e182ed56b6900b12b51723b91a5746a8352ff3b663146703c9b9fe934aead6807df21709c37012a37057592c28511b5715a02cd4f317a60a8e0afe6a7b46bf224374edf93948e279233a959847127b9be8d70e07f1cd860adcd971fdf748d1923d6f4e9150676919bdc5ba724b67757227961d61eb77000d74f05c8c2de7d5744b3702e04365a777172f9b3bf619bf6ff9893e1f21c1f50e74d19c06a88dc28e9cb0d5d7802cdeceb299241bc6a9ca11f7bc00637f4b5600d5599426d14b9eb76d0ca548ca6c80b3b785cafcb43729404c4d7cad877a46049d56811fac0915a63626d2c6be8ab10911ea694749b6ceef0e4a9cbd1b80b2007edde6bf2dda7d304d377ffbaf3e04a385f54d8f085f5e57666a218b6591020cb4de4d1b14d7291f4f4b338e1c16cb0423194096cf89d3771aa448cffb27d0028117d37cfd7022831822c3ebf86330975201ef326cee668dfe5ae87c3d78260e2d32a1655433146c890f2861d3a8b0cfe0f0efec76e8105414d08113afc45d0f3fa24c91560077e794adc5e9fcc895a60b5200cf969c64f2a01cd67388c2b105bf75ae21a08434a8850cb0534fcaef586c5361d255bc436da8db9e1324a08e0e08a5e22bb11f13dbc014983226da31abe5fb2fb13302f0432ae6de6a546e9f0b7bdde2f75818c175f9650526e8c846dd1b22aa5fc931472e7e4a02ebd7c3ba0b675647a3fba9f79429c6d4094d052e2dc337414bb9b24f95b790b243eb3f3b019fb57955d1d5e06c0e045e682df7e53fc2feb5f0b9aa44908b247ab01dd0d90e6e8c401b56549360bebe8951cbf26dc657a078506685e69e715f84dcf5c62c0a7b115df420b6baf1191315670ba6cf553a8b3fd370a1a5d0f8bb7f32fe5e1a0e6e657ef05b39e233d5565464f1f250865b0a92cb44b61c92275f8d4e2d8fe406ba4aae4aa2619bced8e3592dac46c1d917b562a9b12c7a34491d42903c913302c7fb0024295471d27b8eee6ab5fc696fa387a6381f104367b3c6be265df0140d4bc675f1b5b42764a1386ec3abee616be690ca1a30253c02d5baa38bc3ca4d02befa07c90e97f8e9fc5ac85f93e67ee342d611bb5a04f9d7f3321f1aed33c909dc28f151c68872846a7fd4f1b90b1072166868fb68752a3c2f0917cbef33ba04942407e40c23e68af26da699eccd7955282037c9cbd4f2e6f90f6622b7cf090835564455e3fa07573c52c64a38b76b7792df13be08def7495328d7d5be40990dac92ff6533a55ef002b0d01a058a0374780a6b335144fcb0b1a25669b332210f224757140bdd0ea68a168cf45fe6f520dde6d4fd9de7d2c96c939af7d186a409ed6f9976b3d91edcde5d14fa787f03a658c39d948aa47d1c29127a641f8cc10daf91b52a7808b001705af234caafe60e051f90a0ac4201fa82d96532036cd3012e3b6e7b8eceec23a28cfe20ff751f0c78076e184e0f03aea1b4f7cacd05f801495d42f5d1ad530d2b5a3e2c92e93f65bfd82db8b91b0ba461152a1b9e20ac08b55129d40f2ad1ac18827caaa919e97400a5e48e21596d3b7ee3606dad06c202a0534674add6de9594f5a6dfd377d69fb0a092b81dcc6377787e29bba99e620ebeb10314152d1c2f23eb66a746789bd8eaebf41625d8842d7e7897db06714807d069fd9cd3a6ee18b1ae115b8f4917248f1783f361d0a7ef3a12accc7546dd04bde40d4dde1c252648c7ab666ab8f9f14e9f95dd6950ea03e48ed3871340ee0c10e3ff45dbef9da1256eb2f1e71865559a2daddd29c3766922e3fbbfb8ac03058b745003e5fefd5d3baec7d16b2a780372432204ca25d738439b90d07a3def08e268991b849ffd6ef5a662583a3dfd9029edb4ce485883e6365269947d04a4038d5de320a05b4d590ae676f8c16afc99ba90691598fd03632260f7443f874c022faaceb7d7ffb69ba0bbee9fb1518428df834c01ec1f8b2a66daad614ad0b206d145bbaf167bf24b2a2099ad115993ae30380fca5bcea3c3b8555980890b2c089182ef0a5332d120c619bf48543c1860bdce447d7d846f4af39827e31df9da0601ef2ffa58eb0f7e81e754255ecfa2def0629713e3f1815f301273b1d89eb10b53a24ec919ec2dc4a6c9ad90d18923eeef7abe456b9874a9b9005727c718710b39997bb6fd7428550522f75819c1b9e25602d7abb7eb6d30e8e30cb6797259021b72dc44b6eda0cb21c617ed7e02b5fd83e58d923ae6c5c1f9351469f6eae202e6152c7a9504c60dfa953132226bf6a03a8c367d1083a446790c328289f3840e493f4a6043489d96f01664de3567380eb5be91468f7f0f4a14f3781f2788d10cf67bd1f9fae357f6aabb740ac707004237e8eb238488906fb0f6d166286a97007c12e2ad588d8dbdc32b64450f52b77ebd6d80aea5d5648b80efcbbfc9c83c0ef28784060e36125907e19a174e83b5c223a671b422c2d0119c0bcf173d93ca0a6ffcdb82f48b2fca488ded09701b3fc2b7f361d87c346990d0e4c83a39d6be01a9a1a92d04fd9d495f3429633b9517488c301c53ffdcb6944f23cd9117297c04c30a72081173865ede28c7941745dbf265ca6da841775ff57312d4f72ea3730ce0973b28c49da55f54c483de21043d06a483757f79112c56b5bf7d4f9d3dfd06757e7a5226e93161d55ba3ef7e12986db0446815d62071a4053cfe16e221960e400213a10e4c011af0aed0a1934bd33ba54c2b3153eaf44b4dc9a51d0a08b80beff192a7d4f656734a2f050892fdcda7ff45f5b9b02251144525455991b3aa0e91e3411cefc33522c413f2129079d1fee27c94c1ada1d254608e57b64fd03b00de528bcc210d442f0e3291c3119146ec9348de9171b5a781ea8988165a7d650eb0fb2477ecb3d5c7bb254fc179b38439659312c9be20c944dce3e42399b51d00d42c778add6f4884fe886c52c68c264ee4682275ff4d14a95f69b3720091890e4b6426d0ac3a85ede067835170f492d0bb97da9f1961134e8cb21a85e6b6fd0e50f87f1b3da1d6419dd1d9d042a073c482d2f53bb66436faf002e418843554019b5fa586fd5a9719ac74852d90d0347f5c0498593c6a4f398f198d038559e20bc7914568979ed652b3f570417b772cdbb34ef302c9aa2eaa448daa102176f4077049f632c0b655bcac939dea1081a907b691b9666b39eae620f91d7b97c1a40b2a680827ecfa5830586916c43fc14cd15c2e4981e83733a4fc6d9213d3615b0851d0bbfd430efaf81be66ba28f0667858e3af7aaba78d787ce01dac14c94eb0d46f85f5cc8a870e8c9058f235dc2d379ec512a78c669ad05ddfd962db608dd0c5512efe2c275bf1dd93948a7af9ad859f6f5cc02b01710e3addabd7d7d9d370ac090bf60ea2662a7eb3e8ee1b4df2021f0e623fad530fd0e9f2ff2d9170f0c045c4f9188ad87786b0586bf7e27c079886b612944a1b059f2ce30647531e6880f6e9029fe2ce178276cf3227f5cf905e539a5938b9c5493d127310f87b2aad108ae7c134a81940b21c42474b153ad29c910e96e29eb075bd95d3eb710e876ca03ccac48a4fe31d6ab040eee0d6208c5b74eb8c89cc073762f32743e314de1eb0b148ab614f369931624af2f3e9328a59f4793b21798f78b60cb62ccc44b88fe0f6188d383aec89e56d9cb59bcd60ed318f0632d06fa88520e93638d4a2585bd09a4bf593e761de575897d17325d53afbcd6cd914c4749a3ef8f7c4e0f561f360147ca3d22adf29c982908831f2d550d41b5789ff9859af6ac9f3a429b2aebfa071d54d4feeccff8e69d570bdf620ac114c75690cb3a4987f0c2836c6dd3e0460fcb345206df65b7a8898ed375f10e119bafec0338f5c1d9b3ea98ffa65a9abc00e390970afbc52804420b62d49ed9bd2e85f5122d6aeb44c12925f17a14af3f06feec843fa8804079cb7e17c47c4c4357d026ca1af129bf508ff19ff0844f51035ad6cdea4f82a9567d97acced2d44d1930b29a1084b63a4674d226c830e2f50084f1d5b9768067e123fd0913e4cc2d8692bfa0d30d8b47fbb40789a01d27060189607e5f19ddfa7477168e5559fd1a0c143ebce9e944ca5ddffdf86692e66400a83a7faebdc53909c63953377139a02171d6fe99f2a1c9c8b34a2cbc504c0d07416f35ac7f9fdb89d7d508e56eb1270f1cecd0e40b2620625e47a9310bd9b2023ee56570c03be9f58f8a46431534ec993e373e86790df09aaeacebf109d38606edad06fd4285731f3350fc431432835405d73e3848e7a7fdab926486e02667073d4b4c4dddaf94009b69cffc9bf1441856fe016bdb0bc8b502df807329310b094888cceaea0d40c2e6ffca0185dff97bd29b6ac85cfbb899e352b17534c7a10f3fced9839d23e246fdb09da799b5ec545cec859daba5dbd598e41ddd7cb5380dffb5cac487f8eba8f5466c716c28a97c388188f1d61628b912bed1e6dfb0dc01e7e56e376cd1ad680d6a262a36b315c69fc76dd1e857005904c9dee0fb5d7509aa80305c6ac95a06e3e1cba0c61eaf72e933fea48617fc5564f6921f9bbab708132ebb7d4998a56802b12992539e250be130bfd5512bc6b019bab3a5e4ef2c0013529e9cc5d936d87223aa617fca2f2c49ed9a0b4989322d5567ef16d8f45b049d34ef8eecffd06c92a17a7d8b559208dbe0fa57a4bb135b870742973cf948002b789e94b6c82f0faa8a6f25398f7e84b07f2b14ca0d6b921f5ef76754d18907a4a6bb2b5bdf64f0e1a101c5e04264521c0f8545dabaeda073f3c510b0a3f805a223205bd569c13ec447f0efd1f4dac8addb539c44001a670e1518a2a28dcc016b3309239cabf605070b5f2f7096743a612b1ec5e57506d3d36988214473d0006dd4be2872357ba90560efbd10f6a578f76c9e5cbcc8edf5a33d5e5bae7b4f035c89d96ce07c7fea2e58d207fb93282e90a90eeb910bb9c1ee9236f540226d09d69ec1c7e89713806fdc45c24757bcadf295902d9705734b4a6c17718c7a4b0efc02e8d81808a9f9a396c845dcb2d246f1cf864d8d8fd5e3c5838956ea74c703e54ee9ac8b1e8d5b662a7b08f30edc9471e53547d243957033ed1aa7097780035913b4899defd6fe0d25349c2a7ba1752677e4010f0c6e6126a6ac0eb42ea406c94020dd8361b3ff526150fb05a4a356b349a4a134a5e020e53c78bed132120f0ed79d847053f98ff9e14bff5e83cb1cfe757e5b576c1d2d806c2bca08ce910413638d78fddde1d41b234fee932647893297ebf51e6a5dfdeaca7b695f9be4041ce52896a762f97d56300f01fa385f6311ace768e567d37eae7f8ad7bb3ffa0cf62edf01dcc08b5092bdaa5b584f8f844aa61d2bae4d4b187f448b5848bb0d0007062fe8f351fd083c8bee3cdc1ea97d47a14db28724b119ab1ba69753d71b00b166e4f3a2f7e962255c187338ea056a7cd6ca10fd36cb953bcd06d145144f021baf33a5a7bed7cfda9f38f09a896b036c610aff1151b9d551a3f1bb04968c044ce155974c0d7c8c11b636e78b69a9b9e9be96b189309f13f2aaecc6ba316c0d3648f7cda87ce8b046ade74fcc92dab0412ebb304fd3376315f27a8d7545c208fdb6eb356cddffaed426b2cfb6b50b9e4e875065f58c50fb4e4006fd86e66a082310a8561c1e66429460d15f83d8428630bc556ad8245e65aa5e9b2167c53b099ea570da1b84fccd5705534e803d5cc8336760fbb28904675f5f7111fc79ce0647d4bcb365a8b1218f2385311f1a107087bda53cbdff28ff5df5ccf68be9e00f1378ba234ad9c01541806349e14f445b5f0f9a7fdc1c9f60e279cfd4ed70fa0d8c179adf1a64830ba5361c1acd79f73a5bfc8b6328d2134b045071d8f882de01a59f7c2344ed87887f2c926b69dbad07ba5715680ac4e1c76f03b96b612a6c00ced9c4ed041fcd5ab1d698941cd24c2782397037661c4a8e1c6ed31a32bcec0061d96b45ddd07d1f59a73d0b46b780ace0a6e4dad364aba350bf591542d861065f5d093585b3999046b53a3c91c97b8630e918e399d17807091b14230fdec00297cb2831ff53a7e903eb574002087b37aadfa55bd1e7819cc8dfc4e0eb90290fb28dd4adcf0a2520ae3c0c311c044a968a52dff484592dc2bd2dd9bd71f93200c0d444f6e6d400409f28121500dc4c7ae7a4a5abb11e6e3e5701bd0e205f8704d8d41cb17c21a42578d95b0bfa32b1e1bb44f2d559391c44dabadc1f91119d04dca1e7ceda670efc53b8ab1907c65782d5d40eb854f7c0a5a69d60fb846a5b030416b7c7ccbb77f60cab5fce902ccae9e57b1c11200a3f8dc284b7895820600ffa7a89dc69402929f035150371a072aab331c5330f3413a33d2a846a5157c1056edb7354426675aae4e0e12347315d3ba57c6bc168f46687fc7373f10a61c70f2a64c6790ed2779139bb883be2c4f8f2c46c7ac22d347eb18b142ab6f7d7c80e79e9f67eeb389b6be7ceb50798a4626310170605626c92109b3206a0da0a060b5af25fed51c89fcb4e07b9473e0e225e3eaa1b33725bd42d2a4e3b5fe6cad00f260e91d6aec68bc3723b7c2c5807b091a282fccb4415338844ab3197f8d9590e43bbf76488c0e6a5e6a11c55b1268e6c27c37e2c18a8eee4ff217381fca4df0257e894d94c1189f5ec7563c0028bda1370b37224dbd6611a536f099c9302f502e144fc3035034f6113418b03094e64fbfc9bd6646ed961e4d57327aaf38c9a0c68d4b3c0613b9ca8513bb7a5f25973bc30c9a62daa918c38be2bc74c852f240ef02b4b2e22760f047ecdc40de2ca4d08fec5aa34adc787a284e43e9085cc6307cb9ab0746ace0ee95a39ec859fc6dc75e661a70a1ea28bac021bdb330badb50d3f1b32047307d4e70f6224733d05677666452e05185976ab18d5225e0cfa04010ae662de67498e219ed816d42ea496d2f367359d97178d6e835f510563a2ed039ad50bf80d528d9ff216e18f694a8a1ada84a375a0735930e09212f11f038a02816657dc47aefb28ac7ea5e18347926e872ae48a09cacba4887f7c8f58aa9a0f44cfe982e6f553fa8562a1639d2d0d8980e9011987a0b0a806e12f69c1244604598f8f358df1a85d035735156226e5f91a08d6e80681bb31212f0352ada1b8053548aace0f6194f005d0994756d9aa0ef4a9536ad5cab8aa892531ee71dadd0e13456547d582a473efa2a14eab0bb855d534935edf9039ac08baaabcb985a4033c73505fdd05497553c1508f98bcb4e4fc02fc5d6f317396fa5b28ea0cf24408b2f225b6fc0f197544e42b295ae1bd8fb38d2fb1ecebf707e803ed487aedd80ffab9586f7276d9a73ae376c19b4310a8b2073b490788c2d00c6edda4b3664d01314d3b9ad4d9592015b08095bf0fa34c777c30dd4f21b1ceacbcfa49c94110060d98d59e04da232ce0652cb2201145fee52406cf4ed5d41d1da9f4ad5f63aa03268c25561784e3eb2a39458a44f21d4b8090aa9f25d9cb1d9472952be303d00099b8f14aaf6ace6d80721b7fcfd9c63d1fac06ce8f8345994dbb275824b7fc04130adf34a1f34c770088a0c754149c9654dc1f169c27256f262a8aaf011b52000527bdb3f5c894ec56c2923e814739b537d8c0cc0d2c9525071bfc117c03cf04c7c8b32d3cf37b715169565f3001555a5d02c5bbf71df96933c25b4af3301c085eabf20d46ec8c0b7b79ec46ab71681a4ee13497c7b18114cff225d9efc26903e2b73c4700d44e625e61433baa650c4395e397d49396b234f4522bc7543e3302656fce22b0d6121f86f2a94292022c9df69078bd9fa6144b7eb6c660de875b094cff6d61ee4bdf97260ddf1fc02f7e3214b3263647755beada517f0470f1ac0924fb7279c5a9d502ba48b8a2a07f0a2a2f583a4f191e746091a206ed9dda9e089b5d7894dd9c396ec8ca540dee3c1ec192c8b67a3c73fe5e4f49753f17db690b6d6ca71107cfa709acea6c6cf92a81a86b2da8a15912ab512bdf53943eebdb08208d1959a62cfabe81e52fd754230d9bff1db888933f044329faaeb989bb30041963757272656e745f626c6f636b636861696e5f68656967687406bc952000'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2005: RESERVED_FOR_FUTURE_USE', () => {
    it('Request', () => {

    })
  })

  describe('2006: NOTIFY_REQUEST_CHAIN', () => {
    it('Request', () => {
      const raw = '0121010101010101170300000000000000d60700000000000001000000010000000111010101010201010409626c6f636b5f6964730a010ca99b48a8b930ddf50ea24da31e54a475b9a44d67845eb574fe1c80e9974067c6ac614bff1a8476b11c39eefe878ef7bc74433e88fb9038daab37f44af1a1cc68e6a49591b762f0cdbbfb215c7b439bb50b5390d7110ce0438adc4b38ee776da64cc8988b671003ffb3a5e03b3cba8ef3b5fc20af3d9c5fa5353c5882e07fcbc385e16c9ad0faf5f14b8de1b5ec768a21c7e842358a7b613e627d0326e4355f3fd451a5ddd8963c47e199e8dbfadd2fa6293e71882b2f1bd8b87563e00b5ce6af1f745a9dbed2661f496f015b880b20347e20e181f54f2fc4361f455ef86788f398c90577aa112d8d5fe2ba9cdff63048ecfb094666c29a9f7554901b959b9344266d99812cb05de445c911bf984991599b2390ae60733189fbf8da29d1e498a1be6b3b694c018e37c653b3dcd7e42ddf377a1bec133158f193b3c4f0da940eecdecae23582bc6feb2a2f07b4ad1b1d2767d7f06c84ea0d4af491ecf40a851a5ef5b41ec3a4bbd2790da7cb5a20e2238ca5e74f5bd98947a2db0f5b15b1d80a6075b0c7196a3b7c0225998edf0a4a1be751cbebf3eb1aa9aede7739e1551b63427a8f0d2af80783f21695ecb63e8924c79a3761f3e7661d109d80dec18cd7eaf71136949a6bd1e2f3db1236fd9047758ac7934b64a69caa277ae07b76bfdbd82066db6fcef50b9aa573743631da1cac694abc2a1d61aaf799854a1d60a181e1eec043d86a2855875dd821e84903b43bb5240b8723e167aa58d66c34acbe6fe5318eb5fc50dd673051c07362da6777ceb241de7fd0c3071b2612a6a754c0410307d08d2e7ecd9e2bcbd93b32c2f33a70bb2ce53d2bae8cfd0010fb9d8243f23fdb0ee69c4b0aa903d1be55bf940dd81801b2958586c53290848a0ad127b5fd205db94d74ad6f1dee04f17fd31e6216ca95691d907ee6fbb4f0548f9ccc49274efee321354b58c0f701cfbb8517074792be30fb33290ff71b577ffefdc63f0a028f3ff763d58d1da88a2713068ee74e403c2dbff1d85a458929ebe28f918c0c66157fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2007: NOTIFY_RESPONSE_CHAIN_ENTRY', () => {
    it('Request', () => {
      const raw = '01210101010101017d0000000000000000d70700000000000001000000010000000111010101010201010c0c73746172745f68656967687406488420000c746f74616c5f686569676874064a8420000b6d5f626c6f636b5f6964730a0101d2cac0f27ffd678d25936b93dcbcc2ede33872e92ccffd09b3d7612f62601a61a3c6adec91fecba5b97fc781bbc1bcea4ff444317c84cecbc37e562975a56542'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2008: NOTIFY_REQUEST_TX_POOL', () => {
    it('Request', () => {
      const raw = '0121010101010101910100000000000000d807000000000000010000000100000001110101010102010104037478730a0106115b4480794786a79b503df25478cfdd3065149c875543928c7e51662df63e6faee3aea297e54466a93bbec480eb0c16b41fef87da2dfd519bcd77ec0ed13c50f0c019537f01023db731a60835a409d5b35ada483274a9c2835ce4ffd662a486ea02ade20b854bb835f85455ad01f182f6c6e6a2de1527364fb1efc1515afd606d31b6fba4abc33a465339ffc544c65626f972187d9845a5dea103bfab0abc071394057efd846a87eb7fc2b2043e55fe893320d4c83ecdc2d783b0b44f74f44916f63139d885e16a3fcfe0ae88b7e8e7b865cf03f9288aa11ab85d7396e23a3daec1364ff3390233953668e77f49f7fa97bac57ca96c7b90c288b21529f88ea4a26eee9d9e3b2274ba78554d21cc6229d2318d051af4e44251706ae928d37cd3d7a44360f01975c00a5228ee6e9d9f0c4d21e0a321a1564ec2f1305fa34d7c8c9973c715f4285b288fa1254e6636e57a95e95293572afc4f3f9034264845c15a09f705db23d64820a90fd995a2102d55a165627549e3b2eb5f6d5338be9248a5'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2009: NOTIFY_NEW_LITE_BLOCK', () => {
    it('Request', () => {
      const raw = '0121010101010101260300000000000000d90700000000000001000000010000000111010101010201010c1963757272656e745f626c6f636b636861696e5f68656967687406ec81200003686f7006020000000d626c6f636b54656d706c6174650a8d0b0600d3e5a469e876bb44e02a2b69f76b16502a4662932e5d7baabd957eb956b69ad40600b4a784f0054ff309de2279c8a16433bc9f841d0adafe53dd30197ccda6c5cebda5b0d5aeea0efb60000101d0c50401ff9ec5040801023d8abbe71d4bdd23de4101b355a0f274c7b313878224b7972fecdf6036da0a1850022f2002a770da40ffbc83a3a830639f85661a5de5db77e59384b2ea01f3229605a006020262653f32f1e159cb3c75e10091044b2dde5dcf35547a9718862f0965357982b817022937b05c325ddac1bbbc3e79f2b5a6a5ddba4ffe7e3e6bb05a4f2bcc2105c5d180b51802a2fe17c59b2593bad551914da8f8eed07ce45a9925e4009fe9b17341bd3d6016c08db70102c929b8fde8adef46d3c28411550bf209796ebe3fa548ec956c5868d5fd7b849c8095f52a02c5215606ecb587c54085f735e21b32330c19601e604d5afd8010d2500211a7c580cab5ee010233028ed36fa728a3670c5037d6a4b521bcc849271e89674ccd789b8bcb7d50195701824c2d3c69769d42e0476c73608ff701709d93b44b5827e7d87d088578d45670021100000020aeed3b6c0000000000000000000321009b785f189be8fcbf871bb4225997ed06a6ff99e00c819e9e3ccb66c1947bd779019384820101ffeb8382010603022d794b9c08c454d0ea3bf488a0938b38ec14c720a2d19eb8ad733df2b1503df91402d55391dbdd8593b41c6148668b5ce866d1231a3501b4475724d8add3b462848ed836020178462122a90726a7232d9563be6b25e5908089af1e74abc7dc3e0e240fe01090bf0502af639c269db8a5043eca3953e0eb8c67e04f0357b2de53a90c6042033d842cd1e0dc2a02049d823479caa37dcb85461367304e488f5eebcc0f32da16c0a8c7fe64a99fcc80897a026129f9c225aed2a5bb30bcf8183f8df607cee920ea8130e2fce2f3e3ac8f4aeb34014e7fa0d9d8eba3927c52c5c5f7275796b2e0ba7d974c82adcf8b59a5d16373eb021100000000aeed3b6c00000000000000000000'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })

  describe('2010: NOTIFY_MISSING_TXS', () => {
    it('Request', () => {
      const raw = '0121010101010101830000000000000000da0700000000000001000000010000000111010101010201010c1963757272656e745f626c6f636b636861696e5f686569676874064984200009626c6f636b486173680a80d2cac0f27ffd678d25936b93dcbcc2ede33872e92ccffd09b3d7612f62601a610b6d697373696e675f7478730a8061d1ee75f8cb596a253e40cf33fec2adefd7d24212b49b3982c7e6b6d8480dc6'

      const packet = LevinPacket.from(raw)

      assert(raw === packet.toString())
    })
  })
})

