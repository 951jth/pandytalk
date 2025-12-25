import {firebaseCall} from '@app/shared/firebase/firebaseCall'
import {messaging} from '@app/shared/firebase/firestore'
import {
  AuthorizationStatus,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {PermissionsAndroid, Platform} from 'react-native'

export const notificationRemote = {
  // 1. 권한 요청
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )
        return granted === PermissionsAndroid.RESULTS.GRANTED
      }
      return true
    }
    // iOS 권한 요청
    const authStatus = await messaging.requestPermission()
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    )
  },

  // 2. APNs 등록 (iOS 전용)
  async registerAPNs(): Promise<void> {
    if (Platform.OS === 'ios') {
      await firebaseCall(
        'notificationRemote.registerAPNs', // 로거에 찍힐 액션 이름
        () => messaging.registerDeviceForRemoteMessages(),
      )
    }
  },

  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    // 앱 실행 시 딱 한 번만 호출되므로 로그/에러 트래킹에 유용합니다.
    return await firebaseCall('notificationRemote.getInitialNotification', () =>
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
