import {useChatMessagesInfinite} from '@app/features/chat/hooks/useChatMessagesInfinite'
import {useChatScroll} from '@app/features/chat/hooks/useChatScroll'
import {useSubscribeChatMessages} from '@app/features/chat/hooks/useSubscribeChatMessages'
import {useSyncChatMessages} from '@app/features/chat/hooks/useSyncChatMessages' // 신규 추가
import {useUpdateLastReadOnBlur} from '@app/features/chat/hooks/useUpdateLastReadOnBlur'
import type {User} from '@app/shared/types/auth'
import type {ChatRoom} from '@app/shared/types/chat'
import {isSameDate, isSameMinute, isSameSender} from '@app/shared/utils/chat'
import {useMemo} from 'react'

type Props = {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatRoom | null | undefined
}

export const useChatMessageList = ({
  roomId, // 쿼리를 통해 알수있는 정보(구독전용)
  userId,
  roomInfo, // 실제 채팅방 정보 생성 확인
}: Props) => {
  const serverLastSeq = roomInfo?.lastSeq

  // 1. 최신 메시지 동기화 엔진 (포커스 시 작동)
  useSyncChatMessages(roomId, serverLastSeq)

  // 2. 채팅 목록 무한 스크롤 (로컬 우선 뷰어)
  const {data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useChatMessagesInfinite(roomId)
  const messages = data?.pages?.flatMap(page => page?.data ?? []) ?? []

  // 멤버들 정보 map
  const membersMap = useMemo(() => {
    const init = new Map<string, User>()
    const map = roomInfo?.memberInfos?.reduce((acc, obj) => {
      return acc.set(obj.uid, obj)
    }, init)
    return map ?? init
  }, [roomInfo?.memberInfos])

  // UI용 메시지 데이터 가공 로직
  // 멤버 정보를 포함하기 떄문에 훅 내부로 이동.
  const messagesWithUi = useMemo(() => {
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
          isMine,
        },
        roomId,
        member,
      }
    })
  }, [messages, roomId, membersMap, userId])

  // 마지막 읽은 시간, SEQ 처리
  useUpdateLastReadOnBlur(userId, roomInfo, messages)

  // 채팅 목록 구독
  useSubscribeChatMessages(roomId, serverLastSeq) // 채팅방 구독설정
  // 채팅 메시지 스크롤
  const latestMessage = messages?.[0]
  const {flatListRef, isAtBottom, handleScroll, scrollToBottom} = useChatScroll(
    {
      userId,
      latestMessageId: latestMessage?.id,
      isMine: latestMessage?.senderId === userId,
    },
  )

  return {
    messagesWithUi, // 가공된 채팅 메세지
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    membersMap,
    flatListRef,
    handleScroll,
    scrollToBottom,
    isAtBottom,
  }
}
