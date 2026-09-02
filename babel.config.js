module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./app'],
          alias: {
            '@app': './app',
            '@features': './app/features',
            '@shared': './app/shared',
            '@navigation': './app/navigation',
            '@constants': './app/shared/constants',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
