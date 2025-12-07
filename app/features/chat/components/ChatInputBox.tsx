import React, {useState} from 'react'
import {Alert, Keyboard, StyleSheet, View} from 'react-native'
import {ImagePickerResponse} from 'react-native-image-picker'
import {IconButton, TextInput} from 'react-native-paper'
import UploadButton from '../../../components/upload/UploadButton'
import COLORS from '../../../constants/color'
import {createChatRoom, sendMessage} from '../../../services/chatService'
import {auth} from '../../../store/firestore'
import type {ChatListItem, ChatMessage} from '../../../types/chat'
import {firebaseImageUpload} from '../../../utils/file'

interface propTypes {
  roomInfo?: ChatListItem | null
  targetIds?: Array<string> | null //채팅방이 없어서 만들어야 하는 경우.
  getRoomInfo?: () => void //채팅방 생성후 채팅방 정보 조회하기
  setCurrentRoomId?: (id: string) => void
}

export default function ChatInputBox({
  roomInfo,
  targetIds,
  setCurrentRoomId,
}: propTypes) {
  const [text, setText] = useState<string>('')
  const user = auth.currentUser
  const [loading, setLoading] = useState<boolean>(false)

  const onSendMessage = async (
    type?: ChatMessage['type'],
    result?: ImagePickerResponse,
  ) => {
    if (!user?.uid) return
    try {
      let rid = roomInfo?.id
      setLoading(true)
      //채팅방 정보가 없으면 현재 채팅방이 생성되지 않았다는 것임.
      if (!roomInfo && targetIds?.[0]) {
        rid = (await createChatRoom(user?.uid, targetIds)) as string
        setCurrentRoomId?.(rid)
      }

      let message = {
        senderPicURL: user?.photoURL,
        senderName: user?.displayName,
        senderId: user?.uid,
        text: text,
        type: type || 'text',
        imageUrl: '',
      }
      // 🔑 공백만 있는지 체크 (텍스트 메시지일 때만)
      const trimmedText = text?.trim()

      // 이미지가 아닌 일반 텍스트 메시지인데, 공백만 있으면 전송 안 함
      if ((type === undefined || type === 'text') && !trimmedText) {
        return
      }
      if (type == 'image') {
        const image = result?.assets?.[0]
        if (image?.uri && result) {
          const filePath = `chat_images/${rid}/${image.fileName}`
          const uploadProm = await firebaseImageUpload(result, filePath)
          if (uploadProm) {
            message.imageUrl = uploadProm?.downloadUrl
            message.text = uploadProm.fileName
          }
          // rid &&
          //   getChatRoomInfo(rid).then(res => {
          //     console.log('res', res)
          //     console.log('members', res?.members)
          //   })
        } else {
          return // 이미지 없으면 중단
        }
      }
      if (!message.text) return //text가 없는 경우는 존재하지 않아야 함.

      if (rid) {
        await sendMessage(rid, message as ChatMessage)
      }
    } catch (e) {
      Alert.alert('메시지 전송 실패', '네트워크 상태를 확인해주세요')
      console.log('error', e)
    } finally {
      setLoading(false)
      setText('')
      Keyboard.dismiss()
    }
  }

  return (
    <View style={[styles.inputContents]}>
      <UploadButton
        onChange={res => onSendMessage('image', res)}
        options={{quality: 0.5}}
      />
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
        size={25}
        style={styles.sendButton}
        iconColor={COLORS.onPrimary}
        onPress={() => onSendMessage()}
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
