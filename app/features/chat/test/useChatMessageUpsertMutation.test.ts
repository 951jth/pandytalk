import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'

jest.mock('@app/features/chat/service/messageService')
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

describe('useChatMessageUpsertMutation', () => {
  const mutationOptions: Array<{
    mutationFn: (params: {message: ChatMessage}) => Promise<string>
  }> = []
  const sendMutate = jest.fn()
  const retryMutate = jest.fn()
  const queryClient = {
    cancelQueries: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  }
  const message: ChatMessage = {
    id: 'message-1',
    senderId: 'user-1',
    text: '안녕하세요',
    type: 'text',
    createdAt: 1,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mutationOptions.length = 0
    ;(useQueryClient as jest.Mock).mockReturnValue(queryClient)
    ;(useMutation as jest.Mock).mockImplementation(options => {
      mutationOptions.push(options)
      if (mutationOptions.length === 1) {
        return {mutate: sendMutate}
      }
      return {
        mutate: retryMutate,
        mutateAsync: jest.fn(),
        isPending: false,
      }
    })
  })

  it('일반 전송과 재시도 Service를 각각 호출한다', async () => {
    (messageService.sendChatMessage as jest.Mock).mockResolvedValue('room-1')
    ;(messageService.retryChatMessage as jest.Mock).mockResolvedValue('room-1')

    renderHook(() => useChatMessageUpsertMutation('room-1'))

    await mutationOptions[0].mutationFn({message})
    await mutationOptions[1].mutationFn({message})

    expect(messageService.sendChatMessage).toHaveBeenCalledWith({
      roomId: 'room-1',
      message,
    })
    expect(messageService.retryChatMessage).toHaveBeenCalledWith({
      roomId: 'room-1',
      message,
    })
  })

  it('구독 메시지는 React Query 캐시에만 병합한다', () => {
    const {result} = renderHook(() =>
      useChatMessageUpsertMutation('room-1'),
    )

    act(() => {
      result.current.mergeMessagesIntoCache([message])
    })

    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ['chatMessages', 'room-1'],
      expect.any(Function),
    )
  })

  it('실패 메시지 UI에는 재시도 mutation을 노출한다', () => {
    const {result} = renderHook(() =>
      useChatMessageUpsertMutation('room-1'),
    )

    expect(result.current.retryMessage).toBe(retryMutate)
  })
})
