'use strict'

const CopyWebPackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    library: 'TurtleCoinUtils',
    libraryTarget: 'umd'
  },
  node: {
    fs: 'empty'
  },
  target: 'web',
  plugins: [
    new CopyWebPackPlugin([
      { from: 'lib/turtlecoin-crypto/turtlecoin-crypto.js.mem', to: 'turtlecoin-crypto.js.mem' },
      { from: 'lib/turtlecoin-crypto/turtlecoin-crypto-wasm.js', to: 'turtlecoin-crypto-wasm.js' },
      { from: 'lib/turtlecoin-crypto/turtlecoin-crypto-wasm.wasm', to: 'turtlecoin-crypto-wasm.wasm' }
    ])
  ]
}
