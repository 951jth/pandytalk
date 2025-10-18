import {NavigatorScreenParams} from '@react-navigation/native'

export type TabParamList = {
  users: undefined
  chats: undefined
  profile: undefined
  'group-chat': {groupId: string} | undefined
}

export type AuthStackParamList = {
  login: undefined
  addGuest: undefined
}

export type AppRouteParamList = {
  // Auth
  main: NavigatorScreenParams<TabParamList>
  chatRoom: {targetIds?: string[]; roomId?: string; title?: string}
  'guest-manage': undefined
  'group-manage': undefined
  'user-select': undefined
  'group-chat': {groupId?: string} | undefined
}

export type RootStackParamList = {
  app: NavigatorScreenParams<AppRouteParamList>
  auth: NavigatorScreenParams<AuthStackParamList>
}
