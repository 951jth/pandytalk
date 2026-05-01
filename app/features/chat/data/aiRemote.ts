import {AI_STREAM_URL} from '@shared/constants/ai'
import EventSource from 'react-native-sse'

const AI_PERF_LOG_PREFIX = '[AI_PERF][client][sse]'

export interface AiStreamParams {
  chatId: string
  item: import('@app/shared/types/chat').ChatMessage
  onChunk: (text: string) => void
  onDone: () => void
  onError: (error: any) => void
}

export const aiRemote = {
  /**
   * AI 응답 스트림을 시작합니다 (react-native-sse 방식)
   * 전용 라이브러리를 사용하여 SSE 연결의 안정성과 가독성을 높였습니다.
   */
  streamAiResponse: async ({
    chatId,
    item,
    onChunk,
    onDone,
    onError,
  }: AiStreamParams) => {
    try {
      const startedAt = performance.now()
      let firstChunkAt = 0
      let chunkCount = 0
      let receivedChars = 0
      const messageId = item.id || 'unknown'

      if (__DEV__) {
        console.info(`${AI_PERF_LOG_PREFIX}[messageId=${messageId}] connect`)
      }

      // 1. SSE 연결 시작 (POST 방식 지원)
      const es = new EventSource<any>(AI_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          ...item,
          messageId: item.id, // 서버 하위 호환성 유지
        }),
      })

      // 2. 메시지 수신 이벤트 핸들러
      es.addEventListener('message', event => {
        if (!event.data) return

        if (event.data === '[DONE]') {
          if (__DEV__) {
            const doneAt = performance.now()
            console.info(
              `${AI_PERF_LOG_PREFIX}[messageId=${messageId}] done=${(
                doneAt - startedAt
              ).toFixed(2)}ms chunks=${chunkCount} chars=${receivedChars}`,
            )
          }
          es.close()
          onDone()
          return
        }

        const rawData = event.data.trim()

        // JSON 형식이 아닌 경우 (일반 텍스트가 바로 오는 경우 처리)
        if (!rawData.startsWith('{')) {
          chunkCount += 1
          receivedChars += rawData.length
          if (__DEV__ && !firstChunkAt) {
            firstChunkAt = performance.now()
            console.info(
              `${AI_PERF_LOG_PREFIX}[messageId=${messageId}] firstChunkReceived=${(
                firstChunkAt - startedAt
              ).toFixed(2)}ms`,
            )
          }
          onChunk(rawData)
          return
        }

        try {
          const parsed = JSON.parse(rawData)
          if (parsed && typeof parsed.text === 'string') {
            chunkCount += 1
            receivedChars += parsed.text.length
            if (__DEV__ && !firstChunkAt) {
              firstChunkAt = performance.now()
              console.info(
                `${AI_PERF_LOG_PREFIX}[messageId=${messageId}] firstChunkReceived=${(
                  firstChunkAt - startedAt
                ).toFixed(2)}ms`,
              )
            }
            onChunk(parsed.text)
          } else if (parsed && parsed.error) {
            onError(new Error(parsed.error))
            es.close()
          }
        } catch (e) {
          console.warn('[aiRemote] JSON Parse Error:', e, 'data:', event.data)
          // 파싱 실패 시 원본 데이터라도 보여줌
          onChunk(rawData)
        }
      })

      // 3. 에러 발생 이벤트 핸들러
      es.addEventListener('error', event => {
        const errorEvent = event as unknown as {
          message?: string
          xhrStatus?: number
          type: string
        }

        console.error('[aiRemote] SSE Error:', errorEvent)
        if (__DEV__) {
          const errorAt = performance.now()
          console.info(
            `${AI_PERF_LOG_PREFIX}[messageId=${messageId}] error=${(
              errorAt - startedAt
            ).toFixed(2)}ms`,
          )
        }

        // 에러 발생 시 연결 종료 및 콜백 호출
        onError(new Error(errorEvent.message || 'SSE connection failed'))
        es.close()
      })

      // 4. 연결 종료(close) 지원을 위해 필요한 경우 es 객체를 직접 다룰 수도 있음
      // 여기서는 이벤트 기반으로 모든 처리가 완료되도록 설계함
    } catch (error) {
      onError(error)
    }
  },
}
