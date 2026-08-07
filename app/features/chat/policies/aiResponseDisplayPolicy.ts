import type {ChatMessage} from '@app/shared/types/chat'

export type AiMessageRevalidationStatus =
  | 'idle'
  | 'checking'
  | 'delayed'
  | 'missing'
  | 'error'

type AiResponseDisplayParams = {
  message?: ChatMessage
  streamedText: string
  streamError: unknown
  isExpired: boolean
  revalidationStatus: AiMessageRevalidationStatus
}

const EXPIRED_STATUS_TEXT: Partial<
  Record<AiMessageRevalidationStatus, string>
> = {
  checking: 'AI 응답 상태를 확인하고 있습니다...',
  delayed: 'AI 응답 처리가 지연되고 있습니다.',
  missing: 'AI 응답을 확인할 수 없습니다.',
  error: 'AI 응답 상태를 확인하지 못했습니다.',
}

/**
 * AI 메시지의 통신/재검증 상태를 사용자에게 보여줄 문구로 변환합니다.
 * 렌더링과 분리된 순수 함수이므로 상태별 문구를 독립적으로 테스트할 수 있습니다.
 */
export const getAiResponseDisplayText = ({
  message,
  streamedText,
  streamError,
  isExpired,
  revalidationStatus,
}: AiResponseDisplayParams) => {
  if (message?.status !== 'streaming') return message?.text || ''

  if (isExpired) {
    const expiredStatusText = EXPIRED_STATUS_TEXT[revalidationStatus]
    if (expiredStatusText) return expiredStatusText
  }

  if (streamError) return '응답 생성에 실패했습니다.'
  return streamedText || '팬디봇이 답변을 생성 중입니다...'
}
