import {NavigatorScreenParams} from '@react-navigation/native'
import type {ChatRoom} from '@app/shared/types/chat'
import type {InitialDmChatInfo, InitialGroupChatInfo} from './initialChat'

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
  'admin-inquiry-detail': {
    inquiryId: string
  }
  harness: undefined
}

export type RootStackParamList = {
  app: NavigatorScreenParams<AppRouteParamList>
  auth: NavigatorScreenParams<AuthStackParamList>
}
