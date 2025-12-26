import ChatMessageItem from '@app/features/chat/components/ChatMessageItem'
import {useChatMessageList} from '@app/features/chat/hooks/useChatMessageList'
import {ChatListItem, ChatMessage} from '@app/shared/types/chat'
import React, {memo, useCallback} from 'react'
import {FlatList, StyleSheet} from 'react-native'
import {
  isSameDate,
  isSameMinute,
  isSameSender,
} from '../../../shared/utils/chat'

interface Props {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatListItem | null | undefined
  inputComponent?: React.ComponentType<any> | React.ReactElement | null
  chatType?: ChatListItem['type']
}
const MemoizedChatMessage = memo(ChatMessageItem)

export default function ChatMessageList({
  roomId,
  userId,
  roomInfo,
  chatType = 'dm',
}: Props) {
  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    membersMap,
  } = useChatMessageList({roomId, userId, roomInfo, chatType})

  const renderMessage = useCallback(
    ({item, index}: {item: ChatMessage; index: number}) => {
      const isMine = item?.senderId === userId
      const nextItem = messages?.[index + 1] ?? null
      const hideProfile = isSameSender(item, nextItem)
      const hideMinute = isSameMinute(item, nextItem)
      const hideDate = isSameDate(item, nextItem)
      const member = membersMap.get(item.senderId)

      return (
        <MemoizedChatMessage
          item={item}
          isMine={isMine}
          hideProfile={hideProfile}
          hideMinute={hideMinute}
          hideDate={hideDate}
          member={member}
        />
      )
    },
    [membersMap, messages],
  )

  return (
    <FlatList
      style={styles.flex}
      data={messages || []}
      keyExtractor={item => item.id}
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
