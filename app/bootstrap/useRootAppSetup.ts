import {useAuthGate} from '@app/bootstrap/useAuthGate'
import useEnsureChatMessagesSchema from '@app/bootstrap/useEnsureChatMessagesSchema'
import {useFCMPush} from '@app/features/notification/hooks/useFCMPush'
import {useFCMSetup} from '@app/features/notification/hooks/useFCMSetup'
import {useFonts} from 'expo-font'

export function useRootAppSetup() {
  const [fontsLoaded] = useFonts({
    BMDOHYEON: require('../shared/assets/fonts/BMDOHYEON.ttf'),
    'Pretendard-Regular': require('../shared/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../shared/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../shared/assets/fonts/Pretendard-SemiBold.otf'),
  })

  useFCMSetup() //푸시알림 권한을 설정하고, 푸시토큰을 데이터셋업
  useFCMPush() //푸시알림 네비게이트
  useEnsureChatMessagesSchema() //채팅 메세지 테이블 초기설정/마이그레이션
  const {shouldShowSplash: authLoading, canEnterApp} = useAuthGate() //유저정보 조회 후 권한확인

  //  초기/프로필 로딩 중 스플래시
  // 관리자 승인 완료 여부
  const shouldShowSplash = !fontsLoaded || authLoading
  return {shouldShowSplash, canEnterApp}
}
