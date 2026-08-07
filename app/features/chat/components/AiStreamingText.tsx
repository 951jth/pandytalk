import {auth} from '@app/shared/firebase/firestore'
import type {ChatMessage} from '@app/shared/types/chat'
import CopyableText from '@app/shared/ui/text/CopyableText'
import {useAiStreamResponse} from '@features/chat/hooks/useAiStreamResponse'
import {useRevalidateExpiredAiMessage} from '@features/chat/hooks/useRevalidateExpiredAiMessage'
import {getAiResponseDisplayText} from '@features/chat/policies/aiResponseDisplayPolicy'
import COLORS from '@shared/constants/color'
import React from 'react'
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type TextProps,
  type TouchableOpacityProps,
} from 'react-native'

interface AiStreamingTextProps extends Pick<TouchableOpacityProps, 'onPress'> {
  chatId?: string
  color?: string
  item?: ChatMessage
  numberOfLines?: number
  ellipsizeMode?: TextProps['ellipsizeMode']
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
  numberOfLines,
  ellipsizeMode,
  onPress,
}: AiStreamingTextProps) {
  const {
    isExpired,
    status: revalidationStatus,
    refreshedMessage,
  } = useRevalidateExpiredAiMessage(chatId, item)
  const effectiveItem = refreshedMessage ?? item
  const isStreamingStatus = effectiveItem?.status === 'streaming'
  const currentUid = auth.currentUser?.uid
  const isOwner = effectiveItem?.mentionerId === currentUid

  // 1) 질문자 본인이면서 스트리밍 중일 때만 SSE 훅 활성화
  const {streamedText, error} = useAiStreamResponse({
    chatId,
    item: effectiveItem,
    enabled: isStreamingStatus && isOwner && !isExpired,
  })

  // 2) 통신/재검증 상태를 사용자용 표시 문구로 변환
  const displayValue = getAiResponseDisplayText({
    message: effectiveItem,
    streamedText,
    streamError: error,
    isExpired,
    revalidationStatus,
  })

  const handlePress = (e: GestureResponderEvent) => {
    onPress?.(e)
  }

  return (
    <View style={styles.container}>
      <CopyableText
        value={displayValue}
        textStyle={[styles.text, color ? {color} : {}]}
        disabled={isStreamingStatus && !error}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        onPress={handlePress}
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
