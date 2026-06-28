// 푸시 메세지 타입 변환 함수
// export function parsePushMessage(data: {[key: string]: string}): PushMessage {
//   return {
//     id: data.chatId,
//     chatId: data.chatId,
//     pushType: data.pushType,
//     senderId: data.senderId,
//     text: data.text,
//     type: data.type as 'text' | 'image' | 'file',
//     imageUrl: data.imageUrl || '',
//     senderName: data.senderName || '',
//     senderPicURL: data.senderPicURL || '',
//     createdAt: data.createdAt as ServerTime,
//   }
// }

// export const formatChatTime = (
//   timestamp: number | null | undefined,
// ): string => {
//   if (!timestamp) return ''
//   const hour = dayjs(timestamp).format('h:mm')
//   const period = dayjs(timestamp).hour() < 12 ? '오전' : '오후'
//   return `${period}:${hour}`
// }

type NonEmptyRecord<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends null | undefined ? never : K]: T[K]
}

export function removeEmpty<T extends Record<string, unknown>>(
  obj: T,
): NonEmptyRecord<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value !== null && value !== undefined,
    ),
  ) as unknown as NonEmptyRecord<T>
}

export const toStr = (v: unknown) => (v == null ? '' : String(v))
