import AdminMenuScreen from '@app/features/admin/screens/AdminMenuScreen'
import ChatUnreadCount from '@app/features/chat/components/ChatUnreadCount'
import GroupChatUnreadCount from '@app/features/chat/components/GroupChatUnreadCount'
import ChatListScreen from '@app/features/chat/screens/ChatListScreen'
import ProfileScreen from '@app/features/user/screens/ProfileScreen'
import UsersScreen from '@app/features/user/screens/UsersScreen'
import {useAppSelector} from '@app/store/reduxHooks'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
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
  disabled?: boolean // boolean only
}

export type TabRouteItem<K extends keyof TabParamList> = RouteItem & {
  name: K
  badge?: React.ComponentType<any>
  getParams?: () => TabParamList[K]
}

export const useTabScreens = () => {
  const {data: user} = useAppSelector(state => state?.user)
  const isAdmin = user?.authority == 'ADMIN'
  const isPending = user?.accountStatus === 'pending'

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
          disabled: isPending,
        },
        {
          name: 'group-chat-list',
          title: '그룹 채팅',
          icon: 'account-multiple',
          component: ChatListScreen,
          getParams: () => ({type: 'group'}),
          badge: () => ChatUnreadCount({type: 'group'}),
          filtered: !isAdmin,
          disabled: isPending,
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
    [isAdmin, isPending],
  )
}
