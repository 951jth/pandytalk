import {AI_RESPONSE_EXPIRATION_MS} from '@app/shared/constants/ai'
import type {ChatMessage} from '@app/shared/types/chat'
import {toMillisFromServerTime} from '@app/shared/utils/firebase'

export const AI_RESPONSE_EXPIRATION_GRACE_MS = 5_000

/** 명시적 만료 시각을 우선 사용하고, 이전 메시지는 생성 시각 + 90초로 보정합니다. */
export const getAiResponseExpirationTime = (message?: ChatMessage) => {
  const explicitExpiration = toMillisFromServerTime(
    message?.aiResponseExpiresAt,
  )
  if (explicitExpiration != null) return explicitExpiration

  const createdAt = toMillisFromServerTime(message?.createdAt)
  return createdAt == null ? null : createdAt + AI_RESPONSE_EXPIRATION_MS
}

/** 서버 상태를 변경하지 않고 클라이언트 재검증이 필요한 시점인지만 판단합니다. */
export const isAiResponseExpired = (
  message?: ChatMessage,
  now: number = Date.now(),
) => {
  if (message?.status !== 'streaming') return false

  const expirationTime = getAiResponseExpirationTime(message)
  return (
    expirationTime != null &&
    now >= expirationTime + AI_RESPONSE_EXPIRATION_GRACE_MS
  )
}

/** 늦게 도착한 응답이 이미 확정된 메시지 상태를 역행시키지 않도록 병합합니다. */
export const resolveAiMessageUpdate = (
  current: ChatMessage | null | undefined,
  incoming: ChatMessage,
) => {
  if (!current) return incoming

  const isCurrentTerminal =
    current.status === 'success' || current.status === 'failed'
  if (isCurrentTerminal && incoming.status === 'streaming') return current
  if (current.status === 'success' && incoming.status === 'failed') {
    return current
  }

  return incoming
}
