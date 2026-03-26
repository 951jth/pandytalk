import {AI_STREAM_URL} from '@shared/constants/ai'

export interface AiStreamParams {
  chatId: string
  userQuestion: string
  onChunk: (text: string) => void
  onDone: () => void
  onError: (error: any) => void
}

export const aiRemote = {
  /**
   * AI 응답 스트림을 시작합니다 (SSE 방식)
   */
  streamAiResponse: async ({
    chatId,
    userQuestion,
    onChunk,
    onDone,
    onError,
  }: AiStreamParams) => {
    try {
      const response = await fetch(AI_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          userQuestion,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('ReadableStream not supported')
      }

      while (true) {
        const {done, value} = await reader.read()
        if (done) {
          onDone()
          break
        }

        const chunk = decoder.decode(value, {stream: true})
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim()
            
            if (dataStr === '[DONE]') {
              onDone()
              return
            }

            try {
              const parsed = JSON.parse(dataStr)
              if (parsed.text) {
                onChunk(parsed.text)
              } else if (parsed.error) {
                onError(new Error(parsed.error))
              }
            } catch (e) {
              // Partial JSON or format error
            }
          }
        }
      }
    } catch (error) {
      onError(error)
    }
  },
}
