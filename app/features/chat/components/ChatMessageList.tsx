import React, { memo, useCallback } from 'react'
import { FlatList, StyleSheet } from 'react-native'

import ChatMessageItem, {
  ChatMessageItemProps,
} from '@features/chat/components/ChatMessageItem'
import { useChatMessageList } from '@features/chat/hooks/useChatMessageList'
import { ChatRoom } from '@shared/types/chat'

interface Props {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatRoom | null | undefined
  chatType?: ChatRoom['type']
}

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
    flatListRef
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
    <FlatList
      ref={flatListRef}
      style={styles.flex}
      data={messagesWithUi || []} // 메시지 가공 데이터 연결
      keyExtractor={item => item.item?.id}
      renderItem={renderMessage}
      contentContainerStyle={styles.chatList}
      inverted={true}
      keyboardShouldPersistTaps="handled"
      refreshing={isLoading}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}

      // onRefresh={resetChatMessages}
      // refreshing={isLoading}
      onEndReachedThreshold={0.1}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      // 새로운 아이템이 위나 아래에 추가되어도 현재 보고 있는 위치 유지
      //초기 렌더링 개수 및 업데이트 배치 설정
      initialNumToRender={20}
      maxToRenderPerBatch={10}
      windowSize={20}
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
