import {
  useChatMessagesPaging,
  useSubscriptionMessage,
} from '@app/features/chat/hooks/useChatMessageQuery'
import type {ChatListItem} from '@app/shared/types/chat'
import {useEffect, useRef, useState} from 'react'

type Props = {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatListItem | null | undefined
  inputComponent?: React.ComponentType<any> | React.ReactElement | null
  chatType?: ChatListItem['type']
}

export const useChatMessageList = ({
  roomId,
  userId,
  roomInfo,
  chatType = 'dm',
}: Props) => {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    resetChatMessages,
  } = useChatMessagesPaging(roomId)
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null) //마지막으로 읽은 날짜.
  const messages = data?.pages?.flatMap(page => page?.data ?? []) ?? []
  // 포커스 이벤트용 참조값.
  const roomInfoRef = useRef(roomInfo)
  const messagesRef = useRef(messages)

  useSubscriptionMessage(roomId, lastCreatedAt) //채팅방 구독설정

  // 최신값 유지
  useEffect(() => {
    roomInfoRef.current = roomInfo
  }, [roomInfo])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
}
