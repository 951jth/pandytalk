import {useFocusEffect} from '@react-navigation/native'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {Icon, Text} from 'react-native-paper'
import COLORS from '../../constants/color'
import {getLatestMessageCreatedAtFromSQLite} from '../../db/sqlite'
import {
  useChatMessagesPaging,
  useSubscriptionMessage,
} from '../../hooks/queries/useChatMessageQuery'
import {updateLastRead} from '../../services/chatService'
import type {ChatListItem, ChatMessage} from '../../types/chat'
import {isSameDate, isSameMinute, isSameSender} from '../../utils/chat'
import {formatChatTime, formatServerDate} from '../../utils/firebase'
import ImageViewer from '../common/ImageViewer'

interface Props {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatListItem | null
  inputComponent?: React.ComponentType<any> | React.ReactElement | null
  chatType?: ChatListItem['type']
}

export default function ChatMessageList({
  roomId,
  userId,
  roomInfo,
  chatType = 'dm',
}: Props) {
  const members = roomInfo?.memberInfos ?? []
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    resetChatMessages,
  } = useChatMessagesPaging(roomId)
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null) //마지막으로 읽은 날짜.
  const messages = data?.pages?.flatMap(page => page?.data ?? []) ?? []
  useSubscriptionMessage(roomId, lastCreatedAt) //채팅방 구독설정
  // 포커스 이벤트용 참조값.
  const roomInfoRef = useRef(roomInfo)
  const messagesRef = useRef(messages)
  // 최신값 유지
  useEffect(() => {
    roomInfoRef.current = roomInfo
  }, [roomInfo])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const renderMessage = ({item, index}: {item: ChatMessage; index: number}) => {
    const isMine = item?.senderId === userId
    const nextItem = messages?.[index + 1] ?? null
    const prevItem = messages?.[index - 1] ?? null
    const hideProfile = isSameSender(item, nextItem)
    const hideMinute = isSameMinute(item, nextItem)
    const hideDate = isSameDate(item, nextItem)
    const member = members?.find(mem => mem?.id === item?.senderId)
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
        {/* 날짜 표기 */}
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

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (userId && roomInfoRef?.current) {
          const room = roomInfoRef?.current
          const crntReadSeq = room?.lastReadSeqs?.[userId]
          const msgs = messagesRef?.current
          const lastSeq = msgs?.length
            ? Math.max(...msgs.map(m => m.seq ?? 0))
            : 0
          const forceUpdate = crntReadSeq != lastSeq
          if (forceUpdate) updateLastRead(room?.id, userId, lastSeq) // ✅ 화면 벗어날 때 실행됨
        }
      }
    }, [updateLastRead]),
  )

  useEffect(() => {
    //가장 마지막 채팅의 최근 날짜로 subscription
    if (!roomId) return
    // getMessagesFromSQLite(roomId).then(res => {
    //   console.log('all messages', res)
    // })
    getLatestMessageCreatedAtFromSQLite(roomId).then(res => {
      setLastCreatedAt(res)
    })
  }, [data, roomId])

  return (
    <FlatList
      style={styles.flex}
      data={messages || []}
      keyExtractor={(item, index) => `${item.id}-${item.createdAt}-${index}`}
      renderItem={renderMessage}
      contentContainerStyle={styles.chatList}
      inverted={true}
      keyboardShouldPersistTaps="handled"
      refreshing={isLoading}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}
      // onRefresh={resetChatMessages}
      // onScroll={({nativeEvent}) => {
      //   if (nativeEvent.contentOffset.y <= 0) {
      //     console.log('next page')
      //     // 🔁 페이징 or 이전 메시지 불러오기
      //     if (hasNextPage) fetchNextPage()
      //   }
      // }}
      // refreshing={isLoading}
    />
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
  },
  chatImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
})
