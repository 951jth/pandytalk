import {checkForceUpdate} from '@app/shared/utils/update'
import {focusManager} from '@tanstack/react-query'
import {useEffect} from 'react'
import {AppState} from 'react-native'

/**
 * 앱 실행 시 및 백그라운드에서 포그라운드로 복귀 시 강제 업데이트 여부를 체크하는 전용 훅
 */
export function useCheckForceUpdate() {
  useEffect(() => {
    // 1. 앱 최초 진입 시 체크
    void checkForceUpdate()

    // 2. 앱 상태 변경 시 체크 (Background -> Foreground 전환 감지)
    const subscription = AppState.addEventListener('change', nextAppState => {
      const isFocused = nextAppState === 'active'
      if (isFocused) {
        void checkForceUpdate()
      }
      // 네이티브 전용이므로 Platform 체크 없이 바로 실행
      focusManager.setFocused(isFocused)
    })

    return () => {
      subscription.remove()
    }
  }, [])
}
