import {useGroupChatRoomScreen} from '@app/features/chat/hooks/useGroupChatRoomScreen'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import EmptyData from '@app/shared/ui/common/EmptyData'
import {type RouteProp} from '@react-navigation/native'
import React from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppHeader from '../../../layout/AppHeader'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import ChatInputBox from '../components/ChatInputBox'
import ChatMessageList from '../components/ChatMessageList'

type GroupChatRoute = RouteProp<AppRouteParamList, 'group-chat'>

export default function GroupChatRoomScreen() {
  // const route = useRoute<GroupChatRoute>()
  // const {data: user, loading} = useAppSelector(data => data?.user)
  // const [currentRoomId, setCurrentRoomId] = useState<string | null>(
  //   route?.params?.roomId || user?.groupId || null,
  // )
  // //chatId는 groupId와 동일
  // const {data: group, isLoading, error} = useGroup(currentRoomId)
  // const {data: roomInfo} = useChatRoomInfo(currentRoomId)
  const {user, loading, roomId, roomInfo, headerTitle} =
    useGroupChatRoomScreen()

  if (loading || !user)
    return <EmptyData text={`페이지를 로딩 중입니다.\n잠시만 기다려주세요.`} />

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardUtilitiesWrapper useTouchable={false}>
        <AppHeader title={headerTitle} />
        <ChatMessageList
          roomId={roomId}
          userId={user?.uid}
          roomInfo={roomInfo}
          chatType={'group'}
        />
        <ChatInputBox roomInfo={roomInfo} chatType="group" />
      </KeyboardUtilitiesWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
