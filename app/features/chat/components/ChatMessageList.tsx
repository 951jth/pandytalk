import ChatMessageItem, {
  ChatMessageItemProps,
} from '@app/features/chat/components/ChatMessageItem'
import { useChatMessageList } from '@app/features/chat/hooks/useChatMessageList'
import { ChatRoom } from '@app/shared/types/chat'
import { isSameDate, isSameMinute, isSameSender } from '@app/shared/utils/chat'
import React, { memo, useCallback, useMemo } from 'react'
import { FlatList, StyleSheet } from 'react-native'

interface Props {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatRoom | null | undefined
  chatType?: ChatRoom['type']
}

// ChatMessageItem에 props를 전달시 ChatMessagesWithUi의
// uiConfig 떄문에 참조가 꺠져서 메모효과가 없어짐. 그래서 areEqual옵션을 활용함
const arePropsEqual = (
  prev: ChatMessageItemProps,
  next: ChatMessageItemProps,
) => {
  const {item: pMsg, uiConfig: pUi} = prev
  const {item: nMsg, uiConfig: nUi} = next
  const isUiConfigSame =
    pUi.hideProfile === nUi.hideProfile &&
    pUi.hideMinute === nUi.hideMinute &&
    pUi.hideDate === nUi.hideDate
  if (!isUiConfigSame) return false
  if (prev.member !== next.member) return false
  return pMsg === nMsg
}
const MemoizedChatMessage = memo(ChatMessageItem, arePropsEqual)

export default function ChatMessageList({roomId, userId, roomInfo}: Props) {
  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    membersMap,
    flatListRef
  } = useChatMessageList({userId, roomId, roomInfo})

  const ChatMessagesWithUi = useMemo(() => {
    return messages?.map((msg, idx) => {
      const nextItem = messages?.[idx + 1] ?? null
      const hideProfile = isSameSender(msg, nextItem)
      const hideMinute = isSameMinute(msg, nextItem)
      const hideDate = isSameDate(msg, nextItem)
      const isMine = msg?.senderId === userId
      const member = membersMap.get(msg.senderId)
      return {
        item: msg,
        uiConfig: {
          hideProfile,
          hideMinute,
          hideDate,
        },
        isMine,
        roomId,
        member,
      }
    })
  }, [messages, roomId, membersMap, userId])

  const renderMessage = useCallback(
    ({item}: {item: ChatMessageItemProps}) => {
      const {item: chatMessage, uiConfig, isMine, member} = item
      return (
        <MemoizedChatMessage
          item={chatMessage}
          isMine={isMine}
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
      data={ChatMessagesWithUi || []}
      keyExtractor={item => item.item?.id}
      renderItem={renderMessage}
      contentContainerStyle={styles.chatList}
      inverted={true}
      keyboardShouldPersistTaps="handled"
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      refreshing={isLoading}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}

      // onRefresh={resetChatMessages}
      // refreshing={isLoading}
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
