import dayjs from 'dayjs'
import type {PushMessage} from '../types/chat'

// 푸시 메세지 타입 변환 함수
export function parsePushMessage(data: {[key: string]: string}): PushMessage {
  return {
    id: data.chatId,
    chatId: data.chatId,
    pushType: data.pushType,
    senderId: data.senderId,
    text: data.text,
    type: data.type as 'text' | 'image' | 'file',
    imageUrl: data.imageUrl || '',
    senderName: data.senderName || '',
    senderPicURL: data.senderPicURL || '',
    createdAt: Number(data.createdAt),
  }
}

export const formatChatTime = (
  timestamp: number | null | undefined,
): string => {
  if (!timestamp) return ''
  const hour = dayjs(timestamp).format('h:mm')
  const period = dayjs(timestamp).hour() < 12 ? '오전' : '오후'
  return `${period}:${hour}`
}

export function removeEmpty<T extends Record<string, any>>(
  obj: T,
): {
  [K in keyof T as T[K] extends null | undefined ? never : K]: T[K]
} {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value !== null && value !== undefined,
    ),
  ) as any
}

export const toStr = (v: any) => (v == null ? '' : String(v))
