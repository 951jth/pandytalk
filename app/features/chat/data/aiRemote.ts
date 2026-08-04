import {AI_STREAM_URL} from '@shared/constants/ai'
import EventSource from 'react-native-sse'
import {logAiPerf} from '../utils/aiPerfLogger'

export interface AiStreamParams {
  chatId: string
  item: import('@app/shared/types/chat').ChatMessage
  onChunk: (text: string) => void
  onDone: () => void
  onError: (error: unknown) => void
}

export const aiRemote = {
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

      logAiPerf({scope: 'sse', event: 'connect', messageId})

      const es = new EventSource(AI_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          ...item,
          messageId: item.id,
        }),
      })

      const handleFirstChunk = () => {
        if (firstChunkAt) return

        firstChunkAt = performance.now()
        logAiPerf({
          scope: 'sse',
          event: 'firstChunkReceived',
          messageId,
          startedAt,
          at: firstChunkAt,
        })
      }

      es.addEventListener('message', event => {
        if (!event.data) return

        if (event.data === '[DONE]') {
          logAiPerf({
            scope: 'sse',
            event: 'done',
            messageId,
            startedAt,
            metrics: {
              chunks: chunkCount,
              chars: receivedChars,
            },
          })
          es.close()
          onDone()
          return
        }

        const rawData = event.data.trim()

        if (!rawData.startsWith('{')) {
          chunkCount += 1
          receivedChars += rawData.length
          handleFirstChunk()
          onChunk(rawData)
          return
        }

        try {
          const parsed = JSON.parse(rawData)

          if (parsed && typeof parsed.text === 'string') {
            chunkCount += 1
            receivedChars += parsed.text.length
            handleFirstChunk()
            onChunk(parsed.text)
          } else if (parsed && parsed.error) {
            onError(new Error(parsed.error))
            es.close()
          }
        } catch (e) {
          console.warn('[aiRemote] JSON Parse Error:', e, 'data:', event.data)
          onChunk(rawData)
        }
      })

      es.addEventListener('error', event => {
        const errorEvent = event as unknown as {
          message?: string
          xhrStatus?: number
          type: string
        }

        console.error('[aiRemote] SSE Error:', errorEvent)
        logAiPerf({
          scope: 'sse',
          event: 'error',
          messageId,
          startedAt,
        })

        onError(new Error(errorEvent.message || 'SSE connection failed'))
        es.close()
      })

      return {
        close: () => {
          es.close()
        },
      }
    } catch (error) {
      onError(error)
    }
  },
}
