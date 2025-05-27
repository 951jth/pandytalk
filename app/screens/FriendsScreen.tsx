import React, {useEffect, useState} from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import ChatMember from '../components/card/ChatMember'
import SearchInput from '../components/input/SearchInput'
import COLORS from '../constants/color'
import {User} from '../types/firebase'

export default function FriendsScreen(): React.JSX.Element {
  const [friends, setFriends] = useState<Array<User>>(dummy)
  const [loading, setLoading] = useState<boolean>(false)
  const [filter, setFilter] = useState({page: 0, size: 20})

  const fetchList = () => {}

  useEffect(() => {}, [])

  return (
    <View style={styles.container}>
      <SearchInput placeholder="검색할 이름을 입력해주세요." />
      <FlatList
        data={friends}
        keyExtractor={e => e?.uid.toString()}
        style={styles.friendsContainer}
        renderItem={({item}) => <ChatMember {...item} />}
        onEndReached={fetchList}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator color={COLORS.primary} /> : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  friendsContainer: {
    flex: 1,
    padding: 16,
  },
})

var dummy: User[] = [
  {
    uid: '1',
    nickname: 'guest',
    status: 'online',
    email: '123@g.com',
    authority: 'USER',
  },
  {
    uid: '2',
    nickname: 'guest2',
    status: 'offline',
    email: '123@g.com',
    authority: 'USER',
  },
  {
    uid: '3',
    nickname: 'guest3',
    status: 'online',
    email: '123@g.com',
    authority: 'USER',
  },
  {
    uid: '4',
    nickname: 'guest4',
    status: 'offline',
    email: '123@g.com',
    authority: 'USER',
  },
]
