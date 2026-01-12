import ChatMessageItem, {
  ChatMessageItemProps,
} from '@app/features/chat/components/ChatMessageItem'
import {useChatMessageList} from '@app/features/chat/hooks/useChatMessageList'
import {ChatRoom} from '@app/shared/types/chat'
import {isSameDate, isSameMinute, isSameSender} from '@app/shared/utils/chat'
import React, {memo, useCallback, useMemo} from 'react'
import {FlatList, StyleSheet} from 'react-native'

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
  // 1. UI 플래그 비교 (가장 빈번한 변경 요소)
  // uiConfig 객체 자체도 새로 만들어지므로 내부 값 비교가 안전합니다.
  const {item: pMsg, uiConfig: pUi} = prev
  const {item: nMsg, uiConfig: nUi} = next
  const isUiConfigSame =
    pUi.hideProfile === nUi.hideProfile &&
    pUi.hideMinute === nUi.hideMinute &&
    pUi.hideDate === nUi.hideDate
  if (!isUiConfigSame) return false
  // 2. 멤버 정보 비교 (참조 체크 혹은 ID 체크)
  if (prev.member !== next.member) return false
  // 3. [핵심] 메시지 데이터 비교
  // 원본 객체의 참조(Reference)가 같다면, 내용은 무조건 같은 것입니다.
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

  const renderMessage = useCallback(({item}: {item: ChatMessageItemProps}) => {
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
  }, [])

  return (
    <FlatList
      style={styles.flex}
      data={ChatMessagesWithUi || []}
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
