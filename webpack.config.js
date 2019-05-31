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
  target: 'web'
}