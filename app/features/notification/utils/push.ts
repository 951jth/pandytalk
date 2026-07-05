import type {
  InitialChatInfo,
  InitialDmChatInfo,
  InitialGroupChatInfo,
} from '@app/navigation/types'
import {
  PUSH_TYPES,
  type FcmDataPayload,
  type PushChatPayload,
  type PushPayload,
  type PushType,
} from '@app/features/notification/types/push'
import {
  type ChatMessage,
  type ChatRoom,
} from '@app/shared/types/chat'

const CHAT_MESSAGE_TYPES: readonly ChatMessage['type'][] = [
  'text',
  'image',
  'file',
  'ai_text',
]
const CHAT_ROOM_TYPES: readonly ChatRoom['type'][] = ['dm', 'group', 'ai']

function normalizePushType(raw: string): PushType | null {
  return PUSH_TYPES.includes(raw as PushType) ? (raw as PushType) : null
}

function parseChatRoomType(raw?: string): ChatRoom['type'] {
  if (CHAT_ROOM_TYPES.includes(raw as ChatRoom['type'])) {
    return raw as ChatRoom['type']
  }
  return 'dm'
}

function parseChatMessageType(raw?: string): ChatMessage['type'] | '' {
  if (!raw) return ''
  return CHAT_MESSAGE_TYPES.includes(raw as ChatMessage['type'])
    ? (raw as ChatMessage['type'])
    : ''
}

/** RemoteMessage.data 타입(string | object)을 parsePushPayload 입력(FcmDataPayload)에 맞추기 위한 변환. 런타임에선 FCM data가 보통 string만 옴. */
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

/** FCM data를 pushType별 도메인 payload로 파싱합니다. */
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

/** 채팅 푸시 payload를 navigateToChat용 InitialChatInfo로 변환합니다. */
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
