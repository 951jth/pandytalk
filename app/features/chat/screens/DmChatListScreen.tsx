import ChatListItemCard from '@app/features/chat/components/ChatListItemCard'
import ChatListSkeleton from '@app/features/chat/components/ChatListSkeleton'
import {useChatList} from '@app/features/chat/hooks/useChatList'
import type {ChatItemWithMemberInfo} from '@app/features/chat/types/chat'
import type {AppRouteParamList} from '@app/navigation/types'
import COLORS from '@app/shared/constants/color'
import EmptyData from '@app/shared/ui/common/EmptyData'
import SearchInput from '@app/shared/ui/input/SearchInput'
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React, {memo, useCallback} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'

type Navigation = NativeStackNavigationProp<AppRouteParamList, 'dm-chat'>

const MemoizedChatListItem = memo(ChatListItemCard)

export default function DmChatListScreen() {
  const navigation = useNavigation<Navigation>()
  const tabBarHeight = useBottomTabBarHeight()
  const {
    user,
    input,
    setInput,
    chats,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useChatList('dm')

  const moveToChatRoom = useCallback(
    (chatInfo: ChatItemWithMemberInfo) => {
      if (!user?.uid || !chatInfo.findMember?.id) return

      navigation.navigate('dm-chat', {
        initialChatInfo: {
          id: chatInfo.id,
          type: 'dm',
          title: chatInfo.findMember.displayName ?? chatInfo.name,
          image: chatInfo.findMember.photoURL,
          targetId: chatInfo.findMember.id,
          lastSeq: chatInfo.lastSeq,
        },
      })
    },
    [navigation, user?.uid],
  )

  const renderItem = useCallback(
    ({item}: {item: ChatItemWithMemberInfo}) => (
      <MemoizedChatListItem item={item} moveToChatRoom={moveToChatRoom} />
    ),
    [moveToChatRoom],
  )

  if (isLoading && !chats?.length) {
    return (
      <View style={styles.container}>
        <ChatListSkeleton />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SearchInput
        placeholder="검색할 닉네임을 입력해주세요."
        value={input}
        onChangeText={setInput}
      />
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
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
        style={styles.list}
        contentContainerStyle={[
          styles.chatContents,
          {paddingBottom: tabBarHeight + 16},
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    flex: 1,
  },
  chatContents: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
