'use strict'

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    filename: 'TurtleCoinUtils.js',
    library: 'TurtleCoinUtils',
    libraryTarget: 'umd'
  },
  node: {
    fs: 'empty'
  },
  target: 'web'
}
