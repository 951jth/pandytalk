// 푸시 종류 추가 시 보통 변경 없음 (fcmService.initNotificationListeners 호출만)
import {fcmService} from '@app/features/notification/service/fcmService'
import {useEffect} from 'react'

export function useFCMPush() {
  useEffect(() => {
    const unsubscribe = fcmService.initNotificationListeners()
    return unsubscribe
  }, [])
}
