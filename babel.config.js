module.exports = {
  presets: ['@react-native/babel-preset', '@babel/preset-typescript'],
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

    // ✅ 이건 항상 마지막에 단독으로 추가
    'react-native-reanimated/plugin',
  ],
}
