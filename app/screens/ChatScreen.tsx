import React from 'react'
import {StyleSheet, Text, View} from 'react-native'

export default function ChatScreen() {
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
  },
})
