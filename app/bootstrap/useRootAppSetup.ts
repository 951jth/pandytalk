import {useAuthGate} from '@app/bootstrap/useAuthGate'
import {useCheckForceUpdate} from '@app/bootstrap/useCheckForceUpdate'
import useEnsureChatMessagesSchema from '@app/bootstrap/useEnsureChatMessagesSchema'
import {useFontFaceSetup} from '@app/bootstrap/useFontFaceSetup'
import {useFCMPush} from '@app/features/notification/hooks/useFCMPush'
import {useFCMSetup} from '@app/features/notification/hooks/useFCMSetup'

/**
 * 앱 전역 설정을 총괄하는 최상위 부트스트랩 훅
 */
export function useRootAppSetup() {
  const fontsLoaded = useFontFaceSetup() // 1. 폰트 로드
  useCheckForceUpdate() // 2. 업데이트 체크
  useFCMSetup() // 3. 푸시 권한 및 토큰
  useFCMPush() // 4. 푸시 클릭 네비게이션
  useEnsureChatMessagesSchema() // 5. 로컬 DB 스키마 체크

  const {shouldShowSplash: authLoading, canEnterApp} = useAuthGate() // 6. 유저 권한 체크

  // 전체 로딩 상태 및 권한 여부 반환
  const shouldShowSplash = !fontsLoaded || authLoading
  return {shouldShowSplash, canEnterApp}
}
