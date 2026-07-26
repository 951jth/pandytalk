import LoginScreen from '@app/features/auth/screens/LoginScreen'
import ChatMessageDetailScreen from '@app/features/chat/screens/ChatMessageDetailScreen'
import DmChatRoomScreen from '@app/features/chat/screens/DmChatRoomScreen'
import GroupChatRoomScreen from '@app/features/chat/screens/GroupChatRoomScreen'
import GroupManageScreen from '@app/features/group/screens/GroupManageScreen'
import UserJoinScreen from '@app/features/user/screens/UserJoinScreen'
import UsersManageScreen from '@app/features/user/screens/UsersManageScreen'
import HarnessScreen from '@app/features/harness/screens/HarnessScreen'
import AdminInquiriesScreen from '@app/features/admin/screens/AdminInquiriesScreen'
import MainLayout from '@app/layout/MainLayout'
import TabScreenNavigator from '@app/navigation/TabScreenNavigator'
import type {
  AppRouteParamList,
  AuthStackParamList,
} from '@app/navigation/types'
import type {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import React from 'react'

/**
 * 스택 route 설정의 공통 필드.
 * AppStack과 AuthStack에 등록되는 화면 설정이 공유한다.
 */
type RouteItem<RouteName extends string> = {
  name: RouteName
  title?: string
  component?: React.ComponentType
  options?: NativeStackNavigationOptions
  icon?: string
  filtered?: boolean
  path?: string
}

/**
 * 공통 레이아웃으로 묶을 AppStack route 그룹.
 * layout이 있으면 children 화면들을 해당 레이아웃으로 감싸고,
 * options는 그룹에 공통으로 적용할 Native Stack 옵션을 만든다.
 */
type LayoutItem = {
  key: string
  layout?: React.ComponentType<{children: React.ReactNode}>
  options?: NativeStackNavigationOptions
  children: RouteItem<keyof AppRouteParamList>[]
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
          name: 'admin-inquiries',
          title: '문의 관리',
          component: AdminInquiriesScreen,
        },
        {
          name: 'admin-inquiry-detail',
          title: '문의 상세',
          component: React.lazy(() => import('@app/features/admin/screens/AdminInquiryDetailScreen')),
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
        {
          name: 'chat-message-detail',
          title: '메시지 상세',
          component: ChatMessageDetailScreen,
        },
      ],
    },
  ]
}

//규모가 커지면 useAuthRoutes로 분리.
const authRoutes: RouteItem<keyof AuthStackParamList>[] = [
  {
    name: 'login',
    component: LoginScreen,
  },
  {
    name: 'user-join',
    component: UserJoinScreen,
  },
]

const initialRouteName: keyof AppRouteParamList = 'main'

export {appRoutes, authRoutes, initialRouteName}
