import type {ChatMessage} from '@app/shared/types/chat'
import CopyableText from '@app/shared/ui/text/CopyableText'
import {useAiStreamResponse} from '@features/chat/hooks/useAiStreamResponse'
import COLORS from '@shared/constants/color'
import React from 'react'
import {StyleSheet, View} from 'react-native'

interface AiStreamingTextProps {
  chatId?: string
  color?: string
  item?: ChatMessage
}

export default function AiStreamingText({
  chatId,
  color,
  item,
}: AiStreamingTextProps) {
  const isStreamingStatus = item?.status === 'streaming'
  const prompt = item?.prompt ?? '' // onAiMention에서 넣어준 원본 질문 사용
  const messageId = item?.id

  // 훅 내부에서 chatId, prompt가 존재하고 enabled가 true면 자동으로 스트리밍 시작
  const {streamedText} = useAiStreamResponse({
    chatId,
    prompt,
    messageId,
    enabled: isStreamingStatus,
  })

  const displayValue = isStreamingStatus
    ? streamedText || '팬디봇이 답변을 생성 중입니다...'
    : item?.text || ''

  return (
    <View style={styles.container}>
      <CopyableText
        value={displayValue}
        textStyle={[styles.text, color ? {color} : {}]}
        disabled={isStreamingStatus}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
})
