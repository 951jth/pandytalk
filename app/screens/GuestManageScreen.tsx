import {debounce} from 'lodash'
import React, {useEffect, useMemo, useState} from 'react'
import {FlatList, StyleSheet, Text, View} from 'react-native'
import SearchInput from '../components/input/SearchInput'
import {usePendingUsersInfinity} from '../hooks/queries/useUserQuery'
import type {User} from '../types/auth'

const RequestMember = ({member}: {member: User}) => {
  return (
    <View>
      <Text>{member?.displayName}</Text>
    </View>
  )
}

export default function GuestManageScreen() {
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePendingUsersInfinity(searchText)
  const users = (data?.pages.flatMap(page => page.users) as User[]) ?? []
  console.log('users', users)
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
        renderItem={item => <RequestMember member={item} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
})
