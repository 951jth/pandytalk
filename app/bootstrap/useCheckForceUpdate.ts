import {checkForceUpdate} from '@app/shared/utils/update'
import {focusManager} from '@tanstack/react-query'
import {addUpdatesStateChangeListener} from 'expo-updates'
import {useEffect} from 'react'
import {AppState} from 'react-native'
import {logger} from '../shared/services/logger'

/**
 * 앱 실행 시 및 백그라운드에서 포그라운드로 복귀 시 강제 업데이트 여부를 체크하는 전용 훅
 */
export function useCheckForceUpdate() {
  useEffect(() => {
    // 1. EAS Update 이벤트 리스너 등록
    const updateSubscription = addUpdatesStateChangeListener(event => {
      const {context} = event
      logger.logUpdateCheck({
        type: context.isChecking
          ? 'checking'
          : context.isDownloading
            ? 'downloading'
            : context.isRestarting
              ? 'restarting'
              : context.downloadError
                ? 'error'
                : context.checkError
                  ? 'error_check'
                  : context.downloadedManifest
                    ? 'downloaded'
                    : context.latestManifest
                      ? 'updateAvailable'
                      : 'idle',
        message:
          context.downloadError?.message ?? context.checkError?.message,
      })
    })

    // 2. 앱 최초 진입 시 체크
    checkForceUpdate()

    // 3. 앱 상태 변경 시 체크 (Background -> Foreground 전환 감지)
    const subscription = AppState.addEventListener('change', nextAppState => {
      const isFocused = nextAppState === 'active'
      if (isFocused) {
        checkForceUpdate()
      }
      // 네이티브 전용이므로 Platform 체크 없이 바로 실행
      focusManager.setFocused(isFocused)
    })

    return () => {
      updateSubscription.remove()
      subscription.remove()
    }
  }, [])
}
