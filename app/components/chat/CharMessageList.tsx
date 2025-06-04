import React, {useEffect, useState} from 'react'
import {FlatList, Image, StyleSheet, View} from 'react-native'
import {Icon, Text} from 'react-native-paper'
import COLORS from '../../constants/color'
import {
  getChatMembersInfo,
  getChatMessages,
  subscribeToMessages,
} from '../../services/chatService'
import {User} from '../../types/firebase'
import {formatChatTime} from '../../utils/format'

interface propTypes {
  roomId: string | null
  user: User | null
}

export default function ChatMessageList({roomId, user}: propTypes) {
  const [messages, setMessages] = useState<Array<object>>(dummy)
  const [members, setMembers] = useState<Array<User>>([])

  const MyChat = ({item}: any) => {
    return (
      <View style={styles.myChat}>
        <Text style={{color: COLORS.onPrimary}}>{item?.text}</Text>
        <Text style={[styles.chatDate, {left: -50}]}>
          {formatChatTime(item?.createdAt)}
        </Text>
      </View>
    )
  }

  const OtherChat = ({item}: any) => {
    console.log(item)
    const member = members?.find(mem => mem?.uid == item?.senderId)
    return (
      <>
        <View style={styles.frame}>
          {item?.photoURL ? (
            <Image
              source={{
                uri: 'https://firebasestorage.googleapis.com/v0/b/csh-rn.firebasestorage.app/o/profiles%2FJtd0DjYGKagvr4kPr9uvfxu5cLo2%2Fprofile_1748833300803.jpg?alt=media&token=5e0d6eb3-e5fa-4b2a-9f48-942b0c0152fb',
              }}
              resizeMode="cover"
              style={styles.image}
            />
          ) : (
            <Icon source="account" size={40} color={COLORS.primary} />
          )}
        </View>
        <View>
          <Text style={styles.nickname}>{item?.nickname}</Text>
          <View style={styles.otherChat}>
            <Text style={{color: COLORS.text}}>{item?.text}</Text>
            <Text style={[styles.chatDate, {right: -50}]}>
              {formatChatTime(item?.createdAt)}
            </Text>
          </View>
        </View>
      </>
    )
  }

  useEffect(() => {
    if (!roomId) return
    getChatMessages(roomId).then(res => {
      setMessages(res)
    })
    getChatMembersInfo(roomId).then(res => {
      setMembers(res)
    })

    //양방향 통신 설정
    const unsub = subscribeToMessages(roomId, msgs => {
      setMessages(msgs) // 상태 갱신
    })

    return () => unsub() // 언마운트 시 리스너 제거
  }, [roomId])

  console.log(messages)
  return (
    <FlatList
      data={messages}
      keyExtractor={item => item.uid}
      renderItem={({item}) => {
        console.log(user?.uid)
        console.log(item?.uid)
        const isMine = item?.uid == user?.uid
        return (
          <View
            style={[
              styles.chatRow,
              {justifyContent: isMine ? 'flex-end' : 'flex-start'},
            ]}>
            {isMine ? <MyChat item={item} /> : <OtherChat item={item} />}
          </View>
        )
        // return isMine ? <MyChat item={item} /> : <></>
      }}
      contentContainerStyle={styles.chatList}
    />
  )
}

const styles = StyleSheet.create({
  chatList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  chatRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
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
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  nickname: {
    marginBottom: 2,
    fontSize: 13,
    // marginTop: 0,
  },
})

var dummy = [
  {
    uid: 'Jtd0DjYGKagvr4kPr9uvfxu5cLo2',
    nickname: '더미1',
    isGroup: false,
    createdAt: Date.now(),
    type: 'text',
    imageUrl: '',
    text: '테스트입니돠...더미 테스에욘 ㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎ',
    photoUrl:
      'https://firebasestorage.googleapis.com/v0/b/csh-rn.firebasestorage.app/o/profiles%2FJtd0DjYGKagvr4kPr9uvfxu5cLo2%2Fprofile_1748833300803.jpg?alt=media&token=5e0d6eb3-e5fa-4b2a-9f48-942b0c0152fb',
  },
  {
    uid: '3FGB3apiF8MploeAeDdoLO3ycsN2',
    nickname: '더미1',
    isGroup: false,
    createdAt: Date.now(),
    type: 'text',
    imageUrl: '',
    text: '테스트입니돠',
    photoUrl:
      'https://firebasestorage.googleapis.com/v0/b/csh-rn.firebasestorage.app/o/profiles%2FJtd0DjYGKagvr4kPr9uvfxu5cLo2%2Fprofile_1748833300803.jpg?alt=media&token=5e0d6eb3-e5fa-4b2a-9f48-942b0c0152fb',
  },
]
