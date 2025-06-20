import {useFocusEffect, useRoute} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import React, {ReactNode, useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import ChatInputBox from '../components/chat/ChatInputBox'
import ChatMessageList from '../components/chat/ChatMessageList'
import KeyboardUtilitiesWrapper from '../components/container/KeyboardUtilitiesWrapper'
import AppHeader from '../components/navigation/AppHeader'
import COLORS from '../constants/color'
import {updateChatLastReadCache} from '../hooks/useInfiniteQuery'
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
  const rightActions: ReactNode[] = []
  const queryClient = useQueryClient()

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
          updateChatLastReadCache(queryClient, currentRid, user.uid) //현재 query 캐시갱신
        }
      }
    }, [currentRid, user?.id]),
  )

  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardUtilitiesWrapper useTouchable={false}>
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
