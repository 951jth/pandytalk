import {useGroupChatRoomScreen} from '@app/features/chat/hooks/useGroupChatRoomScreen'
import COLORS from '@shared/constants/color'
import React from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppHeader from '../../../layout/AppHeader'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import ChatInputBox from '../components/ChatMessageInput'
import ChatMessageList from '../components/ChatMessageList'

export default function GroupChatRoomScreen() {
  const {user, roomId, roomInfo, initialChatInfo, headerTitle} =
    useGroupChatRoomScreen()

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardUtilitiesWrapper useTouchable={false}>
        <AppHeader title={headerTitle} titleAlign="left" />
        <ChatMessageList
          roomId={roomId}
          userId={user?.uid}
          roomInfo={roomInfo}
          initialChatInfo={initialChatInfo}
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
    backgroundColor: COLORS.background,
  },
})
