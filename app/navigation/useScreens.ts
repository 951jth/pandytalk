import LoginScreen from '@app/features/auth/screens/LoginScreen'
import DmChatRoomScreen from '@app/features/chat/screens/DmChatRoomScreen'
import GroupChatRoomScreen from '@app/features/chat/screens/GroupChatRoomScreen'
import GroupManageScreen from '@app/features/group/screens/GroupManageScreen'
import UserJoinScreen from '@app/features/user/screens/UserJoinScreen'
import UsersManageScreen from '@app/features/user/screens/UsersManageScreen'
import HarnessScreen from '@app/features/harness/screens/HarnessScreen'
import MainLayout from '@app/layout/MainLayout'
import TabScreenNavigator from '@app/navigation/TabScreenNavigator'
import type {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import React from 'react'

type RouteItem = {
  name: string
  title?: string
  component?: React.ComponentType
  options?: NativeStackNavigationOptions
  icon?: string
  filtered?: boolean
  path?: string
}

type LayoutItem = {
  key: string
  layout?: React.ComponentType<{children: React.ReactNode}>
  options?: NativeStackNavigationOptions
  children: RouteItem[]
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
          name: 'harness',
          title: '하네스',
          component: HarnessScreen,
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
    name: 'user-join',
    component: UserJoinScreen,
  },
]

const initialRouteName = 'main'

export {appRoutes, authRoutes, initialRouteName}
