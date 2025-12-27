import {chatService} from '@app/features/chat/service/chatService'
import {fileService} from '@app/features/media/service/fileService'
import {sendMessage} from '@app/services/chatService'
import {auth} from '@app/shared/firebase/firestore'
import type {ChatListItem, ChatMessage} from '@app/shared/types/chat'
import {useState} from 'react'
import {Alert, Keyboard} from 'react-native'
import type {ImagePickerResponse} from 'react-native-image-picker'

type propTypes = {
  roomInfo?: ChatListItem | null
  targetIds?: string[]
  getRoomInfo?: () => void //채팅방 생성후 채팅방 정보 조회하기
  setCurrentRoomId?: (id: string) => void
}

export const useChatInputBox = ({
  roomInfo,
  targetIds,
  setCurrentRoomId,
}: propTypes) => {
  const [text, setText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const user = auth.currentUser

  const onSendMessage = async (
    type?: ChatMessage['type'],
    result?: ImagePickerResponse,
  ) => {
    const myId = user?.uid
    if (!myId) return
    try {
      //step 1. 채팅방 생성(없으면)
      let rid = roomInfo?.id || null
      setLoading(true)
      if (!roomInfo && targetIds) {
        const result = await chatService.createChatRoom({
          myId,
          targetIds,
          type: 'dm', // 명시 안 하면 members 길이로 dm/group
        })
        rid = result.id
      }
      if (!rid) return
      setCurrentRoomId?.(rid)

      //step 2. 메세지 페이로드 생성
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
        return setLoading(false)
      }

      //step 3. 이미지 타입이면 업로드
      if (type == 'image') {
        const image = result?.assets?.[0]
        if (image?.uri && result) {
          const uploadProm = await fileService.uploadImageFromPicker(result, {
            rootName: 'chat_images',
            ext: 'jpg',
          })
          if (!uploadProm?.downloadUrl) return // ✅ 업로드 실패면 전송 중단
          if (uploadProm) {
            message.imageUrl = uploadProm?.downloadUrl
            message.text = uploadProm.fileName
          }
        } else {
          return // 이미지 없으면 중단
        }
      }
      if (!message.text) return //text가 없는 경우는 존재하지 않아야 함.

      //step 4. 메세지 전송
      if (rid) await sendMessage(rid, message as ChatMessage)
    } catch (e) {
      Alert.alert('메시지 전송 실패', '네트워크 상태를 확인해주세요')
      console.log('error', e)
    } finally {
      setLoading(false)
      setText('')
      Keyboard.dismiss()
    }
  }

  return {text, setText, onSendMessage, loading}
}
