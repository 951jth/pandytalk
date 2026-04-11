import React from 'react'
import {Image, StyleSheet, View, useWindowDimensions} from 'react-native'
import {Icon, Text} from 'react-native-paper'

import AiStreamingText from '@features/chat/components/AiStreamingText'
import ChatMessageStatusIcons from '@features/chat/components/ChatMessageStatusIcon'
import {useChatMessageDeleteMutation} from '@features/chat/hooks/useChatMessageDeleteMutation'
import {useChatMessageUpsertMutation} from '@features/chat/hooks/useChatMessageUpsertMutation'
import {AI_BOT_IMAGE} from '@shared/constants/ai'
import COLORS from '@shared/constants/color'
import {User} from '@shared/types/auth'
import type {ChatMessage} from '@shared/types/chat'
import ImageViewer from '@shared/ui/common/ImageViewer'
import CopyableText from '@shared/ui/text/CopyableText'
import {formatChatTime, formatServerDate} from '@shared/utils/firebase'

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

export default function ChatMessageItem({
  item,
  uiConfig,
  roomId,
  member,
}: ChatMessageItemProps) {
  const {hideProfile, hideMinute, hideDate, isMine} = uiConfig
  const {width} = useWindowDimensions()
  const bubbleMaxWidth = width * 0.6 // 화면 너비의 70%를 최대 너비로 설정
  const {mutate: deleteMessage} = useChatMessageDeleteMutation(roomId)
  const {mutate: retrySendMessage} = useChatMessageUpsertMutation(roomId)
  const {type} = item

  // 로컬 에셋 이미지를 URI 형태로 변환하여 ImageViewer가 인식할 수 있게 합니다
  const botImageUri = Image.resolveAssetSource(AI_BOT_IMAGE).uri

  const profileUri =
    type === 'ai_text'
      ? botImageUri
      : member?.photoURL || item?.senderPicURL || ''

  const renderMessageContent = () => {
    const textColor = isMine ? COLORS.onPrimary : COLORS.text

    if (type === 'ai_text') {
      return (
        <AiStreamingText chatId={roomId ?? ''} color={textColor} item={item} />
      )
    }

    if (type === 'text') {
      return (
        <CopyableText
          textStyle={{color: textColor}}
          value={item?.text ?? '-'}
        />
      )
    }

    if (type === 'image' && item?.imageUrl) {
      return (
        <ImageViewer
          images={[{uri: item?.imageUrl}]}
          imageProps={{
            resizeMode: 'cover',
            style: styles.chatImage,
          }}
        />
      )
    }

    return null
  }

  return (
    <>
      {!hideDate && (
        <View style={styles.chatDateWrap}>
          <Text style={styles.chatDateText}>
            {formatServerDate(item?.createdAt, 'YYYY년 MM월 DD일 dddd')}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.chatRow,
          {justifyContent: isMine ? 'flex-end' : 'flex-start'},
        ]}>
        {/* 내 채팅 */}
        {isMine ? (
          <>
            <View
              style={[styles.chatOptionsWrap, {justifyContent: 'flex-end'}]}>
              {/* 재전송, 삭세 아이콘 */}
              {!!item?.status && (
                <ChatMessageStatusIcons
                  item={item}
                  onDelete={deleteMessage}
                  onRetry={item => retrySendMessage({message: item})}
                />
              )}
              {/* 시간 */}
              {!hideMinute && item?.createdAt && (
                <Text style={[styles.chatTime, {textAlign: 'right'}]}>
                  {formatChatTime(item?.createdAt)}
                </Text>
              )}
            </View>
            {/* 채팅내용 */}
            <View style={[styles.myChatBubble, {maxWidth: bubbleMaxWidth}]}>
              {renderMessageContent()}
            </View>
          </>
        ) : (
          <>
            {/* 상대 체팅 */}
            {!hideProfile && (
              //프로필
              <View style={styles.frame}>
                {profileUri ? (
                  <ImageViewer
                    images={[{uri: profileUri}]}
                    useDownload={type !== 'ai_text'} // 봇 이미지 다운로드는 비활성화
                    imageProps={{
                      resizeMode: 'cover',
                      style: styles.profile,
                    }}
                  />
                ) : (
                  <Icon source="account" size={35} color={COLORS.primary} />
                )}
              </View>
            )}
            <View
              style={{
                marginLeft: hideProfile ? 53 : 0,
                alignItems: 'flex-start', // 닉네임 길이에 맞춰 말풍선이 늘어나지 않도록 설정
              }}>
              {/* 닉네임 */}
              {!hideProfile && (
                <Text style={styles.nickname}>
                  {member?.displayName ?? item?.senderName ?? '알수없음'}
                </Text>
              )}
              {/* 말풍선 */}
              <View
                style={[styles.otherChatBubble, {maxWidth: bubbleMaxWidth}]}>
                {renderMessageContent()}
              </View>
            </View>
            {/* 시간 */}
            {!hideMinute && (
              <View style={[styles.chatOptionsWrap]}>
                <Text style={styles.chatTime}>
                  {formatChatTime(item.createdAt)}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    marginBottom: 16, // 간격을 조금 더 넓게
    gap: 10,
  },
  myChatBubble: {
    padding: 12,
    borderTopLeftRadius: 16, // ✅ 최초의 부드러운 24px 곡률로 복원
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: COLORS.primary,
    position: 'relative',
    alignSelf: 'flex-end', // 내용물에 맞게 너비 조절
    // 최초의 소프트 섀도우
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  otherChatBubble: {
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
    backgroundColor: '#FFFFFF', // 화이트 유지
    position: 'relative',
    alignSelf: 'flex-start', // 내용물에 맞게 너비 조절
    // 최초의 소프트 섀도우
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chatDateWrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(45, 36, 31, 0.08)', // 은은한 다크 베이지
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 16,
  },
  chatDateText: {
    fontSize: 11,
    fontFamily: 'BMDOHYEON',
    color: '#8D7D77',
  },
  chatOptionsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  chatTime: {
    fontSize: 10,
    fontFamily: 'BMDOHYEON',
    color: '#BDBDBD',
  },
  statusIcon: {
    margin: 0,
    padding: 0,
    width: 18,
    height: 18,
  },
  frame: {
    width: 44,
    height: 44,
    borderRadius: 15, // ✅ 모던한 라운드 스퀘어
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  profile: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },
  nickname: {
    marginBottom: 4,
    fontSize: 13,
    fontFamily: 'BMDOHYEON',
    color: '#4B3F39', // 부드러운 다크 브라운
  },
  chatImage: {
    width: 180, // 이미지를 조금 더 시원하게
    height: 180,
    borderRadius: 20,
  },
})
