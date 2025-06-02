import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import debounce from 'lodash/debounce'
import React, {useEffect, useMemo, useState} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import ChatMember from '../components/card/ChatMember'
import SearchInput from '../components/input/SearchInput'
import COLORS from '../constants/color'
import {useUsersInfinite} from '../hooks/useInfiniteQuery'

// 채팅방 네비게이션 타입 정의 (필요 시 수정)
type RootStackParamList = {
  chatRoom: {uid: string}
}

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

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'chatRoom'>>()
  const users = data?.pages.flatMap(page => page.users) ?? []
  const debouncedSetSearchText = useMemo(
    () =>
      debounce((text: string) => {
        setSearchText(text.toString())
      }, 300),
    [],
  )

  const moveToChatRoom = (uid: string) => {
    navigation.navigate('chatRoom', {uid})
  }

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
          return (
            <ChatMember item={item} onPress={() => moveToChatRoom(item.uid)} />
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
        refreshing={isLoading}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.friendsContainer}
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
    paddingTop: 4,
  },
})
