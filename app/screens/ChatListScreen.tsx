import React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator, Text} from 'react-native-paper'
import COLORS from '../constants/color'
import {useMyChatsInfinite} from '../hooks/useInfiniteQuery'
import {useAppSelector} from '../store/hooks'

export default function ChatListScreen() {
  const {data: user} = useAppSelector(state => state.user)
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMyChatsInfinite(user?.uid) as any
  const chats = data?.pages.flatMap((page: any) => page?.chats ?? []) ?? []
  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={e => e?.id}
        renderItem={({item}) => {
          return (
            <View>
              <Text>123</Text>
            </View>
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
        refreshing={isLoading}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.outerColor,
  },
})
