import {firestore, messaging} from '@app/shared/firebase/firestore'
import {firebaseCall} from '@app/shared/utils/logger'
import {arrayUnion, doc, setDoc} from '@react-native-firebase/firestore'
import {AuthorizationStatus} from '@react-native-firebase/messaging'
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

  // 3. FCM 토큰 가져오기
  async getFcmToken(): Promise<string | undefined> {
    return await firebaseCall('notificationRemote.getFcmToken', () =>
      messaging.getToken(),
    )
  },

  // 4. 서버(DB)에 토큰 저장
  async saveTokenToUser(uid: string, token: string): Promise<void> {
    const userRef = doc(firestore, 'users', uid)

    await firebaseCall('notificationRemote.saveTokenToUser', () =>
      setDoc(userRef, {fcmTokens: arrayUnion(token)}, {merge: true}),
    )
  },
}
