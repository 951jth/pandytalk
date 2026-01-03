import {
  formatServerDate,
  toMillisFromServerTime,
} from '@app/shared/utils/firebase'
import type {ChatListItem, ChatMessage} from '../types/chat'

export const isSameSender = (
  prev: ChatMessage | null,
  current: ChatMessage,
): boolean => {
  if (!prev) return false
  return prev?.senderId === current?.senderId
}

//이전채팅과 현재채팅의 시간비교
export const isSameMinute = (
  prev: ChatMessage | null,
  current: ChatMessage | null,
): boolean => {
  const pm = toMillisFromServerTime(prev?.createdAt)
  const cm = toMillisFromServerTime(current?.createdAt)
  if (pm == null || cm == null) return false

  // 서버는 UTC로 타임스탬프를 확정하므로 UTC 컴포넌트로 비교
  const p = new Date(pm)
  const c = new Date(cm)

  return (
    p.getUTCFullYear() === c.getUTCFullYear() &&
    p.getUTCMonth() === c.getUTCMonth() &&
    p.getUTCDate() === c.getUTCDate() &&
    p.getUTCHours() === c.getUTCHours() &&
    p.getUTCMinutes() === c.getUTCMinutes()
  )
}

//이전 채팅과 현재채팅의 날짜 비교 함수
export const isSameDate = (
  prev: ChatMessage | null,
  current: ChatMessage | null,
) => {
  if (!prev || !prev?.createdAt || !current?.createdAt) return false
  const prevDate = formatServerDate(prev.createdAt, 'YYYY-MM-DD')
  const currentDate = formatServerDate(current.createdAt, 'YYYY-MM-DD')
  // const prevDate = dayjs(prev.createdAt).format('YYYY-MM-DD')
  // const currentDate = dayjs(current.createdAt).format('YYYY-MM-DD')

  return prevDate === currentDate
}

//메세지 중복 제거 및 병합
export function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const map = new Map<string, ChatMessage>()
  ;[...existing, ...incoming].forEach(msg => map.set(msg.id, msg))
  return Array.from(map.values()).sort(
    (a, b) =>
      (toMillisFromServerTime(b.createdAt) || 0) -
      (toMillisFromServerTime(a.createdAt) || 0),
  ) // 최신순 정렬
}
//체팅 날짜순 정렬
export const compareChat = (a: ChatListItem, b: ChatListItem) => {
  const aLast = toMillisFromServerTime(a.lastMessage?.createdAt) ?? 0
  const bLast = toMillisFromServerTime(b.lastMessage?.createdAt) ?? 0
  if (aLast !== bLast) return bLast - aLast // desc
  const aCreated = toMillisFromServerTime(a.createdAt) ?? 0
  const bCreated = toMillisFromServerTime(b.createdAt) ?? 0
  return bCreated - aCreated // desc
}

export const getUnreadCount = (data: ChatListItem, userId: string) => {
  const lastSeq: number = data?.lastSeq ?? 0
  const myReadSeq: number = data?.lastReadSeqs?.[userId] ?? 0
  const unreadCount = Math.max(0, lastSeq - myReadSeq)
  return unreadCount
}

export const getDMChatId = (userId?: string, targetId?: string): string => {
  const sortedIds = [userId, targetId].filter(Boolean).sort()
  const roomId = `${sortedIds[0]}_${sortedIds[1]}`
  return roomId
}
