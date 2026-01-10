import ChatMessageItem, {
  type ChatMessageItemProps,
} from '@app/features/chat/components/ChatMessageItem'
import {useChatMessageList} from '@app/features/chat/hooks/useChatMessageList'
import {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {isSameDate, isSameMinute, isSameSender} from '@app/shared/utils/chat'
import React, {memo, useCallback, useMemo} from 'react'
import {FlatList, StyleSheet} from 'react-native'

interface Props {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatRoom | null | undefined
  chatType?: ChatRoom['type']
}

type ChatMessagesWithUiType = ChatMessage & {
  hideProfile?: boolean
  hideMinute?: boolean
  hideDate?: boolean
}

// ChatMessageItem에 props를 전달시 ChatMessagesWithUi의
// ...msg 떄문에 참조가 꺠져서 메모효과가 없어짐. 그래서 areEqual옵션을 활용함
const arePropsEqual = (
  prev: ChatMessageItemProps,
  next: ChatMessageItemProps,
) => {
  // UI 표시 관련 플래그 비교 (가장 자주 바뀌는 것들)
  const isFlagsSame =
    prev.hideProfile === next.hideProfile &&
    prev.hideMinute === next.hideMinute &&
    prev.hideDate === next.hideDate &&
    prev.isMine === next.isMine &&
    prev.roomId === next.roomId

  if (!isFlagsSame) return false
  if (prev.member !== next.member) return false
  const p = prev.item
  const n = next.item
  const isItemSame =
    p.id === n.id &&
    p.status === n.status && // 'pending' -> 'success' 상태 변화 감지 (중요)
    p.text === n.text && // 메시지 수정 감지
    p.imageUrl === n.imageUrl && // 이미지 URL 변경 감지
    p.createdAt === n.createdAt && // 생성 시간
    p.senderPicURL === n.senderPicURL && // 보낸 사람 프사 변경 (스냅샷)
    p.senderName === n.senderName && // 보낸 사람 이름 변경 (스냅샷)
    p.type === n.type // 메시지 타입

  return isItemSame
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
  } = useChatMessageList({userId, roomId, roomInfo})

  const ChatMessagesWithUi = useMemo(() => {
    return messages?.map((msg, idx) => {
      const nextItem = messages?.[idx + 1] ?? null
      const hideProfile = isSameSender(msg, nextItem)
      const hideMinute = isSameMinute(msg, nextItem)
      const hideDate = isSameDate(msg, nextItem)
      return {
        ...msg,
        hideProfile,
        hideMinute,
        hideDate,
      }
    })
  }, [messages])

  const renderMessage = useCallback(
    ({item, index}: {item: ChatMessagesWithUiType; index: number}) => {
      const isMine = item?.senderId === userId
      const {hideProfile, hideMinute, hideDate} = item
      const member = membersMap.get(item.senderId)

      return (
        <MemoizedChatMessage
          item={item}
          isMine={isMine}
          hideProfile={!!hideProfile}
          hideMinute={!!hideMinute}
          hideDate={!!hideDate}
          roomId={roomId ?? null}
          member={member}
        />
      )
    },
    [membersMap, userId, roomId],
  )
  console.log('messages', messages)
  return (
    <FlatList
      style={styles.flex}
      data={ChatMessagesWithUi || []}
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
