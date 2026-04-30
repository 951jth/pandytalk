import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {formatServerDate} from '@app/shared/utils/firebase'
import {ServerTime} from '@app/shared/types/chat'

interface ChatDateSeparatorProps {
  date: ServerTime | number | null | undefined
}

const ChatDateSeparator = ({date}: ChatDateSeparatorProps) => {
  if (!date) return null

  return (
    <View style={styles.chatDateWrap}>
      <Text style={styles.chatDateText}>
        {formatServerDate(date, 'YYYY년 MM월 DD일 dddd')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chatDateWrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(45, 36, 31, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 16,
  },
  chatDateText: {
    fontSize: 11,
    fontFamily: 'BMDOHYEON',
    color: '#8D7D77',
  },
})

export default ChatDateSeparator
