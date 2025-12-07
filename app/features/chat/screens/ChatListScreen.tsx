import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {debounce} from 'lodash'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import EmptyData from '../../../components/common/EmptyData'
import SearchInput from '../../../components/input/SearchInput'
import COLORS from '../../../constants/color'
import {
  useMyChatsInfinite,
  useSubscribeChatList,
} from '../hooks/useChatRoomQuery'
// import {updateChatLastReadCache} from '../hooks/useInfiniteQuery'
import ChatListItemCard from '../../../components/features/chat/ChatListItemCard'
import {getUsersByIds} from '../../../services/userService'
import {useAppSelector} from '../../../store/reduxHooks'
import type {User} from '../../../types/auth'
import type {ChatListItem} from '../../../types/chat'
import {AppRouteParamList} from '../../../types/navigate'

type ChatRouteParams = RouteProp<AppRouteParamList, 'chats'>

//1:1 (DM), 그룹채팅(group)
export default function ChatListScreen() {
  const {
    data: user,
    loading: userLoading,
    error,
  } = useAppSelector(state => state.user)
  const {params} = useRoute<ChatRouteParams>()
  const type = params?.type ?? 'dm'
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMyChatsInfinite(user?.uid, type) as any //채팅방 목록 조회
  useSubscribeChatList(user?.uid, type) //채팅 목록 구독 (추가, 삭제, 수정(읽음처리등))

  const fetchedMemberIdsRef = useRef<Set<string | null>>(new Set())
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const navigation =
    useNavigation<NativeStackNavigationProp<AppRouteParamList, 'chatRoom'>>()
  const chats = data?.pages.flatMap((page: any) => page?.chats ?? []) ?? []
  const [targetMembers, setTargetMembers] = useState<User[]>([])

  const chatsWithMemberInfo = useMemo(
    () =>
      chats?.map((chat: ChatListItem) => {
        if (chat?.type == 'group') return chat
        const targetId = chat?.members?.find((mId: string) => mId !== user?.uid)
        const findMember = targetMembers?.find(
          member => member?.uid == targetId,
        )
        return {...chat, targetId, findMember}
      }),
    [chats, targetMembers],
  )

  const memberIds = useMemo(() => {
    if (!chats || !Array.isArray(chats)) return []
    return Array.from(
      new Set(
        chats.flatMap(chat =>
          Array.isArray(chat?.members) ? chat.members : [],
        ),
      ),
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
        res.forEach((user: User) => fetchedMemberIdsRef.current.add(user?.uid))
        // 기존 캐시 + 신규 결과 병합
        setTargetMembers(prev => {
          const prevMap = new Map(prev.map(u => [u.id, u]))
          res.forEach((u: User) => prevMap.set(u.id, u))
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
        data={chatsWithMemberInfo ?? []}
        keyExtractor={e => e?.id}
        renderItem={({item}) => {
          const findMember = item?.findMember
          const targetId = findMember?.id
          return (
            <ChatListItemCard
              item={item}
              onPress={item => moveToChatRoom(item.id, targetId)}
            />
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
  container: {flex: 1},
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
