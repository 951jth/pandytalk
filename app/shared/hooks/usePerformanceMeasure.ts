import {useCallback, useState} from 'react'

export interface PerformanceResult {
  tag: string
  duration: number
  timestamp: number
}

/**
 * CRUD 작업이나 비동기 함수의 성능(Latency)을 측정하기 위한 커스텀 훅
 */
export const usePerformanceMeasure = () => {
  const [results, setResults] = useState<PerformanceResult[]>([])

  const measureAsync = useCallback(
    async <T>(tag: string, fn: () => Promise<T>): Promise<T> => {
      const start = performance.now()
      try {
        const result = await fn()
        const end = performance.now()
        const duration = end - start

        const newResult: PerformanceResult = {
          tag,
          duration,
          timestamp: Date.now(),
        }

        if (__DEV__) {
          console.log(`[Performance][${tag}] ${duration.toFixed(2)}ms`)
        }

        setResults(prev => [...prev, newResult].slice(-50))
        return result
      } catch (error) {
        const end = performance.now()
        if (__DEV__) {
          console.error(
            `[Performance][${tag}] Failed after ${(end - start).toFixed(2)}ms`,
            error,
          )
        }
        throw error
      }
    },
    [],
  )

  const measureSync = useCallback(<T>(tag: string, fn: () => T): T => {
    const start = performance.now()
    try {
      const result = fn()
      const end = performance.now()
      const duration = end - start

      const newResult: PerformanceResult = {
        tag,
        duration,
        timestamp: Date.now(),
      }

      if (__DEV__) {
        console.log(`[Performance][Sync][${tag}] ${duration.toFixed(2)}ms`)
      }

      setResults(prev => [...prev, newResult].slice(-50))
      return result
    } catch (error) {
      if (__DEV__) {
        console.error(`[Performance][Sync][${tag}] Failed`, error)
      }
      throw error
    }
  }, [])

  const clearResults = useCallback(() => setResults([]), [])

  const getAverage = useCallback(
    (tag: string) => {
      const filtered = results.filter(r => r.tag === tag)
      if (filtered.length === 0) return 0
      const sum = filtered.reduce((acc, curr) => acc + curr.duration, 0)
      return sum / filtered.length
    },
    [results],
  )

  return {
    measureAsync,
    measureSync,
    results,
    clearResults,
    getAverage,
  }
}
