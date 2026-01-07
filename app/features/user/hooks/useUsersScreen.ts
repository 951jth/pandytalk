import {useUsersInfinite} from '@app/features/user/hooks/useUsersInfinite'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {useAppSelector} from '@app/store/reduxHooks'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {useCallback, useMemo, useState} from 'react'

export function useUsersScreen() {
  const [searchText, setSearchText] = useState<string>('')
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUsersInfinite(searchText, true)
  const {data: userInfo, loading, error} = useAppSelector(state => state.user)
  const navigation =
    useNavigation<NativeStackNavigationProp<AppRouteParamList, 'dm-chat'>>()

  const others = useMemo(() => {
    const users = data?.pages.flatMap(page => page.users) ?? []
    return users?.filter(e => e?.uid !== userInfo?.uid)
  }, [data])

  const moveToChatRoom = useCallback(
    (targetId: string, title: string) => {
      if (!userInfo) return
      navigation.navigate('dm-chat', {
        myId: userInfo.uid,
        targetId,
        title,
      })
    },
    [navigation, userInfo?.uid],
  )
  // TODO 필터링 기능 필요하면 사용.
  // const debouncedSetSearchText = useMemo(
  //   () =>
  //     debounce((text: string) => {
  //       setSearchText(text.toString())
  //     }, 300),
  //   [],
  // )

  // useEffect(() => {
  //   debouncedSetSearchText(input)
  //   // cleanup 함수로 debounce 취소
  //   return () => debouncedSetSearchText.cancel()
  // }, [input])

  return {
    searchText,
    setSearchText,
    users: others,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    moveToChatRoom,
  }
}
