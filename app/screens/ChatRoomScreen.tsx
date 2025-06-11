import {useFocusEffect, useRoute} from '@react-navigation/native'
import React, {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import ChatMessageList from '../components/chat/CharMessageList'
import ChatInputBox from '../components/chat/ChatInputBox'
import KeyboardViewWrapper from '../components/container/KeyboardViewWrapper'
import AppBar from '../components/navigation/AppBar'
import COLORS from '../constants/color'
import {
  getChatRoomInfo,
  getDirectMessageRoomId,
  updateLastRead,
} from '../services/chatService'
import {useAppSelector} from '../store/hooks'
import {RoomInfo} from '../types/firebase'

interface ChatRoomRouteParams {
  roomId?: string
  targetIds: string[]
}

export default function ChatRoomScreen() {
  const route = useRoute()
  const [rightActions, setRightActions] = useState([{icon: 'magnify'}])
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const {roomId, targetIds} = route.params as ChatRoomRouteParams
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const currentRid = roomId || roomInfo?.id || null
  const targetMember = roomInfo?.memberInfos?.find(
    member => member?.id == targetIds?.[0],
  )

  const getRoomId = async () => {
    let rid = currentRid
    if (!rid && user?.uid !== targetIds?.[0] && user?.uid && targetIds?.[0]) {
      rid = await getDirectMessageRoomId(user.uid, targetIds?.[0])
    }
    if (rid)
      getChatRoomInfo(rid).then(res => {
        setRoomInfo(res || null)
      })
  }

  // useEffect(() => {
  //   if (roomInfo && roomInfo?.type == 'dm' && roomId) {
  //     updateChatRoom(roomId, {
  //       ...roomInfo,
  //       name: targetMember?.nickname,
  //       image: targetMember?.photoURL,
  //     })
  //   }
  // }, [roomInfo])

  useEffect(() => {
    getRoomId()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (currentRid && user?.uid) {
          updateLastRead(currentRid, user.uid) // ✅ 화면 벗어날 때 실행됨
        }
      }
    }, [currentRid, user?.id]),
  )

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardViewWrapper>
        <View style={styles.inner}>
          <AppBar
            title={targetMember?.nickname || '채팅방'}
            rightActions={rightActions}
          />
          {/* ✅채팅은 성능최적화 및 유지 보수성을 위해서 컴포넌트 분리가 강력히 권장됨 */}
          <ChatMessageList
            roomId={currentRid}
            userId={user?.uid}
            roomInfo={roomInfo}
          />
          <ChatInputBox
            roomId={currentRid}
            userId={user?.uid}
            targetIds={targetIds}
            getRoomId={getRoomId}
          />
        </View>
      </KeyboardViewWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: COLORS.outerColor,
  },
})
