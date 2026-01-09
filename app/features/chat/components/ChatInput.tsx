import {
  useChatInput,
  type ChatInputPropTypes,
} from '@app/features/chat/hooks/useChatInput'
import COLORS from '@app/shared/constants/color'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'
import UploadButton from '../../../shared/ui/upload/UploadButton'

export default function ChatInput({
  roomInfo,
  targetIds,
  chatType = 'group',
}: ChatInputPropTypes) {
  const {text, setText, onSendMessage, loading} = useChatInput({
    roomInfo,
    targetIds,
    chatType,
  })

  return (
    <View style={[styles.inputContents]}>
      <UploadButton
        onChange={res => onSendMessage('image', res)}
        options={{quality: 0.5}}
      />
      <TextInput
        style={styles.chatTextInput}
        mode="outlined"
        contentStyle={styles.chatTextContent}
        outlineStyle={styles.chatTextOutlined}
        value={text}
        onChangeText={setText}
      />
      <IconButton
        icon="send"
        size={25}
        style={styles.sendButton}
        iconColor={COLORS.onPrimary}
        onPress={() => onSendMessage('text')}
        loading={loading}
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
    // ✅ 그림자 효과 (iOS + Android 호환)
  },
  chatTextInput: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  chatTextContent: {
    paddingVertical: 0,
    paddingHorizontal: 12,
    textAlignVertical: 'center',
  },
  chatTextOutlined: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sendButton: {
    padding: 0,
    margin: 0,
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
})
