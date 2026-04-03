import React from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'

import {
  useChatMessageInput,
  type ChatInputPropTypes,
} from '@features/chat/hooks/useChatMessageInput'
import COLORS from '@shared/constants/color'
import UploadButton from '@shared/ui/upload/UploadButton'

import MentionSuggestion from './MentionSuggestion'

export default function ChatMessageInput({
  roomInfo,
  targetIds,
  chatType = 'group',
}: ChatInputPropTypes) {
  const {
    text,
    setText,
    onSendMessage,
    loading,
    isMentionSuggested,
    onMentionPress,
    setIsFocused,
    mentionSuggestions,
  } = useChatMessageInput({
    roomInfo,
    targetIds,
    chatType,
  })

  return (
    <>
      <View style={[styles.inputWrapper]}>
        <MentionSuggestion
          isVisible={isMentionSuggested}
          suggestions={mentionSuggestions}
          onPress={onMentionPress}
        />
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
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => onSendMessage('text')}
          />
          <IconButton
            icon="send"
            size={25}
            style={styles.sendButton}
            iconColor={COLORS.onPrimary}
            onPress={() => !loading && onSendMessage('text')}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
    paddingBottom: 20, // 최초 버전의 안정적인 여백
    paddingHorizontal: 16,
  },
  inputContents: {
    backgroundColor: '#FFFFFF',
    borderRadius: 35, // ✅ 최초의 완벽한 캡슐형 복원
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    // 최초의 부드러운 플로팅 섀도우
    shadowColor: '#2D241F',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  chatTextInput: {
    flex: 1,
    minHeight: 45,
    maxHeight: 120,
    backgroundColor: 'transparent',
    fontSize: 15,
    fontFamily: 'BMDOHYEON',
  },
  chatTextContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  chatTextOutlined: {
    borderRadius: 25, // 내부 필드도 캡슐형으로 복원
    borderWidth: 0,
    backgroundColor: 'rgba(242, 114, 73, 0.05)',
  },
  sendButton: {
    padding: 0,
    margin: 0,
    width: 44,
    height: 44,
    borderRadius: 22, // ✅ 원형으로 복원
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    // 버튼 섀도우 복원
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
})
