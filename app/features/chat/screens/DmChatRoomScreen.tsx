import COLORS from '@app/shared/constants/color'
import {AppRouteParamList} from '@app/shared/types/navigate'
import EmptyData from '@app/shared/ui/common/EmptyData'
import {useRoute, type RouteProp} from '@react-navigation/native'
import React, {useMemo, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppHeader from '../../../layout/AppHeader'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import {getDMChatId} from '../../../shared/utils/chat'
import {useAppSelector} from '../../../store/reduxHooks'
import ChatInputBox from '../components/ChatInputBox'
import ChatMessageList from '../components/ChatMessageList'
import {useChatRoomInfo} from '../hooks/useChatRoomQuery'

type DmChatRouteProp = RouteProp<AppRouteParamList, 'dm-chat'>

export default function DmChatRoomScreen() {
  const route = useRoute<DmChatRouteProp>()
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const {myId, targetId, title} = route.params //DM 채팅은 내아이디와 상대방 아이디 필수
  const roomId = getDMChatId(myId, targetId)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(
    roomId || null,
  )
  const {data: roomInfo} = useChatRoomInfo(currentRoomId)
  const headerTitle = useMemo(() => {
    const findMember = roomInfo?.memberInfos?.find(
      member => member?.id !== myId,
    )
    return `${
      title || roomInfo?.name || findMember?.displayName || '채팅방'
    } ${roomInfo?.type == 'group' ? '(그룹)' : ''}`
  }, [title, roomInfo])

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
