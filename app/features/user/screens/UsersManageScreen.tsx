import UserDetailModal from '@app/features/user/components/UserDetailModal'
import UserManageItem from '@app/features/user/components/UserManageItem'
import {useUsersManageScreen} from '@app/features/user/hooks/useUsersManageScreen'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import UserManageSkeleton from '@app/shared/ui/skeleton/UserManageSkeleton'
import React, {useCallback} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import SearchInput from '../../../shared/ui/input/SearchInput'

const MemoizedUserManageItem = React.memo(UserManageItem)

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

  const RenderItem = useCallback(
    ({item}: {item: User}) => {
      return (
        <MemoizedUserManageItem
          item={item}
          onPress={selectedUser => {
            setModalProps({open: true, record: selectedUser})
          }}
        />
      )
    },
    [setModalProps],
  )

  return (
    <View style={styles.container}>
      <AppHeader title="유저 관리" />
      <SearchInput
        placeholder="검색할 닉네임 시작 글자를 입력해주세요."
        value={input}
        onChangeText={setInput}
      />
      {isLoading && !users?.length ? (
        <UserManageSkeleton />
      ) : (
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
          showsVerticalScrollIndicator={false}
        />
      )}

      <UserDetailModal
        open={!!modalProps?.open}
        record={modalProps?.record as User}
        onComplete={() => setModalProps({open: false, record: null})}
        onClose={() => setModalProps({open: false, record: null})}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // 배경 통일
  },
  searchWrapper: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  friendsContainer: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 40,
    flexGrow: 1,
  },
})
