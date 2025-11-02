import {useRoute, type RouteProp} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import React, {useEffect, useState} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import ChatInputBox from '../components/chat/ChatInputBox'
import ChatMessageList from '../components/chat/ChatMessageList'
import KeyboardUtilitiesWrapper from '../components/container/KeyboardUtilitiesWrapper'
import AppHeader from '../components/navigation/AppHeader'
import {useGroup} from '../hooks/queries/useGroupQuery'
import {getChatRoomInfo} from '../services/chatService'
import {useAppSelector} from '../store/reduxHooks'
import type {User} from '../types/auth'
import type {ChatListItem} from '../types/chat'
import type {AppRouteParamList} from '../types/navigate'

type GroupChatRoute = RouteProp<AppRouteParamList, 'group-chat'>

export default function GroupChatRoomScreen() {
  const route = useRoute<GroupChatRoute>()
  const {data: user} = useAppSelector(data => data?.user)
  const groupId = route?.params?.groupId || user?.groupId
  const {data: group, isLoading, error} = useGroup(groupId)
  const [roomInfo, setRoomInfo] = useState<ChatListItem | null>(null)
  const queryClient = useQueryClient()

  const getRoomInfo = async () => {
    if (groupId) {
      try {
        const data = await getChatRoomInfo(groupId)
        setRoomInfo(data || null)
      } catch (e) {
        //채팅방이 없으면 새로 생성
        console.log(e)
      }
    }
  }

  useEffect(() => {
    getRoomInfo()
  }, [])

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
        <ChatInputBox roomId={group?.id} user={user as User} />
      </KeyboardUtilitiesWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
