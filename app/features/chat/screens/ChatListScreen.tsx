import {useRoute, type RouteProp} from '@react-navigation/native'
import React, {useMemo} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import COLORS from '../../../constants/color'
// import {updateChatLastReadCache} from '../hooks/useInfiniteQuery'
import {ActivityIndicator} from 'react-native-paper'
import EmptyData from '../../../components/common/EmptyData'
import SearchInput from '../../../components/input/SearchInput'
import {AppRouteParamList} from '../../../types/navigate'
import ChatListItemCard from '../components/ChatListItemCard'
import {useChatListScreen} from '../hooks/useChatListScreen'

type ChatRouteParams = RouteProp<AppRouteParamList, 'chats'>

//1:1 (DM), 그룹채팅(group) 모두 사용중인 화면.
export default function ChatListScreen() {
  const {params} = useRoute<ChatRouteParams>()
  const type = useMemo(() => params?.type ?? 'dm', [])
  const {
    input,
    setInput,
    chats,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    moveToChatRoom,
  } = useChatListScreen(type)
  return (
    <View style={{flex: 1}}>
      <SearchInput
        placeholder="검색할 닉네임을 입력해주세요."
        value={input}
        onChangeText={setInput}
      />
      <FlatList
        data={chats}
        keyExtractor={e => e?.id}
        renderItem={({item}) => {
          const findMember = item?.findMember
          const targetId = findMember?.id
          return (
            <ChatListItemCard
              item={item}
              onPress={item => moveToChatRoom(targetId, item.id)}
            />
          )
        }}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyData
              text={`레서판다가 기다리고 있어요.\n새로운 대화를 시작해볼까요?`}
            />
          </View>
        }
        refreshing={isLoading}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{flex: 1}}
        contentContainerStyle={styles.chatContents}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  chatContents: {
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    flexGrow: 1,
    backgroundColor: COLORS.outerColor,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  chatRoom: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 8,
  },
  frame: {
    width: 55,
    height: 55,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    position: 'relative',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  point: {
    backgroundColor: '#2CC069',
    width: 14,
    height: 14,
    borderRadius: 100,
    borderColor: '#FFF',
    borderWidth: 2,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  contents: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'BMDOHYEON',
  },
  lastMessage: {
    fontSize: 12,
    color: '#ADB5BD',
    fontFamily: 'BMDOHYEON',
  },
  lastSendTime: {
    fontSize: 12,
    color: '#ADB5BD',
    position: 'absolute',
    top: 0,
    right: 0,
    fontFamily: 'BMDOHYEON',
  },
  unreadMessageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // ✅ 세로 중앙
    backgroundColor: COLORS.primary,
  },
  unreadMessage: {
    color: COLORS.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'BMDOHYEON',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
})
