import * as admin from 'firebase-admin'

export type MessageStatus = 'streaming' | 'success' | 'failed' | 'pending'

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
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
  updatedAt?: admin.firestore.Timestamp | admin.firestore.FieldValue
  status?: MessageStatus
  skipPush?: boolean
  error?: string
}

export interface ChatRoom {
  id: string
  type: 'dm' | 'group'
  members: string[]
  name: string
  image?: string
  lastMessage?: any
  lastMessageAt?: admin.firestore.Timestamp | admin.firestore.FieldValue
  recentMessages?: any[]
  lastSeq?: number
}
