import {fcmService} from '@app/features/notification/service/fcmService'
import {useEffect} from 'react'

export function useFCMPush() {
  useEffect(() => {
    // 리스너 등록 및 초기화
    const unsubscribe = fcmService.initNotificationListeners()

    // 언마운트 시 리스너 해제
    return unsubscribe
  }, [])
}
