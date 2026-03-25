import React from 'react'
import {Image, StyleSheet, View} from 'react-native'
import {Chip, IconButton, TextInput} from 'react-native-paper'

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
  const {
    text,
    setText,
    onSendMessage,
    loading,
    isMentionSuggested,
    onMentionPress,
    setIsFocused,
    mentionLabel,
  } = useChatMessageInput({
    roomInfo,
    targetIds,
    chatType,
  })

  return (
    <>
      <View style={[styles.inputWrapper]}>
        {isMentionSuggested && (
          <View style={styles.mentionRow}>
            <Chip
              style={styles.mentionChip}
              textStyle={styles.mentionChipText}
              onPress={() => onMentionPress('@팬디')}
              icon={({size}) => (
                <Image
                  source={require('@shared/assets/icons/pandy_icon.png')}
                  style={{width: size, height: size, borderRadius: size / 2}}
                />
              )}>
              {mentionLabel}
            </Chip>
          </View>
        )}
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
    backgroundColor: COLORS.background,
  },
  mentionRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    // backgroundColor: 'transparent',
  },
  mentionChip: {
    backgroundColor: COLORS.primary + '20', // primary with transparency
    borderColor: COLORS.primary,
    borderWidth: 0.5,
  },
  mentionChipText: {
    color: COLORS.primary,
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
  },
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
