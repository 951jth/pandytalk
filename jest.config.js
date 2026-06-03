// Jest가 프로젝트의 구조를 어떻게 이해할지 정의하는 곳
module.exports = {
  preset: 'react-native', //환경정의
  setupFilesAfterEnv: ['./jest.setup.js'], //테스트 시작전 실행할 파일
  moduleNameMapper: {
    // 폰트 및 자산 파일Mock 처리
    '^.+\\.(ttf|otf|png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    //경로 매핑
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@shared/(.*)$': '<rootDir>/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/app/features/$1',
  },
  transformIgnorePatterns: [
    //패키지 변환 무시 (ESM 모듈들을 변환 대상에 포함)
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-firebase|@shopify/flash-list|react-redux|react-native-blob-util|react-native-fs|react-native-permissions|react-native-image-picker|react-native-image-viewing|react-native-fast-image|react-native-vector-icons|react-native-modal|expo|expo-updates|expo-constants|react-native-reanimated|react-native-bootsplash|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-linear-gradient|react-native-sse)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/functions/',
  ],
}
