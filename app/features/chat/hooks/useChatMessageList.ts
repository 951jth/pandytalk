import {useChatMessagesInfinite} from '@app/features/chat/hooks/useChatMessagesInfinite'
import {useSyncAndSubsMessages} from '@app/features/chat/hooks/useSyncAndSubsMessages'
import {useUpdateLastReadOnBlur} from '@app/features/chat/hooks/useUpdateLastReadOnBlur'
import type {User} from '@app/shared/types/auth'
import type {ChatRoom} from '@app/shared/types/chat'
import {isSameDate, isSameMinute, isSameSender} from '@app/shared/utils/chat'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {FlatList, NativeScrollEvent, NativeSyntheticEvent} from 'react-native'

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
  const flatListRef = useRef<FlatList>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

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
  useSyncAndSubsMessages(roomId) // 채팅방 구독설정

  const lastMessageIdRef = useRef<string | null>(null)

  //스크롤 튐 현상 떄문에, 사용자가 하단근처를 보고있을떄만 맨 아래로 자동스크롤
  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToOffset({offset: 0, animated})
  }, [])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {contentOffset} = event.nativeEvent
      // inverted 리스트이므로 contentOffset.y가 0에 가까울수록 최하단임
      const isBottom = contentOffset.y < 100
      if (isAtBottom !== isBottom) {
        setIsAtBottom(isBottom)
      }
    },
    [isAtBottom],
  )

  useEffect(() => {
    const latestMessage = messages?.[0]
    if (!latestMessage) return

    const isNewMessage = latestMessage.id !== lastMessageIdRef.current
    const isMine = latestMessage.senderId === userId

    // 내가 보낸 메시지거나, 현재 바닥을 보고 있는 상태라면 자동으로 스크롤
    if (isNewMessage && (isMine || isAtBottom)) {
      // 메시지 렌더링 후 스크롤을 보장하기 위해 약간의 지연을 줍니다 (InteractionManager 등 활용 가능)
      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    }

    lastMessageIdRef.current = latestMessage.id
  }, [messages?.[0]?.id, userId, isAtBottom, scrollToBottom])

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
