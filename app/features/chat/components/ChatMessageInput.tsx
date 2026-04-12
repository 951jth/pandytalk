import React from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'

import {
  useChatMessageInput,
  type ChatInputPropTypes,
} from '@features/chat/hooks/useChatMessageInput'
import COLORS from '@shared/constants/color'
import UploadButton from '@shared/ui/upload/UploadButton'

import ChatMentionSuggestion from './ChatMentionSuggestion'
import ImagePreview from './ImagePreview'

export default function ChatMessageInput({
  roomInfo,
  targetIds,
  chatType = 'group',
}: ChatInputPropTypes) {
  const {
    text,
    loading,
    selectedImage,
    setText,
    onSendMessage,
    clearSelectedImage,
  } = useChatMessageInput({
    roomInfo,
    targetIds,
    chatType,
  })

  const selectedImageUri = selectedImage?.assets?.[0]?.uri

  return (
    <>
      <View style={[styles.inputWrapper]}>
        <ChatMentionSuggestion
          text={text}
          setText={setText}
        />

        <View style={[styles.inputContents]}>
          <UploadButton
            onChange={res => onSendMessage('image', res)}
            options={{quality: 0.5}}
            style={styles.uploadButton}
          />
          <View style={styles.textInputContainer}>
            {selectedImageUri && (
              <ImagePreview
                uri={selectedImageUri}
                onRemove={clearSelectedImage}
              />
            )}
            <TextInput
              style={styles.chatTextInput}
              mode="outlined"
              contentStyle={styles.chatTextContent}
              outlineStyle={styles.chatTextOutlined}
              placeholder={
                selectedImageUri ? '사진에 대해 설명해주세요...' : ''
              }
              value={text}
              onChangeText={setText}
              multiline={true}
              dense={true}
              onSubmitEditing={() => onSendMessage('text')}
            />
          </View>
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
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  inputContents: {
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end', // 사진이 있을 때 버튼들을 아래로 정렬
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#2D241F',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  textInputContainer: {
    flex: 1,
  },
  chatTextInput: {
    backgroundColor: 'transparent',
    fontSize: 15,
    minHeight: 40,
    maxHeight: 120, // ✅ 최대 높이 다시 적용
  },
  chatTextContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontSize: 15,
  },
  chatTextOutlined: {
    borderRadius: 25,
    borderWidth: 0,
    backgroundColor: 'rgba(242, 114, 73, 0.05)',
  },
  uploadButton: {
    marginBottom: 10,
  },
  sendButton: {
    padding: 0,
    margin: 0,
    marginBottom: 4,
    width: 40,
    height: 40,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
})
