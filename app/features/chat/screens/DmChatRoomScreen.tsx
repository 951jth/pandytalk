import ChatInputBox from '@app/features/chat/components/ChatMessageInput'
import ChatMessageList from '@app/features/chat/components/ChatMessageList'
import {useDmChatRoomScreen} from '@app/features/chat/hooks/useDmChatRoomScreen'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import EmptyData from '@app/shared/ui/common/EmptyData'
import KeyboardUtilitiesWrapper from '@app/shared/ui/container/KeyboardUtilitiesWrapper'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

export default function DmChatRoomScreen() {
  const {user, isLoading, targetId, roomId, roomInfo, headerTitle} =
    useDmChatRoomScreen()

  if (isLoading || !user) {
    return (
      <EmptyData
        text="팬디톡이 소식을 불러오는 중이에요"
        subText="잠시만 기다려주세요. 곧 대화가 시작됩니다!"
      />
    )
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardUtilitiesWrapper useTouchable={false}>
          <View style={styles.inner}>
            <AppHeader title={headerTitle} titleAlign="left" />
            <ChatMessageList
              userId={user?.uid}
              roomId={roomId}
              roomInfo={roomInfo}
            />
            <ChatInputBox
              roomInfo={roomInfo}
              targetIds={[targetId]}
              chatType="dm"
            />
          </View>
        </KeyboardUtilitiesWrapper>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    backgroundColor: COLORS.background, // ✅ 프리미엄 크림 베이지 배경
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
