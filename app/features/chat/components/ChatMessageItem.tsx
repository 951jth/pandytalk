import COLORS from '@app/shared/constants/color'
import type {User} from '@app/shared/types/auth'
import type {ChatMessage} from '@app/shared/types/chat'
import ImageViewer from '@app/shared/ui/common/ImageViewer'
import {formatChatTime, formatServerDate} from '@app/shared/utils/firebase'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Icon, IconButton, Text} from 'react-native-paper'

export type ChatMessageItemProps = {
  item: ChatMessage
  hideProfile: boolean
  hideMinute: boolean
  hideDate: boolean
  isMine: boolean
  member?: User
}

const getStatusIcon = (status?: 'pending' | 'success' | 'failed') => {
  switch (status) {
    case 'pending':
      return {name: 'clock-outline', color: '#B0B0B0'} // 전송중
    // case 'success':
    //   return {name: 'check', color: '#B0B0B0'} // 전송완료
    case 'failed':
      return {name: 'alert-circle-outline', color: '#FF5A5A'} // 실패
    default:
      return null
  }
}

export default function ChatMessageItem({
  item,
  isMine,
  hideProfile,
  hideMinute,
  hideDate,
  member,
}: ChatMessageItemProps) {
  const icon = getStatusIcon(item.status)

  return (
    <>
      <View
        style={[
          styles.chatRow,
          {justifyContent: isMine ? 'flex-end' : 'flex-start'},
        ]}>
        {/* 내 채팅 */}
        {isMine ? (
          <>
            <View
              style={[
                styles.chatOptionsWrap,
                {
                  justifyContent: 'flex-end', // ✅ 오른쪽 정렬
                },
              ]}>
              {/* 재전송, 삭세 아이콘 */}
              {!!item?.status && icon && (
                <IconButton
                  icon={icon.name as any}
                  iconColor={icon.color}
                  size={14}
                  style={styles.statusIcon}
                  onPress={() => {}}
                  contentStyle={{padding: 0}} // ✅ 버튼 내부 패딩 제거
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
              <Text style={{color: COLORS.onPrimary}}>{item.text}</Text>
              {item?.type == 'image' && item?.imageUrl && (
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
                {member?.photoURL ? (
                  <ImageViewer
                    images={[{uri: member?.photoURL}]}
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
                marginLeft: hideProfile ? 55 : 0,
              }}>
              {/* 닉네임 */}
              {!hideProfile && (
                <Text style={styles.nickname}>
                  {member?.displayName ?? '알수없음'}
                </Text>
              )}
              {/* 말풍선 */}
              <View style={styles.otherChatBubble}>
                <Text style={{color: COLORS.text}}>{item.text}</Text>
                {item?.type == 'image' && item?.imageUrl && (
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
      {!hideDate && (
        <View style={styles.chatDateWrap}>
          <Text style={styles.chatDateText}>
            {formatServerDate(item?.createdAt, 'YYYY년 MM월 DD일 dddd')}
          </Text>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chatList: {
    minHeight: 100,
    flexGrow: 1,
    paddingBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
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
    alignItems: 'center',
    zIndex: 13,
    alignSelf: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    lineHeight: 14,
    alignSelf: 'flex-start', // make width fit content
    minWidth: 0,
    paddingHorizontal: 4,
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
    marginRight: 10,
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
    marginTop: 8,
  },
})
