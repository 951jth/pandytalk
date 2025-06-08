import React, {useEffect, useState} from 'react'
import {FlatList, Image, StyleSheet, View} from 'react-native'
import {Icon, Text} from 'react-native-paper'
import COLORS from '../../constants/color'
import {getChatMessages, subscribeToMessages} from '../../services/chatService'
import {ChatMessage, RoomInfo} from '../../types/firebase'
import {isSameMinute, isSameSender} from '../../utils/chat'
import {formatChatTime} from '../../utils/format'

interface propTypes {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: RoomInfo | null
}

export default function ChatMessageList({roomId, userId, roomInfo}: propTypes) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const members = roomInfo?.memberInfos ?? []
  const MyChat = ({item, hideMinuete}: any) => {
    return (
      <View style={styles.myChat}>
        <Text style={{color: COLORS.onPrimary}}>{item?.text}</Text>
        {!hideMinuete && (
          <Text style={[styles.chatDate, {left: -60}]}>
            {formatChatTime(item?.createdAt)}
          </Text>
        )}
      </View>
    )
  }

  const OtherChat = ({item, hideProfile, hideMinuete}: any) => {
    const member = members?.find(mem => mem?.uid == item?.senderId) || null
    return (
      <>
        {!hideProfile && (
          <View style={styles.frame}>
            {member?.photoURL ? (
              <Image
                source={{
                  uri: member?.photoURL,
                }}
                resizeMode="cover"
                style={styles.image}
              />
            ) : (
              <Icon source="account" size={35} color={COLORS.primary} />
            )}
          </View>
        )}
        <View style={{marginLeft: hideProfile ? 55 : 0}}>
          {!hideProfile && (
            <Text style={styles.nickname}>{member?.nickname}</Text>
          )}
          <View style={styles.otherChat}>
            <Text style={{color: COLORS.text}}>{item?.text}</Text>
            {!hideMinuete && (
              <Text style={[styles.chatDate, {right: -60}]}>
                {formatChatTime(item?.createdAt)}
              </Text>
            )}
          </View>
        </View>
      </>
    )
  }

  useEffect(() => {
    if (!roomId) return
    getChatMessages(roomId).then(res => {
      setMessages(res ?? [])
    })

    //양방향 통신 설정
    const unsub = subscribeToMessages(roomId, msgs => {
      setMessages(msgs as Array<ChatMessage>) // 상태 갱신
    })

    return () => unsub() // 언마운트 시 리스너 제거
  }, [roomId])

  return (
    <FlatList
      data={messages}
      keyExtractor={item => item.id || item?.senderId}
      renderItem={({item, index}) => {
        const isMine = item?.senderId == userId
        const prevItem = messages?.[index - 1] ?? null
        const afterItem = messages?.[index + 1] ?? null
        const ishideProfile = isSameSender(item, afterItem)
        const isHideMinuete = isSameMinute(item, afterItem)

        return (
          <View
            style={[
              styles.chatRow,
              {justifyContent: isMine ? 'flex-end' : 'flex-start'},
            ]}>
            {isMine ? (
              <MyChat item={item} hideMinuete={isHideMinuete} />
            ) : (
              <OtherChat
                item={item}
                hideProfile={ishideProfile}
                hideMinuete={isHideMinuete}
              />
            )}
          </View>
        )
      }}
      style={{flex: 1}}
      contentContainerStyle={styles.chatList}
      inverted
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScroll={({nativeEvent}) => {
        if (nativeEvent.contentOffset.y <= 0) {
          // 👉 이전 메시지 불러오기 로직 호출
        }
      }}
    />
  )
}

const styles = StyleSheet.create({
  chatList: {
    // flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 16,
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
    maxWidth: 200,
  },
  otherChat: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
    backgroundColor: COLORS.background,
    position: 'relative',
    maxWidth: 200,
    flexDirection: 'row',
    gap: 12,
  },
  chatDate: {
    // color: '#D9D9D9',
    color: '#333333',
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
    position: 'relative',
    backgroundColor: '#FFF',
    // ✅ 그림자 효과 (iOS + Android 호환)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android 전용 그림자
    marginRight: 10,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 25,
  },
  nickname: {
    marginBottom: 2,
    fontSize: 13,
    // marginTop: 0,
  },
})
