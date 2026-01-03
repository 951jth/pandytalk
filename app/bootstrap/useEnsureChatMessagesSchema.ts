import {messageMigrate} from '@app/features/chat/data/messageLocal.migrate.sqlite'
import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {safeCall} from '@app/shared/utils/call'
import {useEffect} from 'react'

export default function useEnsureChatMessagesSchema() {
  // 로컬 DB 테이블 준비 (그대로 유지)
  useEffect(() => {
    safeCall(async () => {
      //sqlite table 생성유무 체크
      const exists = await messageLocal.isMessagesTableExists()
      if (!exists) {
      } else await messageMigrate.migrateDatabaseIfNeeded()
    })
  }, [])
}
