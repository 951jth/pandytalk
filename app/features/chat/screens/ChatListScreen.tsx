import COLORS from '@app/shared/constants/color'
import type {ChatItemWithMemberInfo} from '@app/shared/types/chat'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import EmptyData from '@app/shared/ui/common/EmptyData'
import SearchInput from '@app/shared/ui/input/SearchInput'
import ChatListSkeleton from '@app/shared/ui/skeleton/ChatListSkeleton'
import {useRoute, type RouteProp} from '@react-navigation/native'
import React, {memo, useCallback} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
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
  console.log('chats', chats)
  console.log('isLoading', isLoading)
  if (isLoading && !chats?.length) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['right', 'left', 'bottom']}>
        <ChatListSkeleton />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
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
              text="대화의 꽃을 피워볼까요?"
              subText="친구들과 즐거운 대화를 시작해 보세요!"
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: COLORS.background, // 앱 전체 테마 반영
  },
  chatContents: {
    paddingBottom: 24, // 하단 탭바 여백 확보
    flexGrow: 1, // ✅ 목록이 비었을 때 화면을 꽉 채우도록 설정
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
