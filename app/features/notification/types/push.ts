import type {
  InitialChatInfo,
  InitialDmChatInfo,
  InitialGroupChatInfo,
} from '@app/navigation/types'
import {
  CHAT_MESSAGE_TYPES,
  CHAT_ROOM_TYPES,
  type ChatMessage,
  type ChatMessageType,
  type ChatRoom,
  type ChatRoomType,
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
  type: ChatMessageType | ''
  senderId: ChatMessage['senderId']
  senderName: string
  senderPicURL?: string
  imageUrl?: string
  createdAt?: ChatMessage['createdAt']
  chatType: ChatRoomType
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

function normalizePushType(raw: string): PushType | null {
  return PUSH_TYPES.includes(raw as PushType) ? (raw as PushType) : null
}

function parseChatRoomType(raw?: string): ChatRoomType {
  if (CHAT_ROOM_TYPES.includes(raw as ChatRoomType)) {
    return raw as ChatRoomType
  }
  return 'dm'
}

function parseChatMessageType(raw?: string): ChatMessageType | '' {
  if (!raw) return ''
  return CHAT_MESSAGE_TYPES.includes(raw as ChatMessageType)
    ? (raw as ChatMessageType)
    : ''
}

/** RemoteMessage.data 타입(string | object)을 
 * parsePushPayload 입력(FcmDataPayload)에 맞추기 위한 변환. 
 * 런타임에선 FCM data가 보통 string만 옴. */
export function toFcmDataPayload(
  data: Record<string, string | object> | undefined,
): FcmDataPayload | undefined {
  if (!data) return undefined

  const result: FcmDataPayload = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      result[key] = value
    }
  }
  return result
}

/**
 * FCM data를 pushType별 도메인 payload로 파싱합니다.
 */
export function parsePushPayload(
  data: FcmDataPayload | undefined,
): PushPayload | null {
  if (!data?.pushType) return null

  const pushType = normalizePushType(data.pushType)
  if (!pushType) return null

  switch (pushType) {
    case 'chat': {
      const chatId = data.chatId || data.roomId
      if (!chatId) return null

      return {
        pushType: 'chat',
        id: data.id ?? '',
        chatId,
        text: data.text ?? '',
        type: parseChatMessageType(data.type),
        senderId: data.senderId ?? '',
        senderName: data.senderName ?? '',
        senderPicURL: data.senderPicURL || undefined,
        imageUrl: data.imageUrl || undefined,
        createdAt: data.createdAt ? Number(data.createdAt) : undefined,
        chatType: parseChatRoomType(data.chatType),
        roomName: data.roomName || undefined,
        roomImage: data.roomImage || undefined,
        lastSeq: data.lastSeq ? Number(data.lastSeq) : undefined,
      }
    }
    case 'admin_inquiry':
      return {
        pushType: 'admin_inquiry',
        inquiryId: data.inquiryId ?? '',
      }
    case 'join_approve':
      return {pushType: 'join_approve'}
  }
}

/**
 * 채팅 푸시 payload를 navigateToChat용 InitialChatInfo로 변환합니다.
 */
export function toInitialChatInfo(payload: PushChatPayload): InitialChatInfo {
  if (payload.chatType === 'group') {
    const groupInfo: InitialGroupChatInfo = {
      id: payload.chatId,
      type: 'group',
      title: payload.roomName,
      image: payload.roomImage ?? null,
      lastSeq: payload.lastSeq,
    }
    return groupInfo
  }

  const dmInfo: InitialDmChatInfo = {
    id: payload.chatId,
    type: payload.chatType === 'ai' ? 'ai' : 'dm',
    targetId: payload.senderId,
    title: payload.senderName,
    image: payload.senderPicURL ?? null,
    lastSeq: payload.lastSeq,
  }
  return dmInfo
}
