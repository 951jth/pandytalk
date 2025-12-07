import {getApp} from '@react-native-firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth'
import {
  arrayUnion,
  doc,
  getFirestore,
  setDoc,
} from '@react-native-firebase/firestore'
import {getMessaging, requestPermission} from '@react-native-firebase/messaging'
import {useEffect, useState} from 'react'
import {PermissionsAndroid, Platform} from 'react-native'
import {auth} from '../../../store/firestore'

// iOS 권한 : alert, badge, sound, provisional 선택 가능
const iosPermOptions = {
  alert: true,
  badge: true,
  sound: true,
  provisional: false,
}

const AuthorizationStatus = {
  NOT_DETERMINED: 1,
  DENIED: 2,
  AUTHORIZED: 3,
  PROVISIONAL: 4,
}

export function useFCMSetup() {
  // const authInstance = getAuth()
  // const {data: userInfo} = useAppSelector(state => state?.user)
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(
    auth.currentUser,
  )

  // 1) Auth 변화 구독: 로그인/로그아웃/재로그인 모두 잡음
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user: FirebaseAuthTypes.User | null) => {
        setUser(user)
      },
    )
    return unsub
  }, [])

  useEffect(() => {
    const firestore = getFirestore()
    const currentUser = getAuth().currentUser

    ;(async () => {
      try {
        if (!currentUser?.uid) return
        // iOS 권한 요청
        const app = getApp()
        const messaging = getMessaging(app)

        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          )
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('알림 권한 거부됨')
            return
          }
        }

        if (Platform.OS === 'ios') {
          // 권한 요청
          let authStatus = await requestPermission(
            messaging,
            Platform.OS === 'ios' ? iosPermOptions : {},
          )
          const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL

          console.log('FCM authStatus:', authStatus, 'enabled:', enabled)
          if (!enabled) return

          await messaging.registerDeviceForRemoteMessages()
        } else {
          // Android에서는 권한 요청 없이 바로 가능 (Android 13+는 알림 권한 필요할 수 있음)
          console.log('Android: preparing FCM')
          await messaging.registerDeviceForRemoteMessages()
        }
        const token = await messaging.getToken()
        console.log('token', token)
        await setDoc(
          doc(firestore, 'users', currentUser.uid),
          {fcmTokens: arrayUnion(token)},
          {merge: true},
        )
      } catch (e) {
        console.error('useFCMSetup', e)
      }
    })()
  }, [user])
}
