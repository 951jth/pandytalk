import {useChatRoomInfo} from '@app/features/chat/hooks/useChatRoomInfo'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {getDMChatId} from '@app/shared/utils/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useRoute, type RouteProp} from '@react-navigation/native'
import {useMemo} from 'react'

type DmChatRouteProp = RouteProp<AppRouteParamList, 'dm-chat'>

export const useDmChatRoomScreen = () => {
  const route = useRoute<DmChatRouteProp>()
  const {myId, targetId, title} = route.params //DM 채팅은 내아이디와 상대방 아이디 필수
  const roomId = route?.params?.roomId ?? getDMChatId(myId, targetId) //DM채팅은 aId_bId의 형식(사용자는 채팅방 아이디를 미리 알고있음.)
  const {data: user, loading: isUserLoading} = useAppSelector(
    state => state.user,
  )
  const {data: roomInfo, isLoading: isRoomLoading} = useChatRoomInfo(roomId)

  const isLoading = isUserLoading || isRoomLoading

  const headerTitle = useMemo(() => {
    const findMember = roomInfo?.memberInfos?.find(
      member => member?.id !== myId,
    )
    return `${findMember?.displayName || roomInfo?.name || title || '채팅방'}`
  }, [title, roomInfo])

  return {
    user,
    isLoading,
    targetId,
    roomId,
    roomInfo,
    headerTitle,
  }
}
