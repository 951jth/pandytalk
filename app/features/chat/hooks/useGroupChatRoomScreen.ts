import {useChatRoomInfo} from '@app/features/chat/hooks/useChatRoomInfo'
import {useGroup} from '@app/features/group/hooks/useGroupQuery'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {useAppSelector} from '@app/store/reduxHooks'
import {useRoute, type RouteProp} from '@react-navigation/native'
import {useMemo} from 'react'

type GroupChatRoute = RouteProp<AppRouteParamList, 'group-chat'>

export const useGroupChatRoomScreen = () => {
  const route = useRoute<GroupChatRoute>()
  const {data: user, loading: isUserLoading} = useAppSelector(data => data?.user)
  const initialChatInfo = route.params.initialChatInfo
  const groupId = initialChatInfo.id
  //chatId는 groupId와 동일
  const {data: group, isLoading: isGroupLoading} = useGroup(groupId)
  const {data: roomInfo, isLoading: isRoomLoading} = useChatRoomInfo(groupId)
  const routeTitle = initialChatInfo.title

  const isLoading = isUserLoading || isGroupLoading || isRoomLoading || (!!groupId && !roomInfo)

  const headerTitle = useMemo(() => {
    return group?.name || roomInfo?.name || routeTitle || '그룹 채팅'
  }, [group?.name, roomInfo?.name, routeTitle])

  return {
    user,
    isLoading,
    roomId: groupId,
    roomInfo,
    initialChatInfo,
    headerTitle,
  }
}
