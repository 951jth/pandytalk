// features/notification/api/fcmRemote.ts
import {messaging} from '@app/shared/firebase/firestore'
import {firebaseCall} from '@app/shared/utils/logger' // 로거 사용 시
import {FirebaseMessagingTypes} from '@react-native-firebase/messaging'

export const fcmRemote = {
  /**
   * 앱이 종료(Quit) 상태일 때, 푸시 알림을 클릭하여 앱이 열렸는지 확인합니다.
   */
  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    // 앱 실행 시 딱 한 번만 호출되므로 로그/에러 트래킹에 유용합니다.
    return await firebaseCall('fcmRemote.getInitialNotification', () =>
      messaging.getInitialNotification(),
    )
  },

  /**
   * 앱이 백그라운드(Background) 상태일 때, 푸시 알림을 클릭한 이벤트를 구독합니다.
   * @param callback 메시지 수신 시 실행할 함수
   * @returns 이벤트 구독 해제 함수 (unsubscribe)
   */
  onNotificationOpenedApp(
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void,
  ): () => void {
    return messaging.onNotificationOpenedApp(callback)
  },
}
