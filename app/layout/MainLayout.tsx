import {useSubscribeChatList} from '@app/features/chat/hooks/useSubscribeChatList'
import {useAppSelector} from '@app/store/reduxHooks'
import React, {type ReactNode} from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

type propsType = {
  children: ReactNode
}

export default function MainLayout({children}: propsType): React.JSX.Element {
  const {data: user} = useAppSelector(state => state.user)
  // 실시간 구독, 채팅방 뱃지때문에 여기에 둠
  useSubscribeChatList(user?.uid, 'dm')
  // 관리자일경우 그룹 채팅 목록도 구독
  useSubscribeChatList(user?.uid, 'group', user?.authority !== 'ADMIN')
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
