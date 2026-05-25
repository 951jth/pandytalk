import {FieldValue, Timestamp} from 'firebase-admin/firestore'

export type MessageStatus = 'streaming' | 'success' | 'failed' | 'pending'

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
  text?: string
  prompt?: string
  mentionerId?: string
  imageUrl?: string
  imageUrls?: string[]
  type?: ChatMessage['type']
  senderId?: string
  senderName?: string
  seq?: number
  createdAt?: Timestamp | FieldValue | number
  updatedAt?: Timestamp | FieldValue
  status?: MessageStatus
  skipPush?: boolean
  error?: string
}

export interface ChatMessage {
  id: string
  text: string
  prompt?: string
  mentionerId?: string
  imageUrl?: string
  imageUrls?: string[]
  type: 'text' | 'image' | 'ai_text'
  senderId: string
  senderName: string
  seq: number
  createdAt: Timestamp | FieldValue
  updatedAt?: Timestamp | FieldValue
  status?: MessageStatus
  skipPush?: boolean
  error?: string
}

export interface ChatRoom {
  id: string
  type: 'dm' | 'group' | 'ai'
  members: string[]
  name: string
  image?: string
  lastMessage?: ChatRoomLastMessage
  lastMessageAt?: Timestamp | FieldValue
  recentMessages?: AiRecentMessage[]
  lastSeq?: number
}
