import {getAiResponseDisplayText} from '@app/features/chat/policies/aiResponseDisplayPolicy'
import {
  getAiResponseExpirationTime,
  isAiResponseExpired,
  resolveAiMessageUpdate,
} from '@app/features/chat/policies/aiResponseExpirationPolicy'
import type {ChatMessage} from '@app/shared/types/chat'

const NOW = 1_700_000_000_000

const createAiMessage = (
  overrides: Partial<ChatMessage> = {},
): ChatMessage => ({
  id: 'ai-message',
  senderId: 'pandytalk_ai_bot',
  mentionerId: 'user-1',
  text: '팬디봇이 답변을 생성 중입니다...',
  type: 'ai_text',
  status: 'streaming',
  createdAt: NOW,
  ...overrides,
})

describe('AI 응답 만료 정책', () => {
  it('명시적 만료 시각을 생성 시각 기반 fallback보다 우선한다', () => {
    const message = createAiMessage({aiResponseExpiresAt: NOW + 10_000})

    expect(getAiResponseExpirationTime(message)).toBe(NOW + 10_000)
  })

  it('만료 필드가 없는 이전 메시지는 createdAt + 90초를 사용한다', () => {
    const message = createAiMessage()

    expect(getAiResponseExpirationTime(message)).toBe(NOW + 90_000)
  })

  it('만료 시각 이후 5초 grace가 지난 시점부터 만료 처리한다', () => {
    const message = createAiMessage({aiResponseExpiresAt: NOW + 10_000})

    expect(isAiResponseExpired(message, NOW + 14_999)).toBe(false)
    expect(isAiResponseExpired(message, NOW + 15_000)).toBe(true)
  })

  it('terminal 메시지는 시간이 지나도 재검증 대상으로 만들지 않는다', () => {
    const message = createAiMessage({
      status: 'success',
      aiResponseExpiresAt: NOW - 10_000,
    })

    expect(isAiResponseExpired(message, NOW)).toBe(false)
  })

  it('success 상태가 늦게 도착한 streaming 또는 failed로 역행하지 않는다', () => {
    const success = createAiMessage({status: 'success', text: '완료'})
    const streaming = createAiMessage({status: 'streaming'})
    const failed = createAiMessage({status: 'failed'})

    expect(resolveAiMessageUpdate(success, streaming)).toBe(success)
    expect(resolveAiMessageUpdate(success, failed)).toBe(success)
  })
})

describe('AI 응답 표시 정책', () => {
  const streamingMessage = createAiMessage()

  it.each([
    ['checking', 'AI 응답 상태를 확인하고 있습니다...'],
    ['delayed', 'AI 응답 처리가 지연되고 있습니다.'],
    ['missing', 'AI 응답을 확인할 수 없습니다.'],
    ['error', 'AI 응답 상태를 확인하지 못했습니다.'],
  ] as const)('만료 재검증 상태 %s의 문구를 반환한다', (status, expected) => {
    expect(
      getAiResponseDisplayText({
        message: streamingMessage,
        streamedText: '',
        streamError: null,
        isExpired: true,
        revalidationStatus: status,
      }),
    ).toBe(expected)
  })

  it('terminal 메시지는 저장된 본문을 반환한다', () => {
    expect(
      getAiResponseDisplayText({
        message: createAiMessage({status: 'success', text: '최종 답변'}),
        streamedText: '임시 답변',
        streamError: null,
        isExpired: false,
        revalidationStatus: 'idle',
      }),
    ).toBe('최종 답변')
  })
})
