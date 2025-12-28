import {
  messageService,
  type InputMessageParams,
} from '@app/features/chat/service/messageService'
import {fileService} from '@app/features/media/service/fileService'
import type {ChatListItem, ChatMessage} from '@app/shared/types/chat'
import {useState} from 'react'
import {Alert, Keyboard} from 'react-native'
import type {ImagePickerResponse} from 'react-native-image-picker'

type propTypes = {
  roomInfo?: ChatListItem | null
  targetIds: string[]
  setCurrentRoomId?: (id: string) => void
}

export const useChatInputBox = ({
  roomInfo,
  targetIds,
  setCurrentRoomId,
}: propTypes) => {
  const [text, setText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const onSendMessage = async (
    type: ChatMessage['type'],
    chatType: ChatListItem['type'],
    result?: ImagePickerResponse,
  ) => {
    const roomId = roomInfo?.id

    try {
      setLoading(true)
      //step 1. 메세지 페이로드 생성
      let message: InputMessageParams = {
        text: text,
        type,
        imageUrl: '',
      }

      // step 2. 이미지 타입이면 업로드 Url 생성
      if (type == 'image') {
        const image = result?.assets?.[0]
        if (!image?.uri) return
        if (image?.uri && result) {
          const uploadProm = await fileService.uploadImageFromPicker(result, {
            rootName: 'chat_images',
            ext: 'jpg',
          })
          if (uploadProm) {
            message.imageUrl = uploadProm?.downloadUrl
            message.text = uploadProm.fileName
          }
        }
      }
      //step 3. 신규 채팅 생성 및 메세지 전송
      // if (rid) await sendMessage(rid, message as ChatMessage)
      const fetchedRoomId = await messageService.sendChatMessage({
        roomId,
        targetIds,
        chatType,
        message,
      })
      setCurrentRoomId?.(fetchedRoomId)
      setText('')
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      Alert.alert('전송 오류', message)
    } finally {
      setLoading(false)
      Keyboard.dismiss()
    }
  }

  return {text, setText, onSendMessage, loading}
}
