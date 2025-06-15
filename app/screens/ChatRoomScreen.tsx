import {useFocusEffect, useRoute} from '@react-navigation/native'
import React, {ReactNode, useEffect, useRef, useState} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import ChatInputBox from '../components/chat/ChatInputBox'
import ChatMessageList from '../components/chat/ChatMessageList'
import KeyboardUtilitiesWrapper from '../components/container/KeyboardUtilitiesWrapper'
import AppHeader from '../components/navigation/AppHeader'
import COLORS from '../constants/color'
import {
  getChatRoomInfo,
  getDirectMessageRoomId,
  updateLastRead,
} from '../services/chatService'
import {useAppSelector} from '../store/hooks'
import {RoomInfo, User} from '../types/firebase'
import {RootStackParamList} from '../types/navigate'

export default function ChatRoomScreen() {
  const route = useRoute()
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const {roomId, targetIds, title} =
    route.params as RootStackParamList['chatRoom']
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const currentRid = roomId || roomInfo?.id || null //현재 채팅방 아이디
  const targetMember = roomInfo?.memberInfos?.find(
    member => member?.id == targetIds?.[0], //채팅방이 없으면 targetIds는 필수로 들고와야함
  )
  const flatListRef = useRef<FlatList<any>>(null)
  const rightActions: ReactNode[] = []
  console.log('roomId, targetIds, title', roomId, targetIds, title)
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
    <>
      <SafeAreaView
        style={styles.container}
        // edges={['left', 'right', 'bottom']}
      >
        <KeyboardUtilitiesWrapper>
          <View style={styles.inner}>
            <AppHeader
              title={title || targetMember?.nickname || '채팅방'}
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
              user={user as User}
              targetIds={targetIds}
              getRoomId={getRoomId}
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
    // justifyContent: 'space-between',
    backgroundColor: COLORS.outerColor,
  },
})
