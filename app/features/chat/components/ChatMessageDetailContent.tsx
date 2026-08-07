import COLORS from '@app/shared/constants/color'
import type {ChatMessage} from '@app/shared/types/chat'
import MultiImageViewer from '@app/shared/ui/common/MultiImageViewer'
import CopyableText from '@app/shared/ui/text/CopyableText'
import React from 'react'

export type ChatMessageDetailContentProps = {
  item: ChatMessage
  bubbleMaxWidth: number
}

export default function ChatMessageDetailContent({
  item,
  bubbleMaxWidth,
}: ChatMessageDetailContentProps) {
  const textColor = COLORS.text
  const {type, text, imageUrls, imageUrl} = item

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

  // ai_text나 일반 텍스트 모두 저장된 텍스트 전체를 보여주면 됩니다.
  // 스트리밍이나 접기 로직이 필요 없습니다.
  return (
    <CopyableText
      textStyle={{color: textColor}}
      value={text ?? '-'}
    />
  )
}
