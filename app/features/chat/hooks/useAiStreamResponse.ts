import type {ChatMessage} from '@app/shared/types/chat'
import {useCallback, useEffect, useRef, useState} from 'react'
import {aiService} from '../service/aiService'
import {logAiPerf} from '../utils/aiPerfLogger'

export interface UseAiStreamOptions {
  chatId?: string
  item?: ChatMessage
  enabled?: boolean
}

/**
 * [Interview Point]
 * 컴포넌트 라이프사이클과 독립적인 중복 요청 방지 처리를 위해 전역 Set 사용.
 * 화면 전환이나 재마운트 시 이미 진행 중인 스트리밍이 다시 시작되는 현상을 원천 차단합니다.
 */
const processedMessageIds = new Set<string>()

/**
 * AI 응답 스트리밍 및 자연스러운 타이핑 효과를 위한 커스텀 훅
 * 단순히 수신 데이터를 출력하는 것을 넘어, 데이터 수신 속도와 출력 속도 간의 차이를
 * 'Buffer(Backlog)' 개념으로 제어하여 사용자에게 부드러운 읽기 경험을 제공합니다.
 */
export const useAiStreamResponse = (params: UseAiStreamOptions) => {
  const {chatId, item, enabled = true} = params

  const [displayText, setDisplayText] = useState<string>('') // 화면에 렌더링될 '가공된' 텍스트
  const [isStreaming, setIsStreaming] = useState<boolean>(false) // API 통신 상태
  const [error, setError] = useState<Error | null>(null)

  /**
   * [UX Optimization] Ref를 활용한 데이터 관리
   * 렌더링에 즉시 영향을 주지 않아도 되는 원본 데이터와 커서 위치는
   * Ref로 관리하여 불필요한 리렌더링 오버헤드를 줄입니다.
   */
  const fullTextRef = useRef<string>('') // 서버로부터 수신된 실제 전체 텍스트 원본
  const cursorRef = useRef<number>(0) // 타이핑 효과가 현재 진행 중인 글자 위치
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null) // 애니메이션 타이머
  const perfRef = useRef({
    startAt: 0,
    firstChunkAt: 0,
    firstRenderAt: 0,
    chunkCount: 0,
  })

  // 메모리 누수 방지 및 재마운트 시 정합성을 위한 처리
  const isPreviouslyProcessed = useRef<boolean>(
    !!item?.id && processedMessageIds.has(item.id),
  )

  /**
   * [Core Logic] 자연스러운 타이핑 효과 (Smooth Typing Effect)
   * 서버로부터 들어오는 데이터(Backlog)가 많을 때는 더 빠르게,
   * 적을 때는 한 글자씩 천천히 출력되도록 유동적으로 가속도를 조절합니다.
   */
  useEffect(() => {
    if (isPreviouslyProcessed.current) return

    const startTyping = () => {
      if (timerRef.current) return

      timerRef.current = setInterval(() => {
        const backlog = fullTextRef.current.length - cursorRef.current // 아직 화면에 그려지지 않은 텍스트 양

        if (backlog > 0) {
          // 데이터가 쌓여있을 경우(Backlog 발생 시) 가변 속도 적용 (1~5자 사이)
          const charsToAdd = Math.max(1, Math.min(5, Math.ceil(backlog / 10)))
          cursorRef.current += charsToAdd
          setDisplayText(fullTextRef.current.substring(0, cursorRef.current))

          if (!perfRef.current.firstRenderAt) {
            perfRef.current.firstRenderAt = performance.now()
            logAiPerf({
              scope: 'stream',
              event: 'firstTextRendered',
              messageId: item?.id,
              startedAt: perfRef.current.startAt,
              at: perfRef.current.firstRenderAt,
            })
          }
        } else if (!isStreaming) {
          // 모든 데이터가 수신되었고 출력이 완료되었으면 타이머 종료
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        }
      }, 20) // 20ms 간격으로 업데이트하여 인간의 가독 효율에 최적화
    }

    startTyping()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isStreaming, item?.id])

  /**
   * SSE(Server-Sent Events) 스트리밍 시작 함수
   */
  const startStreaming = useCallback(
    async (targetChatId: string, targetItem: ChatMessage) => {
      const targetMessageId = targetItem.id

      // 1. 멱등성 검사: 동일 메시지 ID에 대한 중복 스트리밍 차단
      if (targetMessageId && processedMessageIds.has(targetMessageId)) {
        return
      }

      if (targetMessageId) {
        processedMessageIds.add(targetMessageId)
      }

      setDisplayText('')
      fullTextRef.current = ''
      cursorRef.current = 0
      setIsStreaming(true)
      setError(null)
      perfRef.current = {
        startAt: performance.now(),
        firstChunkAt: 0,
        firstRenderAt: 0,
        chunkCount: 0,
      }

      logAiPerf({
        scope: 'stream',
        event: 'requestStart',
        messageId: targetMessageId,
      })

      try {
        // 2. aiService를 통한 SSE 통신 호출
        await aiService.requestAiResponse({
          chatId: targetChatId,
          item: targetItem,
          onChunk: (chunk: string) => {
            // [Data Partitioning] 수신된 척(Chunk)을 원본 Ref에 누적하고,
            // 타이핑 타이머가 이를 감지하여 화면에 순차적으로 노출함
            fullTextRef.current += chunk
            perfRef.current.chunkCount += 1

            if (!perfRef.current.firstChunkAt) {
              perfRef.current.firstChunkAt = performance.now()
              logAiPerf({
                scope: 'stream',
                event: 'firstChunkBuffered',
                messageId: targetMessageId,
                startedAt: perfRef.current.startAt,
                at: perfRef.current.firstChunkAt,
              })
            }
          },
          onDone: () => {
            setIsStreaming(false) // 스트리밍 완료 핸들러
            logAiPerf({
              scope: 'stream',
              event: 'streamDone',
              messageId: targetMessageId,
              startedAt: perfRef.current.startAt,
              metrics: {
                chunks: perfRef.current.chunkCount,
                chars: fullTextRef.current.length,
              },
            })
            if (targetMessageId) processedMessageIds.delete(targetMessageId)
          },
          onError: (err: unknown) => {
            logAiPerf({
              scope: 'stream',
              event: 'streamError',
              messageId: targetMessageId,
              startedAt: perfRef.current.startAt,
            })
            setError(err instanceof Error ? err : new Error(String(err)))
            setIsStreaming(false)
          },
        })
      } catch (err: unknown) {
        logAiPerf({
          scope: 'stream',
          event: 'requestError',
          messageId: targetMessageId,
          startedAt: perfRef.current.startAt,
        })
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsStreaming(false)
      }
    },
    [],
  )

  // 컴포넌트 마운트 시 조건에 따른 자동 시작 전략
  useEffect(() => {
    if (
      enabled &&
      chatId &&
      item &&
      (item.prompt || item.imageUrl || item.imageUrls?.length) &&
      !isStreaming &&
      fullTextRef.current === ''
    ) {
      startStreaming(chatId, item)
    }
  }, [enabled, chatId, item, startStreaming, isStreaming])

  const resetStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setDisplayText('')
    fullTextRef.current = ''
    cursorRef.current = 0
    setIsStreaming(false)
    setError(null)
  }, [])

  return {
    streamedText: displayText, // 화면에 그려질 실시간 텍스트
    isStreaming, // 현재 진행 중 여부 (스피너 제어용)
    error,
    startStreaming,
    resetStream,
  }
}
