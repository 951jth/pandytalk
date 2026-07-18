import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import {doc, runTransaction, serverTimestamp} from '@react-native-firebase/firestore'

jest.mock('@app/shared/firebase/firebaseUtils', () => ({
  firebaseCall: jest.fn((_name: string, task: () => unknown) => task()),
  firebaseObserver: jest.fn(),
}))

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(),
  where: jest.fn(),
}))

describe('messageRemote 메시지 전송', () => {
  const transaction = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(doc as jest.Mock).mockImplementation(
      (_firestore: unknown, ...segments: string[]) => ({
        id: segments[segments.length - 1],
        path: segments.join('/'),
      }),
    )
    ;(serverTimestamp as jest.Mock).mockReturnValue('server-time')
    ;(runTransaction as jest.Mock).mockImplementation(
      (_firestore: unknown, task: (tx: typeof transaction) => unknown) =>
        task(transaction),
    )
  })

  it('신규 메시지에 새 seq를 배정하고 결과를 반환한다', async () => {
    transaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({lastSeq: 7, recentMessages: []}),
    })

    const result = await messageRemote.sendChatMessage('room-1', {
      id: 'message-1',
      senderId: 'user-1',
      text: '안녕하세요',
      type: 'text',
    })

    expect(result).toEqual({
      id: 'message-1',
      seq: 8,
      alreadySent: false,
    })
    expect(transaction.get).toHaveBeenCalledTimes(1)
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({id: 'message-1'}),
      expect.objectContaining({seq: 8, senderId: 'user-1'}),
    )
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({id: 'room-1'}),
      expect.objectContaining({lastSeq: 8}),
    )
  })

  it('재시도 메시지가 이미 있으면 seq를 증가시키지 않는다', async () => {
    transaction.get
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({lastSeq: 8, recentMessages: []}),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({seq: 8, senderId: 'user-1'}),
      })

    const result = await messageRemote.retryChatMessage('room-1', {
      id: 'message-1',
      senderId: 'user-1',
      text: '안녕하세요',
      type: 'text',
    })

    expect(result).toEqual({
      id: 'message-1',
      seq: 8,
      alreadySent: true,
    })
    expect(transaction.set).not.toHaveBeenCalled()
    expect(transaction.update).not.toHaveBeenCalled()
  })

  it('재시도 메시지가 서버에 없으면 새 seq로 등록한다', async () => {
    transaction.get
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({lastSeq: 8, recentMessages: []}),
      })
      .mockResolvedValueOnce({
        exists: () => false,
      })

    const result = await messageRemote.retryChatMessage('room-1', {
      id: 'message-1',
      senderId: 'user-1',
      text: '안녕하세요',
      type: 'text',
    })

    expect(result).toEqual({
      id: 'message-1',
      seq: 9,
      alreadySent: false,
    })
    expect(transaction.get).toHaveBeenCalledTimes(2)
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({id: 'message-1'}),
      expect.objectContaining({seq: 9}),
    )
  })

  it('동일 ID를 다른 발신자가 사용하면 오류를 반환한다', async () => {
    transaction.get
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({lastSeq: 8, recentMessages: []}),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({seq: 8, senderId: 'other-user'}),
      })

    await expect(
      messageRemote.retryChatMessage('room-1', {
        id: 'message-1',
        senderId: 'user-1',
        text: '안녕하세요',
        type: 'text',
      }),
    ).rejects.toThrow('동일한 메시지 ID가 이미 사용 중입니다.')

    expect(transaction.set).not.toHaveBeenCalled()
    expect(transaction.update).not.toHaveBeenCalled()
  })
})
