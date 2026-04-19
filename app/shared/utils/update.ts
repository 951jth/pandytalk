import remoteConfig from '@react-native-firebase/remote-config'
import {Alert, Linking, Platform} from 'react-native'
import Constants from 'expo-constants'
import {logger} from '../services/logger'

/**
 * 스토어 주소 설정
 */
const STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/id...', // 실제 App Store ID로 변경 필요
  android: 'market://details?id=com.cshchatapp', // 실제 패키지 명 확인
})


/**
 * 앱의 버전을 비교하는 함수 (단순 문자열 비교)
 * @param current 현재 버전 (예: '1.2.6')
 * @param required 최소 요구 버전 (예: '1.2.7')
 * @returns 업데이트가 필요하면 true
 */
const isUpdateRequired = (current: string, required: string) => {
  const currentParts = current.split('.').map(Number)
  const requiredParts = required.split('.').map(Number)

  for (
    let i = 0;
    i < Math.max(currentParts.length, requiredParts.length);
    i++
  ) {
    const curr = currentParts[i] || 0
    const req = requiredParts[i] || 0
    if (curr < req) return true
    if (curr > req) return false
  }
  return false
}

/**
 * Firebase Remote Config를 사용하여 강제 업데이트 여부를 체크합니다.
 */
export const checkForceUpdate = async () => {
  // 🚀 개발 환경(__DEV__)이면 건너뜀
  if (__DEV__) {
    console.log('[UpdateCheck] Skipping update check in DEV mode')
    return false
  }

  try {
    // 1. 설정 초기화 및 데이터 가져오기 (0초 간격으로 즉시 갱신)
    await remoteConfig().setConfigSettings({minimumFetchIntervalMillis: 0})
    await remoteConfig().fetchAndActivate()

    // 2. 버전 결정 (Firebase 서버 버전)
    const minRequiredVersion =
      remoteConfig().getValue('min_required_version').asString() ||
      Constants.expoConfig?.version ||
      '1.0.0'
    const currentVersion = Constants.expoConfig?.version || '1.0.0'

    console.log(
      `[UpdateCheck] Current: ${currentVersion}, Required: ${minRequiredVersion}`,
    )

    // 3. 버전 비교 후 업데이트 유도
    if (isUpdateRequired(currentVersion, minRequiredVersion)) {
      Alert.alert(
        '필수 업데이트 알림',
        '현재 버전(v' +
          currentVersion +
          ')은 더 이상 지원되지 않습니다.\n안전한 서비스를 위해 최신 버전(v' +
          minRequiredVersion +
          ')으로 업데이트 해주세요.',
        [
          {
            text: '업데이트 하러 가기',
            onPress: () => {
              if (STORE_URL) {
                Linking.openURL(STORE_URL).catch(() => {
                  Alert.alert(
                    '안내',
                    '스토어를 열 수 없습니다. 직접 앱스토어에서 검색해 주세요.',
                  )
                })
              }
            },
          },
        ],
        {cancelable: false}, // 뒤로가기 방지 (강제성)
      )
      return true
    }
    return false
  } catch (error) {
    console.error('[UpdateCheck] Failed to fetch remote config:', error)
    logger.error('Failed to fetch remote config for force update check', error)
    return false
  }
}
