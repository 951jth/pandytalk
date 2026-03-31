import {useCallback, useEffect, useRef, useState} from 'react'
import {aiService} from '../service/aiService'

export interface UseAiStreamOptions {
  chatId?: string
  prompt?: string
  messageId?: string
  enabled?: boolean
  typingSpeed?: number // 각 글자별 출력 간격 (ms)
  skipTyping?: boolean // 타이핑 효과 없이 즉시 출력할지 여부
}

/**
 * AI 응답 스트리밍 및 동적 렌더링을 위한 커스텀 훅
 * SSE로부터 수신된 원본 텍스트를 담아둔 뒤, 자연스러운 타이핑 효과를 통해 화면에 출력합니다.
 */
export const useAiStreamResponse = (params: UseAiStreamOptions) => {
  const {
    chatId,
    prompt,
    messageId,
    enabled = true,
    typingSpeed = 20,
    skipTyping = false,
  } = params

  const [displayText, setDisplayText] = useState<string>('') // 화면에 실시간으로 보여줄 텍스트
  const [isStreaming, setIsStreaming] = useState<boolean>(false) // API 통신 중 여부
  const [error, setError] = useState<Error | null>(null)

  // 실제 서버로부터 수신된 모든 텍스트 원본 (불변성 유지를 위해 ref 사용)
  const fullTextRef = useRef<string>('')
  // 현재까지 화면에 출력된 텍스트의 누적 길이
  const cursorRef = useRef<number>(0)
  // 타이핑 애니메이션을 위한 타이머
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // 현재 실행 중인 SSE 스트림의 제어 객체 (닫기용)
  const streamRef = useRef<{ close: () => void } | null>(null)

  // 1. 동적 타이핑 효과 (Text-to-UI Animation)
  useEffect(() => {
    if (skipTyping) return

    const startTyping = () => {
      if (timerRef.current) return

      timerRef.current = setInterval(() => {
        //밀려있는 글자 수 계산
        const backlog = fullTextRef.current.length - cursorRef.current
        if (backlog > 0) {
          // 밀린 글자가 많으면 한 번에 여러 글자(최대 5글자)씩, 적으면 1글자씩 출력
          const charsToAdd = Math.max(1, Math.min(5, Math.ceil(backlog / 10)))
          cursorRef.current += charsToAdd
          setDisplayText(fullTextRef.current.substring(0, cursorRef.current))
        } else if (!isStreaming) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        }
      }, typingSpeed)
    }

    startTyping()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isStreaming, skipTyping, typingSpeed])

  /**
   * 스트리밍을 수동으로 시작합니다.
   */
  const startStreaming = useCallback(
    async (
      targetChatId: string,
      targetPrompt: string,
      targetMessageId?: string,
    ) => {
      // 0. 기존에 실행 중인 스트림이 있다면 강제 종료
      if (streamRef.current) {
        console.log('[useAiStreamResponse] Aborting previous stream...')
        streamRef.current.close()
        streamRef.current = null
      }

      setDisplayText('')
      fullTextRef.current = ''
      cursorRef.current = 0
      setIsStreaming(true)
      setError(null)

      try {
        // AI 응답 요청 및 제어 객체 저장
        const stream = aiService.requestAiResponse(
          targetChatId,
          targetPrompt,
          (chunk: string) => {
            fullTextRef.current += chunk
            if (skipTyping) {
              setDisplayText(fullTextRef.current)
            }
          },
          () => {
            setIsStreaming(false)
            streamRef.current = null
          },
          (err: any) => {
            console.error('[useAiStreamResponse] Stream Error:', err)
            setError(err instanceof Error ? err : new Error(String(err)))
            setIsStreaming(false)
            streamRef.current = null
          },
          targetMessageId,
        )

        streamRef.current = stream
      } catch (err: any) {
        console.error('[useAiStreamResponse] Init Error:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsStreaming(false)
        streamRef.current = null
      }
    },
    [skipTyping],
  )

  // 1-1. 컴포넌트 언마운트 시 스트림 종료 보장
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        console.log('[useAiStreamResponse] Cleanup: Closing active stream')
        streamRef.current.close()
        streamRef.current = null
      }
    }
  }, [])

  // 2. 파라미터가 모두 존재하고 enabled가 true일 때 자동 시작
  useEffect(() => {
    if (
      enabled &&
      chatId &&
      prompt &&
      !isStreaming &&
      fullTextRef.current === ''
    ) {
      startStreaming(chatId, prompt, messageId)
    }
  }, [enabled, chatId, prompt, messageId, startStreaming, isStreaming])

  /**
   * 상태 및 타이머 완전 초기화
   */
  const resetStream = useCallback(() => {
    setDisplayText('')
    fullTextRef.current = ''
    cursorRef.current = 0
    setIsStreaming(false)
    setError(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    streamedText: displayText,
    isStreaming,
    isTyping: cursorRef.current < fullTextRef.current.length,
    error,
    startStreaming,
    resetStream,
  }
}
