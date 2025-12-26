export async function sqliteCall<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  // 배포 환경에서는 바로 실행
  if (!__DEV__) return await fn()

  // 1. [변경] group -> groupCollapsed (기본적으로 접힘)
  console.groupCollapsed(`🧱 [SQLITE] ${label}`)

  const start = Date.now()
  try {
    const res = await fn()
    // 2. [개선] 성공 로그에 결과값(res)을 함께 출력
    // 화살표를 눌러 펼치면 쿼리 결과를 바로 볼 수 있습니다.
    console.log(`✅ SUCCESS (${Date.now() - start}ms)`, res)
    return res
  } catch (e) {
    // 3. 실패 시에는 console.error 사용 (빨간색 강조)
    console.error(`❌ FAIL (${Date.now() - start}ms)`, e)
    throw e
  } finally {
    // 그룹 닫기 (필수)
    console.groupEnd()
  }
}
