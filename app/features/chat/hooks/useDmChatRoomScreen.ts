import {useChatRoomInfo} from '@app/features/chat/hooks/useChatRoomInfo'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {useAppSelector} from '@app/store/reduxHooks'
import {useRoute, type RouteProp} from '@react-navigation/native'
import {useMemo} from 'react'

type DmChatRouteProp = RouteProp<AppRouteParamList, 'dm-chat'>

export const useDmChatRoomScreen = () => {
  const route = useRoute<DmChatRouteProp>()
  const {data: user, loading: isUserLoading} = useAppSelector(
    state => state.user,
  )

  const myId = user?.uid
  const initialChatInfo = route.params?.initialChatInfo
  const targetId = initialChatInfo.targetId
  const title = initialChatInfo.title
  const roomId = initialChatInfo.id
  const {data: roomInfo, isLoading: isRoomLoading} = useChatRoomInfo(roomId)

  const isLoading = isUserLoading || isRoomLoading

  const headerTitle = useMemo(() => {
    const findMember = roomInfo?.memberInfos?.find(
      member => member?.id !== myId,
    )
    return `${findMember?.displayName || roomInfo?.name || title || '채팅방'}`
  }, [myId, title, roomInfo])

  return {
    user,
    isLoading,
    targetId,
    roomId,
    roomInfo,
    initialChatInfo,
    headerTitle,
  }
}
