import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import {messageService} from '@app/features/chat/service/messageService'

// 의존성 모킹
jest.mock('@app/features/chat/data/messageLocal.sqlite')
jest.mock('@app/features/chat/data/messageRemote.firebase')

describe('messageService.getChatMessages (통합 조회 오케스트레이션 테스트)', () => {
  const mockRoomId = 'room_123'
  const PAGE_SIZE = 20

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Scenario 1: Offline-First (로컬 데이터가 충분하면 서버를 호출하지 않음)', async () => {
    // 1. 로컬 DB에 20개(페이지 꽉 참)의 연속된 데이터가 있다고 가정
    const mockLocalData = Array(20)
      .fill(null)
      .map((_, i) => ({seq: 100 - i}))
    ;(messageLocal.getChatMessagesBySeq as jest.Mock).mockResolvedValue(
      mockLocalData,
    )

    const result = await messageService.getChatMessages(mockRoomId)

    // 검증: 로컬 조회가 수행됨
    expect(messageLocal.getChatMessagesBySeq).toHaveBeenCalledWith(
      mockRoomId,
      undefined,
      PAGE_SIZE,
    )
    // 검증: 데이터가 충분하므로 서버 메서드는 호출되지 않음
    expect(messageRemote.getChatMessagesBySeq).not.toHaveBeenCalled()
    expect(result).toEqual(mockLocalData)
  })

  it('Scenario 2: Initial Sync (로컬 최신 데이터가 서버보다 낮으면 서버 호출)', async () => {
    // 1. 로컬 데이터가 있지만 서버의 최신(serverLastSeq)보다 낮은 경우 (Stale)
    const mockLocalData = [{seq: 50}]
    ;(messageLocal.getChatMessagesBySeq as jest.Mock)
      .mockResolvedValueOnce(mockLocalData) // 첫 로컬 조회
      .mockResolvedValueOnce([{seq: 60}, {seq: 50}]) // 서버 저장 후 최종 조회

    // 2. 서버에는 최신 데이터가 있음
    const mockServerData = {items: [{seq: 60}]}
    ;(messageRemote.getChatMessagesBySeq as jest.Mock).mockResolvedValue(
      mockServerData,
    )

    const result = await messageService.getChatMessages(
      mockRoomId,
      undefined,
      PAGE_SIZE,
    )

    // 검증: 서버 페치가 발생함
    expect(messageRemote.getChatMessagesBySeq).toHaveBeenCalled()
    // 검증: 서버에서 가져온 데이터가 로컬에 저장됨
    expect(messageLocal.saveMessagesToSQLite).toHaveBeenCalled()
    // 검증: 최종적으로 업데이트된 리스트 반환
    expect(result[0].seq).toBe(60)
  })

  it('Scenario 3: Pagination Sync (중간 데이터 간극(Gap) 발생 시 서버 호출)', async () => {
    // 1. 커서는 100인데 로컬 최신은 80인 경우 (81~99 간극 발생)
    const mockLocalData = [{seq: 80}]
    ;(messageLocal.getChatMessagesBySeq as jest.Mock)
      .mockResolvedValueOnce(mockLocalData)
      .mockResolvedValueOnce([{seq: 95}, {seq: 80}])

    // 2. 서버 조회 결과
    ;(messageRemote.getChatMessagesBySeq as jest.Mock).mockResolvedValue({
      items: [{seq: 95}],
    })

    const result = await messageService.getChatMessages(
      mockRoomId,
      100, // cursorSeq
      PAGE_SIZE,
    )

    // 검증: Gap이 감지되어 서버 호출이 발생함 (80 < 100 - 1)
    expect(messageRemote.getChatMessagesBySeq).toHaveBeenCalled()
    expect(result[0].seq).toBe(95)
  })

  it('Scenario 4: Fallback (서버 에러 시 로컬 데이터를 안전하게 반환)', async () => {
    // 1. 로컬에 데이터가 5개밖에 없어 서버 페치가 필요하지만 서버가 터진 상황
    const mockLocalData = Array(5)
      .fill(null)
      .map((_, i) => ({seq: 10 - i}))
    ;(messageLocal.getChatMessagesBySeq as jest.Mock).mockResolvedValue(
      mockLocalData,
    )
    ;(messageRemote.getChatMessagesBySeq as jest.Mock).mockRejectedValue(
      new Error('Network Error'),
    )

    const result = await messageService.getChatMessages(mockRoomId)

    // 검증: 에러가 던져지지 않고 로컬 데이터가 반환됨
    expect(result).toEqual(mockLocalData)
  })
})
