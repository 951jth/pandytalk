import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import debounce from 'lodash/debounce'
import React, {useEffect, useMemo, useState} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import ChatMember from '../components/card/ChatMember'
import EmptyData from '../components/common/EmptyData'
import SearchInput from '../components/input/SearchInput'
import {useUsersInfinite} from '../hooks/queries/useUserQuery'
import useKeyboardFocus from '../hooks/useKeyboardFocus'
import {useAppSelector} from '../store/reduxHooks'
import {AppRouteParamList} from '../types/navigate'

// 채팅방 네비게이션 타입 정의 (필요 시 수정)

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
  const {data: user, loading, error} = useAppSelector(state => state.user)

  const navigation =
    useNavigation<NativeStackNavigationProp<AppRouteParamList, 'chatRoom'>>()
  const users = data?.pages.flatMap(page => page.users) ?? []
  const {isKeyboardVisible, dismissKeyboard} = useKeyboardFocus()

  const debouncedSetSearchText = useMemo(
    () =>
      debounce((text: string) => {
        setSearchText(text.toString())
      }, 300),
    [],
  )

  const moveToChatRoom = (uid: string, title: string) => {
    navigation.navigate('chatRoom', {targetIds: [uid], title})
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
        data={users?.filter(({uid}) => uid != user?.uid)}
        keyExtractor={item => item.uid}
        renderItem={({item}) => {
          return (
            <ChatMember
              item={item}
              onPress={() => {
                dismissKeyboard()
                if (!isKeyboardVisible)
                  moveToChatRoom(item.uid, item?.displayName)
              }}
            />
          )
        }}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 12,
            }}>
            <EmptyData text={`아직 유저가 없네요.`} />
          </View>
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
    paddingHorizontal: 12,
    paddingTop: 4,
    flexGrow: 1,
  },
})
