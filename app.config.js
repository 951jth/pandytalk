const PRODUCTION_ANDROID_PACKAGE = 'com.cshchatapp'
const DEVELOPMENT_ANDROID_PACKAGE = 'com.cshchatapp.debug'
const ANDROID_RUNTIME_VERSION = '49'
const IOS_RUNTIME_VERSION = '47'

// 이 프로젝트는 React Native CLI로 시작해 Expo Modules를 연결한 Bare 프로젝트다.
// android/와 ios/가 Native 설정의 원본이며, expo prebuild로 재생성하지 않는다.
module.exports = {
  // 1. 앱 기본 정보
  name: '팬디톡', // 앱의 표시 이름 (홈 화면)
  slug: 'cshchatapp', // Expo 프로젝트의 고유 식별자 (URL 등에 사용)
  version: '1.4.6', // 앱의 외부 버전 (Store 표시용)
  // 2. 자산(Assets) 설정
  icon: './app/shared/assets/images/pandy_icon_padding.png',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],

  // 3. 배포 및 업데이트 주소
  updates: {
    url: 'https://u.expo.dev/713adbab-1d3b-4992-9aab-396e9557bd0f',
    enabled: true,
    checkOnLaunch: 'ALWAYS',
    requestHeaders: {
      'expo-channel-name': 'main',
    },
  },

  // 4. iOS 섹션
  ios: {
    // Android 빌드 번호 증가가 iOS OTA 호환성에 영향을 주지 않도록 플랫폼별로 관리한다.
    runtimeVersion: IOS_RUNTIME_VERSION,
    supportsTablet: true,
    bundleIdentifier: 'com.cshchatapp', // iOS 앱 고유 ID
    buildNumber: '24', // 빌드 회차 (업로드 시마다 올려야 함)
    infoPlist: {
      LSApplicationQueriesSchemes: ['mailto'],
    },
    entitlements: {
      'keychain-access-groups': ['$(AppIdentifierPrefix)com.cshchatapp'],
    },
  },

  // 5. 안드로이드 메타데이터
  // 실제 package, versionCode, SDK, 권한, flavor는 android/에서 관리한다.
  android: {
    // scripts/bumpAndroidBuildVersion.js가 versionCode와 함께 증가시킨다.
    runtimeVersion: ANDROID_RUNTIME_VERSION,
    package: PRODUCTION_ANDROID_PACKAGE, // 안드로이드 운영 앱 고유 ID (패키지명)
    versionCode: 49, // 빌드 회차 (정수값, 업데이트 시 올려야 함)

    // 적응형 아이콘: 안드로이드 8.0 이상에서 필수
    adaptiveIcon: {
      foregroundImage: './app/shared/assets/images/pandy_icon_small.png',
      backgroundColor: '#FDFCF0', // 상수의 COLORS.background 값과 일치시킴
    },
  },

  // 6. 프로젝트 고유 ID (EAS 서버 연결용)
  extra: {
    eas: {
      projectId: '713adbab-1d3b-4992-9aab-396e9557bd0f',
    },
    // EAS profile 및 앱 코드에서 환경별 패키지를 참조할 때 사용하는 메타데이터
    androidApplicationIds: {
      production: PRODUCTION_ANDROID_PACKAGE,
      development: DEVELOPMENT_ANDROID_PACKAGE,
    },
  },

  // 7. 기타 설정
  owner: 'sehooncho',
  // expo-font는 Expo Modules 설정으로 유지한다. Native 폰트 파일은 각 플랫폼에서 관리한다.
  plugins: ['expo-font'],
}
