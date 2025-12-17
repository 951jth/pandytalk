import COLORS from '@app/shared/constants/color'
import {AppRouteParamList} from '@app/shared/types/navigate'
import {useRoute} from '@react-navigation/native'
import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppHeader from '../../../layout/AppHeader'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import {getDMChatId} from '../../../shared/utils/chat'
import {useAppSelector} from '../../../store/reduxHooks'
import ChatInputBox from '../components/ChatInputBox'
import ChatMessageList from '../components/ChatMessageList'
import {useChatRoomInfo} from '../hooks/useChatRoomQuery'

export default function DmChatRoomScreen() {
  const route = useRoute()
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const {myId, targetId, title} = route.params as AppRouteParamList['dm-chat'] //DM 채팅은 내아이디와 상대방 아이디 필수
  const roomId = getDMChatId(myId, targetId)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(
    roomId || null,
  )
  const {data: roomInfo} = useChatRoomInfo(currentRoomId)
  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardUtilitiesWrapper useTouchable={false}>
          <View style={styles.inner}>
            <AppHeader
              title={`${
                title || roomInfo?.name || '채팅방'
              } ${roomInfo?.type == 'group' ? '(그룹)' : ''}`}
            />
            {/* ✅채팅은 성능최적화 및 유지 보수성을 위해서 컴포넌트 분리가 강력히 권장됨 */}
            <ChatMessageList
              roomId={currentRoomId}
              userId={user?.uid}
              roomInfo={roomInfo}
            />
            <ChatInputBox
              roomInfo={roomInfo}
              targetIds={[targetId]}
              setCurrentRoomId={setCurrentRoomId}
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
