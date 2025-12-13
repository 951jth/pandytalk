import AdminMenuScreen from '@app/features/admin/screens/AdminMenuScreen'
import LoginScreen from '@app/features/auth/screens/LoginScreen'
import ChatUnreadCount from '@app/features/chat/components/ChatUnreadCount'
import GroupChatUnreadCount from '@app/features/chat/components/GroupChatUnreadCount'
import ChatListScreen from '@app/features/chat/screens/ChatListScreen'
import DmChatRoomScreen from '@app/features/chat/screens/DmChatRoomScreen'
import GroupChatRoomScreen from '@app/features/chat/screens/GroupChatRoomScreen'
import GroupManageScreen from '@app/features/group/screens/GroupManageScreen'
import ProfileScreen from '@app/features/profile/screens/ProfileScreen'
import AddUserScreen from '@app/features/user/screens/AddUserScreen'
import UserSelectScreen from '@app/features/user/screens/UserSelectScreen'
import UsersManageScreen from '@app/features/user/screens/UsersManageScreen'
import UsersScreen from '@app/features/user/screens/UsersScreen'
import MainLayout from '@app/layout/MainLayout'
import TabScreenNavigator from '@app/navigation/TabScreenNavigator'
import {useAppSelector} from '@app/store/reduxHooks'
import type {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import React, {useMemo} from 'react'
import type {TabParamList} from '../shared/types/navigate'

type RouteItem = {
  name: string
  title?: string
  component?: React.ComponentType<any>
  options?: NativeStackNavigationOptions
  icon?: string
  filtered?: boolean
  path?: string
}

//TabParamList의 키 중 하나
export type TabRouteItem<K extends keyof TabParamList> = RouteItem & {
  name: K
  badge?: React.ComponentType<any>
  // 2) TabParamList에 지정한 값만 getParams 검증함.
  getParams?: () => TabParamList[K]
}

type LayoutItem = {
  key: string
  layout?: React.ComponentType<any>
  options?: NativeStackNavigationOptions
  children: RouteItem[]
}

// ✅ 하단 탭에 들어갈 화면 정의 (중앙 집중화): 메인페이지 전용 탭들
const tabScreens = () => {
  const {data: user} = useAppSelector(state => state?.user)
  const isAdmin = user?.authority == 'ADMIN'
  return useMemo<TabRouteItem<keyof TabParamList>[]>(
    () =>
      [
        {
          name: 'users',
          title: '홈',
          component: UsersScreen,
          icon: 'home',
        },
        {
          name: 'chats',
          title: '채팅',
          component: ChatListScreen,
          icon: 'chat',
          getParams: () => ({type: 'dm'}),
          badge: ChatUnreadCount,
        },
        {
          name: 'group-chat',
          title: '그룹 채팅',
          icon: 'account-multiple',
          path: 'group-chat',
          badge: GroupChatUnreadCount,
          filtered: isAdmin,
        },
        {
          //관리자용 그룹채팅 전체보기.
          name: 'group-chat-list',
          title: '그룹 채팅',
          icon: 'account-multiple',
          component: ChatListScreen,
          getParams: () => ({type: 'group'}),
          badge: () => ChatUnreadCount({type: 'group'}),
          filtered: !isAdmin,
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
          filtered: !isAdmin,
        },
      ].filter(e => !e.filtered),
    [user?.authority ?? null],
  )
}

//규모가 커지면 분리도 권장
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
          title: '유저 관리',
          component: UsersManageScreen,
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
        {name: 'dm-chat', title: '채탕방', component: DmChatRoomScreen},
        {
          name: 'group-chat',
          title: '그룹 채팅',
          component: GroupChatRoomScreen,
        },
      ],
    },
  ]
}

//규모가 커지면 useAuthRoutes로 분리.
const authRoutes: RouteItem[] = [
  {
    name: 'login',
    component: LoginScreen,
  },
  {
    name: 'addGuest',
    component: AddUserScreen,
  },
]

const initialRouteName = 'main'

export {appRoutes, authRoutes, initialRouteName, tabScreens}
