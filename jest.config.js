// Jest가 프로젝트의 구조를 어떻게 이해할지 정의하는 곳
module.exports = {
  preset: 'react-native', //환경정의
  setupFilesAfterEnv: ['./jest.setup.js'], //테스트 시작전 실행할 파일
  moduleNameMapper: {
    //경로 매핑
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@shared/(.*)$': '<rootDir>/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/app/features/$1',
  },
  transformIgnorePatterns: [
    //패키지 변환 무시
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-firebase|@shopify/flash-list|react-redux|react-native-blob-util|react-native-fs)/)',
  ],
}
