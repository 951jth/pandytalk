import {chatService} from '@app/features/chat/service/chatService'
import {
  messageService,
  type InputMessageParams,
} from '@app/features/chat/service/messageService'
import {fileService} from '@app/features/media/service/fileService'
import type {ChatListItem, ChatMessage} from '@app/shared/types/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useQueryClient} from '@tanstack/react-query'
import {useState} from 'react'
import {Alert, Keyboard} from 'react-native'
import type {ImagePickerResponse} from 'react-native-image-picker'

type propTypes = {
  roomInfo?: ChatListItem | null
  targetIds: string[]
  chatType?: ChatListItem['type']
}

export const useChatInputBox = ({
  roomInfo,
  targetIds,
  chatType = 'dm',
}: propTypes) => {
  const [text, setText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const {data: user} = useAppSelector(state => state.user)
  const queryClient = useQueryClient()

  async function fetchChatRoom() {}

  const onSendMessage = async (
    type: ChatMessage['type'],
    result?: ImagePickerResponse,
  ) => {
    try {
      let fetchedRoomId = roomInfo?.id
      if (!user?.uid) throw new Error('유저정보 조회 실패')
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
      let fetchedRoomInfo = roomInfo
      // step 3. 채팅방 신규 생성(없으면)
      if (!roomInfo?.id) {
        if (!targetIds?.length) throw new Error('대화 상대 정보가 없습니다.')
        fetchedRoomInfo = await chatService.createChatRoom({
          myId: user.uid,
          targetIds,
          type: chatType,
        })
        await queryClient.refetchQueries({
          queryKey: ['chatRoom', fetchedRoomId],
          exact: true,
        })
        if (!fetchedRoomInfo?.id)
          throw new Error('채팅방 생성에 실패하였습니다.')
      }

      //step 4. 메세지 전송
      await messageService.sendChatMessage({
        roomInfo: fetchedRoomInfo,
        targetIds,
        chatType,
        message,
        user,
      })
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
