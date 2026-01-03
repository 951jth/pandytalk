import {messageRemote} from '@app/features/chat/data/messageRemote.firebase' // 경로 맞춰
import type {User} from '@app/shared/types/auth'
import type {ChatMessage} from '@app/shared/types/chat'
// 또는 messageRemote가 이미 import 가능한 위치면 그걸 사용

type InputMessageParams = {
  text: string
  type: ChatMessage['type']
  imageUrl?: string
}

type SetChatMessagePayload = {
  roomId: string
  message: InputMessageParams
  user: User
  // ✅ 재전송/멱등 위해 외부에서 id를 넣고 싶으면 옵션으로 받기
  messageId?: string
  createdAt?: number
}

export const setChatMessagePayload = ({
  roomId,
  message,
  user,
  messageId,
  createdAt,
}: SetChatMessagePayload): ChatMessage | null => {
  if (!roomId || !user?.uid || !message) return null

  const trimmed = (message.text ?? '').trim()

  if (message.type === 'text' && !trimmed) return null
  if (message.type === 'image' && !message.imageUrl) return null

  const id = messageId ?? messageRemote.generateMessageId(roomId)

  return {
    ...message,
    id,
    text: message.type === 'text' ? trimmed : message.text,
    senderId: user.uid,
    senderName: user.displayName ?? '',
    senderPicURL: user.photoURL ?? '',
    createdAt: createdAt ?? Date.now(),
  }
}
