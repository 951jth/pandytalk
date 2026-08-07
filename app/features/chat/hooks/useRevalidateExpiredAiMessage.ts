import {
  AI_RESPONSE_EXPIRATION_GRACE_MS,
  getAiResponseExpirationTime,
  isAiResponseExpired,
  resolveAiMessageUpdate,
} from '@app/features/chat/policies/aiResponseExpirationPolicy'
import type {AiMessageRevalidationStatus} from '@app/features/chat/policies/aiResponseDisplayPolicy'
import {messageService} from '@app/features/chat/service/messageService'
import type {ReactQueryPageType} from '@app/features/chat/types/react-query'
import {updateInfiniteQueryItems} from '@app/features/chat/utils/infiniteQuery'
import type {ChatMessage} from '@app/shared/types/chat'
import {
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {useEffect, useState} from 'react'
import {AppState} from 'react-native'

type MessagesInfiniteData = InfiniteData<ReactQueryPageType<ChatMessage>>

const REVALIDATION_COOLDOWN_MS = 30_000
const MAX_RECENT_REVALIDATIONS = 100

const inFlightRevalidations = new Map<
  string,
  Promise<ChatMessage | null>
>()
const recentRevalidations = new Map<
  string,
  {checkedAt: number; message: ChatMessage | null}
>()

/** 동일 훅이 재마운트되어도 같은 메시지의 서버 조회를 중복 실행하지 않습니다. */
const revalidateAiMessage = (roomId: string, messageId: string) => {
  const key = `${roomId}:${messageId}`
  const now = Date.now()
  const recent = recentRevalidations.get(key)

  if (recent && now - recent.checkedAt < REVALIDATION_COOLDOWN_MS) {
    return Promise.resolve(recent.message)
  }

  const inFlight = inFlightRevalidations.get(key)
  if (inFlight) return inFlight

  const request = messageService
    .refreshChatMessage(roomId, messageId)
    .then(message => {
      recentRevalidations.set(key, {checkedAt: Date.now(), message})
      if (recentRevalidations.size > MAX_RECENT_REVALIDATIONS) {
        const oldestKey = recentRevalidations.keys().next().value
        if (oldestKey) recentRevalidations.delete(oldestKey)
      }
      return message
    })
    .finally(() => {
      inFlightRevalidations.delete(key)
    })

  inFlightRevalidations.set(key, request)
  return request
}

/**
 * AI 메시지 만료 타이머와 앱 활성화 시점의 서버 재검증을 React 생명주기에 연결합니다.
 */
export const useRevalidateExpiredAiMessage = (
  chatId?: string,
  item?: ChatMessage,
) => {
  const queryClient = useQueryClient()
  const [, setExpirationRevision] = useState(0)
  const [status, setStatus] =
    useState<AiMessageRevalidationStatus>('idle')
  const [refreshedMessage, setRefreshedMessage] =
    useState<ChatMessage | null>(null)

  const expirationTime = getAiResponseExpirationTime(item)
  const isExpired = isAiResponseExpired(item)

  // 백그라운드에서 타이머가 지연될 수 있으므로 active 복귀 시에도 다시 계산합니다.
  useEffect(() => {
    if (
      item?.status !== 'streaming' ||
      expirationTime == null ||
      isExpired
    ) {
      return
    }

    const refreshExpiration = () => {
      setExpirationRevision(revision => revision + 1)
    }
    const remaining =
      expirationTime + AI_RESPONSE_EXPIRATION_GRACE_MS - Date.now()
    const timeout =
      remaining > 0 ? setTimeout(refreshExpiration, remaining) : null
    const appStateSubscription = AppState.addEventListener(
      'change',
      nextState => {
        if (nextState === 'active') refreshExpiration()
      },
    )

    return () => {
      if (timeout != null) clearTimeout(timeout)
      appStateSubscription.remove()
    }
  }, [expirationTime, isExpired, item?.id, item?.status])

  // 만료된 메시지만 단건 재검증하고 화면 캐시에 병합합니다.
  useEffect(() => {
    const messageId = item?.id
    if (!chatId || !messageId || !isExpired) {
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('checking')

    void revalidateAiMessage(chatId, messageId)
      .then(refreshed => {
        if (cancelled) return
        if (!refreshed) {
          setStatus('missing')
          return
        }

        const cachedData =
          queryClient.getQueryData<MessagesInfiniteData>([
            'chatMessages',
            chatId,
          ])
        const cachedMessage = cachedData?.pages
          .flatMap(page => page.data)
          .find(message => message.id === messageId)
        const resolvedMessage = resolveAiMessageUpdate(
          cachedMessage ?? item,
          refreshed,
        )

        setRefreshedMessage(resolvedMessage)
        queryClient.setQueryData<MessagesInfiniteData>(
          ['chatMessages', chatId],
          data =>
            updateInfiniteQueryItems(data, current =>
              current.id === resolvedMessage.id
                ? resolveAiMessageUpdate(current, resolvedMessage)
                : current,
            ),
        )
        queryClient.setQueryData<ChatMessage>(
          ['chatMessage', chatId, messageId],
          current => resolveAiMessageUpdate(current, resolvedMessage),
        )
        setStatus(resolvedMessage.status === 'streaming' ? 'delayed' : 'idle')
      })
      .catch(error => {
        if (cancelled) return
        console.warn('[AI] expired message revalidation failed', {
          chatId,
          messageId,
          error,
        })
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [chatId, isExpired, item?.id, queryClient])

  const applicableRefreshedMessage =
    refreshedMessage?.id === item?.id ? refreshedMessage : null

  return {
    isExpired,
    status,
    refreshedMessage: applicableRefreshedMessage,
  }
}
