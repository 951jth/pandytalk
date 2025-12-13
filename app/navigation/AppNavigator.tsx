import {appRoutes} from '@app/navigation/useScreens'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
// import {navigate} from '../components/navigation/RootNavigation'

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  const routes = appRoutes()

  //알림 클릭시 초기 진입 route
  // useEffect(() => {
  //   const app = getApp()
  //   const messaging = getMessaging(app)
  //   // 앱 종료 상태에서 푸시 클릭
  //   messaging.getInitialNotification().then(remoteMessage => {
  //     if (
  //       remoteMessage?.data?.pushType === 'chat' &&
  //       remoteMessage?.data?.chatId
  //     ) {
  //       console.log('앱 종료 푸시')
  //       const data = remoteMessage.data
  //       console.log(data)
  //       navigateToChat(data?.chatId as string, data?.senderName as string)
  //     }
  //   })

  //   // 백그라운드 상태에서 푸시 클릭
  //   const unsubscribe = messaging.onNotificationOpenedApp(remoteMessage => {
  //     if (
  //       remoteMessage?.data?.pushType === 'chat' &&
  //       remoteMessage?.data?.chatId
  //     ) {
  //       console.log('백그라운드 푸시')
  //       const data = remoteMessage.data
  //       console.log(data)
  //       navigateToChat(data?.chatId as string, data?.senderName as string)
  //     }
  //   })

  //   return unsubscribe
  // }, [])

  return (
    <Stack.Navigator>
      {routes.flatMap(layoutGroup =>
        layoutGroup.children.map(route => (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={layoutGroup.options || route.options}>
            {(props: any) => {
              const Component = route.component ?? React.Fragment
              const Layout = layoutGroup.layout ?? React.Fragment

              return (
                <Layout>
                  <Component {...props} />
                </Layout>
              )
            }}
          </Stack.Screen>
        )),
      )}
    </Stack.Navigator>
  )
}
