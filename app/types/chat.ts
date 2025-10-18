import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'
import type {User} from './auth'
export type ServerTime =
  | FirebaseFirestoreTypes.FieldValue
  | FirebaseFirestoreTypes.Timestamp
export interface ChatMessage {
  id: string
  senderId: string
  text?: string
  type: 'text' | 'image' | 'file'
  imageUrl?: string
  createdAt: number //sqlite에 저장하기 위해 number 타입으로 변환함
  // createdAt: ServerTime | number
  senderPicURL?: string
  senderName?: string
}

export interface PushMessage extends ChatMessage {
  chatId: string
  pushType: string
}

export interface ChatListItem {
  id?: string
  type: 'dm' | 'group'
  // createdAt?: number
  createdAt: ServerTime
  members?: string[]
  name?: string // 그룹일 경우만
  image?: string // 그룹일 경우만
  lastMessage?: ChatMessage
  memberInfos?: User[] | null
  lastReadTimestamps?: Record<string, number | null> | null
  unreadCount?: number | null
  chatId?: string
  groupId?: string
}
