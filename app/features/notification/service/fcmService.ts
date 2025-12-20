// features/notification/service/fcmService.ts
import {fcmRemote} from '@app/features/notification/data/fcmRemote.firebase'
import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {navigateToChat} from '../../../navigation/RootNavigation'

export const fcmService = {
  /**
   * [통합 로직] 메시지 데이터를 분석하여 적절한 화면으로 이동합니다.
   * 종료 상태든 백그라운드 상태든 메시지 구조는 같으므로 이 함수 하나로 처리합니다.
   */
  handleMessageNavigation(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage | null,
  ) {
    if (!remoteMessage) return

    const data = remoteMessage.data

    // 유효성 검사 (데이터가 있고, 채팅 타입인 경우)
    if (data?.pushType === 'chat' && data?.chatId) {
      console.log('🚀 [FCM] 채팅 화면으로 이동:', data)

      navigateToChat(
        data.chatId as string,
        data.senderName as string,
        (data.chatType as string) || 'dm',
      )
    } else {
      // 채팅 외에 다른 푸시 타입(예: 공지사항)이 있다면 여기서 분기 처리
      // console.log('🚀 [FCM] 기타 알림:', data);
    }
  },

  /**
   * 앱 실행 시 푸시 알림 리스너들을 초기화합니다.
   * @returns 정리(cleanup) 함수
   */
  initNotificationListeners(): () => void {
    // 1. 앱 종료 상태(Quit)에서 열렸을 때 처리
    fcmRemote.getInitialNotification().then(msg => {
      if (msg) {
        console.log('📌 [FCM] 앱 종료 상태에서 실행됨')
        this.handleMessageNavigation(msg)
      }
    })

    // 2. 백그라운드(Background) 상태에서 열렸을 때 처리
    const unsubscribe = fcmRemote.onNotificationOpenedApp(msg => {
      console.log('📌 [FCM] 백그라운드 상태에서 열림')
      this.handleMessageNavigation(msg)
    })

    return unsubscribe
  },
}
