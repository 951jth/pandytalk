import {getApp} from '@react-native-firebase/app'
import {getAuth} from '@react-native-firebase/auth'
import {getMessaging} from '@react-native-firebase/messaging'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React, {useEffect} from 'react'
import {navigate} from '../components/navigation/RootNavigation'
import {useFCMListener} from '../hooks/useFCM'
import {authRoutes, initialRouteName} from '../hooks/useRoutes'

const Stack = createNativeStackNavigator()
const authInstance = getAuth()

export default function AuthNavigator() {
  const routes = authRoutes()
  const currentUser = authInstance.currentUser

  useFCMListener(currentUser?.uid)

  function navigateToChat(roomId: string, title?: string) {
    console.log('roomId', roomId)
    console.log('title', title)
    try {
      navigate('chatRoom', {roomId, title})
    } catch (e) {
      console.log(e)
    }
  }

  //알림 클릭시 초기 진입 route
  useEffect(() => {
    const app = getApp()
    const messaging = getMessaging(app)
    // 앱 종료 상태에서 푸시 클릭
    messaging.getInitialNotification().then(remoteMessage => {
      if (remoteMessage?.data?.type === 'chat' && remoteMessage?.data?.chatId) {
        console.log('앱 종료 푸시')
        const data = remoteMessage.data
        navigateToChat(data?.chatId as string, data?.senderName as string)
      }
    })

    // 백그라운드 상태에서 푸시 클릭
    const unsubscribe = messaging.onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage?.data?.type === 'chat' && remoteMessage?.data?.chatId) {
        console.log('백그라운드 푸시')
        const data = remoteMessage.data
        navigateToChat(data?.chatId as string, data?.senderName as string)
      }
    })

    return unsubscribe
  }, [])

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      {routes.flatMap(layoutGroup =>
        layoutGroup.children.map(route => (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={layoutGroup.options || route.options}>
            {(props: any) => {
              const Component = route.component
              const Layout = layoutGroup.layout

              return Layout ? (
                <Layout>
                  <Component {...props} />
                </Layout>
              ) : (
                <Component {...props} />
              )
            }}
          </Stack.Screen>
        )),
      )}
    </Stack.Navigator>
  )
}
