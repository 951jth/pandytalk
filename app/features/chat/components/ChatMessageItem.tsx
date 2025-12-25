import COLORS from '@app/shared/constants/color'
import type {User} from '@app/shared/types/auth'
import type {ChatMessage} from '@app/shared/types/chat'
import ImageViewer from '@app/shared/ui/common/ImageViewer'
import {formatChatTime, formatServerDate} from '@app/shared/utils/firebase'
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Icon} from 'react-native-paper'

export default function ChatMessageItem({
  item,
  isMine,
  hideProfile,
  hideMinute,
  hideDate,
  member,
}: {
  item: ChatMessage
  hideProfile: boolean
  hideMinute: boolean
  hideDate: boolean
  isMine: boolean
  member?: User
}) {
  return (
    <>
      <View
        style={[
          styles.chatRow,
          {justifyContent: isMine ? 'flex-end' : 'flex-start'},
        ]}>
        {isMine ? (
          <View style={styles.myChat}>
            {/* 내 채팅 */}
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
            {!hideMinute && item?.createdAt && (
              <Text style={[styles.chatTime, {left: -60}]}>
                {formatChatTime(item?.createdAt)}
              </Text>
            )}
          </View>
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
            <View style={{marginLeft: hideProfile ? 55 : 0}}>
              {/* 닉네임 */}
              {!hideProfile && (
                <Text style={styles.nickname}>
                  {member?.displayName ?? '알수없음'}
                </Text>
              )}
              <View style={styles.otherChat}>
                {/* 상대 채팅 */}
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
                {!hideMinute && (
                  <Text style={[styles.chatTime, {right: -65}]}>
                    {formatChatTime(item.createdAt)}
                  </Text>
                )}
              </View>
            </View>
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
  },
  myChat: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: COLORS.primary,
    position: 'relative',
    maxWidth: 250,
  },
  otherChat: {
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

  chatTime: {
    color: '#333',
    fontSize: 12,
    position: 'absolute',
    bottom: 0,
    width: 60,
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
