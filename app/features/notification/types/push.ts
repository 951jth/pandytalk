import type {
  ChatMessage,
  ChatRoom,
} from '@app/shared/types/chat'

export const PUSH_TYPES = ['chat', 'admin_inquiry', 'join_approve'] as const
export type PushType = (typeof PUSH_TYPES)[number]
export type FcmDataPayload = Record<string, string>

/**
 * functions/src/utils/fcm.ts → multicastMessage.data (chat)
 * FCM은 전부 string으로 오므로 parsePushPayload에서 number 등으로 변환한다.
 */
export type PushChatPayload = {
  pushType: 'chat'
  id: ChatMessage['id']
  chatId: ChatRoom['id']
  text: string
  type: ChatMessage['type'] | ''
  senderId: ChatMessage['senderId']
  senderName: string
  senderPicURL?: string
  imageUrl?: string
  createdAt?: ChatMessage['createdAt']
  chatType: ChatRoom['type']
  roomName?: ChatRoom['name']
  roomImage?: ChatRoom['image']
  lastSeq?: ChatRoom['lastSeq']
}

export interface PushAdminInquiryPayload {
  pushType: 'admin_inquiry'
  inquiryId: string
}

export interface PushJoinApprovePayload {
  pushType: 'join_approve'
}

export type PushPayload =
  | PushChatPayload
  | PushAdminInquiryPayload
  | PushJoinApprovePayload
