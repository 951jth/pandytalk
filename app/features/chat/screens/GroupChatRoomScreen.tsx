import {ChatRoomUIProvider} from '@app/features/chat/contexts/ChatRoomUIContext'
import {useGroupChatRoomScreen} from '@app/features/chat/hooks/useGroupChatRoomScreen'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppHeader from '../../../layout/AppHeader'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import ChatInputBox from '../components/ChatMessageInput'
import ChatMessageList from '../components/ChatMessageList'

export default function GroupChatRoomScreen() {
  const {user, roomId, roomInfo, initialChatInfo, headerTitle} =
    useGroupChatRoomScreen()

  return (
    <ChatRoomUIProvider>
      <SafeAreaView
        style={styles.container}
        edges={['top', 'left', 'right']}>
        <KeyboardUtilitiesWrapper useTouchable={false}>
          <View style={styles.inner}>
            <AppHeader title={headerTitle} titleAlign="left" />
            <ChatMessageList
              roomId={roomId}
              userId={user?.uid}
              roomInfo={roomInfo}
              initialChatInfo={initialChatInfo}
              chatType={'group'}
            />
            <ChatInputBox roomInfo={roomInfo} chatType="group" />
          </View>
        </KeyboardUtilitiesWrapper>
      </SafeAreaView>
    </ChatRoomUIProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inner: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
})
