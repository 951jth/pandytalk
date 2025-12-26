import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {useChatMessagesInfinite} from '@app/features/chat/hooks/useChatMessagesInfinite'
import {useSubscriptionMessages} from '@app/features/chat/hooks/useSubscirbeMessages'
import {useUpdateLastReadOnBlur} from '@app/features/chat/hooks/useUpdateLastReadOnBlur'
import {messageService} from '@app/features/chat/service/messageService'
import type {User} from '@app/shared/types/auth'
import type {ChatListItem} from '@app/shared/types/chat'
import {useEffect, useMemo, useRef, useState} from 'react'

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
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null) //마지막으로 읽은 날짜.
  const lastCreatedAtRef = useRef<number | null>(null)

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
  useSubscriptionMessages(roomId, lastCreatedAtRef.current) //채팅방 구독설정

  //최신 메세지 동기화 -> 구독설정
  const getSyncMessage = async () => {
    if (!roomId) return
    try {
      const localMaxSeq = await messageLocal.getMaxLocalSeq(roomId)
      const newMsgs = await messageService.syncNewMessages(roomId, localMaxSeq)
      const lastSeq =
        newMsgs.length > 0
          ? newMsgs.reduce((acc, m) => Math.max(acc, m.seq ?? 0), 0)
          : 0
      lastCreatedAtRef.current = lastSeq
    } catch (e) {
      console.error('getSyncMessage error:', e)
    }
  }

  //가장 마지막 채팅의 최근 날짜로 subscription
  useEffect(() => {
    let mounted = true
    if (!roomId) return
    // getSyncMessage()
    // getLatestMessageCreatedAtFromSQLite(roomId).then(res => {
    //   if (!mounted) return
    //   lastCreatedAtRef.current = res
    // })
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
