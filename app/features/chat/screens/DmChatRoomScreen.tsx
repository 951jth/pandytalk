import ChatInputBox from '@app/features/chat/components/ChatMessageInput'
import ChatMessageList from '@app/features/chat/components/ChatMessageList'
import {ChatRoomUIProvider} from '@app/features/chat/contexts/ChatRoomUIContext'
import {useDmChatRoomScreen} from '@app/features/chat/hooks/useDmChatRoomScreen'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import KeyboardUtilitiesWrapper from '@app/shared/ui/container/KeyboardUtilitiesWrapper'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

export default function DmChatRoomScreen() {
  const {user, targetId, roomId, roomInfo, initialChatInfo, headerTitle} =
    useDmChatRoomScreen()

  return (
    <ChatRoomUIProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardUtilitiesWrapper useTouchable={false}>
          <View style={styles.inner}>
            <AppHeader title={headerTitle} titleAlign="left" />
            <ChatMessageList
              userId={user?.uid}
              roomId={roomId}
              roomInfo={roomInfo}
              initialChatInfo={initialChatInfo}
            />
            <ChatInputBox
              roomInfo={roomInfo}
              targetIds={[targetId]}
              chatType="dm"
            />
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
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 10,
  },
})
