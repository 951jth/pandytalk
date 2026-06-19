import {useAuthGate} from '@app/bootstrap/useAuthGate'
import {useCheckForceUpdate} from '@app/bootstrap/useCheckForceUpdate'
import useEnsureChatMessagesSchema from '@app/bootstrap/useEnsureChatMessagesSchema'
import {useFontFaceSetup} from '@app/bootstrap/useFontFaceSetup'
import {useFCMPush} from '@app/features/notification/hooks/useFCMPush'
import {useFCMSetup} from '@app/features/notification/hooks/useFCMSetup'
import {useUserPresence} from '@app/features/user/hooks/useUserPresence'
import {useEASUpdateManager} from '@app/shared/hooks/useEASUpdateManager'

import {useEffect} from 'react'
import {
  setIsAppReady,
  setIsSplashFinished,
} from '@app/navigation/rootNavigationService'

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
  useUserPresence() // 7. 유저 온라인/오프라인 체크
  useEASUpdateManager() // 8. EAS Update 진단 및 자동 업데이트 관리
  // 전체 로딩 상태 및 권한 여부 반환
  const shouldShowSplash = !fontsLoaded || authLoading

  useEffect(() => {
    if (!shouldShowSplash) {
      setIsSplashFinished()
    }
  }, [shouldShowSplash])

  useEffect(() => {
    setIsAppReady(canEnterApp)
  }, [canEnterApp])

  return {shouldShowSplash, canEnterApp}
}
