import {getApp} from '@react-native-firebase/app'
import {getMessaging} from '@react-native-firebase/messaging'
import {useEffect} from 'react'
import {navigateToChat} from '../../../components/navigation/RootNavigation'

function useFCMPushHandler() {
  useEffect(() => {
    const app = getApp()
    const messaging = getMessaging(app)
    // 앱 종료 상태에서 푸시 클릭
    messaging.getInitialNotification().then(remoteMessage => {
      // console.log('check!')
      if (
        remoteMessage?.data?.pushType === 'chat' &&
        remoteMessage?.data?.chatId
      ) {
        console.log('앱 종료 푸시')
        const data = remoteMessage.data
        console.log(data)
        navigateToChat(
          data?.chatId as string,
          data?.senderName as string,
          (data?.chatType as string) || 'dm',
        )
      }
    })

    // 백그라운드 상태에서 푸시 클릭
    const unsubscribe = messaging.onNotificationOpenedApp(remoteMessage => {
      if (
        remoteMessage?.data?.pushType === 'chat' &&
        remoteMessage?.data?.chatId
      ) {
        console.log('백그라운드 푸시')
        const data = remoteMessage.data
        console.log(data)
        navigateToChat(
          data?.chatId as string,
          data?.senderName as string,
          (data?.chatType as string) || 'dm',
        )
      }
    })

    return unsubscribe
  }, [])
}

export {useFCMPushHandler}
