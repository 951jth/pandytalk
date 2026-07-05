import {FieldValue, Timestamp} from 'firebase-admin/firestore'

export type MessageStatus = 'streaming' | 'success' | 'failed' | 'pending'

export type ServerTime = FieldValue | Timestamp

export const CHAT_MESSAGE_TYPES = ['text', 'image', 'file', 'ai_text'] as const
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number]

export const CHAT_ROOM_TYPES = ['dm', 'group', 'ai'] as const
export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number]

export type AiRecentMessageRole = 'user' | 'assistant'

export interface AiTextContentPart {
  type: 'text'
  text: string
}

export interface AiImageUrlContentPart {
  type: 'image_url'
  image_url: {
    url: string
  }
}

export type AiRecentUserContent =
  | string
  | Array<AiTextContentPart | AiImageUrlContentPart>

export type AiRecentMessage =
  | {
      role: 'user'
      content: AiRecentUserContent
    }
  | {
      role: 'assistant'
      content: string
    }

export interface ChatRoomLastMessage {
  id?: string
  senderId?: string
  text?: string
  prompt?: string
  mentionerId?: string
  type?: ChatMessageType
  imageUrl?: string
  imageUrls?: string[]
  createdAt?: number
  senderPicURL?: string
  senderName?: string
  seq?: number
  status?: MessageStatus
  roomTitle?: string
  roomUrl?: string
  skipPush?: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  text?: string
  prompt?: string
  mentionerId?: string
  type: ChatMessageType
  imageUrl?: string
  imageUrls?: string[]
  createdAt: number
  senderPicURL?: string
  senderName?: string
  seq?: number
  status?: MessageStatus
  roomTitle?: string
  roomUrl?: string
  skipPush?: boolean
}

export interface ChatRoom {
  id: string
  type: ChatRoomType
  createdAt: ServerTime
  members?: string[]
  name?: string
  image?: string
  lastMessage?: ChatMessage
  lastMessageAt?: ServerTime
  memberInfos?: unknown[] | null
  lastReadTimestamps?: Record<string, number | null> | null
  lastReadSeqs?: Record<string, number | null>
  unreadCount?: number | null
  chatId?: string
  groupId?: string
  lastSeq?: number
  recentMessages?: {role: AiRecentMessageRole; content: string}[]
}
