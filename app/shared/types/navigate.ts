import {NavigatorScreenParams} from '@react-navigation/native'
import type {ChatRoom} from './chat'

export type InitialChatInfo = {
  id: string
  type: ChatRoom['type']
  title?: string
  image?: string | null
  targetId?: string
  lastSeq?: number
}

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
  'dm-chat': {
    myId?: string
    targetId?: string
    title?: string
    roomId?: string
    initialChatInfo?: InitialChatInfo & {
      type: 'dm' | 'ai'
      targetId: string
    }
  }
  'group-chat':
    | {
        roomId?: string
        title?: string
        type?: ChatRoom['type']
        initialChatInfo?: InitialChatInfo & {type: 'group'}
      }
    | undefined
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
