import {FlashList} from '@shopify/flash-list'
import React, {memo, useCallback} from 'react'
import {StyleSheet} from 'react-native'

import ChatMessageItem, {
  ChatMessageItemProps,
} from '@features/chat/components/ChatMessageItem'
import {useChatMessageList} from '@features/chat/hooks/useChatMessageList'
import {ChatRoom} from '@shared/types/chat'

interface Props {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatRoom | null | undefined
  chatType?: ChatRoom['type']
}

//FlatList vs FlashList
// 왜 FlashList를 사용하는가?

// ChatMessageItem에 props를 전달시 ChatMessagesWithUi의
// uiConfig 떄문에 참조가 꺠져서 메모효과가 없어짐. 그래서 arePropsEqual옵션을 활용함
const arePropsEqual = (
  prev: ChatMessageItemProps,
  next: ChatMessageItemProps,
) => {
  const {item: pMsg, uiConfig: pUi} = prev
  const {item: nMsg, uiConfig: nUi} = next
  const isUiConfigSame =
    pUi.hideProfile === nUi.hideProfile &&
    pUi.hideMinute === nUi.hideMinute &&
    pUi.hideDate === nUi.hideDate &&
    pUi.isMine === nUi.isMine
  if (!isUiConfigSame) return false
  if (prev.member !== next.member) return false
  return pMsg === nMsg
}
const MemoizedChatMessage = memo(ChatMessageItem, arePropsEqual)

export default function ChatMessageList({roomId, userId, roomInfo}: Props) {
  const {
    messagesWithUi, // 훅에서 가공된 데이터 받아옴(멤버 정보도 포함)
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    flatListRef,
    handleScroll,
  } = useChatMessageList({userId, roomId, roomInfo})

  const renderMessage = useCallback(
    ({item}: {item: ChatMessageItemProps}) => {
      const {item: chatMessage, uiConfig, member} = item
      return (
        <MemoizedChatMessage
          item={chatMessage}
          uiConfig={uiConfig}
          roomId={roomId ?? null}
          member={member}
        />
      )
    },
    [roomId],
  )

  return (
    <FlashList
      ref={flatListRef}
      style={styles.flex}
      data={messagesWithUi || []} // 메시지 가공 데이터 연결
      keyExtractor={item => item.item?.id}
      renderItem={renderMessage}
      contentContainerStyle={styles.chatList}
      keyboardShouldPersistTaps="handled"
      refreshing={isLoading}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}
      // onRefresh={resetChatMessages}
      // refreshing={isLoading}
      onEndReachedThreshold={0.5}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      // FlashList 필수 및 권장 옵션
      estimatedItemSize={80} // 말풍선의 평균적인 높이
      drawDistance={500}
      removeClippedSubviews={true}
    />
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chatList: {
    minHeight: 100,
    flexGrow: 1,
    paddingBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
})
