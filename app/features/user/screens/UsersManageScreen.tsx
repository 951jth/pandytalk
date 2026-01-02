import UserDetailModal from '@app/features/user/components/UserDetailModal'
import UserListItem from '@app/features/user/components/UserListItem'
import {useUsersManageScreen} from '@app/features/user/hooks/useUsersManageScreen'
import {User} from '@app/shared/types/auth'
import React from 'react'
import {FlatList, StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import SearchInput from '../../../shared/ui/input/SearchInput'

export default function UsersManageScreen() {
  const {
    input,
    setInput,
    users,
    isLoading,
    fetchNextPage,
    hasNextPage,
    refetch,
    modalProps,
    setModalProps,
  } = useUsersManageScreen()

  const RenderItem = ({item}: {item: User}) => {
    return (
      <UserListItem
        item={item}
        onPress={item => {
          setModalProps({open: true, record: item})
        }}
      />
    )
  }

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
      <UserDetailModal
        open={!!modalProps?.open}
        setOpen={boolean => setModalProps({open: boolean, record: null})}
        record={modalProps?.record as User}
        onComplete={() => setModalProps({open: false, record: null})}
        onClose={() => setModalProps({open: false, record: null})}
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
