type AiPerfMetricValue = string | number | boolean | null | undefined

interface LogAiPerfParams {
  scope: 'sse' | 'stream'
  event: string
  messageId?: string | null
  startedAt?: number
  at?: number
  metrics?: Record<string, AiPerfMetricValue>
}

// const formatMetricValue = (value: AiPerfMetricValue) => {
//   if (typeof value === 'number') {
//     return Number.isInteger(value) ? String(value) : value.toFixed(2)
//   }
//
//   if (value === null) return 'null'
//   if (typeof value === 'undefined') return 'n/a'
//
//   return String(value)
// }

// export const logAiPerf = ({
//   scope,
//   event,
//   messageId,
//   startedAt,
//   at = performance.now(),
//   metrics,
// }: LogAiPerfParams) => {
//   if (!__DEV__) return
//
//   const resolvedMessageId = messageId || 'unknown'
//   const lines = [
//     `--- [AI_PERF][client][${scope}] ${event} ---`,
//     `messageId : ${resolvedMessageId}`,
//   ]
//
//   if (typeof startedAt === 'number') {
//     lines.push(`elapsedMs : ${(at - startedAt).toFixed(2)}`)
//   }
//
//   Object.entries(metrics || {}).forEach(([key, value]) => {
//     lines.push(`${key} : ${formatMetricValue(value)}`)
//   })
//
//   lines.push('----------------------------------------')
//
//   console.info(lines.join('\n'))
// }

// 호출부를 유지한 채 성능 측정 로그 출력만 비활성화합니다.
export const logAiPerf = (_params: LogAiPerfParams) => undefined
