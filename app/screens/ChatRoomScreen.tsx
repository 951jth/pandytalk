import {useRoute} from '@react-navigation/native'
import React, {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import ChatMessageList from '../components/chat/CharMessageList'
import ChatInputBox from '../components/chat/ChatInputBox'
import KeyboardViewWrapper from '../components/container/KeyboardViewWrapper'
import AppBar from '../components/navigation/AppBar'
import COLORS from '../constants/color'
import {getDirectMessageRoomId} from '../services/chatService'
import {useAppSelector} from '../store/hooks'
import {User} from '../types/firebase'

export default function ChatRoomScreen() {
  const [rightActions, setRightActions] = useState([{icon: 'magnify'}])
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const route = useRoute()
  const {targetId} = route.params as {targetId: string}
  const [roomId, setRoomId] = useState<string | null>(null)
  const [members, setMembers] = useState<Array<User>>([]) //채팅방에 있는 멤버 조회회

  const getRoomId = async () => {
    if (user?.uid !== targetId && user?.uid && targetId) {
      const rid = await getDirectMessageRoomId(user.uid, targetId)

      setRoomId(rid)
    }
  }

  useEffect(() => {
    getRoomId()
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardViewWrapper>
        <View style={styles.inner}>
          <AppBar title="채팅방" rightActions={rightActions} />
          {/* ✅채팅은 성능최적화 및 유지 보수성을 위해서 컴포넌트 분리가 강력히 권장됨 */}
          <ChatMessageList roomId={roomId} user={user} />
          <ChatInputBox roomId={roomId} user={user} />
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
    // position: 'relative',
    // paddingBottom: 60,
  },
})
