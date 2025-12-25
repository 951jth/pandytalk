import ChatMessageItem from '@app/features/chat/components/ChatMessageItem'
import { readStatusRemote } from '@app/features/chat/data/readStatusRemote.firebase'
import COLORS from '@app/shared/constants/color'
import type { User } from '@app/shared/types/auth'
import { ChatListItem, ChatMessage } from '@app/shared/types/chat'
import { useFocusEffect } from '@react-navigation/native'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { getLatestMessageCreatedAtFromSQLite } from '../../../db/sqlite'
import {
  isSameDate,
  isSameMinute,
  isSameSender,
} from '../../../shared/utils/chat'
import {
  useChatMessagesPaging,
  useSubscriptionMessage,
} from '../hooks/useChatMessageQuery'

interface Props {
  roomId: string | null
  userId: string | null | undefined
  roomInfo: ChatListItem | null | undefined
  inputComponent?: React.ComponentType<any> | React.ReactElement | null
  chatType?: ChatListItem['type']
}
const MemoizedChatMessage = memo(ChatMessageItem)

export default function ChatMessageList({
  roomId,
  userId,
  roomInfo,
  chatType = 'dm',
}: Props) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    resetChatMessages,
  } = useChatMessagesPaging(roomId)
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null) //마지막으로 읽은 날짜.
  const messages = data?.pages?.flatMap(page => page?.data ?? []) ?? []
  useSubscriptionMessage(roomId, lastCreatedAt) //채팅방 구독설정
  // 포커스 이벤트용 참조값.
  const roomInfoRef = useRef(roomInfo)
  const messagesRef = useRef(messages)

  //unreadCount, lastReadSeqs 같은 필드가 업데이트 될떄 멤버정보의 참조가 바뀔 수 있음
  //find는 매 채팅 로우마다 순회해서, map으로 고정시키는것이 비용적으로 유리
  const membersMap = useMemo(() => {
    let map = new Map<string, User>()
    for (const member of roomInfo?.memberInfos ?? []) {
      map.set(member.uid, member)
    }
    return map
  }, [roomInfo?.memberInfos])

  // 최신값 유지
  useEffect(() => {
    roomInfoRef.current = roomInfo
  }, [roomInfo])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const renderMessage = useCallback(
    ({item, index}: {item: ChatMessage; index: number}) => {
      const isMine = item?.senderId === userId
      const nextItem = messages?.[index + 1] ?? null
      const hideProfile = isSameSender(item, nextItem)
      const hideMinute = isSameMinute(item, nextItem)
      const hideDate = isSameDate(item, nextItem)
      const member = membersMap.get(item.senderId)

      return (
        <MemoizedChatMessage
          item={item}
          isMine={isMine}
          hideProfile={hideProfile}
          hideMinute={hideMinute}
          hideDate={hideDate}
          member={member}
        />
      )
    },
    [membersMap, messages],
  )
  useFocusEffect(
    useCallback(() => {
      return () => {
        const room = roomInfoRef.current
        if (!userId || !room?.id) return

        const currentReadSeq = room.lastReadSeqs?.[userId] ?? 0
        const msgs = messagesRef.current ?? []

        //해당 유저 마지막 읽음 처리
        const lastSeq =
          msgs.length > 0
            ? msgs.reduce((acc, m) => Math.max(acc, m.seq ?? 0), 0)
            : 0

        if (currentReadSeq !== lastSeq) {
          readStatusRemote.updateChatLastReadByUser(room.id, userId, lastSeq)
        }
      }
    }, [userId]),
  )

  useEffect(() => {
    //가장 마지막 채팅의 최근 날짜로 subscription
    if (!roomId) return
    // getMessagesFromSQLite(roomId).then(res => {
    //   console.log('all messages', res)
    // })
    getLatestMessageCreatedAtFromSQLite(roomId).then(res => {
      setLastCreatedAt(res)
    })
  }, [data, roomId])

  return (
    <FlatList
      style={styles.flex}
      data={messages || []}
      keyExtractor={item => item.id}
      renderItem={renderMessage}
      contentContainerStyle={styles.chatList}
      inverted={true}
      keyboardShouldPersistTaps="handled"
      refreshing={isLoading}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}
      // onRefresh={resetChatMessages}
      // onScroll={({nativeEvent}) => {
      //   if (nativeEvent.contentOffset.y <= 0) {
      //     console.log('next page')
      //     // 🔁 페이징 or 이전 메시지 불러오기
      //     if (hasNextPage) fetchNextPage()
      //   }
      // }}
      // refreshing={isLoading}
    />
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chatList: {
    minHeight: 100,
    flexGrow: 1,
    paddingBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  chatRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myChat: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: COLORS.primary,
    position: 'relative',
    maxWidth: 250,
  },
  otherChat: {
    padding: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
    backgroundColor: COLORS.background,
    position: 'relative',
    maxWidth: 250,
  },
  chatDateWrap: {
    alignSelf: 'center',
    backgroundColor: '#E5E5EA', // 연한 회색
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 8,
  },
  chatDateText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },

  chatTime: {
    color: '#333',
    fontSize: 12,
    position: 'absolute',
    bottom: 0,
    width: 60,
  },
  frame: {
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginRight: 10,
  },
  profile: {
    width: 48,
    height: 48,
    borderRadius: 25,
  },
  nickname: {
    marginBottom: 2,
    fontSize: 13,
  },
  chatImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
})
