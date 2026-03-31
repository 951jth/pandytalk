import EventSource from 'react-native-sse'
import {AI_STREAM_URL} from '@shared/constants/ai'

export interface AiStreamParams {
  chatId: string
  prompt: string
  messageId?: string
  onChunk: (text: string) => void
  onDone: () => void
  onError: (error: any) => void
}

export const aiRemote = {
  /**
   * AI 응답 스트림을 시작합니다 (react-native-sse 방식)
   * 전용 라이브러리를 사용하여 SSE 연결의 안정성과 가독성을 높였습니다.
   * @returns 연결을 닫을 수 있는 함수가 포함된 객체
   */
  streamAiResponse: ({
    chatId,
    prompt,
    messageId,
    onChunk,
    onDone,
    onError,
  }: AiStreamParams) => {
    try {
      // 1. SSE 연결 시작 (POST 방식 지원)
      const es = new EventSource<any>(AI_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          prompt,
          messageId,
        }),
      })

      // 2. 메시지 수신 이벤트 핸들러
      es.addEventListener('message', (event) => {
        if (!event.data) return

        if (event.data === '[DONE]') {
          es.close()
          onDone()
          return
        }

        try {
          const parsed = JSON.parse(event.data)
          if (parsed.text) {
            onChunk(parsed.text)
          } else if (parsed.error) {
            onError(new Error(parsed.error))
            es.close()
          }
        } catch (e) {
          console.warn('[aiRemote] JSON Parse Error:', e, 'data:', event.data)
        }
      })

      // 3. 에러 발생 이벤트 핸들러
      es.addEventListener('error', (event) => {
        const errorEvent = event as unknown as {
          message?: string
          xhrStatus?: number
          type: string
        }

        console.error('[aiRemote] SSE Error:', errorEvent)

        // 에러 발생 시 연결 종료 및 콜백 호출
        onError(new Error(errorEvent.message || 'SSE connection failed'))
        es.close()
      })

      // 4. 외부에서 연결을 수동으로 닫을 수 있도록 close 함수 반환
      return {
        close: () => {
          console.log('[aiRemote] Manual stream close triggered')
          es.close()
        },
      }
    } catch (error) {
      onError(error)
      return {close: () => {}}
    }
  },
}
