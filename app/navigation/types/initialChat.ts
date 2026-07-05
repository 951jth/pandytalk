/** 채팅 화면 진입 시 route params로 전달하는 최소 정보 (ChatRoom DTO와 별도) */
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

export type ChatRouteName = 'dm-chat' | 'group-chat'
