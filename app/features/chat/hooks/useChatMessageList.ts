import {useChatMessagesInfinite} from '@app/features/chat/hooks/useChatMessagesInfinite'
import {useSyncAndSubsMessages} from '@app/features/chat/hooks/useSyncAndSubsMessages'
import {useUpdateLastReadOnBlur} from '@app/features/chat/hooks/useUpdateLastReadOnBlur'
import type {User} from '@app/shared/types/auth'
import type {ChatListItem} from '@app/shared/types/chat'
import {useMemo} from 'react'

type Props = {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatListItem | null | undefined
  inputComponent?: React.ComponentType<any> | React.ReactElement | null
}

export const useChatMessageList = ({
  roomId, //쿼리를 통해 알수있는 정보(구독전용)
  userId,
  roomInfo, //실제 채팅방 정보 생성 확인
}: Props) => {
  // const roomId = useMemo(() => roomInfo?.id ?? null, [roomInfo?.id])
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
  useSyncAndSubsMessages(roomId) //채팅방 구독설정
  return {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    membersMap,
  }
}
