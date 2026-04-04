import {userService} from '@app/features/user/service/userService'
import {useAppSelector} from '@app/store/reduxHooks'
import {useEffect, useRef} from 'react'
import {AppState, AppStateStatus} from 'react-native'

/**
 * 유저의 온라인/오프라인 상태를 관리하는 훅
 */
export function useUserPresence() {
  const {data: userInfo} = useAppSelector(state => state.user)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const uid = userInfo?.uid
    const isConfirmed = userInfo?.accountStatus === 'confirm'

    if (!uid || !isConfirmed) return

    // 1. 초기 로드 시 온라인으로 표시
    userService.updateLastSeen(uid, 'online')

    // 2. 앱 상태 변경 감지 루틴
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 백그라운드 -> 포그라운드 (온라인)
        await userService.updateLastSeen(uid, 'online')
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // 포그라운드 -> 백그라운드 (오프라인)
        await userService.updateLastSeen(uid, 'offline')
      }
      appState.current = nextAppState
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
      // 언마운트(로그아웃 등) 시 명시적으로 오프라인 처리
      userService.updateLastSeen(uid, 'offline')
    }
  }, [userInfo?.uid, userInfo?.accountStatus])
}
