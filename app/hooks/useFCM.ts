import {getApp} from '@react-native-firebase/app'
import {getAuth} from '@react-native-firebase/auth'
import {
  arrayUnion,
  doc,
  getFirestore,
  setDoc,
} from '@react-native-firebase/firestore'
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
} from '@react-native-firebase/messaging'
import {useQueryClient} from '@tanstack/react-query'
import {useEffect, useRef} from 'react'
import {PermissionsAndroid, Platform} from 'react-native'

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
  const authInstance = getAuth()
  useEffect(() => {
    const firestore = getFirestore()
    const currentUser = getAuth().currentUser
    async function setup() {
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
    }

    setup()
  }, [authInstance])
}

//현재 미사용.
//수신 후 채팅방 목록 (읽음 카운트 밎 생성) 실시간 갱신
export function useFCMListener(userId: string | null | undefined) {
  const queryClient = useQueryClient()
  const hasMounted = useRef(false) //마운트될떄 한번만 호출되도록

  useEffect(() => {
    if (!userId || hasMounted.current) return
    hasMounted.current = true

    const app = getApp()
    const messaging = getMessaging(app)

    const updateChatList = (remoteMessage: any) => {
      const data = remoteMessage?.data
      if (!data) return
      queryClient.invalidateQueries({queryKey: ['chats', userId]})
      // updateChatListCache(queryClient, userId, {
      //   chatId: data.chatId,
      //   pushType: data.pushType,
      //   senderId: data.senderId,
      //   text: data.text,
      //   type: data.type,
      //   imageUrl: data.imageUrl || '',
      //   senderName: data.senderName || '',
      //   senderPicURL: data.senderPicURL || '',
      //   createdAt: Number(data.createdAt),
      // } as PushMessage)
    }

    const unsubscribe = onMessage(messaging, async remoteMessage => {
      if (remoteMessage?.data?.pushType === 'chat') {
        console.log('[FCM] foreground tap: 채팅 목록 새로고침')
        updateChatList(remoteMessage)
      }
    })

    onNotificationOpenedApp(messaging, remoteMessage => {
      if (remoteMessage?.data?.pushType === 'chat') {
        console.log('[FCM] background tap: 채팅 목록 새로고침')
        updateChatList(remoteMessage)
      }
    })

    getInitialNotification(messaging).then(remoteMessage => {
      if (remoteMessage?.data?.pushType === 'chat') {
        console.log('[FCM] quit → 실행됨: 채팅 목록 새로고침')
        updateChatList(remoteMessage)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [userId])
}
