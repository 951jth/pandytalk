import {useRoute, type RouteProp} from '@react-navigation/native'
import React, {useState} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import ChatInputBox from '../components/chat/ChatInputBox'
import ChatMessageList from '../components/chat/ChatMessageList'
import KeyboardUtilitiesWrapper from '../components/container/KeyboardUtilitiesWrapper'
import AppHeader from '../components/navigation/AppHeader'
import {useChatRoomInfo} from '../hooks/queries/useChatRoomQuery'
import {useGroup} from '../hooks/queries/useGroupQuery'
import {useAppSelector} from '../store/reduxHooks'
import type {AppRouteParamList} from '../types/navigate'

type GroupChatRoute = RouteProp<AppRouteParamList, 'group-chat'>

export default function GroupChatRoomScreen() {
  const route = useRoute<GroupChatRoute>()
  const {data: user} = useAppSelector(data => data?.user)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(
    route?.params?.roomId || user?.groupId || null,
  )
  //chatId는 groupId와 동일
  const {data: group, isLoading, error} = useGroup(currentRoomId)
  const {data: roomInfo} = useChatRoomInfo(currentRoomId)

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardUtilitiesWrapper useTouchable={false}>
        <AppHeader title={group?.name || '그룹 채팅방'} />
        <ChatMessageList
          roomId={group?.id}
          userId={user?.uid}
          roomInfo={roomInfo}
          chatType={'group'}
        />
        <ChatInputBox roomInfo={roomInfo} setCurrentRoomId={setCurrentRoomId} />
      </KeyboardUtilitiesWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
