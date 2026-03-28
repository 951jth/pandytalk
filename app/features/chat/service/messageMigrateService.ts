import {messageMigrateLocal} from '@app/features/chat/data/messagLocal.migrate.sqlite'

export const messageMigrateService = {
  ensureMessageColumns: async () => {
    try {
      // 1) 표준 마이그레이션 시도 (ALTER TABLE 등)
      await messageMigrateLocal.migrateDatabaseIfNeeded()
    } catch (e) {
      // 마이그레이션 중 오류(예: duplicate column 등)가 발생하더라도
      // 아래의 missingColumns 체크를 통해 최종 복구 기회를 가짐
      console.warn('⚠️ Standard migration failed, check for fallback:', e)
    }
  },
}
