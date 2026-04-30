import {NavigatorScreenParams} from '@react-navigation/native'
import type {ChatRoom} from './chat'

export type TabParamList = {
  'group-chat': {groupId: string} | undefined
  'group-chat-list': {type: ChatRoom['type']}
  [key: string]: Record<string, unknown> | undefined
}

export type AuthStackParamList = {
  login: undefined
  'user-join': undefined
}

export type AppRouteParamList = {
  // Auth
  'dm-chat': {myId: string; targetId: string; title?: string; roomId?: string}
  'group-chat': {roomId: string; type?: ChatRoom['type']} | undefined
  'guest-manage': undefined
  'group-manage': undefined
  harness: undefined
  'user-select': undefined
  chats: {type?: ChatRoom['type']}
}

export type RootStackParamList = {
  app: NavigatorScreenParams<AppRouteParamList>
  auth: NavigatorScreenParams<AuthStackParamList>
}
