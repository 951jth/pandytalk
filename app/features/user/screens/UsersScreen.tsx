import {useUsersScreen} from '@app/features/user/hooks/useUsersScreen'
import COLORS from '@app/shared/constants/color'
import UserListSkeleton from '@app/features/user/components/UserListSkeleton'
import React from 'react'
import {FlatList, StyleSheet, Text, View} from 'react-native'
import EmptyData from '../../../shared/ui/common/EmptyData'
import SearchInput from '../../../shared/ui/input/SearchInput'
import GroupMainThumnail from '../../group/components/GroupMainThumnail'
import UserListItem from '../components/UserListItem'

export default function UsersScreen(): React.JSX.Element {
  const {
    searchQuery,
    setSearchQuery,
    users,
    isLoading,
    fetchNextPage,
    hasNextPage,
    refetch,
    moveToChatRoom,
  } = useUsersScreen()

  if (isLoading && !users?.length) {
    return (
      <View style={styles.container}>
        <UserListSkeleton />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SearchInput
        placeholder="검색할 닉네임 시작 글자를 입력해주세요."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={users}
        ListHeaderComponent={
          <>
            <GroupMainThumnail />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>모든 친구</Text>
              <Text style={styles.sectionCount}>
                {users?.length || 0}
              </Text>
            </View>
          </>
        }
        keyExtractor={item => item.uid}
        renderItem={({item}) => {
          return (
            <UserListItem
              item={item}
              onPress={() => {
                moveToChatRoom(item.uid, item?.displayName)
              }}
              style={{marginHorizontal: 16}}
            />
          )
        }}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyData
              text={
                searchQuery ? '검색 결과가 없습니다.' : '아직 친구가 없네요.'
              }
              subText={
                searchQuery
                  ? '정확한 닉네임을 다시 한 번 확인해 보세요.'
                  : '새로운 친구를 찾고 즐거운 대화를 시작해 보세요!'
              }
            />
          </View>
        }
        refreshing={isLoading}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
})
