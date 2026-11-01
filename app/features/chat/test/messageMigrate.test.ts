/// <reference types="jest" />
import useEnsureChatMessagesSchema from '@app/bootstrap/useEnsureChatMessagesSchema'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import {
  CREATE_MESSAGE_ROOM_SEQ_INDEX_SQL,
  LATEST_DB_VERSION,
  MESSAGE_COLUMNS_V1,
  MESSAGE_COLUMNS_V4,
  MESSAGE_ROOM_SEQ_INDEX,
  MESSAGES_COLUMNS,
} from '@app/features/chat/data/messages.schema'
import {messageMigrateLocal} from '@app/features/chat/data/messagLocal.migrate.sqlite'
import {useChatMessagesInfinite} from '@app/features/chat/hooks/useChatMessagesInfinite'
import {messageMigrateService} from '@app/features/chat/service/messageMigrateService'
import {messageService} from '@app/features/chat/service/messageService'
import {createInMemorySqliteState} from '@app/shared/test/sqliteTestUtils'
import type {ChatMessage} from '@app/shared/types/chat'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react-native'

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

jest.mock('@app/shared/services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@app/features/chat/data/messageRemote.firebase', () => ({
  messageRemote: {
    getChatMessagesBySeq: jest.fn(),
    getAllChatMessagesFromSeq: jest.fn(),
    getChatMessageById: jest.fn(),
    sendChatMessage: jest.fn(),
    retryChatMessage: jest.fn(),
    subscribeChatMessages: jest.fn(),
  },
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(),
  useInfiniteQuery: jest.fn(),
}))

describe('SQLite 마이그레이션 및 메시지 조회 검증 (Local -> Remote -> Service -> Hook)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useQueryClient as jest.Mock).mockReturnValue({
      isFetching: jest.fn(() => 0),
      resetQueries: jest.fn(),
    })
  })

  describe('1. [Local] 버전별 마이그레이션(v1, v4 -> v6) 및 컬럼/인덱스 검증', () => {
    it('v1 유저가 마이그레이션 수행 시 FIFO 큐에서도 seq 컬럼 추가 후 v6 인덱스가 생성되어 최신 컬럼 및 인덱스가 보장된다', async () => {
      const {state} = createInMemorySqliteState({
        userVersion: 1,
        columns: MESSAGE_COLUMNS_V1,
      })

      expect(state.columns).toHaveLength(9)

      await messageMigrateLocal.migrateDatabaseIfNeeded()
      const missingColumns = await messageMigrateLocal.getMissingColumns()
      const indexes = await messageMigrateLocal.getMessageIndexes()

      expect(state.userVersion).toBe(LATEST_DB_VERSION)
      expect(state.userVersion).toBe(6)
      expect(state.columns).toHaveLength(MESSAGES_COLUMNS.length)
      expect(state.columns).toEqual(MESSAGES_COLUMNS)
      expect(missingColumns).toEqual([])
      expect(indexes).toContain(MESSAGE_ROOM_SEQ_INDEX)
      expect(state.executedQueries).toContain(CREATE_MESSAGE_ROOM_SEQ_INDEX_SQL)
    })

    it('v4 유저가 마이그레이션 수행 시 v6까지 업그레이드되며 최신 컬럼 개수 및 인덱스가 동일하게 보장된다', async () => {
      const {state} = createInMemorySqliteState({
        userVersion: 4,
        columns: MESSAGE_COLUMNS_V4,
      })

      expect(state.columns).toHaveLength(12)

      await messageMigrateLocal.migrateDatabaseIfNeeded()
      const missingColumns = await messageMigrateLocal.getMissingColumns()
      const indexes = await messageMigrateLocal.getMessageIndexes()

      expect(state.userVersion).toBe(LATEST_DB_VERSION)
      expect(state.userVersion).toBe(6)
      expect(state.columns).toHaveLength(MESSAGES_COLUMNS.length)
      expect(state.columns).toEqual(MESSAGES_COLUMNS)
      expect(missingColumns).toEqual([])
      expect(indexes).toContain(MESSAGE_ROOM_SEQ_INDEX)
      expect(state.executedQueries).toContain(CREATE_MESSAGE_ROOM_SEQ_INDEX_SQL)
    })

    it('테이블이 없던 신규 유저가 initMessageTable 수행 시 최신 컬럼, 인덱스, v6 버전이 모두 설정된다', async () => {
      const {state} = createInMemorySqliteState({
        tableExists: false,
        userVersion: 0,
        columns: [],
      })

      await messageMigrateLocal.initMessageTable()
      const missingColumns = await messageMigrateLocal.getMissingColumns()
      const indexes = await messageMigrateLocal.getMessageIndexes()

      expect(state.tableExists).toBe(true)
      expect(state.userVersion).toBe(LATEST_DB_VERSION)
      expect(state.userVersion).toBe(6)
      expect(state.columns).toHaveLength(MESSAGES_COLUMNS.length)
      expect(state.columns).toEqual(MESSAGES_COLUMNS)
      expect(missingColumns).toEqual([])
      expect(indexes).toContain(MESSAGE_ROOM_SEQ_INDEX)
      expect(state.executedQueries).toContain(CREATE_MESSAGE_ROOM_SEQ_INDEX_SQL)
    })
  })

  describe('2. [Local -> Remote -> Service] 마이그레이션 이후 통합 메시지 조회 정합성', () => {
    it('v1에서 v6으로 마이그레이션 후 messageService.getChatMessages 호출 시 Remote(서버) 데이터(텍스트, AI)를 받아 SQLite에 저장하고 기존 v1 메시지와 함께 반환한다', async () => {
      const roomId = 'room-migrate-1'
      const v1CreatedAt = 1700000001000

      // 1) Local 초기 상태: v1 시절 저장된 일반 텍스트 메시지 1건
      const {state} = createInMemorySqliteState({
        userVersion: 1,
        columns: MESSAGE_COLUMNS_V1,
        rows: [
          {
            id: 'msg-v1-text',
            roomId,
            text: 'v1 시절 일반 텍스트 메시지',
            senderId: 'user-1',
            createdAt: v1CreatedAt,
            type: 'text',
            imageUrl: '',
            senderPicURL: 'https://example.com/u1.png',
            senderName: '유저1',
          },
        ],
      })

      // 2) Service: ensureMessageColumns로 v1 -> v6 마이그레이션 실행
      await messageMigrateService.ensureMessageColumns()
      expect(state.userVersion).toBe(6)

      // 3) Remote: 서버(Firebase)에 있는 신규 텍스트 + AI 메시지 응답 설정
      const remoteMessages: ChatMessage[] = [
        {
          id: 'msg-v6-ai',
          senderId: 'ai-bot',
          senderName: '판디 AI',
          senderPicURL: undefined,
          text: '안녕하세요! AI 응답 메시지입니다.',
          type: 'ai_text',
          createdAt: 1700000003000,
          seq: 3,
          status: 'success',
          aiResponseExpiresAt: 1700000063000,
        },
        {
          id: 'msg-v6-text',
          senderId: 'user-2',
          senderName: '유저2',
          senderPicURL: 'https://example.com/u2.png',
          text: '마이그레이션 이후 텍스트 메시지',
          type: 'text',
          createdAt: 1700000002000,
          seq: 2,
          status: 'success',
        },
      ]
      ;(messageRemote.getChatMessagesBySeq as jest.Mock).mockResolvedValue({
        items: remoteMessages,
        nextPageParam: 2,
        hasNext: false,
      })

      // 4) Service: getChatMessages 실행 (Local 조회 -> 부족하므로 Remote 조회 -> Local 저장 -> Local 재조회)
      const loadedMessages = await messageService.getChatMessages(
        roomId,
        undefined,
        20,
      )

      expect(messageRemote.getChatMessagesBySeq).toHaveBeenCalledWith(
        roomId,
        undefined,
        20,
      )
      expect(loadedMessages).toHaveLength(3)
      expect(loadedMessages.map(m => m.id)).toEqual([
        'msg-v6-ai',
        'msg-v6-text',
        'msg-v1-text',
      ])

      // AI 메시지 검증
      expect(loadedMessages[0]).toMatchObject({
        id: 'msg-v6-ai',
        type: 'ai_text',
        text: '안녕하세요! AI 응답 메시지입니다.',
        seq: 3,
        status: 'success',
        aiResponseExpiresAt: 1700000063000,
      })

      // 신규 일반 텍스트 메시지 검증
      expect(loadedMessages[1]).toMatchObject({
        id: 'msg-v6-text',
        type: 'text',
        text: '마이그레이션 이후 텍스트 메시지',
        seq: 2,
        status: 'success',
      })

      // v1 시절 텍스트 메시지 보존 및 기본값(seq: 0, status: 'success') 검증
      expect(loadedMessages[2]).toMatchObject({
        id: 'msg-v1-text',
        type: 'text',
        text: 'v1 시절 일반 텍스트 메시지',
        senderId: 'user-1',
        createdAt: v1CreatedAt,
        seq: 0,
        status: 'success',
      })
    })

    it('v4에서 v6으로 마이그레이션된 후 기존 텍스트/이미지/AI 메시지가 손실 없이 동일하게 출력된다', async () => {
      const roomId = 'room-migrate-4'

      const {state} = createInMemorySqliteState({
        userVersion: 4,
        columns: MESSAGE_COLUMNS_V4,
        rows: [
          {
            id: 'msg-v4-text',
            roomId,
            text: 'v4 일반 채팅 메시지',
            senderId: 'user-1',
            createdAt: 1700000010000,
            type: 'text',
            imageUrl: '',
            senderPicURL: '',
            senderName: '유저1',
            seq: 10,
            status: 'success',
            imageUrls: '[]',
          },
          {
            id: 'msg-v4-image',
            roomId,
            text: '',
            senderId: 'user-1',
            createdAt: 1700000020000,
            type: 'image',
            imageUrl: 'https://example.com/img1.jpg',
            senderPicURL: '',
            senderName: '유저1',
            seq: 11,
            status: 'success',
            imageUrls: JSON.stringify([
              'https://example.com/img1.jpg',
              'https://example.com/img2.jpg',
            ]),
          },
          {
            id: 'msg-v4-ai',
            roomId,
            text: 'v4 시절 AI 메시지 응답',
            senderId: 'ai-bot',
            createdAt: 1700000030000,
            type: 'ai_text',
            imageUrl: '',
            senderPicURL: '',
            senderName: 'AI',
            seq: 12,
            status: 'success',
            imageUrls: '[]',
          },
        ],
      })

      await messageMigrateService.ensureMessageColumns()
      expect(state.userVersion).toBe(6)

      ;(messageRemote.getChatMessagesBySeq as jest.Mock).mockResolvedValue({
        items: [],
        nextPageParam: null,
        hasNext: false,
      })

      const loadedMessages = await messageService.getChatMessages(
        roomId,
        undefined,
        20,
      )

      expect(loadedMessages).toHaveLength(3)
      expect(loadedMessages.map(m => m.id)).toEqual([
        'msg-v4-ai',
        'msg-v4-image',
        'msg-v4-text',
      ])

      expect(loadedMessages[0]).toMatchObject({
        id: 'msg-v4-ai',
        type: 'ai_text',
        text: 'v4 시절 AI 메시지 응답',
        seq: 12,
        aiResponseExpiresAt: null,
      })

      expect(loadedMessages[1]).toMatchObject({
        id: 'msg-v4-image',
        type: 'image',
        seq: 11,
        imageUrls: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
        ],
      })

      const detailTextMsg = await messageService.getChatMessage(
        roomId,
        'msg-v4-text',
      )
      expect(detailTextMsg).toMatchObject({
        id: 'msg-v4-text',
        type: 'text',
        text: 'v4 일반 채팅 메시지',
        seq: 10,
        status: 'success',
      })
    })
  })

  describe('3. [Hook] 첫 마운트 스키마 보장 훅(useEnsureChatMessagesSchema) 및 조회 훅(useChatMessagesInfinite) 검증', () => {
    it('첫 마운트 시 useEnsureChatMessagesSchema가 v1 테이블을 감지하여 v6으로 마이그레이션한 뒤, useChatMessagesInfinite로 메시지를 조회한다', async () => {
      const roomId = 'room-hook-1'
      const {state} = createInMemorySqliteState({
        tableExists: true,
        userVersion: 1,
        columns: MESSAGE_COLUMNS_V1,
        rows: [
          {
            id: 'msg-hook-v1',
            roomId,
            text: '훅 테스트용 v1 텍스트',
            senderId: 'user-1',
            createdAt: 1700000001000,
            type: 'text',
            imageUrl: '',
            senderPicURL: '',
            senderName: '유저1',
          },
        ],
      })

      // 1) 첫 마운트 시 useEnsureChatMessagesSchema 실행
      renderHook(() => useEnsureChatMessagesSchema())

      await waitFor(() => {
        expect(state.userVersion).toBe(6)
      })
      expect(state.indexes.has(MESSAGE_ROOM_SEQ_INDEX)).toBe(true)

      // 2) Remote 서버 응답 모킹 (AI 메시지 추가)
      ;(messageRemote.getChatMessagesBySeq as jest.Mock).mockResolvedValue({
        items: [
          {
            id: 'msg-hook-ai',
            senderId: 'ai-bot',
            senderName: 'AI',
            text: '훅을 통해 조회된 AI 메시지',
            type: 'ai_text',
            createdAt: 1700000005000,
            seq: 5,
            status: 'success',
            aiResponseExpiresAt: 1700000065000,
          },
        ],
        nextPageParam: 5,
        hasNext: false,
      })

      // 3) useChatMessagesInfinite 훅 실행 시 queryFn을 통해 Local + Remote 통합 결과 반환 확인
      let capturedQueryFn:
        | ((ctx: {pageParam?: number}) => Promise<{
            data: ChatMessage[]
            lastVisible: number | null
            isLastPage: boolean
          }>)
        | undefined

      ;(useInfiniteQuery as jest.Mock).mockImplementation(({queryFn}) => {
        capturedQueryFn = queryFn
        return {
          data: undefined,
          isLoading: false,
          fetchNextPage: jest.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        }
      })

      renderHook(() => useChatMessagesInfinite(roomId))
      expect(capturedQueryFn).toBeDefined()

      const pageResult = await capturedQueryFn!({pageParam: undefined})

      expect(pageResult.data).toHaveLength(2)
      expect(pageResult.data[0]).toMatchObject({
        id: 'msg-hook-ai',
        type: 'ai_text',
        text: '훅을 통해 조회된 AI 메시지',
        seq: 5,
      })
      expect(pageResult.data[1]).toMatchObject({
        id: 'msg-hook-v1',
        type: 'text',
        text: '훅 테스트용 v1 텍스트',
        seq: 0,
      })
      expect(pageResult.lastVisible).toBe(0)
      expect(pageResult.isLastPage).toBe(true)
    })
  })
})
