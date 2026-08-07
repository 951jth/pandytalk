import {chatService} from '@app/features/chat/service/chatService'
import {userService} from '@app/features/user/service/userService'
import {useFocusEffect} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {useCallback, useEffect, useMemo, useRef} from 'react'

/**
 * 채팅방 정보 및 멤버 정보 관리 훅
 * - 최신 lastSeq 등 방 정보는 빈번하게 동기화 (staleTime: 0)
 * - 유저 프로필 등 멤버 정보는 캐시 적극 활용 (staleTime: 1시간)
 */
export const useChatRoomInfo = (roomId?: string | null) => {
  const isFetchingRef = useRef<boolean>(false)
  // 1. 방 기본 정보 쿼리 (가벼운 메타 데이터 전용)
  const roomQuery = useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) return null
      return await chatService.getChatRoom(roomId)
    },
    staleTime: 5,
  })

  // 2. 멤버 프로필 정보 쿼리 (무거운 데이터, 캐싱 필요)
  const memberIds = useMemo(
    () => [...(roomQuery.data?.members || [])].sort(),
    [roomQuery.data?.members],
  )

  const membersQuery = useQuery({
    queryKey: ['chatRoomMembers', memberIds],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      return await userService.getUsersByIds(memberIds)
    },
    staleTime: 1000 * 60 * 60, // 1시간 유지 (프로필은 자주 변하지 않음)
    gcTime: 1000 * 60 * 60 * 2, // 2시간 동안 가비지 컬렉션 유예
  })

  // 3. 하위 호환성을 위해 데이터 결합
  const combinedData = useMemo(() => {
    if (!roomQuery.data) return null
    return {
      ...roomQuery.data,
      memberInfos: membersQuery.data || [],
    }
  }, [roomQuery.data, membersQuery.data])

  // isFetching 변경으로 focus effect가 재등록되지 않도록 Ref에 동기화
  useEffect(() => {
    isFetchingRef.current = roomQuery.isFetching
  }, [roomQuery.isFetching])

  // 화면 포커스 시에는 '방 기본 정보'만 가볍게 갱신 (lastSeq 체크용)
  const refetchRoom = roomQuery.refetch

  useFocusEffect(
    useCallback(() => {
      // 이미 조회 중이면 포커스 진입에 따른 추가 refetch를 생략
      if (roomId && !isFetchingRef.current) {
        refetchRoom()
      }
    }, [roomId, refetchRoom]),
  )

  return {
    ...roomQuery,
    data: combinedData,
    isLoading:
      roomQuery.isLoading || (roomQuery.data && membersQuery.isLoading),
    isMembersLoading: membersQuery.isLoading,
  }
}
