import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'
import type {User} from './auth'

import {AI_BOT_ID, AI_BOT_NAME} from '../constants/ai'

export const PANDY_AI_BOT = {
  uid: AI_BOT_ID,
  name: AI_BOT_NAME,
}

export type ServerTime =
  | FirebaseFirestoreTypes.FieldValue
  | FirebaseFirestoreTypes.Timestamp
  
export const CHAT_MESSAGE_TYPES = ['text', 'image', 'file', 'ai_text'] as const
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number]

export const CHAT_ROOM_TYPES = ['dm', 'group', 'ai'] as const
export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number]

export interface ChatMessage {
  id: string
  senderId: string
  text?: string
  prompt?: string // AI 응답 시 원본 질문 보관 (SSE 연동용)
  mentionerId?: string // AI를 호출한 유저 UID (중복 스트리밍 방지용)
  type: ChatMessageType
  imageUrl?: string
  imageUrls?: string[]
  createdAt: number //sqlite에 저장하기 위해 number 타입으로 변환함
  senderPicURL?: string
  senderName?: string
  seq?: number
  status?: 'pending' | 'success' | 'failed' | 'streaming'
  roomTitle?: string
  roomUrl?: string
  skipPush?: boolean
}

export type ChatMessagesWithUiType = ChatMessage & {
  hideProfile?: boolean
  hideMinute?: boolean
  hideDate?: boolean
}

export interface ChatMemberDoc {
  uid: string // 문서 ID와 동일하게 두되, 필드에도 보관(쿼리용)
  role?: 'ADMIN' | 'MEMBER'
  joinedAt?: FirebaseFirestoreTypes.Timestamp | null
  lastReadSeq: number
  lastReadAt?: FirebaseFirestoreTypes.Timestamp | null
  mute?: boolean
}

export interface ChatRoom {
  id: string
  type: ChatRoomType
  createdAt: ServerTime
  members?: string[]
  name?: string // 그룹일 경우만
  image?: string // 그룹일 경우만
  lastMessage?: ChatMessage
  lastMessageAt?: ServerTime
  memberInfos?: User[] | null
  lastReadTimestamps?: Record<string, number | null> | null
  lastReadSeqs?: Record<string, number | null>
  unreadCount?: number | null
  chatId?: string
  groupId?: string
  lastSeq?: number
  recentMessages?: {role: 'user' | 'assistant'; content: string}[]
}

export type ChatItemWithMemberInfo = ChatRoom & {findMember: User}
