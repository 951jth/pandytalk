import {useUsersInfinite} from '@app/features/user/hooks/useUsersInfinite'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {useAppSelector} from '@app/store/reduxHooks'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {useState} from 'react'

export function useUsersScreen() {
  const [searchText, setSearchText] = useState<string>('')
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUsersInfinite(searchText)
  const {data: userInfo, loading, error} = useAppSelector(state => state.user)
  const navigation =
    useNavigation<NativeStackNavigationProp<AppRouteParamList, 'dm-chat'>>()

  const users = data?.pages.flatMap(page => page.users) ?? []

  const moveToChatRoom = (targetId: string, title: string) => {
    if (!userInfo) return
    navigation.navigate('dm-chat', {
      myId: userInfo.uid,
      targetId,
      title,
    })
  }
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
    users,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    moveToChatRoom,
  }
}
