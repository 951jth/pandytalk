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
  // route.params?.roomId가 있으면 최우선 (푸시 알림 등으로 진입 시)
  const groupId = route.params?.roomId ?? user?.groupId ?? null
  //chatId는 groupId와 동일
  const {data: group, isLoading: isGroupLoading} = useGroup(groupId)
  const {data: roomInfo, isLoading: isRoomLoading} = useChatRoomInfo(groupId)
  const routeTitle = route.params?.title

  const isLoading = isUserLoading || isGroupLoading || isRoomLoading || (!!groupId && !roomInfo)

  const headerTitle = useMemo(() => {
    return group?.name || roomInfo?.name || routeTitle || '그룹 채팅'
  }, [group?.name, roomInfo?.name, routeTitle])

  return {
    user,
    isLoading,
    roomId: groupId,
    roomInfo,
    headerTitle,
  }
}
