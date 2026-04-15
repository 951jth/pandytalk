import React, {memo} from 'react'
import {StyleSheet, View, useWindowDimensions} from 'react-native'
import {Text} from 'react-native-paper'

import AiStreamingText from '@app/features/chat/components/AiStreamingText'
import ChatDateSeparator from '@app/features/chat/components/ChatDateSeparator'
import ChatMessageAvatar from '@app/features/chat/components/ChatMessageAvatar'
import ChatMessageMeta from '@app/features/chat/components/ChatMessageMeta'
import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import type {ChatMessage} from '@app/shared/types/chat'
import MultiImageViewer from '@app/shared/ui/common/MultiImageViewer'
import CopyableText from '@app/shared/ui/text/CopyableText'

export type ChatMessageItemProps = {
  item: ChatMessage
  uiConfig: {
    hideProfile: boolean
    hideMinute: boolean
    hideDate: boolean
    isMine: boolean
  }
  roomId?: string | null
  member?: User
}

// --- 메인 컴포넌트 ---
const ChatMessageItem = ({
  item,
  uiConfig,
  roomId,
  member,
}: ChatMessageItemProps) => {
  const {hideProfile, hideMinute, hideDate, isMine} = uiConfig
  const {width} = useWindowDimensions()
  const bubbleMaxWidth = width * 0.7

  return (
    <View style={styles.container}>
      {!hideDate && <ChatDateSeparator date={item.createdAt} />}

      <View
        style={[
          styles.chatRow,
          {flexDirection: isMine ? 'row-reverse' : 'row'},
          isMine ? {paddingLeft: 40} : {paddingRight: 40},
        ]}>
        {/* 프로필 이미지 (상대방일 때만) */}
        {!isMine && (
          <ChatMessageAvatar
            item={item}
            member={member}
            isHidden={hideProfile}
          />
        )}

        <View
          style={[
            styles.messageContentSection,
            isMine && {alignItems: 'flex-end'},
          ]}>
          {/* 닉네임 (상대방 첫 메시지일 때만) */}
          {!isMine && !hideProfile && (
            <Text style={styles.nickname}>
              {member?.displayName ?? item?.senderName ?? '알수없음'}
            </Text>
          )}

          <View
            style={[
              styles.chatContentWrap,
              isMine && {flexDirection: 'row-reverse'},
            ]}>
            {/* 말풍선 */}
            <View
              style={[
                isMine ? styles.myChatBubble : styles.otherChatBubble,
                {maxWidth: bubbleMaxWidth},
              ]}>
              <ChatMessageContent
                item={item}
                isMine={isMine}
                bubbleMaxWidth={bubbleMaxWidth}
                roomId={roomId}
              />
            </View>

            {/* 시간 및 상태 표기 (메타 정보) */}
            <ChatMessageMeta
              item={item}
              roomId={roomId}
              isMine={isMine}
              hideMinute={hideMinute}
            />
          </View>
        </View>
      </View>
    </View>
  )
}

// --- 보조 컴포넌트: 본문 내용 (Bubble Content) ---
const ChatMessageContent = ({
  item,
  isMine,
  bubbleMaxWidth,
  roomId,
}: {
  item: ChatMessage
  isMine: boolean
  bubbleMaxWidth: number
  roomId?: string | null
}) => {
  const textColor = isMine ? COLORS.onPrimary : COLORS.text
  const {type, text, imageUrls, imageUrl} = item

  if (type === 'ai_text') {
    return (
      <AiStreamingText chatId={roomId ?? ''} color={textColor} item={item} />
    )
  }

  if (type === 'image') {
    const images = imageUrls || (imageUrl ? [imageUrl] : [])
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

  return <CopyableText textStyle={{color: textColor}} value={text ?? '-'} />
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chatRow: {
    marginBottom: 16,
    gap: 8,
  },
  messageContentSection: {
    flex: 1,
    gap: 4,
  },
  chatContentWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  myChatBubble: {
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  otherChatBubble: {
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  nickname: {
    fontSize: 13,
    fontFamily: 'BMDOHYEON',
    color: '#4B3F39',
  },
})

export default memo(ChatMessageItem)
