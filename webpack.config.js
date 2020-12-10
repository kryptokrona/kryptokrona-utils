'use strict';

module.exports = {
    mode: 'production',
    entry: './dist/index.js',
    output: {
        filename: 'KryptokronaUtils.js',
        library: 'KryptokronaUtils',
        libraryTarget: 'umd'
    },
    node: {
        fs: 'empty'
    },
    target: 'web'
};
