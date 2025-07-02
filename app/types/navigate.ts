export type TabParamList = {
  users: undefined
  chats: undefined
  profile: undefined
}

export type AuthStackParamList = {
  main: undefined
  chatRoom: {targetIds?: string[]; roomId?: string; title?: string}
}

export type NoAuthStackParamList = {
  login: undefined
}

// 필요 없다면 RootStackParamList 제거 가능
// export type RootStackParamList = { ... };

export type AppRouteParamList = {
  // Auth
  main: undefined
  chatRoom: {targetIds?: string[]; roomId?: string; title?: string}

  // Tabs
  users: undefined
  chats: undefined
  profile: undefined

  // NoAuth
  login: undefined
}

export type RootStackParamList = {
  app: undefined
  auth: undefined
}
