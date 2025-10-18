/** 배열을 지정 크기로 쪼개기 */
export function chunkBy<T>(arr: T[], size: number): T[][] {
  if (!Array.isArray(arr) || size <= 0) return []
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
