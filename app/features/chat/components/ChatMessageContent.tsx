import AiStreamingText from '@app/features/chat/components/AiStreamingText'
import {
  CHAT_MESSAGE_DETAIL_POLICY,
  shouldOpenMessageDetail,
} from '@app/features/chat/utils/messageDetail'
import COLORS from '@app/shared/constants/color'
import type {ChatMessage} from '@app/shared/types/chat'
import MultiImageViewer from '@app/shared/ui/common/MultiImageViewer'
import CopyableText from '@app/shared/ui/text/CopyableText'
import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {Text} from 'react-native-paper'

export type ChatMessageContentProps = {
  item: ChatMessage
  isMine: boolean
  bubbleMaxWidth: number
  roomId?: string | null
  mode?: 'bubble' | 'detail'
  onMessagePress?: (message: ChatMessage) => void
}

export default function ChatMessageContent({
  item,
  isMine,
  bubbleMaxWidth,
  roomId,
  mode = 'bubble',
  onMessagePress,
}: ChatMessageContentProps) {
  const textColor =
    mode === 'detail'
      ? COLORS.text
      : isMine
        ? COLORS.onPrimary
        : COLORS.text
  const {type, text, imageUrls, imageUrl} = item
  const shouldShowDetailPreview =
    mode === 'bubble' &&
    !!onMessagePress &&
    shouldOpenMessageDetail(item)
  const handleDetailPress = shouldShowDetailPreview
    ? () => onMessagePress(item)
    : undefined

  if (type === 'ai_text') {
    return (
      <>
        <AiStreamingText
          chatId={roomId ?? ''}
          color={textColor}
          item={item}
          numberOfLines={
            shouldShowDetailPreview
              ? CHAT_MESSAGE_DETAIL_POLICY.PREVIEW_LINES
              : undefined
          }
          ellipsizeMode="tail"
          onPress={handleDetailPress}
        />
        {shouldShowDetailPreview && (
          <DetailLink color={textColor} onPress={handleDetailPress} />
        )}
      </>
    )
  }

  if (type === 'image') {
    const images = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []

    return (
      <>
        <MultiImageViewer images={images} maxWidth={bubbleMaxWidth - 24} />
        {text && (
          <CopyableText
            textStyle={{color: textColor, marginTop: 5}}
            value={text}
          />
        )}
      </>
    )
  }

  return (
    <>
      <CopyableText
        textStyle={{color: textColor}}
        value={text ?? '-'}
        numberOfLines={
          shouldShowDetailPreview
            ? CHAT_MESSAGE_DETAIL_POLICY.PREVIEW_LINES
            : undefined
        }
        ellipsizeMode="tail"
        onPress={handleDetailPress}
      />
      {shouldShowDetailPreview && (
        <DetailLink color={textColor} onPress={handleDetailPress} />
      )}
    </>
  )
}

const DetailLink = ({
  color,
  onPress,
}: {
  color: string
  onPress?: () => void
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.detailLink}>
      <Text style={[styles.detailLinkText, {color}]}>전체보기</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  detailLink: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  detailLinkText: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    textDecorationLine: 'underline',
  },
})
