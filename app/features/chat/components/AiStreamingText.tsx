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

/**
 * [AI 스트리밍 처리 흐름도]
 * 1. 유저가 AI 멘션 전송 -> Firestore에 'streaming' 상태의 메시지가 먼저 생성됨
 * 2. 모든 클라이언트가 이 메시지를 수신
 * 3. [본인인 경우]: useAiStreamResponse 훅이 서버와 SSE 연결을 맺고 실시간 글자 수신
 * 4. [타인인 경우]: 서버 부하 및 중복 요청 방지를 위해 "답변 생성 중" 메시지만 표시
 * 5. 서버 완료 시: 최종 결과가 Firestore에 저장되고 모든 유저의 화면이 일반 텍스트로 전환
 */

export default function AiStreamingText({
  chatId,
  color,
  item,
}: AiStreamingTextProps) {
  const isStreamingStatus = item?.status === 'streaming'
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
    displayValue = streamedText || '팬디봇이 답변을 생성 중입니다...'
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
