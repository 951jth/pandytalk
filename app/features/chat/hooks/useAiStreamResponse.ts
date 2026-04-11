import {useCallback, useEffect, useRef, useState} from 'react'
import {aiService} from '../service/aiService'

export interface UseAiStreamOptions {
  chatId?: string
  prompt?: string
  messageId?: string
  imageUrl?: string
  enabled?: boolean
  // typingSpeed?: number // [비교용] 각 글자별 출력 간격 (ms)
  // skipTyping?: boolean // [비교용] 타이핑 효과 없이 즉시 출력할지 여부
}

/**
 * AI 응답 스트리밍 및 동적 렌더링을 위한 커스텀 훅
 * SSE로부터 수신된 텍스트를 즉시 화면에 출력합니다.
 */
export const useAiStreamResponse = (params: UseAiStreamOptions) => {
  const {chatId, prompt, messageId, imageUrl, enabled = true} = params

  const [displayText, setDisplayText] = useState<string>('') // 화면에 실시간으로 보여줄 텍스트
  const [isStreaming, setIsStreaming] = useState<boolean>(false) // API 통신 중 여부
  const [error, setError] = useState<Error | null>(null)

  // 실제 서버로부터 수신된 모든 텍스트 원본 (불변성 유지를 위해 ref 사용)
  const fullTextRef = useRef<string>('')

  /* [비교용] 타이핑 애니메이션 관련 Refs 및 효과
   */

  const cursorRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // if (skipTyping) return

    const startTyping = () => {
      if (timerRef.current) return

      timerRef.current = setInterval(() => {
        const backlog = fullTextRef.current.length - cursorRef.current
        if (backlog > 0) {
          const charsToAdd = Math.max(1, Math.min(5, Math.ceil(backlog / 10)))
          cursorRef.current += charsToAdd
          setDisplayText(fullTextRef.current.substring(0, cursorRef.current))
        } else if (!isStreaming) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        }
      }, 20) // typingSpeed 대용
    }

    startTyping()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isStreaming])

  /**
   * 스트리밍을 수동으로 시작합니다.
   */
  const startStreaming = useCallback(
    async (
      targetChatId: string,
      targetPrompt: string,
      targetMessageId?: string,
      targetImageUrl?: string,
    ) => {
      setDisplayText('')
      fullTextRef.current = ''
      // cursorRef.current = 0 // [비교용]
      setIsStreaming(true)
      setError(null)

      try {
        await aiService.requestAiResponse(
          targetChatId,
          targetPrompt,
          (chunk: string) => {
            fullTextRef.current += chunk
            // 서버로부터 온 데이터를 즉시 업데이트 (타이핑 효과 사용 시 이 줄을 주석 처리)
            // setDisplayText(fullTextRef.current)
          },
          () => {
            setIsStreaming(false)
          },
          (err: any) => {
            console.error('[useAiStreamResponse] Stream Error:', err)
            setError(err instanceof Error ? err : new Error(String(err)))
            setIsStreaming(false)
          },
          targetMessageId,
          targetImageUrl,
        )
      } catch (err: any) {
        console.error('[useAiStreamResponse] Init Error:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsStreaming(false)
      }
    },
    [],
  )

  // 파라미터가 모두 존재하고 enabled가 true일 때 자동 시작
  useEffect(() => {
    if (
      enabled &&
      chatId &&
      prompt &&
      !isStreaming &&
      fullTextRef.current === ''
    ) {
      startStreaming(chatId, prompt, messageId, imageUrl)
    }
  }, [enabled, chatId, prompt, messageId, imageUrl, startStreaming, isStreaming])

  /**
   * 상태 완전 초기화
   */
  const resetStream = useCallback(() => {
    setDisplayText('')
    fullTextRef.current = ''
    setIsStreaming(false)
    setError(null)
  }, [])

  return {
    streamedText: displayText,
    isStreaming,
    error,
    startStreaming,
    resetStream,
  }
}
