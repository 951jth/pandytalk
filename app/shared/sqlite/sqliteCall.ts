export async function sqliteCall<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!__DEV__) return await fn()

  console.group(`🧱 [SQLITE] ${label}`)
  const start = Date.now()
  try {
    const res = await fn()
    console.log(`✅ SUCCESS (${Date.now() - start}ms)`)
    return res
  } catch (e) {
    console.log(`❌ FAIL (${Date.now() - start}ms)`, e)
    throw e
  } finally {
    console.groupEnd()
  }
}
