import {NavigatorScreenParams} from '@react-navigation/native'

export type TabParamList = {
  users: undefined
  chats: undefined
  profile: undefined
}

export type AuthStackParamList = {
  login: undefined
  addGuest: undefined
}

// 필요 없다면 RootStackParamList 제거 가능
// export type RootStackParamList = { ... };

export type AppRouteParamList = {
  // Auth
  main: NavigatorScreenParams<TabParamList>
  chatRoom: {targetIds?: string[]; roomId?: string; title?: string}
  'guest-manage': undefined
  'group-manage': undefined
  'user-select': undefined
}

export type RootStackParamList = {
  app: NavigatorScreenParams<AppRouteParamList>
  auth: NavigatorScreenParams<AuthStackParamList>
}
