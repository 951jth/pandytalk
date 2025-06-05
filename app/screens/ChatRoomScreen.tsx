import {useRoute} from '@react-navigation/native'
import React, {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import ChatMessageList from '../components/chat/CharMessageList'
import ChatInputBox from '../components/chat/ChatInputBox'
import AppBar from '../components/navigation/AppBar'
import COLORS from '../constants/color'
import {getChatRoomInfo, getDirectMessageRoomId} from '../services/chatService'
import {useAppSelector} from '../store/hooks'
import {RoomInfo} from '../types/firebase'

interface ChatRoomRouteParams {
  targetIds: string[]
}

export default function ChatRoomScreen() {
  const route = useRoute()
  const [rightActions, setRightActions] = useState([{icon: 'magnify'}])
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const {targetIds} = route.params as ChatRoomRouteParams
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const roomId = roomInfo?.id || null
  const targetMember = roomInfo?.memberInfos?.find(
    member => member?.id == targetIds?.[0],
  )

  const getRoomId = async () => {
    if (user?.uid !== targetIds?.[0] && user?.uid && targetIds?.[0]) {
      const rid = await getDirectMessageRoomId(user.uid, targetIds?.[0])
      if (rid)
        getChatRoomInfo(rid).then(res => {
          setRoomInfo(res || null)
        })
      // setRoomId(rid)
    }
  }

  useEffect(() => {
    getRoomId()
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.inner}>
        <AppBar
          title={targetMember?.nickname || '채팅방'}
          rightActions={rightActions}
        />
        {/* ✅채팅은 성능최적화 및 유지 보수성을 위해서 컴포넌트 분리가 강력히 권장됨 */}
        <ChatMessageList
          roomId={roomId}
          userId={user?.uid}
          roomInfo={roomInfo}
        />
        <ChatInputBox
          roomId={roomId}
          userId={user?.uid}
          targetIds={targetIds}
          getRoomId={getRoomId}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    // justifyContent: 'space-between',
    backgroundColor: COLORS.outerColor,
  },
})
