import {messageRemote} from '@app/features/chat/data/messageRemote.firebase' // 경로 맞춰
import type {InputMessageParams} from '@app/features/chat/hooks/useChatMessageInput'
import type {User} from '@app/shared/types/auth'
import type {ChatMessage} from '@app/shared/types/chat'
import {InfiniteData} from '@tanstack/react-query'
// 또는 messageRemote가 이미 import 가능한 위치면 그걸 사용

type SetChatMessagePayload = {
  roomId: string
  message: InputMessageParams
  user: User
}

type pageType = {
  data: ChatMessage[]
  lastVisible: unknown | null
  isLastPage: boolean
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
    createdAt: Date.now(),
  }
}

//채팅 메세지 캐시 페이징 재처리
export const rebuildMessagePages = (
  flat: ChatMessage[],
  old: InfiniteData<pageType>,
  pageSize: number,
): InfiniteData<pageType> => {
  const newPages: pageType[] = []
  for (let i = 0; i < flat.length; i += pageSize) {
    const slice = flat.slice(i, i + pageSize)
    newPages.push({
      data: slice,
      lastVisible:
        old.pages[Math.min(newPages.length, old.pages.length - 1)]
          ?.lastVisible ?? null,
      isLastPage: i + pageSize >= flat.length,
    })
  }
  return {...old, pages: newPages.length ? newPages : old.pages}
}
