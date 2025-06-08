import dayjs from 'dayjs'
import {debounce} from 'lodash'
import React, {useEffect, useMemo, useState} from 'react'
import {FlatList, Image, StyleSheet, View} from 'react-native'
import {ActivityIndicator, Icon, Text} from 'react-native-paper'
import SearchInput from '../components/input/SearchInput'
import COLORS from '../constants/color'
import {useMyChatsInfinite} from '../hooks/useInfiniteQuery'
import {getUsersByIds} from '../services/userService'
import {useAppSelector} from '../store/hooks'
import type {User} from '../types/firebase'

export default function ChatListScreen() {
  const {data: user} = useAppSelector(state => state.user)
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMyChatsInfinite(user?.uid) as any
  const chats = data?.pages.flatMap((page: any) => page?.chats ?? []) ?? []
  const [targetMembers, setTargetMembers] = useState<User[]>([])
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')

  const memberIds = useMemo(() => {
    return Array.from(
      new Set(chats?.flatMap((chat: any) => chat?.members || [])),
    ) as string[]
  }, [chats])

  console.log('chats', chats)

  const debouncedSetSearchText = useMemo(
    () =>
      debounce((text: string) => {
        setSearchText(text.toString())
      }, 300),
    [],
  )

  useEffect(() => {
    debouncedSetSearchText(input)
    // cleanup 함수로 debounce 취소
    return () => debouncedSetSearchText.cancel()
  }, [input])

  useEffect(() => {
    console.log('memberIds', memberIds)
    if (memberIds?.[0]) {
      console.log('memberIds', memberIds)
      // alert(JSON.stringify(chats))
      getUsersByIds(memberIds).then(res => {
        setTargetMembers(res)
      })
    }
  }, [JSON.stringify(memberIds)])

  return (
    <View style={{flex: 1}}>
      <SearchInput
        placeholder="검색할 닉네임 시작 글자를 입력해주세요."
        value={input}
        onChangeText={setInput}
      />
      <FlatList
        data={chats}
        keyExtractor={e => e?.id}
        renderItem={({item}) => {
          const isDM = item?.type == 'dm'
          const targetId = item?.members.find(
            (mId: string) => mId !== user?.uid,
          )
          const findMember = targetMembers?.find(
            member => member?.uid == targetId,
          )
          return (
            <View style={styles.chatRoom}>
              <View style={styles.frame}>
                {findMember?.photoURL ? (
                  <Image
                    source={{uri: findMember?.photoURL}}
                    resizeMode="cover"
                    style={styles.image}
                  />
                ) : (
                  <Icon source="account" size={40} color={COLORS.primary} />
                )}
                {findMember?.status == 'online' && (
                  <View style={styles.point} />
                )}
              </View>
              <View style={styles.contents}>
                <Text style={styles.name}>
                  {isDM ? findMember?.nickname : '-'}
                </Text>
                <Text
                  style={styles.lastMessage}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {item?.lastMessage?.text || '대화 없음'}
                </Text>
                <Text style={styles.lastSendTime}>
                  {item?.lastMessage?.createdAt
                    ? dayjs(Number(item?.lastMessage?.createdAt)).fromNow()
                    : '알 수 없음'}
                </Text>
                <View style={styles.unreadMessageBadge}>
                  <Text style={styles.unreadMessage}>12</Text>
                </View>
              </View>
            </View>
          )
        }}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : null
        }
        refreshing={isLoading}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{flex: 1}}
        contentContainerStyle={styles.chatContents}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContents: {
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    backgroundColor: COLORS.outerColor,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  chatRoom: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    // 그림자 스타일 (iOS + Android)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
    padding: 8,
  },
  frame: {
    width: 55,
    height: 55,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    position: 'relative',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  point: {
    backgroundColor: '#2CC069',
    width: 14,
    height: 14,
    borderRadius: 100,
    borderColor: '#FFF',
    borderWidth: 2,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  contents: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  lastSendTime: {
    fontSize: 12,
    color: '#ADB5BD',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  unreadMessageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // ✅ 세로 중앙
    backgroundColor: COLORS.primary,
  },
  unreadMessage: {
    color: COLORS.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
})
