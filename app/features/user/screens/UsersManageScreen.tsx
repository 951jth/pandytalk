import MemberDetailModal from '@app/features/user/components/MemberDetailModal'
import {User} from '@app/shared/types/auth'
import {debounce} from 'lodash'
import React, {useEffect, useMemo, useState} from 'react'
import {FlatList, StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import SearchInput from '../../../shared/ui/input/SearchInput'
import {usePendingUsersInfinity} from '../../chat/hooks/useUserQuery'
import RequestMemberCard from '../components/MemberCard'

type modalProps = {
  open: boolean | null | undefined
  record?: User | object | null
}

export default function UsersManageScreen() {
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [modalProps, setModalProps] = useState<modalProps>({open: false})
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePendingUsersInfinity(searchText)

  const RenderItem = ({item}: {item: User}) => {
    return (
      <RequestMemberCard
        item={item}
        onPress={item => {
          setModalProps({open: true, record: item})
        }}
      />
    )
  }

  const users = (data?.pages.flatMap(page => page.users) as User[]) ?? []
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
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <SearchInput
        placeholder="검색할 닉네임 시작 글자를 입력해주세요."
        value={input}
        onChangeText={setInput}
      />
      <FlatList
        data={users}
        renderItem={({item}) => <RenderItem item={item} />}
        refreshing={isLoading}
        onRefresh={refetch}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.friendsContainer}
      />
      <MemberDetailModal
        open={!!modalProps?.open}
        setOpen={boolean => setModalProps({open: boolean, record: null})}
        record={modalProps?.record as User}
        onRefresh={refetch}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  friendsContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    flexGrow: 1,
  },
})
