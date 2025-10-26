import React, {useMemo} from 'react'
import GroupChatUnreadCount from '../components/badge/GroupChatUnreadCount'
import MainLayout from '../components/layout/MainLayout'
import TabScreenNavigator from '../navigation/TabScreenNavigator'
import AddGuestScreen from '../screens/AddGuestScreen'
import AdminMenuScreen from '../screens/AdminMenuScreen'
import ChatListScreen from '../screens/ChatListScreen'
import ChatRoomScreen from '../screens/ChatRoomScreen'
import GroupChatRoomScreen from '../screens/GroupChatRoomScreen'
import GroupManageScreen from '../screens/GroupManageScreen'
import GuestManageScreen from '../screens/GuestManageScreen'
import LoginScreen from '../screens/LoginScreen'
import ProfileScreen from '../screens/ProfileScreen'
import UserSelectScreen from '../screens/UserSelectScreen'
import UsersScreen from '../screens/UsersScreen'
import {useAppSelector} from '../store/reduxHooks'
import type {TabParamList} from '../types/navigate'

type RouteItem = {
  name: string
  title?: string
  component?: React.ComponentType<any>
  options?: object
  icon?: string
  filtered?: boolean
  path?: string
}

type TabRouteItem = RouteItem & {
  getParams?: () => TabParamList[keyof TabParamList] // ← 추가
  badge?: React.ComponentType<any>
}

type LayoutItem = {
  key: string
  layout?: React.ComponentType<any>
  options?: object
  children: RouteItem[]
}

// ✅ 하단 탭에 들어갈 화면 정의 (중앙 집중화): 메인페이지 전용 탭들
const tabScreens = (): TabRouteItem[] => {
  const {data: user} = useAppSelector(state => state?.user)
  return useMemo<TabRouteItem[]>(
    () =>
      [
        {
          name: 'users',
          title: '홈',
          component: UsersScreen,
          icon: 'home',
        },
        {name: 'chats', title: '채팅', component: ChatListScreen, icon: 'chat'},
        {
          name: 'group-chat',
          title: '그룹 채팅',
          icon: 'account-multiple',
          path: 'group-chat',
          badge: GroupChatUnreadCount,
        },
        {
          name: 'profile',
          title: '프로필',
          component: ProfileScreen,
          icon: 'account-circle',
        },
        {
          name: 'admin-menu',
          title: '관리자 메뉴',
          component: AdminMenuScreen,
          icon: 'menu',
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
          title: '홈',
          component: TabScreenNavigator, // 실제 탭 화면
        },
        {
          name: 'guest-manage',
          title: '게스트 관리',
          component: GuestManageScreen,
        },
        {
          name: 'group-manage',
          title: '그룹 관리',
          component: GroupManageScreen,
        },
        {
          name: 'user-select',
          title: '유저 선택',
          component: UserSelectScreen,
        },
      ],
    },
    {
      key: 'chat',
      options: {
        headerShown: false,
      },
      children: [
        {name: 'chatRoom', title: '채탕방', component: ChatRoomScreen},
        {
          name: 'group-chat',
          title: '그룹 채팅',
          component: GroupChatRoomScreen,
          icon: 'account-multiple',
        },
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
