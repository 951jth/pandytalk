import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {useSubscribeChatMessages} from '@app/features/chat/hooks/useSubscribeChatMessages'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {act, renderHook} from '@testing-library/react-native'

jest.mock('@app/features/chat/hooks/useChatMessageUpsertMutation')
jest.mock('@app/features/chat/service/messageService')
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}))

describe('useSubscribeChatMessages', () => {
  const unsubscribe = jest.fn()
  const mergeMessagesIntoCache = jest.fn()
  const message: ChatMessage = {
    id: 'message-1',
    senderId: 'user-1',
    text: '안녕하세요',
    type: 'text',
    createdAt: 1,
    seq: 11,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useChatMessageUpsertMutation as jest.Mock).mockReturnValue({
      mergeMessagesIntoCache,
    })
  })

  it('Service가 전달한 구독 메시지를 캐시에 병합한다', async () => {
    let subscribedCallback: (messages: ChatMessage[]) => void = () => {}
    ;(messageService.subscribeChatMessages as jest.Mock).mockImplementation(
      async (_roomId, callback) => {
        subscribedCallback = callback
        return unsubscribe
      },
    )

    renderHook(() => useSubscribeChatMessages('room-1'))
    const focusEffect = (useFocusEffect as jest.Mock).mock.calls[0][0]

    let cleanup: (() => void) | undefined
    await act(async () => {
      cleanup = focusEffect()
      await Promise.resolve()
    })
    act(() => subscribedCallback([message]))

    expect(messageService.subscribeChatMessages).toHaveBeenCalledWith(
      'room-1',
      expect.any(Function),
    )
    expect(mergeMessagesIntoCache).toHaveBeenCalledWith([message])

    cleanup?.()
  })

  it('구독 준비 전에 blur되면 준비 완료 직후 구독을 해제한다', async () => {
    let resolveSubscription: ((unsubscribe: () => void) => void) | undefined
    ;(messageService.subscribeChatMessages as jest.Mock).mockReturnValue(
      new Promise<() => void>(resolve => {
        resolveSubscription = resolve
      }),
    )

    renderHook(() => useSubscribeChatMessages('room-1'))
    const focusEffect = (useFocusEffect as jest.Mock).mock.calls[0][0]
    const cleanup = focusEffect()

    cleanup()
    await act(async () => {
      resolveSubscription?.(unsubscribe)
      await Promise.resolve()
    })

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('blur 이후 도착한 메시지는 캐시에 병합하지 않는다', async () => {
    let subscribedCallback: (messages: ChatMessage[]) => void = () => {}
    ;(messageService.subscribeChatMessages as jest.Mock).mockImplementation(
      async (_roomId, callback) => {
        subscribedCallback = callback
        return unsubscribe
      },
    )

    renderHook(() => useSubscribeChatMessages('room-1'))
    const focusEffect = (useFocusEffect as jest.Mock).mock.calls[0][0]

    let cleanup: (() => void) | undefined
    await act(async () => {
      cleanup = focusEffect()
      await Promise.resolve()
    })
    cleanup?.()
    act(() => subscribedCallback([message]))

    expect(mergeMessagesIntoCache).not.toHaveBeenCalled()
  })
})
