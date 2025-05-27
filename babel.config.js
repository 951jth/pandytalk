module.exports = {
  presets: ['@babel/preset-typescript', '@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./app'],
        alias: {
          '@assets': './app/assets',
          '@components': './app/components',
          '@constants': './app/constants',
          '@contexts': './app/contexts',
          '@hooks': './app/hooks',
          '@navigation': './app/navigation',
          '@screens': './app/screens',
          '@services': './app/services',
          '@store': './app/store',
          '@utils': './app/utils',
          '@types': './app/types',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],

    // ✅ 이건 항상 마지막에 단독으로 추가
    'react-native-reanimated/plugin',
  ],
}
