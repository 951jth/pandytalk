import AiStreamingText from '@app/features/chat/components/AiStreamingText'
import {useAiStreamResponse} from '@app/features/chat/hooks/useAiStreamResponse'
import {useRevalidateExpiredAiMessage} from '@app/features/chat/hooks/useRevalidateExpiredAiMessage'
import type {ChatMessage} from '@app/shared/types/chat'
import {render} from '@testing-library/react-native'
import React from 'react'

jest.mock('@app/shared/firebase/firestore', () => ({
  auth: {currentUser: {uid: 'user-1'}},
}))
jest.mock('@app/features/chat/hooks/useAiStreamResponse')
jest.mock('@app/features/chat/hooks/useRevalidateExpiredAiMessage')
jest.mock('@app/shared/ui/text/CopyableText', () => () => null)

const message: ChatMessage = {
  id: 'ai-message',
  senderId: 'pandytalk_ai_bot',
  mentionerId: 'user-1',
  text: '팬디봇이 답변을 생성 중입니다...',
  type: 'ai_text',
  status: 'streaming',
  createdAt: 1_700_000_000_000,
}

describe('AiStreamingText SSE 활성화 조건', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAiStreamResponse as jest.Mock).mockReturnValue({
      streamedText: '',
      error: null,
    })
  })

  it('질문자의 미만료 streaming 메시지는 SSE를 시작한다', () => {
    (useRevalidateExpiredAiMessage as jest.Mock).mockReturnValue({
      isExpired: false,
      status: 'idle',
      refreshedMessage: null,
    })

    render(<AiStreamingText chatId="room-1" item={message} />)

    expect(useAiStreamResponse).toHaveBeenCalledWith(
      expect.objectContaining({enabled: true}),
    )
  })

  it('만료된 streaming 메시지는 질문자여도 SSE를 시작하지 않는다', () => {
    (useRevalidateExpiredAiMessage as jest.Mock).mockReturnValue({
      isExpired: true,
      status: 'checking',
      refreshedMessage: null,
    })

    render(<AiStreamingText chatId="room-1" item={message} />)

    expect(useAiStreamResponse).toHaveBeenCalledWith(
      expect.objectContaining({enabled: false}),
    )
  })

  it('다른 사용자의 streaming 메시지는 SSE를 시작하지 않는다', () => {
    (useRevalidateExpiredAiMessage as jest.Mock).mockReturnValue({
      isExpired: false,
      status: 'idle',
      refreshedMessage: null,
    })

    render(
      <AiStreamingText
        chatId="room-1"
        item={{...message, mentionerId: 'user-2'}}
      />,
    )

    expect(useAiStreamResponse).toHaveBeenCalledWith(
      expect.objectContaining({enabled: false}),
    )
  })
})
