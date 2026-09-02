import {useChatWithMembersInfo} from '@app/features/chat/hooks/useChatWithMembersInfo'
import {useMyChatListInfinite} from '@app/features/chat/hooks/useMyChatListInfinite'
import type {ChatRoom} from '@app/shared/types/chat'
import {debounce} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {useAppSelector} from '../../../store/reduxHooks'

type ChatListType = Extract<ChatRoom['type'], 'dm' | 'group'>

export function useChatList(type: ChatListType) {
  const {data: user} = useAppSelector(state => state.user)
  const [input, setInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const {
    data,
    isLoading: isQueryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMyChatListInfinite(user?.uid, type)

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

  const filteredChats = useMemo(
    () =>
      chats?.filter(chat =>
        chat?.name?.toUpperCase().includes(searchText?.toUpperCase()),
      ),
    [chats, searchText],
  )

  const isLoading =
    !user?.uid ||
    isQueryLoading ||
    (rawChats.length > 0 && filteredChats.length === 0 && !input)

  return {
    user,
    input,
    setInput,
    chats: filteredChats,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  }
}
