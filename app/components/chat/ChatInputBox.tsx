import React, {useState} from 'react'
import {Alert, Keyboard, StyleSheet, View} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'
import COLORS from '../../constants/color'
import {createChatRoom, sendMessage} from '../../services/chatService'
import {ChatMessage} from '../../types/firebase'
import UploadButton from '../upload/UploadButton'

interface propTypes {
  roomId: string | null
  userId: string | null | undefined
  targetIds: Array<string> | null
  getRoomId: () => void
}

export default function ChatInputBox({
  roomId,
  userId,
  targetIds,
  getRoomId,
}: propTypes) {
  const [text, setText] = useState<string>('')

  // const onNewChatRoom = () => {
  //   createChatRoom()
  // }

  const onSendMessage = async (type?: ChatMessage['type']) => {
    console.log(userId, text, targetIds)
    if (!userId || !text) return
    try {
      let rid = roomId
      if (!rid && targetIds?.[0]) {
        rid = await createChatRoom(userId, targetIds)
      }
      const message = {
        senderId: userId,
        text: text,
        type: type || 'text',
      }
      if (rid) {
        await sendMessage(rid, message)
        getRoomId()
      }
    } catch (e) {
      Alert.alert('메시지 전송 실패', '네트워크 상태를 확인해주세요')
    }
    setText('')
    Keyboard.dismiss()
  }

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
        value={text}
        onChangeText={setText}
      />
      <IconButton
        icon="send"
        size={20}
        style={styles.sendButton}
        iconColor={COLORS.onPrimary}
        onPress={() => onSendMessage()}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
})
