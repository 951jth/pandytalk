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
            '@services': './app/services',
            '@repositories': './app/repositories',
            '@navigation': './app/navigation',
            '@layout': './app/layout',
            '@providers': './app/providers',
            '@constants': './app/shared/constants',
            '@assets': './app/shared/assets',
            '@db': './app/db',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
