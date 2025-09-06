import React, {useMemo} from 'react'
import MainLayout from '../components/layout/MainLayout'
import TabScreenNavigator from '../navigation/TabScreenNavigator'
import AddGuestScreen from '../screens/AddGuestScreen'
import ChatListScreen from '../screens/ChatListScreen'
import ChatRoomScreen from '../screens/ChatRoomScreen'
import GuestManageScreen from '../screens/GuestManageScreen'
import LoginScreen from '../screens/LoginScreen'
import ProfileScreen from '../screens/ProfileScreen'
import UsersScreen from '../screens/UsersScreen'
import {useAppSelector} from '../store/reduxHooks'

type RouteItem = {
  name: string
  title?: string
  component: React.ComponentType<any>
  options?: object
  icon?: string
  filtered?: boolean
}

type LayoutItem = {
  key: string
  layout?: React.ComponentType<any>
  options?: object
  children: RouteItem[]
}

// ✅ 하단 탭에 들어갈 화면 정의 (중앙 집중화): 메인페이지 전용 탭들
const tabScreens = (): RouteItem[] => {
  const {data: user} = useAppSelector(state => state?.user)
  return useMemo<RouteItem[]>(
    () =>
      [
        {
          name: 'users',
          title: '유저 찾기',
          component: UsersScreen,
          icon: 'account-group',
        },
        {name: 'chats', title: '채팅', component: ChatListScreen, icon: 'chat'},
        {
          name: 'profile',
          title: '프로필',
          component: ProfileScreen,
          icon: 'account-circle',
        },
        {
          name: 'guest',
          title: '게스트 관리',
          component: GuestManageScreen,
          icon: 'account-multiple-plus',
          filtered: user?.authority !== 'ADMIN',
        },
      ].filter(e => !e.filtered),
    [user?.authority ?? null],
  )
}

const appRoutes = (): LayoutItem[] => {
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
          title: '유저 찾기',
          component: TabScreenNavigator, // 실제 탭 화면
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

const authRoutes: RouteItem[] = [
  {
    name: 'login',
    component: LoginScreen,
  },
  {
    name: 'addGuest',
    component: AddGuestScreen,
  },
]

const initialRouteName = 'main'

export {appRoutes, authRoutes, initialRouteName, tabScreens}
