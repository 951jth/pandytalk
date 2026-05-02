const {withAppBuildGradle} = require('expo/config-plugins')

const PRODUCTION_ANDROID_PACKAGE = 'com.cshchatapp'
const DEVELOPMENT_ANDROID_PACKAGE = 'com.cshchatapp.debug'

const withDevelopmentAndroidPackage = config =>
  withAppBuildGradle(config, buildGradleConfig => {
    buildGradleConfig.modResults.contents =
      buildGradleConfig.modResults.contents.replace(
        /development\s*\{\s*dimension "default"\s*applicationId 'com\.cshchatapp'\s*\}/,
        `development {
            dimension "default"
            applicationId '${DEVELOPMENT_ANDROID_PACKAGE}'
        }`,
      )
    return buildGradleConfig
  })

module.exports = {
  // 1. 앱 기본 정보
  name: '팬디톡', // 앱의 표시 이름 (홈 화면)
  slug: 'cshchatapp', // Expo 프로젝트의 고유 식별자 (URL 등에 사용)
  version: '1.4.2', // 앱의 외부 버전 (Store 표시용)

  // 2. 중요: 코드푸시(EAS Update) 설정
  runtimeVersion: '44',

  // 3. 자산(Assets) 설정
  icon: './app/shared/assets/images/pandy_icon_padding.png',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],

  // 4. 배포 및 업데이트 주소
  updates: {
    url: 'https://u.expo.dev/713adbab-1d3b-4992-9aab-396e9557bd0f',
    enabled: true,
    checkOnLaunch: 'ALWAYS',
    requestHeaders: {
      'expo-channel-name': 'main',
    },
  },

  // 5. iOS 섹션
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.cshchatapp', // iOS 앱 고유 ID
    buildNumber: '19', // 빌드 회차 (업로드 시마다 올려야 함)
  },

  // 6. 안드로이드 섹션 (프리빌드 시 매우 중요)
  android: {
    package: PRODUCTION_ANDROID_PACKAGE, // 안드로이드 운영 앱 고유 ID (패키지명)
    versionCode: 44, // 빌드 회차 (정수값, 업데이트 시 올려야 함)

    // 적응형 아이콘: 안드로이드 8.0 이상에서 필수
    adaptiveIcon: {
      foregroundImage: './app/shared/assets/images/pandy_icon_small.png',
      backgroundColor: '#FDFCF0', // 상수의 COLORS.background 값과 일치시킴
    },
  },

  // 7. 프로젝트 고유 ID (EAS 서버 연결용)
  extra: {
    eas: {
      projectId: '713adbab-1d3b-4992-9aab-396e9557bd0f',
    },
    androidApplicationIds: {
      production: PRODUCTION_ANDROID_PACKAGE,
      development: DEVELOPMENT_ANDROID_PACKAGE,
    },
  },

  // 8. 기타 설정
  owner: 'sehooncho',
  plugins: ['expo-font', withDevelopmentAndroidPackage],
}
