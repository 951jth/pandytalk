import {useFonts} from 'expo-font'

/**
 * 앱 전역에서 사용하는 폰트 설정을 초기화하는 훅
 * @returns 폰트 로드 완료 여부 (boolean)
 */
export function useFontFaceSetup() {
  const [fontsLoaded] = useFonts({
    BMDOHYEON: require('../shared/assets/fonts/BMDOHYEON.ttf'),
    'Pretendard-Regular': require('../shared/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../shared/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../shared/assets/fonts/Pretendard-SemiBold.otf'),
  })

  return fontsLoaded
}
