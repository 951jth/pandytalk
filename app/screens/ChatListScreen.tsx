import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import COLORS from '../constants/color'

export default function ChatListScreen() {
  return (
    <View style={styles.container}>
      <Text>채팅 페이지</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
})
