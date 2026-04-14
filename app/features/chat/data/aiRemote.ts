import {AI_STREAM_URL} from '@shared/constants/ai'
import EventSource from 'react-native-sse'

export interface AiStreamParams {
  chatId: string
  prompt: string
  messageId?: string
  imageUrl?: string
  imageUrls?: string[]
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
    prompt,
    messageId,
    imageUrl,
    imageUrls,
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
          imageUrl,
          imageUrls,
        }),
      })

      // 2. 메시지 수신 이벤트 핸들러
      es.addEventListener('message', event => {
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
      es.addEventListener('error', event => {
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

      // 4. 연결 종료(close) 지원을 위해 필요한 경우 es 객체를 직접 다룰 수도 있음
      // 여기서는 이벤트 기반으로 모든 처리가 완료되도록 설계함
    } catch (error) {
      onError(error)
    }
  },
}
