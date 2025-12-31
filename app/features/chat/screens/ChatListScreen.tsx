import COLORS from '@app/shared/constants/color'
import type {ChatItemWithMemberInfo} from '@app/shared/types/chat'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import EmptyData from '@app/shared/ui/common/EmptyData'
import SearchInput from '@app/shared/ui/input/SearchInput'
import {useRoute, type RouteProp} from '@react-navigation/native'
import React, {memo, useCallback} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import ChatListItemCard from '../components/ChatListItemCard'
import {useChatListScreen} from '../hooks/useChatListScreen'

type ChatRouteParams = RouteProp<AppRouteParamList, 'chats'>

const MemoizedChatListItem = memo(ChatListItemCard)

//1:1 (DM), 그룹채팅(group) 모두 사용중인 화면.
export default function ChatListScreen() {
  const {params} = useRoute<ChatRouteParams>()
  const type = params?.type ?? 'dm'
  const {
    input,
    setInput,
    chats,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    moveToChatRoom,
  } = useChatListScreen(type)

  const renderItem = useCallback(
    ({item}: {item: ChatItemWithMemberInfo}) => {
      return (
        <MemoizedChatListItem item={item} moveToChatRoom={moveToChatRoom} />
      )
    },
    [moveToChatRoom],
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={e => e?.id}
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        ListHeaderComponent={
          <SearchInput
            placeholder="검색할 닉네임을 입력해주세요."
            value={input}
            onChangeText={setInput}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyData
              text={`레서판다가 기다리고 있어요.\n새로운 대화를 시작해볼까요?`}
            />
          </View>
        }
        refreshing={isLoading}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{flex: 1}}
        contentContainerStyle={styles.chatContents}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  chatContents: {
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    flexGrow: 1,
    backgroundColor: COLORS.outerColor,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  chatRoom: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 8,
  },
  contents: {
    flex: 1,
    gap: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
})
