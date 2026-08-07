import {useRevalidateExpiredAiMessage} from '@app/features/chat/hooks/useRevalidateExpiredAiMessage'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import {useQueryClient} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

jest.mock('@app/features/chat/service/messageService')
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(),
}))

const NOW = 1_700_000_000_000

const createExpiredMessage = (id: string): ChatMessage => ({
  id,
  senderId: 'pandytalk_ai_bot',
  mentionerId: 'user-1',
  text: '팬디봇이 답변을 생성 중입니다...',
  type: 'ai_text',
  status: 'streaming',
  createdAt: NOW - 100_000,
  aiResponseExpiresAt: NOW - 6_000,
  seq: 10,
})

describe('useRevalidateExpiredAiMessage', () => {
  let listCache: {
    pages: Array<{
      data: ChatMessage[]
      lastVisible: unknown | null
      isLastPage: boolean
    }>
    pageParams: unknown[]
  }
  const queryClient = {
    getQueryData: jest.fn(() => listCache),
    setQueryData: jest.fn((key: unknown[], updater: unknown) => {
      if (key[0] !== 'chatMessages') return
      listCache =
        typeof updater === 'function'
          ? updater(listCache)
          : (updater as typeof listCache)
    }),
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(NOW)
    jest.clearAllMocks()
    listCache = {pages: [], pageParams: []}
    ;(useQueryClient as jest.Mock).mockReturnValue(queryClient)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('만료 전에는 서버 단건 조회를 실행하지 않는다', () => {
    const message: ChatMessage = {
      ...createExpiredMessage('fresh-message'),
      aiResponseExpiresAt: NOW + 10_000,
    }

    renderHook(() => useRevalidateExpiredAiMessage('room-1', message))

    expect(messageService.refreshChatMessage).not.toHaveBeenCalled()
  })

  it('마운트 시 이미 만료된 메시지를 즉시 재조회한다', async () => {
    const message = createExpiredMessage('expired-success')
    const success = {...message, status: 'success' as const, text: '최종 답변'}
    listCache.pages = [
      {data: [message], lastVisible: message.seq, isLastPage: true},
    ]
    ;(messageService.refreshChatMessage as jest.Mock).mockResolvedValue(success)

    const {result} = renderHook(() =>
      useRevalidateExpiredAiMessage('room-1', message),
    )

    await waitFor(() => {
      expect(messageService.refreshChatMessage).toHaveBeenCalledWith(
        'room-1',
        message.id,
      )
      expect(result.current.refreshedMessage?.status).toBe('success')
    })
    expect(listCache.pages[0].data[0].text).toBe('최종 답변')
  })

  it('서버도 streaming이면 delayed 상태를 반환한다', async () => {
    const message = createExpiredMessage('expired-delayed')
    ;(messageService.refreshChatMessage as jest.Mock).mockResolvedValue(message)

    const {result} = renderHook(() =>
      useRevalidateExpiredAiMessage('room-1', message),
    )

    await waitFor(() => expect(result.current.status).toBe('delayed'))
  })

  it('서버 문서가 없으면 missing 상태를 반환한다', async () => {
    const message = createExpiredMessage('expired-missing')
    ;(messageService.refreshChatMessage as jest.Mock).mockResolvedValue(null)

    const {result} = renderHook(() =>
      useRevalidateExpiredAiMessage('room-1', message),
    )

    await waitFor(() => expect(result.current.status).toBe('missing'))
  })

  it('서버 조회가 실패하면 error 상태를 반환한다', async () => {
    const message = createExpiredMessage('expired-error')
    ;(messageService.refreshChatMessage as jest.Mock).mockRejectedValue(
      new Error('network error'),
    )

    const {result} = renderHook(() =>
      useRevalidateExpiredAiMessage('room-1', message),
    )

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('동일 메시지의 진행 중인 재조회 Promise를 공유한다', async () => {
    const message = createExpiredMessage('expired-in-flight')
    let resolveRequest: ((message: ChatMessage) => void) | undefined
    ;(messageService.refreshChatMessage as jest.Mock).mockReturnValue(
      new Promise<ChatMessage>(resolve => {
        resolveRequest = resolve
      }),
    )

    const first = renderHook(() =>
      useRevalidateExpiredAiMessage('room-1', message),
    )
    const second = renderHook(() =>
      useRevalidateExpiredAiMessage('room-1', message),
    )

    expect(messageService.refreshChatMessage).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRequest?.(message)
      await Promise.resolve()
    })
    first.unmount()
    second.unmount()
  })

  it('마운트 후 만료 경계가 지나면 재조회한다', async () => {
    const message: ChatMessage = {
      ...createExpiredMessage('expires-after-mount'),
      aiResponseExpiresAt: NOW + 1_000,
    }
    ;(messageService.refreshChatMessage as jest.Mock).mockResolvedValue(message)

    renderHook(() => useRevalidateExpiredAiMessage('room-1', message))
    expect(messageService.refreshChatMessage).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(6_000)
      await Promise.resolve()
    })

    expect(messageService.refreshChatMessage).toHaveBeenCalledWith(
      'room-1',
      message.id,
    )
  })
})
