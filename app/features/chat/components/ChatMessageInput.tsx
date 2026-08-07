import React, {useCallback} from 'react'
import {StyleSheet, View, type LayoutChangeEvent} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useChatRoomUIAction} from '@app/features/chat/contexts/ChatRoomUIContext'
import {
  useChatMessageInput,
  type ChatInputPropTypes,
} from '@features/chat/hooks/useChatMessageInput'
import {MAX_CHAT_IMAGES} from '@shared/constants/chat'
import COLORS from '@shared/constants/color'
import useKeyboardFocus from '@shared/hooks/useKeyboardFocus'
import UploadButton from '@shared/ui/upload/UploadButton'

import ChatMentionSuggestion from './ChatMentionSuggestion'
import ChatUploadImagePreview from './ChatUploadImagePreview'

export default function ChatMessageInput({
  roomInfo,
  targetIds,
  chatType = 'group',
}: ChatInputPropTypes) {
  const {scrollToBottom, setInputHeight} = useChatRoomUIAction()
  const {bottom} = useSafeAreaInsets()
  const {isKeyboardVisible} = useKeyboardFocus()
  const {text, loading, selectedImage, setText, onSendMessage, removeImage} =
    useChatMessageInput({
      roomInfo,
      targetIds,
      chatType,
    })

  const handleSend = (type: 'text' | 'image', result?: any) => {
    if (!loading) {
      onSendMessage(type, result)
      scrollToBottom(true)
    }
  }

  const selectedImages = selectedImage?.assets || []
  const bottomPadding = bottom + (isKeyboardVisible ? 12 : 8)
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setInputHeight(event.nativeEvent.layout.height)
    },
    [setInputHeight],
  )

  return (
    <View
      onLayout={handleLayout}
      style={[styles.inputWrapper, {paddingBottom: bottomPadding}]}>
      <ChatMentionSuggestion text={text} setText={setText} disabled={loading} />

      <View style={styles.inputContents}>
        <UploadButton
          onChange={res => handleSend('image', res)}
          options={{quality: 0.5, selectionLimit: MAX_CHAT_IMAGES}}
          style={styles.uploadButton}
          iconColor={COLORS.primary}
          disabled={loading}
        />
        <View style={styles.textInputContainer}>
          {selectedImages.length > 0 && (
            <View style={styles.previewList}>
              {selectedImages.map((asset, idx) => (
                <ChatUploadImagePreview
                  key={asset.uri || idx}
                  uri={asset.uri!}
                  onRemove={() => removeImage(asset.uri!)}
                />
              ))}
            </View>
          )}
          <TextInput
            style={styles.chatTextInput}
            mode="outlined"
            contentStyle={styles.chatTextContent}
            outlineStyle={styles.chatTextOutlined}
            placeholder={
              selectedImages.length > 0
                ? '사진 설명 입력...'
                : '메시지 입력 (@팬디 호출)'
            }
            value={text}
            onChangeText={setText}
            textColor={COLORS.text}
            placeholderTextColor={COLORS.textSecondary}
            cursorColor={COLORS.primary}
            multiline={true}
            dense={true}
            onSubmitEditing={() => handleSend('text')}
          />
        </View>
        <IconButton
          icon="send"
          size={25}
          style={styles.sendButton}
          iconColor={COLORS.onPrimary}
          onPress={() => handleSend('text')}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  inputContents: {
    backgroundColor: COLORS.surface + 'F2',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: COLORS.white + '8C',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end', // 사진이 있을 때 버튼들을 아래로 정렬
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#2D241F',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  textInputContainer: {
    flex: 1,
  },
  previewList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
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
    backgroundColor: COLORS.primary + '0F',
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
    backgroundColor: COLORS.primary + '1A',
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
