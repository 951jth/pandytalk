import {NavigatorScreenParams} from '@react-navigation/native'
import type {ChatRoom} from './chat'

type InitialChatInfoBase = {
  id: string
  title?: string
  image?: string | null
  lastSeq?: number
}

export type InitialDmChatInfo = InitialChatInfoBase & {
  type: 'dm' | 'ai'
  targetId: string
}

export type InitialGroupChatInfo = InitialChatInfoBase & {
  type: 'group'
}

export type InitialChatInfo = InitialDmChatInfo | InitialGroupChatInfo

export type TabParamList = {
  users: undefined
  chats: {type?: ChatRoom['type']} | undefined
  'group-chat-tab': undefined
  'group-chat-list': {type: ChatRoom['type']}
  profile: undefined
  'admin-menu': undefined
}

export type AuthStackParamList = {
  login: undefined
  'user-join': undefined
}

export type AppRouteParamList = {
  main: NavigatorScreenParams<TabParamList> | undefined
  'dm-chat': {
    initialChatInfo: InitialDmChatInfo
  }
  'group-chat': {
    initialChatInfo: InitialGroupChatInfo
  }
  'guest-manage': undefined
  'group-manage': undefined
  'admin-inquiries': undefined
  harness: undefined
  'user-select': undefined
}

export type RootStackParamList = {
  app: NavigatorScreenParams<AppRouteParamList>
  auth: NavigatorScreenParams<AuthStackParamList>
}
