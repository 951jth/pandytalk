// features/chat/hooks/useChatListScreen.ts
import {useChatWithMembersInfo} from '@app/features/chat/hooks/useChatWithMembersInfo'
import {useMyChatListInfinite} from '@app/features/chat/hooks/useMyChatListInfinite'
import {useSubscribeChatList} from '@app/features/chat/hooks/useSubscribeChatList'
import {ChatItemWithMemberInfo, ChatListItem} from '@app/shared/types/chat'
import {AppRouteParamList} from '@app/shared/types/navigate'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {debounce} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useAppSelector} from '../../../store/reduxHooks'

type Navigation = NativeStackNavigationProp<
  AppRouteParamList,
  'dm-chat' | 'group-chat'
>

export const useChatListScreen = (type: ChatItemWithMemberInfo['type']) => {
  const {data: user} = useAppSelector(state => state.user)
  const navigation = useNavigation<Navigation>()
  // 검색 인풋 / 디바운스 검색어
  const [input, setInput] = useState('')
  const [searchText, setSearchText] = useState('')

  // 채팅 목록 쿼리
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMyChatListInfinite(user?.uid, type)
  // 실시간 구독
  useSubscribeChatList(user?.uid, type)

  const rawChats: ChatListItem[] = useMemo(
    () => data?.pages.flatMap(page => page?.chats ?? []) ?? [],
    [data],
  )
  const chats = useChatWithMembersInfo(rawChats, type, user?.uid)

  const debouncedSetSearchText = useMemo(
    () =>
      debounce((text: string) => {
        setSearchText(text.trim())
      }, 300),
    [],
  )

  useEffect(() => {
    debouncedSetSearchText(input)
    return () => debouncedSetSearchText.cancel()
  }, [input, debouncedSetSearchText])

  const filteredChat = useMemo(
    () => chats?.filter(chat => chat?.name?.includes(searchText)),
    [chats, searchText],
  )

  const moveToChatRoom = useCallback(
    (targetId?: string | undefined, roomId?: string | undefined) => {
      if (type === 'dm' && user?.uid && targetId) {
        navigation.navigate('dm-chat', {myId: user.uid, targetId})
      } else if (type === 'group' && roomId) {
        navigation.navigate('group-chat', {roomId})
      }
    },
    [navigation, user?.uid],
  )

  return {
    input,
    setInput,
    chats: filteredChat,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    moveToChatRoom,
  }
}
