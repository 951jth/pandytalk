import {messageMigrateLocal} from '@app/features/chat/data/messagLocal.migrate.sqlite'
import {messageMigrateService} from '@app/features/chat/service/messageMigrateService'
import {safeCall} from '@app/shared/utils/call'
import {useEffect} from 'react'

export default function useEnsureChatMessagesSchema() {
  // 로컬 DB 테이블 준비 (그대로 유지)
  useEffect(() => {
    safeCall(async () => {
      //sqlite table 생성유무 체크
      const exists = await messageMigrateLocal.isMessagesTableExists()
      if (!exists) {
        await messageMigrateLocal.initMessageTable()
      } else {
        await messageMigrateService.ensureMessageColumns()
      }
    })
  }, [])
}
