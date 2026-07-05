// 푸시 종류 추가 시: handleMessageNavigation (네비 분기)
import {fcmRemote} from '@app/features/notification/data/fcmRemote.firebase'
import {notificationRemote} from '@app/features/notification/data/notificationRemote.firebase'
import {
  parsePushPayload,
  toFcmDataPayload,
  toInitialChatInfo,
} from '@app/features/notification/types/push'
import {userService} from '@app/features/user/service/userService'
import {
  navigateToAdminInquiry,
  navigateToChat,
  navigateToMainTab,
} from '@app/navigation/navigationRef'
import {auth} from '@app/shared/firebase/firestore'
import {logger} from '@app/shared/services/logger'
import type {User} from '@app/shared/types/auth'
import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging'

export const fcmService = {
  handleMessageNavigation(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage | null,
  ) {
    if (!remoteMessage) return
    //data.pushType에 맞춰서 data payload를 파싱
    const payload = parsePushPayload(toFcmDataPayload(remoteMessage.data))
    if (!payload) {
      navigateToMainTab('users')
      return
    }

    switch (payload.pushType) {
      case 'chat':
        console.log('🚀 [FCM] 채팅 화면으로 이동:', payload)
        navigateToChat(toInitialChatInfo(payload))
        break
      case 'join_approve':
        console.log('🚀 [FCM] 가입 승인 알림 수신:', payload)
        navigateToMainTab('users')
        break
      case 'admin_inquiry':
        console.log('🚀 [FCM] 문의 알림 수신:', payload)
        navigateToAdminInquiry(
          payload.inquiryId ? payload.inquiryId : undefined,
        )
        break
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
        logger.warn('📌 [FCM] 로그아웃 시도 중: 사용자 정보(auth.currentUser) 없음')
        return
      }
      const uid = currentUser.uid

      // 디버깅을 위해 현재 DB의 토큰 상태 조회 (읽기 비용 1회 발생)
      const profile = await userService.getProfile(uid) as
        | (User & {fcmTokens?: string[]})
        | null
      const existingTokens = profile?.fcmTokens || []
      const token = await fcmRemote.getFcmToken()

      // Crashlytics 로깅
      logger.info(`📌 [FCM] 토큰 삭제 시도 - UID: ${uid}`, {
        existingTokensCount: existingTokens.length,
        tokenToRemove: token || 'null',
        allTokensAtMoment: existingTokens,
      })

      if (!token) {
        logger.warn('📌 [FCM] 삭제할 현재 기기 토큰을 가져오지 못함')
        return
      }

      await fcmRemote.removeTokenToUser(uid, token)
      logger.info(`📌 [FCM] 유저(${uid})의 토큰 제거 성공`)
    } catch (error) {
      logger.error('🚨 [FCM] 토큰 제거 중 오류 발생:', error)
    }
  },
}
