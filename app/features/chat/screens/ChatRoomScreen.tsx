import {useRoute} from '@react-navigation/native'
import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import KeyboardUtilitiesWrapper from '../../../components/container/KeyboardUtilitiesWrapper'
import AppHeader from '../../../components/navigation/AppHeader'
import COLORS from '../../../constants/color'
import {useAppSelector} from '../../../store/reduxHooks'
import {AppRouteParamList} from '../../../types/navigate'
import {getDMChatId} from '../../../utils/chat'
import ChatInputBox from '../components/ChatInputBox'
import ChatMessageList from '../components/ChatMessageList'
import {useChatRoomInfo} from '../hooks/useChatRoomQuery'

export default function ChatRoomScreen() {
  const route = useRoute()
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const {roomId, targetIds, title} =
    route.params as AppRouteParamList['chatRoom']
  // const [roomInfo, setRoomInfo] = useState<ChatListItem | null>(null)
  const findDmID = getDMChatId(user?.uid, targetIds?.[0])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(
    roomId || findDmID || null,
  ) //현채 채팅방(룸)아이디

  const {data: roomInfo} = useChatRoomInfo(currentRoomId)
  const targetMember = roomInfo?.memberInfos?.find(
    member => member?.id == targetIds?.[0], //채팅방이 없으면 targetIds는 필수로 들고와야함
  )

  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardUtilitiesWrapper useTouchable={false}>
          <View style={styles.inner}>
            <AppHeader
              title={`${
                title || targetMember?.displayName || roomInfo?.name || '채팅방'
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
              targetIds={targetIds}
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
