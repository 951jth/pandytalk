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
  senderPicURL?: string
  senderName?: string
  seq?: number
  status?: 'pending' | 'success' | 'failed'
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

export interface PushMessage extends ChatMessage {
  chatId: string
  pushType: string
}

export interface ChatRoom {
  id: string
  type: 'dm' | 'group'
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
}

export type ChatItemWithMemberInfo = ChatRoom & {findMember: User}
