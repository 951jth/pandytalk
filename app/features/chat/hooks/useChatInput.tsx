import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {chatService} from '@app/features/chat/service/chatService'
import {setChatMessagePayload} from '@app/features/chat/utils/message'
import {fileService} from '@app/features/media/service/fileService'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useState} from 'react'
import {Alert, Keyboard} from 'react-native'
import type {ImagePickerResponse} from 'react-native-image-picker'

export type InputMessageParams = {
  // ✅ 재전송/멱등 위해 외부에서 id를 넣고 싶으면 옵션으로 받기
  text: string
  type: ChatMessage['type']
  seq?: number
  imageUrl?: string
}

export type ChatInputPropTypes = {
  chatType: ChatRoom['type']
  targetIds?: string[]
  roomInfo?: ChatRoom | null
}

export const useChatInput = ({
  roomInfo,
  targetIds,
  chatType,
}: ChatInputPropTypes) => {
  const [text, setText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const {data: user} = useAppSelector(state => state.user)
  const {mutate: sendChatAndCache, isPending} = useChatMessageUpsertMutation(
    roomInfo?.id,
  )

  const onSendMessage = async (
    type: ChatMessage['type'], //메세지 타입임
    result?: ImagePickerResponse,
  ) => {
    try {
      if (!user?.uid) throw new Error('유저정보 조회 실패')
      setLoading(true)
      let fetchedRoomInfo = roomInfo
      //step 1. 기본 메세지 페이로드 생성
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

      // step 3. 채팅방 신규 생성(없으면)
      if (!roomInfo?.id) {
        if (!targetIds?.length) throw new Error('대화 상대 정보가 없습니다.')
        fetchedRoomInfo = await chatService.createChatRoom({
          myId: user.uid,
          targetIds,
          type: chatType,
        })
      }
      console.log('fetchedRoomInfo', fetchedRoomInfo)
      if (!fetchedRoomInfo) throw new Error('채팅방 정보가 없습니다.')
      //step 4. 메세지 전송 및 캐시 반영
      const reformedMsg = setChatMessagePayload({
        roomId: fetchedRoomInfo.id,
        message,
        user,
      })
      if (!reformedMsg) throw new Error('메시지 생성에 실패했습니다.')
      sendChatAndCache({
        message: reformedMsg,
        createdRoomId: fetchedRoomInfo.id,
      })
      setText('')
    } catch (e) {
      console.log(e)
      const message = e instanceof Error ? e.message : String(e)
      Alert.alert('전송 오류', message)
    } finally {
      setLoading(false)
      Keyboard.dismiss()
    }
  }

  return {text, setText, onSendMessage, loading}
}
