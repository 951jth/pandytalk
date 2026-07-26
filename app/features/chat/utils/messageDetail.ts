import type {ChatMessage} from '@app/shared/types/chat'

export const CHAT_MESSAGE_DETAIL_POLICY = {
  MIN_TEXT_LENGTH: 500,
  PREVIEW_LINES: 6,
} as const

export const getChatMessageTextLength = (text?: string) => {
  return Array.from(text?.trim() ?? '').length
}

export const shouldOpenMessageDetail = (message: ChatMessage) => {
  if (message.type !== 'text' && message.type !== 'ai_text') return false
  if (message.status === 'streaming') return false

  return (
    getChatMessageTextLength(message.text) >=
    CHAT_MESSAGE_DETAIL_POLICY.MIN_TEXT_LENGTH
  )
}
