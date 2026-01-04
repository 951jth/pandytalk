import {messageRemote} from '@app/features/chat/data/messageRemote.firebase' // 경로 맞춰
import type {InputMessageParams} from '@app/features/chat/hooks/useChatInput'
import type {User} from '@app/shared/types/auth'
import type {ChatMessage} from '@app/shared/types/chat'
// 또는 messageRemote가 이미 import 가능한 위치면 그걸 사용

type SetChatMessagePayload = {
  roomId: string
  message: InputMessageParams
  user: User
}
//채팅방의 메세지 페이로드 생성 유틸
export const setChatMessagePayload = ({
  roomId,
  user,
  message,
}: SetChatMessagePayload): ChatMessage | null => {
  if (!roomId || !user?.uid || !message) return null

  const trimmed = (message.text ?? '').trim()

  if (message.type === 'text' && !trimmed) return null
  if (message.type === 'image' && !message.imageUrl) return null

  const id = messageRemote.generateMessageId(roomId)

  return {
    ...message,
    id,
    text: message.type === 'text' ? trimmed : message.text,
    senderId: user.uid,
    senderName: user.displayName ?? '',
    senderPicURL: user.photoURL ?? '',
    seq: message.seq,
    createdAt: Date.now(),
  }
}
