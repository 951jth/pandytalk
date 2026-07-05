import AdminMenuScreen from '@app/features/admin/screens/AdminMenuScreen'
import ChatUnreadCount from '@app/features/chat/components/ChatUnreadCount'
import GroupChatUnreadCount from '@app/features/chat/components/GroupChatUnreadCount'
import ChatListScreen from '@app/features/chat/screens/ChatListScreen'
import ProfileScreen from '@app/features/user/screens/ProfileScreen'
import UsersScreen from '@app/features/user/screens/UsersScreen'
import {useAppSelector} from '@app/store/reduxHooks'
import React, {useMemo} from 'react'
import type {
  AppRouteParamList,
  InitialGroupChatInfo,
  TabParamList,
} from '@app/navigation/types'

/**
 * 탭 설정의 공통 필드.
 * 일반 탭 화면과 부모 스택으로 이동하는 액션 탭이 공유한다.
 */
type BaseTabRoute<K extends keyof TabParamList> = {
  name: K
  title?: string
  icon?: string
  filtered?: boolean
  disabled?: boolean // boolean only
  badge?: React.ComponentType
}

/**
 * 일반 탭 화면.
 * BottomTab 안에서 component를 직접 렌더링하고,
 * getParams는 해당 탭 화면의 route params를 만든다.
 */
type TabScreenRoute<K extends keyof TabParamList> = BaseTabRoute<K> & {
  component: React.ComponentType
  path?: never
  getParams?: () => TabParamList[K]
}

/**
 * 액션 탭.
 * 탭 화면을 렌더링하지 않고, 탭 버튼을 누르면 부모 AppStack의 path 화면으로 이동한다.
 * getParams는 path가 가리키는 AppStack route params를 만든다.
 */
type StackActionTabRoute<
  K extends keyof TabParamList,
  T extends keyof AppRouteParamList,
> = BaseTabRoute<K> & {
  path: T
  component?: never
  getParams: () => AppRouteParamList[T] | undefined
}

/**
 * 이 앱에서 허용되는 탭 route 설정 목록.
 * 새 탭을 추가할 때는 TabParamList에 파라미터를 설정하고,
 * 일반 탭이면 TabScreenRoute,
 * 스택 이동 탭이면 StackActionTabRoute로 추가한다.
 */
export type TabRouteItem =
  | TabScreenRoute<'users'>
  | TabScreenRoute<'chats'>
  | StackActionTabRoute<'group-chat-tab', 'group-chat'>
  | TabScreenRoute<'group-chat-list'>
  | TabScreenRoute<'profile'>
  | TabScreenRoute<'admin-menu'>

export const useTabScreens = () => {
  const {data: user} = useAppSelector(state => state?.user)
  const isAdmin = user?.authority === 'ADMIN'
  const isPending = user?.accountStatus === 'pending'
  const groupId = user?.groupId
  const groupInfo = useMemo<InitialGroupChatInfo | undefined>(() => {
    if (!groupId) return undefined

    return {
      id: groupId,
      type: 'group',
      title: user?.groupName ?? '그룹 채팅',
    }
  }, [groupId, user?.groupName])

  return useMemo<TabRouteItem[]>(() => {
    const routes: TabRouteItem[] = [
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
        name: 'group-chat-tab',
        title: '그룹 채팅',
        icon: 'account-multiple',
        path: 'group-chat',
        getParams: () => (groupInfo ? {initialChatInfo: groupInfo} : undefined),
        badge: GroupChatUnreadCount,
        filtered: isAdmin,
        disabled: isPending || !groupId,
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
    ]

    return routes.filter(e => !e.filtered)
  }, [groupId, groupInfo, isAdmin, isPending])
}
