import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'
import dayjs from 'dayjs'
import {debounce} from 'lodash'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {FlatList, Image, Pressable, StyleSheet, View} from 'react-native'
import {ActivityIndicator, Icon, Text} from 'react-native-paper'
import EmptyData from '../components/common/EmptyData'
import SearchInput from '../components/input/SearchInput'
import COLORS from '../constants/color'
import {
  updateChatLastReadCache,
  useMyChatsInfinite,
} from '../hooks/useInfiniteQuery'
import {getUsersByIds} from '../services/userService'
import {useAppSelector} from '../store/hooks'
import type {RoomInfo, User} from '../types/firebase'
import {RootStackParamList} from '../types/navigate'

export default function ChatListScreen() {
  const {data: user} = useAppSelector(state => state.user)
  const queryClient = useQueryClient()
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMyChatsInfinite(user?.uid) as any
  const fetchedMemberIdsRef = useRef<Set<string | null>>(new Set())
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'chatRoom'>>()
  const chats = data?.pages.flatMap((page: any) => page?.chats ?? []) ?? []
  const [targetMembers, setTargetMembers] = useState<User[]>([])
  const chatsWithMemberInfo = chats?.map((chat: any) => {
    const targetId = chat?.members.find((mId: string) => mId !== user?.uid)
    const findMember = targetMembers?.find(member => member?.uid == targetId)
    return {...chat, targetId, findMember}
  })

  const memberIds = useMemo(() => {
    return Array.from(
      new Set(chats?.flatMap((chat: RoomInfo) => chat?.members || [])),
    ).sort((a: any, b: any) => b - a) as string[]
  }, [chats])

  const debouncedSetSearchText = useMemo(
    () =>
      debounce((text: string) => {
        setSearchText(text.toString())
      }, 300),
    [],
  )

  const moveToChatRoom = (roomId: string, uid: string) => {
    if (!user?.uid) return
    updateChatLastReadCache(queryClient, roomId, user?.uid)
    navigation.navigate('chatRoom', {roomId, targetIds: [uid]})
  }

  useEffect(() => {
    debouncedSetSearchText(input)
    // cleanup 함수로 debounce 취소
    return () => debouncedSetSearchText.cancel()
  }, [input])

  useEffect(() => {
    if (memberIds?.[0]) {
      const newIds = memberIds.filter(
        id => !fetchedMemberIdsRef.current.has(id),
      )
      if (newIds.length === 0) return
      getUsersByIds(newIds).then(res => {
        // 캐시에 추가
        res.forEach(user => fetchedMemberIdsRef.current.add(user?.uid))
        // 기존 캐시 + 신규 결과 병합
        setTargetMembers(prev => {
          const prevMap = new Map(prev.map(u => [u.id, u]))
          res.forEach(u => prevMap.set(u.id, u))
          return Array.from(prevMap.values())
        })
      })
    }
  }, [memberIds])

  return (
    <View style={{flex: 1}}>
      <SearchInput
        placeholder="검색할 닉네임을 입력해주세요."
        value={input}
        onChangeText={setInput}
      />
      <FlatList
        data={chatsWithMemberInfo?.filter((chat: any) =>
          String(chat.findMember?.nickname?.toLowerCase())?.includes(
            searchText,
          ),
        )}
        keyExtractor={e => e?.id}
        renderItem={({item}) => {
          const isDM = item?.type == 'dm'
          const findMember = item?.findMember
          const targetId = findMember?.id
          return (
            <Pressable
              onPress={() => moveToChatRoom(item.id, targetId)}
              style={({pressed}) => [
                {
                  marginBottom: 8,
                  borderRadius: 8,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: pressed ? 0.5 : 1.5},
                  shadowOpacity: 0.1,
                  shadowRadius: pressed ? 1 : 3,
                  elevation: pressed ? 1 : 3,
                  backgroundColor: '#FFF',
                  transform: [{scale: pressed ? 0.98 : 1}],
                },
                styles.chatRoom,
              ]}>
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
                {!!item?.unreadCount && (
                  <View style={styles.unreadMessageBadge}>
                    <Text style={styles.unreadMessage}>
                      {item?.unreadCount || 0}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
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
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 12,
            }}>
            <EmptyData
              text={`레서판다가 기다리고 있어요.\n새로운 대화를 시작해볼까요?`}
            />
          </View>
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
    flexGrow: 1,
    backgroundColor: COLORS.outerColor,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  chatRoom: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    borderRadius: 8,
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
    fontFamily: 'BMDOHYEON',
  },
  lastMessage: {
    fontSize: 12,
    color: '#ADB5BD',
    fontFamily: 'BMDOHYEON',
  },
  lastSendTime: {
    fontSize: 12,
    color: '#ADB5BD',
    position: 'absolute',
    top: 0,
    right: 0,
    fontFamily: 'BMDOHYEON',
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
    fontFamily: 'BMDOHYEON',
  },
})
