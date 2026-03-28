import {useState, useCallback, useRef, useEffect} from 'react'
import {aiService} from '../service/aiService'

/**
 * AI 응답 스트리밍 및 동적 렌더링을 위한 커스텀 훅
 * SSE로부터 수신된 원본 텍스트를 담아둔 뒤, 자연스러운 타이핑 효과를 통해 화면에 출력합니다.
 */
export const useAiStreamResponse = (options?: {
  typingSpeed?: number // 각 글자별 출력 간격 (ms)
  skipTyping?: boolean // 타이핑 효과 없이 즉시 출력할지 여부
}) => {
  const {typingSpeed = 20, skipTyping = false} = options || {}

  const [displayText, setDisplayText] = useState<string>('') // 화면에 실시간으로 보여줄 텍스트
  const [isStreaming, setIsStreaming] = useState<boolean>(false) // API 통신 중 여부
  const [error, setError] = useState<Error | null>(null)

  // 실제 서버로부터 수신된 모든 텍스트 원본 (불변성 유지를 위해 ref 사용)
  const fullTextRef = useRef<string>('')
  // 현재까지 화면에 출력된 텍스트의 누적 길이
  const cursorRef = useRef<number>(0)
  // 타이핑 애니메이션을 위한 타이머
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 동적 타이핑 효과 (Text-to-UI Animation)
  useEffect(() => {
    if (skipTyping) return

    // 수신 중이거나 아직 출력할 텍스트가 남았을 때 타이머 작동
    const startTyping = () => {
      // 이미 동작 중이면 중복 실행 방지
      if (timerRef.current) return

      timerRef.current = setInterval(() => {
        // 서버에서 온 텍스트가 더 많고, 아직 다 못 출력했다면 한 글자씩 밀어넣음
        if (cursorRef.current < fullTextRef.current.length) {
          cursorRef.current += 1
          setDisplayText(fullTextRef.current.substring(0, cursorRef.current))
        } else if (!isStreaming) {
          // 서버 응답이 끝났고 타이핑도 모두 끝났으면 타이머 완전 중지
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
   * 스트리밍을 시작합니다.
   * @param chatId 채팅방 ID
   * @param userQuestion 사용자 질문
   */
  const startStreaming = useCallback(
    async (chatId: string, userQuestion: string) => {
      // 1. 상태 초기화
      setDisplayText('')
      fullTextRef.current = ''
      cursorRef.current = 0
      setIsStreaming(true)
      setError(null)

      try {
        await aiService.requestAiResponse(
          chatId,
          userQuestion,
          (chunk: string) => {
            // 원본 텍스트에 청크 실시간 누적
            fullTextRef.current += chunk
            
            // 만약 타이팅 효과(skipTyping)를 건너뛰는 경우 바로 상태 업데이트
            if (skipTyping) {
              setDisplayText(fullTextRef.current)
            }
          },
          () => {
            // [DONE] 신호 수신 시 통신 플래그만 세움 (타이핑은 계속 진행될 수 있음)
            setIsStreaming(false)
          },
          (err: any) => {
            console.error('[useAiStreamResponse] Stream Error:', err)
            setError(err instanceof Error ? err : new Error(String(err)))
            setIsStreaming(false)
          },
        )
      } catch (err: any) {
        console.error('[useAiStreamResponse] Init Error:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsStreaming(false)
      }
    },
    [skipTyping],
  )

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
    streamedText: displayText, // 실시간 렌더링 중인 텍스트
    isStreaming,               // 실제 스트리밍 통신 중 여부
    isTyping: cursorRef.current < fullTextRef.current.length, // 타이핑 애니메이션 진행 중 여부
    error,
    startStreaming,
    resetStream,
  }
}
