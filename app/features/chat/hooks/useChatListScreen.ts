// features/chat/hooks/useChatListScreen.ts
import {useMyChatsInfinite} from '@app/features/chat/hooks/useMyChatsInfinite'
import {useSubscribeChatList} from '@app/features/chat/hooks/useSubscribeChatList'
import {ChatItemWithMemberInfo, ChatListItem} from '@app/shared/types/chat'
import {AppRouteParamList} from '@app/shared/types/navigate'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {debounce} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {useAppSelector} from '../../../store/reduxHooks'
import {useChatWithMembersInfo} from './useChatWithMembersInfo'

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
  } = useMyChatsInfinite(user?.uid, type)
  // 실시간 구독
  // useSubscribeChatList(user?.uid, type)
  useSubscribeChatList(user?.uid, type)

  const rawChats: ChatListItem[] =
    data?.pages.flatMap(page => page?.chats ?? []) ?? []
  const chats = useChatWithMembersInfo(rawChats, user, type)

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

  const filteredChat = chats?.filter(chat => chat?.name?.includes(searchText))

  const moveToChatRoom = (targetId?: string | null, roomId?: string) => {
    if (type === 'dm' && user?.uid && targetId) {
      navigation.navigate('dm-chat', {myId: user.uid, targetId})
    } else if (type === 'group' && roomId) {
      navigation.navigate('group-chat', {roomId})
    }
  }

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
