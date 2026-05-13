// features/chat/hooks/useChatListScreen.ts
import {useChatWithMembersInfo} from '@app/features/chat/hooks/useChatWithMembersInfo'
import {useMyChatListInfinite} from '@app/features/chat/hooks/useMyChatListInfinite'
import {ChatItemWithMemberInfo, ChatRoom} from '@app/shared/types/chat'
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
    isLoading: isQueryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMyChatListInfinite(user?.uid, type)
  // 실시간 구독은 현재 레이아웃단에서 구독함(뱃지 카운트 때문에)
  // useSubscribeChatList(user?.uid, type)

  const rawChats: ChatRoom[] = useMemo(
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

  const filteredChat = useMemo(() => {
    let list = chats
    if (user?.accountStatus === 'pending' && type === 'dm') {
      list = list?.filter(chat => chat.findMember?.authority === 'ADMIN')
    }
    return list?.filter(chat =>
      chat?.name?.toUpperCase().includes(searchText?.toUpperCase()),
    )
  }, [chats, searchText, user?.accountStatus, type])

  const isLoading =
    !user?.uid ||
    isQueryLoading ||
    (rawChats.length > 0 && filteredChat.length === 0 && !input)

  const moveToChatRoom = useCallback(
    (chatInfo: ChatItemWithMemberInfo) => {
      if (type === 'dm' && user?.uid && chatInfo.findMember?.id) {
        navigation.navigate('dm-chat', {
          initialChatInfo: {
            id: chatInfo.id,
            type: 'dm',
            title: chatInfo.findMember?.displayName ?? chatInfo.name,
            image: chatInfo.findMember?.photoURL,
            targetId: chatInfo.findMember.id,
            lastSeq: chatInfo.lastSeq,
          },
        })
      } else if (type === 'group' && chatInfo.id) {
        navigation.navigate('group-chat', {
          initialChatInfo: {
            id: chatInfo.id,
            type: 'group',
            title: chatInfo.name,
            image: chatInfo.image,
            lastSeq: chatInfo.lastSeq,
          },
        })
      }
    },
    [navigation, type, user?.uid],
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
