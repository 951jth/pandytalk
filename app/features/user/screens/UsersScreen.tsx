import {useUsersScreen} from '@app/features/user/hooks/useUsersScreen'
import React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import EmptyData from '../../../shared/ui/common/EmptyData'
import ChatMember from '../../chat/components/ChatMember'
import GroupMainThumnail from '../../group/components/GroupMainThumnail'

// 채팅방 네비게이션 타입 정의 (필요 시 수정)
export default function UsersScreen(): React.JSX.Element {
  const {
    users,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    moveToChatRoom,
  } = useUsersScreen()

  return (
    <View style={styles.container}>
      {/* <SearchInput
        placeholder="검색할 닉네임 시작 글자를 입력해주세요."
        value={input}
        onChangeText={setInput}
      /> */}
      <FlatList
        data={users}
        ListHeaderComponent={<GroupMainThumnail style={{paddingBottom: 12}} />}
        keyExtractor={item => item.uid}
        renderItem={({item}) => {
          return (
            <ChatMember
              item={item}
              onPress={() => {
                // dismissKeyboard()
                // if (!isKeyboardVisible)
                moveToChatRoom(item.uid, item?.displayName)
              }}
              style={{marginHorizontal: 12}}
            />
          )
        }}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
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
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
})
