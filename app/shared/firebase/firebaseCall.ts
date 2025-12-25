//파이어베이스 네트워크 요청 로깅용 함수.
export const firebaseCall = async <T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> => {
  if (!__DEV__) return await fn()

  console.group(`🔥 [SERVICE] ${label}`)
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    console.log(`✅ SUCCESS (${duration}ms)`)
    console.log(`📦 RESPONSE:`, result) // 결과값 확인
    console.groupEnd()
    return result
  } catch (error: any) {
    console.error(`❌ FAILED`)
    console.error(`📝 ERROR_CODE: ${error.code}`)
    console.error(`💬 MESSAGE: ${error.message}`)
    console.groupEnd()
    throw error
  }
}
