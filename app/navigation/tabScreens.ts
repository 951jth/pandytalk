import AdminMenuScreen from '@app/features/admin/screens/AdminMenuScreen'
import ChatUnreadCount from '@app/features/chat/components/ChatUnreadCount'
import GroupChatUnreadCount from '@app/features/chat/components/GroupChatUnreadCount'
import ChatListScreen from '@app/features/chat/screens/ChatListScreen'
import ProfileScreen from '@app/features/user/screens/ProfileScreen'
import UsersScreen from '@app/features/user/screens/UsersScreen'
import {useAppSelector} from '@app/store/reduxHooks'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useMemo} from 'react'
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

export type TabRouteItem<K extends keyof TabParamList> = RouteItem & {
  name: K
  badge?: React.ComponentType<any>
  getParams?: () => TabParamList[K]
}

export const tabScreens = () => {
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
