import {useMemo} from 'react'
import AuthLayout from '../components/layout/AuthLayout'
import MainContents from '../components/navigation/MainContents'
import ChatScreen from '../screens/ChatScreen'
import LoginScreen from '../screens/LoginScreen'
import ProfileScreen from '../screens/ProfileScreen'
import UsersScreen from '../screens/UsersScreen'

type RouteItem = {
  name: string
  title?: string
  component: React.ComponentType<any>
  options?: object
  icon?: string
}

type LayoutItem = {
  key: string
  layout: React.ComponentType<any>
  options?: object
  children: RouteItem[]
}

// ✅ 하단 탭에 들어갈 화면 정의 (중앙 집중화): 메인페이지 전용 탭들
const tabScreens = (): RouteItem[] => {
  const tabsMemo = useMemo(
    () => [
      {
        name: 'users',
        title: 'Users',
        component: UsersScreen,
        icon: 'account-group',
      },
      {
        name: 'chats',
        title: 'Chat',
        component: ChatScreen,
        icon: 'chat',
      },
      {
        name: 'profile',
        title: 'Profile',
        component: ProfileScreen,
        icon: 'account-circle',
      },
    ],
    [],
  )
  return tabsMemo
}

const authRoutes = (): LayoutItem[] => {
  return [
    {
      key: 'auth',
      layout: AuthLayout,
      options: {
        headerShown: false,
      },
      children: [
        {
          name: 'main',
          title: 'Main',
          component: MainContents, // 실제 탭 화면
        },
      ],
    },
  ]
}
const noAuthRoutes: RouteItem[] = [
  {
    name: 'login',
    component: LoginScreen,
  },
]

const initialRouteName = 'main'

export {authRoutes, initialRouteName, noAuthRoutes, tabScreens}
