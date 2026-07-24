import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {db} from '@app/shared/sqlite/sqlite'
import {sqliteCall} from '@app/shared/sqlite/sqliteCall'

jest.mock('@app/shared/sqlite/sqlite', () => {
  const actual = jest.requireActual('@app/shared/sqlite/sqlite')
  return {
    ...actual,
    db: {
      transaction: jest.fn(),
    },
  }
})

jest.mock('@app/shared/sqlite/sqliteCall', () => ({
  sqliteCall: jest.fn((_name: string, task: () => unknown) => task()),
}))

describe('messageLocal 메시지 전송 상태 변경', () => {
  const executeSql = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(db.transaction as jest.Mock).mockImplementation(
      (callback: (tx: {executeSql: typeof executeSql}) => void) => {
        callback({executeSql})
      },
    )
    executeSql.mockImplementation(
      (
        _query: string,
        _params: Array<string | number>,
        onSuccess: (_tx: unknown, result: {rowsAffected: number}) => void,
      ) => {
        onSuccess({}, {rowsAffected: 1})
      },
    )
  })

  it('성공 상태와 서버 seq를 함께 반영한다', async () => {
    const updated = await messageLocal.markMessageAsSuccess(
      'room-1',
      'message-1',
      42,
    )

    expect(updated).toBe(true)
    expect(sqliteCall).toHaveBeenCalledWith(
      'messageLocal.markMessageAsSuccess',
      expect.any(Function),
      {lock: true},
    )
    expect(executeSql).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'success', seq = ?"),
      [42, 'room-1', 'message-1'],
      expect.any(Function),
      expect.any(Function),
    )
  })

  it('pending 메시지만 failed 상태로 변경한다', async () => {
    const updated = await messageLocal.markMessageAsFailedIfPending(
      'room-1',
      'message-1',
    )

    expect(updated).toBe(true)
    expect(sqliteCall).toHaveBeenCalledWith(
      'messageLocal.markMessageAsFailedIfPending',
      expect.any(Function),
      {lock: true},
    )
    expect(executeSql).toHaveBeenCalledWith(
      expect.stringContaining("AND status = 'pending'"),
      ['room-1', 'message-1'],
      expect.any(Function),
      expect.any(Function),
    )
  })

  it('pending 상태가 아니면 false를 반환한다', async () => {
    executeSql.mockImplementation(
      (
        _query: string,
        _params: Array<string | number>,
        onSuccess: (_tx: unknown, result: {rowsAffected: number}) => void,
      ) => {
        onSuccess({}, {rowsAffected: 0})
      },
    )

    const updated = await messageLocal.markMessageAsFailedIfPending(
      'room-1',
      'message-1',
    )

    expect(updated).toBe(false)
  })
})
