import dayjs from 'dayjs'

export const formatChatTime = (timestamp: number): string => {
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
