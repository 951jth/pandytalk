module.exports = {
  // 1. 앱 기본 정보
  name: '팬디톡', // 앱의 표시 이름 (홈 화면)
  slug: 'cshchatapp', // Expo 프로젝트의 고유 식별자 (URL 등에 사용)
  version: '1.3.8', // 앱의 외부 버전 (Store 표시용)

  // 2. 중요: 코드푸시(EAS Update) 설정
  runtimeVersion: '39',

  // 3. 자산(Assets) 설정
  icon: './app/shared/assets/images/pandy_icon_padding.png',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],

  // 4. 배포 및 업데이트 주소
  updates: {
    url: 'https://u.expo.dev/713adbab-1d3b-4992-9aab-396e9557bd0f',
  },

  // 5. iOS 섹션
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.cshchatapp', // iOS 앱 고유 ID
    buildNumber: '14', // 빌드 회차 (업로드 시마다 올려야 함)
  },

  // 6. 안드로이드 섹션 (프리빌드 시 매우 중요)
  android: {
    package: 'com.cshchatapp', // 안드로이드 앱 고유 ID (패키지명)
    versionCode: 39, // 빌드 회차 (정수값, 업데이트 시 올려야 함)

    // 적응형 아이콘: 안드로이드 8.0 이상에서 필수
    adaptiveIcon: {
      foregroundImage: './app/shared/assets/images/pandy_icon_padding.png',
      backgroundColor: '#FDFCF0', // 상수의 COLORS.background 값과 일치시킴
    },
  },

  // 7. 프로젝트 고유 ID (EAS 서버 연결용)
  extra: {
    eas: {
      projectId: '713adbab-1d3b-4992-9aab-396e9557bd0f',
    },
  },

  // 8. 기타 설정
  owner: 'sehooncho',
  plugins: ['expo-font'], 
};

