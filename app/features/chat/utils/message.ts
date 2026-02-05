import {messageRemote} from '@app/features/chat/data/messageRemote.firebase' // 경로 맞춰
import type {InputMessageParams} from '@app/features/chat/hooks/useChatMessageInput'
import type {User} from '@app/shared/types/auth'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {InfiniteData} from '@tanstack/react-query'

type SetChatMessagePayload = {
  roomInfo: ChatRoom
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
  roomInfo,
  user,
  message,
}: SetChatMessagePayload): ChatMessage | null => {
  const roomId = roomInfo?.id
  if (!roomId || !user?.uid || !message) return null
  const trimmed = (message.text ?? '').trim()

  if (message.type === 'text' && !trimmed)
    throw new Error('내용을 입력해주세요.')
  if (message.type === 'image' && !message.imageUrl)
    throw new Error('이미지를 선택해주세요.')

  const id = messageRemote.generateMessageId(roomId)
  return {
    ...message,
    id,
    text: message.type === 'text' ? trimmed : message.text,
    senderId: user.uid,
    senderName: user.displayName ?? '',
    senderPicURL: user.photoURL ?? '',
    createdAt: Date.now(), //서버타임으로 대체되지만, 로컬에 먼저표시용
    roomTitle: roomInfo?.name,
    roomUrl: roomInfo?.image,
  }
}

//채팅 메세지 캐시 페이징 재처리
export const rebuildMessagePages = (
  flat: ChatMessage[],
  old: InfiniteData<pageType>, //기존 서버에서 받아왔던 페이지 lastVisible을 유지
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

export const normalize = (s: string) => s.trim().toLowerCase()

// 락 안에서 실행될 작업의 형태
type AnyFn<T> = () => Promise<T>

// runExclusive(fn)으로 넘긴 비동기 작업들을 절대 동시에 실행하지 않고,
// 앞 작업이 끝난 뒤에만 실행되게 보장
class AsyncQueueLock {
  // 처음엔 아무 작업도 없으니까 Promise.resolve()
  private tail: Promise<void> = Promise.resolve()
  // 핵심: promise를 항상 단독으로 실행되게 하는 옵션
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
