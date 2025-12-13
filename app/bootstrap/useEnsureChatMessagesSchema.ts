import {initChatTables, isMessagesTableExists} from '@app/db/sqlite'
import {migrateDatabaseIfNeeded} from '@app/shared/sqlite/migrate'
import {safeCall} from '@app/shared/utils/call'
import {useEffect} from 'react'

export default function useEnsureChatMessagesSchema() {
  // 로컬 DB 테이블 준비 (그대로 유지)
  useEffect(() => {
    safeCall(async () => {
      //sqlite table 생성유무 체크
      const exists = await isMessagesTableExists()
      if (!exists) {
        initChatTables()
      } else migrateDatabaseIfNeeded()
    })
  }, [])
}
