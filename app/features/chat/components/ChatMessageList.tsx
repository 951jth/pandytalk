import ChatMessageItem from '@app/features/chat/components/ChatMessageItem'
import {useChatMessageList} from '@app/features/chat/hooks/useChatMessageList'
import COLORS from '@app/shared/constants/color'
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
  chatRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myChat: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: COLORS.primary,
    position: 'relative',
    maxWidth: 250,
  },
  otherChat: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
    backgroundColor: COLORS.background,
    position: 'relative',
    maxWidth: 250,
  },
  chatDateWrap: {
    alignSelf: 'center',
    backgroundColor: '#E5E5EA', // 연한 회색
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 8,
  },
  chatDateText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },

  chatTime: {
    color: '#333',
    fontSize: 12,
    position: 'absolute',
    bottom: 0,
    width: 60,
  },
  frame: {
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginRight: 10,
  },
  profile: {
    width: 48,
    height: 48,
    borderRadius: 25,
  },
  nickname: {
    marginBottom: 2,
    fontSize: 13,
  },
  chatImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
})
