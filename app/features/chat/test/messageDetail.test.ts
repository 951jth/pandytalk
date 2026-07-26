import {
  CHAT_MESSAGE_DETAIL_POLICY,
  getChatMessageTextLength,
  shouldOpenMessageDetail,
} from '@app/features/chat/utils/messageDetail'
import type {ChatMessage} from '@app/shared/types/chat'

const createMessage = (
  overrides: Partial<ChatMessage> = {},
): ChatMessage => ({
  id: 'message-1',
  senderId: 'user-1',
  type: 'text',
  text: '',
  createdAt: 1,
  status: 'success',
  ...overrides,
})

describe('messageDetail', () => {
  const minLength = CHAT_MESSAGE_DETAIL_POLICY.MIN_TEXT_LENGTH

  it('최소 길이보다 짧은 텍스트는 상세 대상으로 판단하지 않는다', () => {
    const message = createMessage({text: '가'.repeat(minLength - 1)})

    expect(shouldOpenMessageDetail(message)).toBe(false)
  })

  it('최소 길이와 같은 텍스트는 상세 대상으로 판단한다', () => {
    const message = createMessage({text: '가'.repeat(minLength)})

    expect(shouldOpenMessageDetail(message)).toBe(true)
  })

  it('앞뒤 공백을 제외하고 텍스트 길이를 계산한다', () => {
    expect(getChatMessageTextLength(`  ${'가'.repeat(minLength)}  `)).toBe(
      minLength,
    )
  })

  it('이모지를 사용자에게 보이는 코드 포인트 단위로 계산한다', () => {
    expect(getChatMessageTextLength('😀')).toBe(1)
  })

  it('스트리밍 중인 AI 메시지는 상세 대상으로 판단하지 않는다', () => {
    const message = createMessage({
      type: 'ai_text',
      text: '가'.repeat(minLength),
      status: 'streaming',
    })

    expect(shouldOpenMessageDetail(message)).toBe(false)
  })

  it('완료된 AI 메시지는 텍스트 길이에 따라 상세 대상으로 판단한다', () => {
    const message = createMessage({
      type: 'ai_text',
      text: '가'.repeat(minLength),
    })

    expect(shouldOpenMessageDetail(message)).toBe(true)
  })

  it('이미지 메시지는 캡션이 길어도 상세 대상으로 판단하지 않는다', () => {
    const message = createMessage({
      type: 'image',
      text: '가'.repeat(minLength),
      imageUrl: 'https://example.com/image.jpg',
    })

    expect(shouldOpenMessageDetail(message)).toBe(false)
  })
})
