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

export const handleFirebaseAuthError = (error: any): string => {
  let message = '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'
  switch (error?.code) {
    case 'auth/invalid-email':
      message = '이메일 형식이 올바르지 않습니다.'
      break
    case 'auth/user-not-found':
      message = '등록되지 않은 이메일입니다.'
      break
    case 'auth/wrong-password':
      message = '비밀번호가 일치하지 않습니다.'
      break
    case 'auth/user-disabled':
      message = '이 계정은 비활성화되어 있습니다.'
      break
    case 'auth/too-many-requests':
      message = '잠시 후 다시 시도해주세요. 요청이 너무 많습니다.'
      break
    case 'auth/invalid-credential':
      // 잘못된 이메일/비밀번호
      message = `잘못된 이메일/비밀번호 입니다.`
      break
    // 필요시 추가
  }
  return message
  // setError(message)
}
