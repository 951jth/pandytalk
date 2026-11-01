/// <reference types="jest" />
import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {
  CREATE_MESSAGE_ROOM_SEQ_INDEX_SQL,
  LATEST_DB_VERSION,
  MESSAGE_COLUMNS_V1,
  MESSAGE_COLUMNS_V4,
  MESSAGE_ROOM_SEQ_INDEX,
  MESSAGES_COLUMNS,
} from '@app/features/chat/data/messages.schema'
import {messageMigrateLocal} from '@app/features/chat/data/messagLocal.migrate.sqlite'
import {messageMigrateService} from '@app/features/chat/service/messageMigrateService'
import {db} from '@app/shared/sqlite/sqlite'
import type {ChatMessage} from '@app/shared/types/chat'

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

type MockRow = Record<string, unknown>

function createInMemorySqliteState(initial?: {
  userVersion?: number
  columns?: string[]
  rows?: MockRow[]
  indexes?: string[]
}) {
  const state = {
    userVersion: initial?.userVersion ?? 0,
    columns: [...(initial?.columns ?? [])],
    rows: [...(initial?.rows ?? [])],
    indexes: new Set<string>(initial?.indexes ?? []),
    executedQueries: [] as string[],
  }

  const executeSql = jest.fn(
    (
      sql: string,
      params: unknown[] = [],
      onSuccess?: (tx: {executeSql: typeof executeSql}, result: unknown) => void,
      onError?: (tx: {executeSql: typeof executeSql}, err: Error) => boolean,
    ) => {
      const normalized = sql.trim()
      state.executedQueries.push(normalized)
      const txObj = {executeSql}

      try {
        // 1. PRAGMA user_version 조회
        if (/^PRAGMA user_version;$/i.test(normalized)) {
          onSuccess?.(txObj, {
            rows: {
              length: 1,
              item: () => ({user_version: state.userVersion}),
            },
          })
          return
        }

        // 2. PRAGMA user_version 설정
        const setVersionMatch = normalized.match(
          /^PRAGMA user_version\s*=\s*(\d+);?$/i,
        )
        if (setVersionMatch) {
          state.userVersion = Number(setVersionMatch[1])
          onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
          return
        }

        // 3. PRAGMA table_info(messages) 조회
        if (/^PRAGMA table_info\(messages\);?$/i.test(normalized)) {
          const items = state.columns.map(name => ({name}))
          onSuccess?.(txObj, {
            rows: {
              length: items.length,
              item: (idx: number) => items[idx],
            },
          })
          return
        }

        // 3-1. PRAGMA index_list(messages) 조회
        if (/^PRAGMA index_list\(messages\);?$/i.test(normalized)) {
          const items = Array.from(state.indexes).map(name => ({name}))
          onSuccess?.(txObj, {
            rows: {
              length: items.length,
              item: (idx: number) => items[idx],
            },
          })
          return
        }

        // 4. CREATE TABLE IF NOT EXISTS messages (...)
        if (/^CREATE TABLE IF NOT EXISTS messages/i.test(normalized)) {
          const bodyMatch = normalized.match(/\(([\s\S]*)\)/)
          if (bodyMatch) {
            const colNames = bodyMatch[1]
              .split(',')
              .map(line => line.trim().split(/\s+/)[0])
              .filter(Boolean)
            state.columns = colNames
          }
          onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
          return
        }

        // 5. ALTER TABLE messages ADD COLUMN <colName> <type> [DEFAULT <val>]
        const alterMatch = normalized.match(
          /^ALTER TABLE messages ADD COLUMN\s+(\w+)\s+([^;]+);?$/i,
        )
        if (alterMatch) {
          const colName = alterMatch[1]
          const colSpec = alterMatch[2]
          if (!state.columns.includes(colName)) {
            state.columns.push(colName)
          }

          let defaultValue: unknown = null
          const defaultMatch = colSpec.match(/DEFAULT\s+('([^']*)'|(\d+))/i)
          if (defaultMatch) {
            defaultValue =
              defaultMatch[2] !== undefined
                ? defaultMatch[2]
                : Number(defaultMatch[3])
          }

          state.rows = state.rows.map(row => ({
            ...row,
            [colName]: row[colName] !== undefined ? row[colName] : defaultValue,
          }))

          onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
          return
        }

        // 6. CREATE INDEX IF NOT EXISTS <indexName> ON messages ...
        const indexMatch = normalized.match(
          /^CREATE INDEX IF NOT EXISTS\s+(\w+)\s+ON\s+messages/i,
        )
        if (indexMatch) {
          state.indexes.add(indexMatch[1])
          onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
          return
        }

        // 7. INSERT OR REPLACE INTO messages (...) VALUES (...)
        if (/^INSERT OR REPLACE INTO messages/i.test(normalized)) {
          const row: MockRow = {}
          MESSAGES_COLUMNS.forEach((col, idx) => {
            row[col] = params[idx]
          })
          const existingIdx = state.rows.findIndex(r => r.id === row.id)
          if (existingIdx >= 0) {
            state.rows[existingIdx] = row
          } else {
            state.rows.push(row)
          }
          onSuccess?.(txObj, {
            rowsAffected: 1,
            rows: {length: 0, item: () => undefined},
          })
          return
        }

        // 8. SELECT * FROM messages WHERE roomId = ? [AND seq < ?] ORDER BY seq DESC LIMIT ?
        if (
          /^SELECT \* FROM messages WHERE roomId = \?.*ORDER BY seq DESC LIMIT \?$/i.test(
            normalized,
          )
        ) {
          const hasCursor = /AND seq < \?/i.test(normalized)
          const roomId = params[0] as string
          const cursorSeq = hasCursor ? (params[1] as number) : undefined
          const limit = (hasCursor ? params[2] : params[1]) as number

          const filtered = state.rows
            .filter(r => r.roomId === roomId)
            .filter(r =>
              cursorSeq !== undefined ? Number(r.seq ?? 0) < cursorSeq : true,
            )
            .sort((a, b) => Number(b.seq ?? 0) - Number(a.seq ?? 0))
            .slice(0, limit)
            .map(r => ({...r}))

          onSuccess?.(txObj, {
            rows: {
              length: filtered.length,
              item: (idx: number) => filtered[idx],
            },
          })
          return
        }

        // 9. SELECT * FROM messages WHERE roomId = ? AND id = ? LIMIT 1
        if (
          /^SELECT \* FROM messages WHERE roomId = \? AND id = \? LIMIT 1$/i.test(
            normalized,
          )
        ) {
          const [roomId, messageId] = params as [string, string]
          const found = state.rows.find(
            r => r.roomId === roomId && r.id === messageId,
          )
          const resultRows = found ? [{...found}] : []
          onSuccess?.(txObj, {
            rows: {
              length: resultRows.length,
              item: (idx: number) => resultRows[idx],
            },
          })
          return
        }

        onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
      } catch (err) {
        onError?.(txObj, err as Error)
      }
    },
  )

  ;(db.transaction as jest.Mock).mockImplementation(
    (
      txCallback: (tx: {executeSql: typeof executeSql}) => void,
      _errorCallback?: (err: Error) => void,
      successCallback?: () => void,
    ) => {
      txCallback({executeSql})
      successCallback?.()
    },
  )

  return {state, executeSql}
}

describe('SQLite 메시지 테이블 마이그레이션 및 조회 정합성', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. 버전별 마이그레이션(v1, v4 -> v6) 및 컬럼/인덱스 검증', () => {
    it('v1 유저가 마이그레이션 수행 시 v6까지 업그레이드되며 최신 컬럼 개수 및 인덱스가 동일하게 보장된다', async () => {
      const {state} = createInMemorySqliteState({
        userVersion: 1,
        columns: MESSAGE_COLUMNS_V1,
      })

      expect(state.columns).toHaveLength(9)

      await messageMigrateService.ensureMessageColumns()
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

      await messageMigrateService.ensureMessageColumns()
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
        userVersion: 0,
        columns: [],
      })

      await messageMigrateLocal.initMessageTable()
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
  })

  describe('2. 마이그레이션 이후 채팅 메시지(일반 텍스트, 이미지, AI 메시지) 조회 정합성', () => {
    it('v1에서 마이그레이션된 후 기존 텍스트 메시지와 새로 저장된 AI/이미지 메시지가 동일하게 조회된다', async () => {
      const roomId = 'room-migrate-1'
      const v1CreatedAt = 1700000001000

      // v1 시절에 저장되어 있던 텍스트 메시지
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

      // v1 -> v6 마이그레이션 실행
      await messageMigrateService.ensureMessageColumns()
      expect(state.userVersion).toBe(6)

      // 마이그레이션 이후 신규 텍스트 + AI 메시지 저장
      const newMessages: ChatMessage[] = [
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
      ]

      await messageLocal.saveMessagesToSQLite(roomId, newMessages)

      const loadedMessages = await messageLocal.getChatMessagesBySeq(
        roomId,
        undefined,
        20,
      )

      // seq DESC 정렬(3 -> 2 -> 0(v1 기본값))로 3개 모두 정상 조회되는지 확인
      expect(loadedMessages).toHaveLength(3)
      expect(loadedMessages.map(m => m.id)).toEqual([
        'msg-v6-ai',
        'msg-v6-text',
        'msg-v1-text',
      ])

      // 1) AI 메시지 필드 검증
      expect(loadedMessages[0]).toMatchObject({
        id: 'msg-v6-ai',
        type: 'ai_text',
        text: '안녕하세요! AI 응답 메시지입니다.',
        seq: 3,
        status: 'success',
        aiResponseExpiresAt: 1700000063000,
      })

      // 2) 신규 일반 텍스트 메시지 검증
      expect(loadedMessages[1]).toMatchObject({
        id: 'msg-v6-text',
        type: 'text',
        text: '마이그레이션 이후 텍스트 메시지',
        seq: 2,
        status: 'success',
      })

      // 3) v1 시절 텍스트 메시지 보존 및 마이그레이션 기본값(seq: 0, status: 'success') 검증
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

    it('v4에서 마이그레이션된 후 기존 텍스트/이미지/AI 메시지가 손실 없이 동일하게 출력된다', async () => {
      const roomId = 'room-migrate-4'

      // v4 시절 저장된 일반 텍스트, 다중 이미지, AI 메시지 (aiResponseExpiresAt 컬럼 추가 전)
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

      // v4 -> v6 마이그레이션 실행
      await messageMigrateService.ensureMessageColumns()
      expect(state.userVersion).toBe(6)

      const loadedMessages = await messageLocal.getChatMessagesBySeq(
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

      // AI 메시지 확인
      expect(loadedMessages[0]).toMatchObject({
        id: 'msg-v4-ai',
        type: 'ai_text',
        text: 'v4 시절 AI 메시지 응답',
        seq: 12,
        aiResponseExpiresAt: null,
      })

      // 이미지 메시지 imageUrls 배열 파싱 확인
      expect(loadedMessages[1]).toMatchObject({
        id: 'msg-v4-image',
        type: 'image',
        seq: 11,
        imageUrls: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
        ],
      })

      // 일반 텍스트 메시지 단건 상세 조회(getMessageById)도 동일한지 확인
      const detailTextMsg = await messageLocal.getMessageById(
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
})

