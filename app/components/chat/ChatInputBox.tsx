import React from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'
import COLORS from '../../constants/color'
import UploadButton from '../upload/UploadButton'

interface propTypes {
  roomId: string | null
  user: object | null
}

export default function ChatInputBox({roomId, user}: propTypes) {
  return (
    <View style={[styles.inputContents]}>
      <UploadButton />
      <TextInput
        style={styles.chatTextInput}
        mode="outlined"
        contentStyle={{
          paddingVertical: 0,
          paddingHorizontal: 12,
          textAlignVertical: 'center',
        }}
        outlineStyle={{
          borderRadius: 50,
          borderWidth: 1,
        }}
      />
      <IconButton
        icon="send"
        size={20}
        style={styles.sendButton}
        iconColor={COLORS.onPrimary}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  inputContents: {
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderTopColor: '#d9d9d9',
    borderTopWidth: 0.3,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 50,
    // ✅ 그림자 효과 (iOS + Android 호환)
  },
  chatTextInput: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    padding: 0,
    margin: 0,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
})
