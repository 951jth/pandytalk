import {useUsersInfinite} from '@app/features/user/hooks/useUsersInfinite'
import type {AppRouteParamList} from '@app/navigation/types'
import {getDMChatId} from '@app/shared/utils/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {debounce} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'

export function useUsersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchText, setSearchText] = useState('')
  const {
    data,
    isLoading: isQueryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUsersInfinite(searchText, true)
  const {data: userInfo, loading: isUserLoading} = useAppSelector(
    state => state.user,
  )
  const currentUid = userInfo?.uid
  const navigation =
    useNavigation<NativeStackNavigationProp<AppRouteParamList, 'dm-chat'>>()

  const others = useMemo(() => {
    const users = data?.pages.flatMap(page => page.users) ?? []
    return users?.filter(e => e?.uid !== currentUid)
  }, [data, currentUid])

  const moveToChatRoom = useCallback(
    (targetId: string, title: string) => {
      if (!currentUid) return
      navigation.navigate('dm-chat', {
        initialChatInfo: {
          id: getDMChatId(currentUid, targetId),
          type: 'dm',
          title,
          targetId,
        },
      })
    },
    [currentUid, navigation],
  )
  const debouncedSetSearchText = useMemo(
    () =>
      debounce((text: string) => {
        setSearchText(text.trim())
      }, 300),
    [],
  )

  useEffect(() => {
    debouncedSetSearchText(searchQuery)
    return () => debouncedSetSearchText.cancel()
  }, [searchQuery, debouncedSetSearchText])

  const isLoading =
    isUserLoading || isQueryLoading || !userInfo?.uid

  return {
    searchQuery,
    setSearchQuery,
    users: others,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    moveToChatRoom,
  }
}
