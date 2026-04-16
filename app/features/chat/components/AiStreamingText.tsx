import {auth} from '@app/shared/firebase/firestore'
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
  const currentUid = auth.currentUser?.uid
  const isOwner = item?.mentionerId === currentUid

  // 1) 질문자 본인이면서 스트리밍 중일 때만 SSE 훅 활성화
  const {streamedText} = useAiStreamResponse({
    chatId,
    item,
    enabled: isStreamingStatus && isOwner,
  })

  // 2) 스트리밍 상태에 따른 텍스트 결정
  let displayValue = item?.text || ''

  if (isStreamingStatus) {
    if (isOwner) {
      // 본인: 스트리밍 중인 텍스트 표시
      displayValue = streamedText || '팬디봇이 답변을 생성 중입니다...'
    } else {
      // 타인: 동적 대기 메시지 표시 (., .., ...)
      displayValue = '팬디봇이 답변을 생성 중입니다...'
    }
  }

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
