import debounce from 'lodash/debounce'
import React, {useEffect, useMemo, useState} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import ChatMember from '../components/card/ChatMember'
import SearchInput from '../components/input/SearchInput'
import COLORS from '../constants/color'
import {useUsersInfinite} from '../hooks/useInfiniteQuery'

export default function UsersScreen(): React.JSX.Element {
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUsersInfinite(searchText)

  const users = data?.pages.flatMap(page => page.users) ?? []
  console.log(users)
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

  return (
    <View style={styles.container}>
      <SearchInput
        placeholder="검색할 닉네임 시작 글자를 입력해주세요."
        value={input}
        onChangeText={setInput}
      />
      <FlatList
        data={users}
        keyExtractor={item => item.uid}
        renderItem={({item}) => {
          return <ChatMember item={item} />
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
        style={styles.friendsContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  friendsContainer: {
    paddingHorizontal: 16,
  },
})
