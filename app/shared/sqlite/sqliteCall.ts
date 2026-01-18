import {sqliteLock} from '@app/features/chat/utils/message'

const BE_QUITE = false

export async function sqliteCall<T>(
  label: string,
  fn: () => Promise<T>,
  opts?: {lock?: boolean}, // <- 선택 옵션
): Promise<T> {
  const run = () => fn()
  const shouldLock = opts?.lock ?? true
  //sqliteLock은 테이블이 삭제중 일때, sqlite요청이 완료될 떄 까지 기다리는 옵션임.
  const exec = () => (shouldLock ? sqliteLock.runExclusive(run) : run())

  // 배포 환경에서는 바로 실행(로그만 스킵). 락은 운영에서도 유지하는 게 안전함.
  if (!__DEV__ || BE_QUITE) return await exec()

  console.groupCollapsed(`🧱 [SQLITE] ${label}`)
  const start = Date.now()

  try {
    const res = await exec()
    console.log(`✅ SUCCESS (${Date.now() - start}ms)`, res)
    return res
  } catch (e) {
    console.error(`❌ FAIL (${Date.now() - start}ms)`, e)
    throw e
  } finally {
    console.groupEnd()
  }
}
