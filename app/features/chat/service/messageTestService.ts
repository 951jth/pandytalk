import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {
  messageLocalTest,
  type TargetOldVersion,
} from '@app/features/chat/data/messageLocal.test.sqlite'
import {messageMigrateLocal} from '@app/features/chat/data/messagLocal.migrate.sqlite'

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
}
