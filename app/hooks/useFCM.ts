import {getApp} from '@react-native-firebase/app'
import {getAuth} from '@react-native-firebase/auth'
import {doc, getFirestore, setDoc} from '@react-native-firebase/firestore'
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
} from '@react-native-firebase/messaging'
import {useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'
import {PermissionsAndroid, Platform} from 'react-native'
import {PushMessage} from '../types/firebase'
import {updateChatListCache} from './useInfiniteQuery'

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
  const currentUser = authInstance.currentUser
  useEffect(() => {
    const firestore = getFirestore()
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
        await setDoc(
          doc(firestore, 'users', currentUser.uid),
          {fcmToken: token},
          {merge: true},
        )
      } catch (e) {
        console.error('useFCMSetup', e)
      }
    }

    setup()
  }, [currentUser])
}

//수신등록
export function useFCMListener(userId: string | null | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!userId) return

    const app = getApp()
    const messaging = getMessaging(app)

    const updateChatList = (remoteMessage: any) => {
      const data = remoteMessage?.data
      if (data) {
        updateChatListCache(queryClient, userId, {
          chatId: data.chatId,
          pushType: data.pushType,
          senderId: data.senderId,
          text: data.text,
          type: data.type,
          imageUrl: data.imageUrl || '',
          senderName: data.senderName || '',
          senderPicURL: data.senderPicURL || '',
          createdAt: Number(data.createdAt),
        } as PushMessage)
        // queryClient.invalidateQueries({queryKey: ['chats', userId]})
      }
    }

    // ✅ 포그라운드 수신
    const unsubscribe = onMessage(messaging, async remoteMessage => {
      console.log('음음?')
      const type = remoteMessage?.data?.pushType
      if (type === 'chat') {
        console.log('[FCM] foreground tap: 채팅 목록 새로고침')
        updateChatList(remoteMessage)
      }
    })

    // ✅ 백그라운드 탭
    onNotificationOpenedApp(messaging, remoteMessage => {
      const type = remoteMessage?.data?.pushType
      if (type === 'chat') {
        console.log('[FCM] background tap: 채팅 목록 새로고침')
        updateChatList(remoteMessage)
        // queryClient.invalidateQueries({queryKey: ['chats', userId]})
      }
    })

    // ✅ 종료 상태에서 푸시로 실행된 경우
    getInitialNotification(messaging).then(remoteMessage => {
      const type = remoteMessage?.data?.pushType
      if (type === 'chat') {
        console.log('[FCM] quit → 실행됨: 채팅 목록 새로고침')
        updateChatList(remoteMessage)
        // queryClient.invalidateQueries({queryKey: ['chats', userId]})
      }
    })

    return () => unsubscribe()
  }, [userId, queryClient])
}
