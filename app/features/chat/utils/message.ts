import {messageRemote} from '@app/features/chat/data/messageRemote.firebase' // 경로 맞춰
import type {InputMessageParams} from '@app/features/chat/hooks/useChatMessageInput'
import type {User} from '@app/shared/types/auth'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'

type SetChatMessagePayload = {
  roomInfo: ChatRoom
  message: InputMessageParams
  user: User
}

export const MESSAGE_POLICY = {
  MAX_LENGTH: 5000,
  TRIM: true,
}

//채팅방의 메세지 페이로드 생성 유틸
export const setChatMessagePayload = ({
  roomInfo,
  user,
  message,
}: SetChatMessagePayload): ChatMessage | null => {
  const roomId = roomInfo?.id
  if (!roomId || !user?.uid || !message) return null

  let text = message.text ?? ''

  if (MESSAGE_POLICY.TRIM) {
    text = text.trim()
  }

  if (message.type === 'text') {
    if (!text) {
      throw new Error('내용을 입력해주세요.')
    }
    if (text.length > MESSAGE_POLICY.MAX_LENGTH) {
      throw new Error(
        `메시지는 최대 ${MESSAGE_POLICY.MAX_LENGTH}자까지 입력 가능합니다.`,
      )
    }
  }

  // 이미지 타입 검증: imageUrl 또는 imageUrls 중 하나는 있어야 함
  if (
    message.type === 'image' &&
    !message.imageUrl &&
    (!message.imageUrls || message.imageUrls.length === 0)
  ) {
    throw new Error('이미지를 선택해주세요.')
  }

  const id = messageRemote.generateMessageId(roomId)
  const createdAt = Date.now()

  const payload: ChatMessage = {
    ...message,
    id,
    text: message.type === 'text' ? text : message.text,
    senderId: user.uid,
    senderName: user.displayName ?? '',
    senderPicURL: user.photoURL ?? '',
    createdAt,
    roomTitle: roomInfo?.name,
    roomUrl: roomInfo?.image,
    imageUrls: message.imageUrls || [],
  }

  return payload
}

export const normalize = (s: string) => s.trim().toLowerCase()

// 락 안에서 실행될 작업의 형태
type AnyFn<T> = () => Promise<T>

// 동일한 lock 인스턴스에 등록된 비동기 작업을 등록 순서대로 실행
class AsyncQueueLock {
  // 처음엔 아무 작업도 없으니까 Promise.resolve()
  private tail: Promise<void> = Promise.resolve()
  // 이전 작업의 정산 이후 현재 작업을 실행하도록 tail에 연결
  runExclusive<T>(fn: AnyFn<T>): Promise<T> {
    const run = async () => fn()
    // 핵심2: 이전 작업의 실패와 성공에 상관없이 다음 함수를 run
    const next = this.tail.then(run, run)

    this.tail = next.then(
      () => undefined,
      () => undefined,
    )

    return next
  }
}

//Promise 요청이 끝난 뒤에 로직을 실행.
export const sqliteLock = new AsyncQueueLock()
