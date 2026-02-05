const {getDefaultConfig} = require('expo/metro-config')
const {mergeConfig} = require('@react-native/metro-config')
const path = require('path')

const projectRoot = __dirname
const config = getDefaultConfig(projectRoot)

const {
  resolver: {sourceExts, assetExts},
} = config

const appDir = path.resolve(projectRoot, 'app')

const customConfig = {
  resolver: {
    extraNodeModules: new Proxy(
      {},
      {
        get: (_, name) => {
          if (name.startsWith('@')) {
            return path.join(appDir, name.slice(1))
          }
          return path.join(projectRoot, 'node_modules', name)
        },
      },
    ),
  },
  watchFolders: [appDir],
}

module.exports = mergeConfig(config, customConfig)
