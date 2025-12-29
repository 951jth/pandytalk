import ChatInputBox from '@app/features/chat/components/ChatInputBox'
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
  const {user, loading, targetId, roomId, roomInfo, headerTitle} =
    useDmChatRoomScreen()

  if (loading || !user)
    return <EmptyData text={`페이지를 로딩 중입니다.\n잠시만 기다려주세요.`} />

  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardUtilitiesWrapper useTouchable={false}>
          <View style={styles.inner}>
            <AppHeader title={headerTitle} />
            {/* ✅채팅은 성능최적화 및 유지 보수성을 위해서 컴포넌트 분리가 강력히 권장됨 */}
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
    backgroundColor: COLORS.outerColor,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    // paddingVertical: 10,
    // paddingHorizontal: 16,
    // borderTopWidth: 1,
    // borderTopColor: '#eee',
    zIndex: 10,
  },
})
