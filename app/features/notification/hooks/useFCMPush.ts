import {fcmService} from '@app/features/notification/service/fcmService'
import {useEffect} from 'react'

export function useFCMPush() {
  useEffect(() => {
    // 리스너 등록 및 초기화
    // 서비스의 handleMessageNavigation으 외부에서 재사용될 수 있으니, service로 이관
    const unsubscribe = fcmService.initNotificationListeners()

    // 언마운트 시 리스너 해제
    return unsubscribe
  }, [])
}
