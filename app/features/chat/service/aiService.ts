import {aiRemote} from '@app/features/chat/data/aiRemote'

export const aiService = {
  /**
   * 팬디봇에게 질문을 던지고 스트리밍 답변을 받습니다.
   * 비즈니스 로직이나 추가 처리가 필요할 경우 여기서 처리합니다.
   */
  requestAiResponse: async (
    chatId: string,
    prompt: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (error: any) => void,
    messageId?: string,
  ) => {
    // 1. 필요한 경우 로컬 상태 기록 또는 전처리 진행 가능
    
    // 2. 리모트 호출
    return aiRemote.streamAiResponse({
      chatId,
      prompt,
      messageId,
      onChunk,
      onDone,
      onError,
    })
  },
}
