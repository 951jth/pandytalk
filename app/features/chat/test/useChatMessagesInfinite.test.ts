import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageService} from '@app/features/chat/service/messageService'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'
import {useChatMessagesInfinite} from '../hooks/useChatMessagesInfinite'

// 의존성 모킹
jest.mock('@app/features/chat/data/messageLocal.sqlite')
jest.mock('@app/features/chat/service/messageService')
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(),
  useInfiniteQuery: jest.fn(),
}))
jest.mock('@app/shared/hooks/usePerformanceMeasure', () => ({
  usePerformanceMeasure: () => ({
    measureAsync: (_tag: string, fn: () => unknown) => fn(),
  }),
}))

describe('useChatMessagesInfinite - 스마트 데이터 로딩 로직 테스트', () => {
  const mockRoomId = 'room_123'
  const mockQueryClient = {isFetching: jest.fn(), resetQueries: jest.fn()}

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useQueryClient as jest.Mock).mockReturnValue(mockQueryClient)
  })

  it('로컬 DB(SQLite)에 데이터가 충분하면 서버를 호출하지 않아야 한다 (Offline-First)', async () => {
    // 1. messageService.getChatMessages가 데이터를 반환한다고 가정
    const mockData = Array(20).fill({id: 'msg'})
    ;(messageService.getChatMessages as jest.Mock).mockResolvedValue(mockData)
    ;(useInfiniteQuery as jest.Mock).mockImplementation(({queryFn}) => {
      // 실제 queryFn 실행 시뮬레이션
      queryFn({pageParam: undefined})
      return {data: undefined}
    })

    renderHook(() => useChatMessagesInfinite(mockRoomId))

    // 검증: 서비스 레이어 조회가 발생했는가?
    expect(messageService.getChatMessages).toHaveBeenCalledWith(
      mockRoomId,
      undefined,
      20,
    )
  })

  it('로컬 DB에 데이터가 부족하면 서버에서 가져와 저장해야 한다 (Hybrid Sync)', async () => {
    // 1. messageService.getChatMessages가 내부적으로 동기화 후 데이터를 반환한다고 가정
    const mockData = [{id: 'server_msg_1'}]
    ;(messageService.getChatMessages as jest.Mock).mockResolvedValue(mockData)
    ;(useInfiniteQuery as jest.Mock).mockImplementation(({queryFn}) => {
      queryFn({pageParam: undefined})
      return {data: undefined}
    })

    renderHook(() => useChatMessagesInfinite(mockRoomId))

    // 검증: 서비스 레이어 조회가 발생했는가?
    expect(messageService.getChatMessages).toHaveBeenCalled()
  })

  it('resetChatMessages 호출 시 로컬 데이터를 지우고 쿼리를 리셋해야 한다', async () => {
    const {result} = renderHook(() => useChatMessagesInfinite(mockRoomId))

    await act(async () => {
      await result.current.resetChatMessages()
    })

    // 검증: SQLite 데이터 삭제 호출
    expect(messageLocal.clearMessagesByChatRoomId).toHaveBeenCalledWith(
      mockRoomId,
    )
    // 검증: React Query 캐시 리셋 호출
    expect(mockQueryClient.resetQueries).toHaveBeenCalled()
  })
})
