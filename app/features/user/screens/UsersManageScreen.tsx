import UserDetailModal from '@app/features/user/components/UserDetailModal'
import UserListItem from '@app/features/user/components/UserListItem'
import {useUsersManageScreen} from '@app/features/user/hooks/useUsersManageScreen'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import React, {useCallback} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import SearchInput from '../../../shared/ui/input/SearchInput'

const MemoizedUserListItem = React.memo(UserListItem)

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
        <MemoizedUserListItem
          item={item}
          onPress={item => {
            setModalProps({open: true, record: item})
          }}
        />
      )
    },
    [setModalProps],
  )

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <AppHeader title="유저 관리" />
      <View style={styles.searchWrapper}>
        <SearchInput
          placeholder="검색할 닉네임 시작 글자를 입력해주세요."
          value={input}
          onChangeText={setInput}
        />
      </View>
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
      <UserDetailModal
        open={!!modalProps?.open}
        record={modalProps?.record as User}
        onComplete={() => setModalProps({open: false, record: null})}
        onClose={() => setModalProps({open: false, record: null})}
      />
    </SafeAreaView>
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
