import dayjs from 'dayjs'

export const formatChatTime = (timestamp: number): string => {
  const hour = dayjs(timestamp).format('h:mm')
  const period = dayjs(timestamp).hour() < 12 ? '오전' : '오후'
  return `${period}:${hour}`
}
