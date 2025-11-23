import {NavigatorScreenParams} from '@react-navigation/native'
import type {ChatListItem} from './chat'

//값을 지정하는 경우 해당 key의 조건을 따지고, 아닌경우 기본값 지정
type ParamListOf<
  Specific extends Record<string, any>,
  Default extends any = Record<string, unknown> | undefined,
> = Specific & Record<string, Default>

export type TabParamList = {
  'group-chat': {groupId: string} | undefined
  'group-chat-list': {type: ChatListItem['type']}
  [key: string]: Record<string, unknown> | undefined
}

export type AuthStackParamList = {
  login: undefined
  addGuest: undefined
}

export type AppRouteParamList = {
  // Auth
  // main: undefined
  chatRoom: {targetIds?: string[]; roomId?: string; title?: string}
  'guest-manage': undefined
  'group-manage': undefined
  'user-select': undefined
  chats: {type?: ChatListItem['type']}
  'group-chat': {groupId?: string; type?: ChatListItem['type']} | undefined
}

export type RootStackParamList = {
  app: NavigatorScreenParams<AppRouteParamList>
  auth: NavigatorScreenParams<AuthStackParamList>
}
