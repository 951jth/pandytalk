import React from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'

import {
  useChatMessageInput,
  type ChatInputPropTypes,
} from '@features/chat/hooks/useChatMessageInput'
import COLORS from '@shared/constants/color'
import UploadButton from '@shared/ui/upload/UploadButton'

export default function ChatMessageInput({
  roomInfo,
  targetIds,
  chatType = 'group',
}: ChatInputPropTypes) {
  const {text, setText, onSendMessage, loading} = useChatMessageInput({
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
        multiline={true}
        dense={true}
        onSubmitEditing={() => onSendMessage('text')}
      />
      <IconButton
        icon="send"
        size={25}
        style={styles.sendButton}
        iconColor={COLORS.onPrimary}
        onPress={() => !loading && onSendMessage('text')} // ✅ 로딩 중 추가 전송 방지
        loading={loading}
        disabled={loading} // ✅ 확실한 비활성화
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
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  chatTextContent: {
    paddingHorizontal: 12,
    textAlignVertical: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  chatTextOutlined: {
    borderRadius: 25,
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
