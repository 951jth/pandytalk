import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {
  messageLocalTest,
  type TargetOldVersion,
} from '@app/features/chat/data/messageLocal.test.sqlite'
import {
  messageMigrateLocal,
  type MessageColumnSchema,
} from '@app/features/chat/data/messagLocal.migrate.sqlite'
import type {ChatMessage} from '@app/shared/types/chat'

export type SqliteDebugSnapshot = {
  userVersion: number
  indexes: string[]
  columns: MessageColumnSchema[]
  missingColumns: string[]
  messages: ChatMessage[]
}

export const messageTestService = {
  //message테이블을 구버전으로 (테스트용)
  migrateToLatest: async (version: TargetOldVersion) => {
    try {
      // 1) v1 DB를 실제로 만든다
      await messageLocal.clearAllMessages()
      await messageLocalTest.resetMessagesToOldSchema(version)
      const msgs = await messageLocal.getAllMessages()
      console.log('migrateToLatest Messages: ', msgs)
      const vs = await messageMigrateLocal.getUserVersion()
      console.log('migrateToLatest Version: ', vs)
    } catch (e) {
      console.log(e)
    }
  },
  // SQLite 현재 버전, 인덱스, 컬럼 스키마, 저장된 데이터 전체 조회 (디버그용)
  inspectSqliteStatus: async (): Promise<SqliteDebugSnapshot> => {
    const [userVersion, indexes, columns, missingColumns, messages] =
      await Promise.all([
        messageMigrateLocal.getUserVersion(),
        messageMigrateLocal.getMessageIndexes(),
        messageMigrateLocal.getMessageColumnsSchema(),
        messageMigrateLocal.getMissingColumns(),
        messageLocal.getAllMessages(),
      ])

    console.log('=== 📊 [SQLite Debug Snapshot] ===')
    console.log('1. Migration Version (user_version):', userVersion)
    console.log('2. Indexes:', indexes)
    console.log('3. Columns Schema:', columns)
    console.log('4. Missing Columns:', missingColumns)
    console.log(`5. Stored Messages (${messages.length}):`, messages)

    return {
      userVersion,
      indexes,
      columns,
      missingColumns,
      messages,
    }
  },
}
