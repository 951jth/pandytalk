import {messageService} from '@app/features/chat/service/messageService'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {useCallback, useRef} from 'react'

/**
 * 채팅방 진입/포커스 시 최신 메시지 싱크를 담당하는 훅
 */
export const useSyncChatMessages = (
  roomId: string | null | undefined,
  serverLastSeq: number | undefined,
) => {
  const queryClient = useQueryClient()
  const isSyncing = useRef(false)

  const sync = useCallback(async () => {
    if (!roomId || serverLastSeq === undefined || isSyncing.current) return

    try {
      isSyncing.current = true
      //데이터를 가져와서 있으면 로컬에 저장함
      const hasNewData = await messageService.syncMessages(
        roomId,
        serverLastSeq,
      )

      if (hasNewData) {
        // 현재 화면에 보이는(active) 상태일 때만 다시 불러오도록 제한하여 부하를 방지합니다.
        // 로컬에 미리 저장했기 떄문에, 화면에 보여지는 데이터는 최신이됨
        queryClient.invalidateQueries({
          queryKey: ['chatMessages', roomId],
          refetchType: 'active',
        })
      }
    } catch (e) {
      console.error('[useSyncChatMessages] Sync error:', e)
    } finally {
      isSyncing.current = false
    }
  }, [roomId, serverLastSeq, queryClient])

  // React Navigation 화면 포커스 시마다 싱크 시도
  useFocusEffect(
    useCallback(() => {
      sync()
    }, [sync]),
  )

  return {sync}
}
