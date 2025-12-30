// features/notification/service/fcmService.ts
import {fcmRemote} from '@app/features/notification/data/fcmRemote.firebase'
import {notificationRemote} from '@app/features/notification/data/notificationRemote.firebase'
import {auth} from '@app/shared/firebase/firestore'
import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {navigateToChat} from '../../../navigation/RootNavigation'

export const fcmService = {
  /**
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
    }
  },

  // 앱 실행 시 푸시 알림 리스너들을 초기화
  initNotificationListeners(): () => void {
    // 1. 앱 종료 상태에서 열렸을 때 처리
    notificationRemote.getInitialNotification().then(msg => {
      if (msg) {
        console.log('📌 [FCM] 앱 종료 상태에서 실행됨')
        this.handleMessageNavigation(msg)
      }
    })

    // 2. 백그라운드 상태에서 열렸을 때 처리
    const unsubscribe = notificationRemote.onNotificationOpenedApp(msg => {
      console.log('📌 [FCM] 백그라운드 상태에서 열림')
      this.handleMessageNavigation(msg)
    })

    return unsubscribe
  },
  // 토큰 제거
  async removeFCMTokenOnLogout() {
    try {
      const currentUser = auth.currentUser
      if (!currentUser?.uid) {
        console.warn('로그아웃 시도 중: 사용자 정보 없음')
        return
      }
      const uid = currentUser.uid

      const token = await fcmRemote.getFcmToken()

      if (!token) return
      await fcmRemote.reomveTokenToUser(uid, token)

      console.log('로그아웃 시 FCM 토큰 제거 완료:', token)
    } catch (error) {
      console.error('FCM 토큰 제거 중 오류 발생:', error)
    }
  },
}
