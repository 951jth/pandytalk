import {messageMigrateLocal} from '@app/features/chat/data/messagLocal.migrate.sqlite'

export const messageMigrateService = {
  ensureMessageColumns: async () => {
    await messageMigrateLocal.migrateDatabaseIfNeeded()
    //과거에 sqlite를 생성할 떄 일부 컬럼값을 뺴먹은 적이 있엇는데,
    //이런 경우에는 ALTER TABLE명령어로만은 모든 오류를 제어하기 어려운 부분이있엇음
    //그런 경우에 한정하여 메세지 테이블만 삭제후 재생성함
    const missingColumns = await messageMigrateLocal.getMissingColumns()
    if (missingColumns?.length > 0) {
      await messageMigrateLocal.rebuildMessageTable()
    }
  },
}
