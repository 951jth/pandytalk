const path = require('path')
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config')

const projectRoot = __dirname
const appDir = path.resolve(projectRoot, 'app')

const config = {
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

module.exports = mergeConfig(getDefaultConfig(projectRoot), config)
