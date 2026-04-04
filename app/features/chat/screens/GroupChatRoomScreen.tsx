import {useGroupChatRoomScreen} from '@app/features/chat/hooks/useGroupChatRoomScreen'
import EmptyData from '@app/shared/ui/common/EmptyData'
import COLORS from '@shared/constants/color'
import React from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppHeader from '../../../layout/AppHeader'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import ChatInputBox from '../components/ChatMessageInput'
import ChatMessageList from '../components/ChatMessageList'

export default function GroupChatRoomScreen() {
  const {user, isLoading, roomId, roomInfo, headerTitle} =
    useGroupChatRoomScreen()

  if (isLoading || !user) {
    return (
      <EmptyData
        text="팬디톡이 소식을 불러오는 중이에요"
        subText="잠시만 기다려주세요. 곧 대화가 시작됩니다!"
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardUtilitiesWrapper useTouchable={false}>
        <AppHeader title={headerTitle} titleAlign="left" />
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
    backgroundColor: COLORS.background,
  },
})
