import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Icon, Text} from 'react-native-paper'

import ChatMessageStatusIcons from '@features/chat/components/ChatMessageStatusIcon'
import {useChatMessageDeleteMutation} from '@features/chat/hooks/useChatMessageDeleteMutation'
import {useChatMessageUpsertMutation} from '@features/chat/hooks/useChatMessageUpsertMutation'
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
  const {mutate: deleteMessage} = useChatMessageDeleteMutation(roomId)
  const {mutate: retrySendMessage} = useChatMessageUpsertMutation(roomId)
  const {type} = item
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
        ]}
        onLayout={content => {
          console.log('ChatMessageItem Layout:', content.nativeEvent.layout)
        }}>
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
            <View style={styles.myChatBubble}>
              {type === 'text' && (
                <CopyableText
                  textStyle={{color: COLORS.onPrimary}}
                  value={item?.text ?? '-'}
                />
              )}
              {type == 'image' && item?.imageUrl && (
                <View>
                  <ImageViewer
                    images={[{uri: item?.imageUrl}]}
                    imageProps={{
                      resizeMode: 'cover',
                      style: styles.chatImage,
                    }}
                  />
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            {/* 상대 체팅 */}
            {!hideProfile && (
              //프로필
              <View style={styles.frame}>
                {member?.photoURL || !!item?.senderPicURL ? (
                  <ImageViewer
                    images={[
                      {uri: member?.photoURL ?? item.senderPicURL ?? ''},
                    ]}
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
              }}>
              {/* 닉네임 */}
              {!hideProfile && (
                <Text style={styles.nickname}>
                  {member?.displayName ?? item?.senderName ?? '알수없음'}
                </Text>
              )}
              {/* 말풍선 */}
              <View style={styles.otherChatBubble}>
                {type == 'text' && (
                  <CopyableText
                    textStyle={{color: COLORS.text}}
                    value={item?.text ?? '-'}
                  />
                )}
                {type == 'image' && item?.imageUrl && (
                  <ImageViewer
                    images={[{uri: item?.imageUrl}]}
                    imageProps={{
                      resizeMode: 'cover',
                      style: styles.chatImage,
                    }}
                  />
                )}
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
    marginBottom: 12,
    gap: 8,
  },
  myChatBubble: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: COLORS.primary,
    position: 'relative',
    maxWidth: 250,
  },
  otherChatBubble: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
    backgroundColor: COLORS.background,
    position: 'relative',
    maxWidth: 250,
  },
  chatDateWrap: {
    alignSelf: 'center',
    backgroundColor: '#E5E5EA', // 연한 회색
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 8,
  },
  chatDateText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },
  chatOptionsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    height: 14,
  },
  chatTime: {
    fontSize: 12,
    lineHeight: 14,
    alignSelf: 'flex-start', // make width fit content
    // paddingHorizontal: 4,
  },
  statusIcon: {
    margin: 0,
    padding: 0,
    width: 18,
    height: 18,
  },
  frame: {
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profile: {
    width: 48,
    height: 48,
    borderRadius: 25,
  },
  nickname: {
    marginBottom: 2,
    fontSize: 13,
    color: COLORS.text,
  },
  chatImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
})
