import {useChatMessagesInfinite} from '@app/features/chat/hooks/useChatMessagesInfinite'
import {useSubscriptionMessages} from '@app/features/chat/hooks/useSubscirbeMessages'
import {useUpdateLastReadOnBlur} from '@app/features/chat/hooks/useUpdateLastReadOnBlur'
import type {User} from '@app/shared/types/auth'
import type {ChatListItem} from '@app/shared/types/chat'
import {useEffect, useMemo} from 'react'

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
  } = useChatMessagesInfinite(roomId)
  const messages = data?.pages?.flatMap(page => page?.data ?? []) ?? []

  // 멤버들 정보 map
  const membersMap = useMemo(() => {
    const init = new Map<string, User>()
    const map = roomInfo?.memberInfos?.reduce((acc, obj) => {
      return acc.set(obj.uid, obj)
    }, init)
    return map ?? init
  }, [roomInfo?.memberInfos])

  //마지막 읽은 시간,SEQ 처리
  useUpdateLastReadOnBlur(userId, roomInfo, messages)
  //채팅 목록 구독
  useSubscriptionMessages(roomId) //채팅방 구독설정

  //가장 마지막 채팅의 최근 날짜로 subscription
  useEffect(() => {
    if (!roomId) return
  }, [roomId])

  return {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    membersMap,
  }
}
