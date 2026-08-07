import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {setChatMessagePayload} from '@app/features/chat/utils/message'
import {mockRoomInfo, mockUser} from '@app/shared/test/mocks'
import {useAppSelector} from '@app/store/reduxHooks'
import {act, renderHook} from '@testing-library/react-native'
import {Alert} from 'react-native'
import {useChatMessageInput} from '../hooks/useChatMessageInput'

// 1. 모듈 모킹
jest.mock('@app/features/chat/hooks/useChatMessageUpsertMutation')
jest.mock('@app/features/chat/hooks/useChatRoomCreateMutation', () => ({
  useCreateChatRoomMutation: () => ({mutateAsync: jest.fn()}),
}))
jest.mock('@app/store/reduxHooks')
jest.mock('@app/features/chat/utils/message')
jest.mock('@app/features/media/service/fileService')
jest.mock('@app/features/chat/contexts/ChatRoomUIContext', () => ({
  useChatRoomUIAction: () => ({
    setIsAIGenerating: jest.fn(),
    scrollToBottom: jest.fn(),
  }),
}))
jest.spyOn(Alert, 'alert').mockImplementation(() => {})

describe('useChatMessageInput (채팅 전송 로직 테스트)', () => {
  const mockMutate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // 기본 모킹 설정
    ;(useChatMessageUpsertMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
    })
    ;(useAppSelector as jest.Mock).mockReturnValue({data: mockUser})
    ;(setChatMessagePayload as jest.Mock).mockImplementation(({message}) => ({
      ...message,
      id: 'msg_1',
      senderId: mockUser.uid,
    }))
  })

  it('빈 텍스트는 전송되지 않아야 한다', async () => {
    const {result} = renderHook(() =>
      useChatMessageInput({
        roomInfo: mockRoomInfo,
        chatType: 'group',
      }),
    )

    // 텍스트가 없는 상태에서 전송 시도
    await act(async () => {
      await result.current.onSendMessage('text')
    })

    // mutate(전송)가 호출되지 않았는지 검증
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('텍스트가 입력되었을 때 성공적으로 전송 호출이 되어야 한다', async () => {
    const {result} = renderHook(() =>
      useChatMessageInput({
        roomInfo: mockRoomInfo,
        chatType: 'group',
      }),
    )

    // 텍스트 입력
    act(() => {
      result.current.setText('안녕하세요')
    })

    // 전송 실행
    await act(async () => {
      await result.current.onSendMessage('text')
    })

    // 검증: 1) 페이로드 생성 호출됨
    expect(setChatMessagePayload).toHaveBeenCalled()
    // 검증: 2) 실제 전송(mutate) 함수가 호출됨
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({text: '안녕하세요'}),
        createdRoomId: mockRoomInfo.id,
      }),
    )
  })

  it('메시지 전송 후 입력창이 초기화되어야 한다', async () => {
    const {result} = renderHook(() =>
      useChatMessageInput({
        roomInfo: mockRoomInfo,
        chatType: 'group',
      }),
    )

    act(() => {
      result.current.setText('테스트 메시지')
    })

    await act(async () => {
      await result.current.onSendMessage('text')
    })

    // 검증: 입력값이 빈 문자열('')이 되었는가?
    expect(result.current.text).toBe('')
  })
})
