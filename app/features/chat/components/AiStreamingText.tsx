import type {ChatMessage} from '@app/shared/types/chat'
import CopyableText from '@app/shared/ui/text/CopyableText'
import {useAiStreamResponse} from '@features/chat/hooks/useAiStreamResponse'
import COLORS from '@shared/constants/color'
import React, {useEffect} from 'react'
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
  const {streamedText, startStreaming} = useAiStreamResponse()
  const isStreamingStatus = item?.status === 'streaming'
  const userQuestion = item?.text ?? ''

  useEffect(() => {
    if (isStreamingStatus && chatId && userQuestion) {
      startStreaming(chatId, userQuestion)
    }
  }, [isStreamingStatus, chatId, userQuestion, startStreaming])

  const displayValue = isStreamingStatus
    ? streamedText || '팬디봇이 입력 중입니다...'
    : item?.text || ''

  return (
    <View style={styles.container}>
      <CopyableText
        value={displayValue}
        textStyle={[styles.text, color ? {color} : {}]}
        // wrapperStyle={{disabled: isStreamingStatus}}
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
