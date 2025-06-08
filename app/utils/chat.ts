import {ChatMessage} from '../types/firebase'

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
  if (!prev || !prev?.createdAt || !current?.createdAt) return false

  const prevDate = new Date(Number(prev.createdAt))
  const currentDate = new Date(Number(current.createdAt))

  return (
    prevDate.getFullYear() === currentDate.getFullYear() &&
    prevDate.getMonth() === currentDate.getMonth() &&
    prevDate.getDate() === currentDate.getDate() &&
    prevDate.getHours() === currentDate.getHours() &&
    prevDate.getMinutes() === currentDate.getMinutes()
  )
}
