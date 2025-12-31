import {useChatRoomInfo} from '@app/features/chat/hooks/useChatRoomInfo'
import {useGroup} from '@app/features/group/hooks/useGroupQuery'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {useAppSelector} from '@app/store/reduxHooks'
import {useRoute, type RouteProp} from '@react-navigation/native'
import {useMemo} from 'react'

type GroupChatRoute = RouteProp<AppRouteParamList, 'group-chat'>

export const useGroupChatRoomScreen = () => {
  const route = useRoute<GroupChatRoute>()
  const {data: user, loading} = useAppSelector(data => data?.user)
  const groupId = route?.params?.roomId || user?.groupId || null
  //chatId는 groupId와 동일
  const {data: group, isLoading, error} = useGroup(groupId)
  const {data: roomInfo} = useChatRoomInfo(groupId)

  const headerTitle = useMemo(() => {
    return group?.name
  }, [group])

  return {
    user,
    loading,
    roomId: groupId,
    roomInfo,
    headerTitle,
  }
}
