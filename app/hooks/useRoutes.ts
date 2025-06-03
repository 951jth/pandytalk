import React from 'react'
import MainLayout from '../components/layout/MainLayout'
import MainContents from '../components/navigation/MainContents'
import ChatListScreen from '../screens/ChatListScreen'
import ChatRoomScreen from '../screens/ChatRoomScreen'
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
  layout?: React.ComponentType<any>
  options?: object
  children: RouteItem[]
}

// ✅ 하단 탭에 들어갈 화면 정의 (중앙 집중화): 메인페이지 전용 탭들
const tabScreens = (): RouteItem[] => {
  return [
    {
      name: 'users',
      title: 'Users',
      component: UsersScreen,
      icon: 'account-group',
    },
    {
      name: 'chats',
      title: 'Chat',
      component: ChatListScreen,
      icon: 'chat',
    },
    {
      name: 'profile',
      title: 'Profile',
      component: ProfileScreen,
      icon: 'account-circle',
    },
  ]
}

const authRoutes = (): LayoutItem[] => {
  return [
    {
      key: 'main',
      layout: MainLayout,
      options: {
        headerShown: false,
      },
      children: [
        {
          name: 'main',
          title: 'Users',
          component: MainContents, // 실제 탭 화면
        },
      ],
    },
    {
      key: 'chat',
      options: {
        headerShown: false,
      },
      children: [
        {name: 'chatRoom', title: 'ChatRoom', component: ChatRoomScreen},
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
