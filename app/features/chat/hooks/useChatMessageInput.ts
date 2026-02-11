import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {useCreateChatRoomMutation} from '@app/features/chat/hooks/useChatRoomCreateMutation'
import {setChatMessagePayload} from '@app/features/chat/utils/message'
import {fileService} from '@app/features/media/service/fileService'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useState} from 'react'
import {Alert} from 'react-native'
import type {ImagePickerResponse} from 'react-native-image-picker'

export type InputMessageParams = {
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

export const useChatMessageInput = ({
  roomInfo,
  targetIds,
  chatType,
}: ChatInputPropTypes) => {
  const [text, setText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const {data: user} = useAppSelector(state => state.user)
  const {mutate: sendMessageAndCache} = useChatMessageUpsertMutation(
    roomInfo?.id,
  )
  const {mutateAsync: createChatRoomAndCache} = useCreateChatRoomMutation()

  const isDisabled = (() => {
    if (!roomInfo) return false
    // DM인데 멤버가 1명 이하인 경우 (상대방 탈퇴 등)
    if (chatType === 'dm' && (roomInfo.members?.length ?? 0) < 2) {
      return true
    }
    return false
  })()

  const onSendMessage = async (
    type: ChatMessage['type'],
    result?: ImagePickerResponse,
  ) => {
    if (isDisabled) {
      Alert.alert('안내', '대화가 불가능한 상태입니다.')
      return
    }
    try {
      if (type == 'text' && !text) return
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
        if (!image?.uri) throw new Error('이미지가 없습니다.')
        if (image?.uri && result) {
          const uploadProm = await fileService.uploadImageFromPicker(result, {
            rootName: 'chat_images',
            ext: 'jpg',
          })
          if (uploadProm) {
            message.imageUrl = uploadProm?.downloadUrl
            message.text = ''
          }
        }
      }

      // step 3. 채팅방 신규 생성(없으면)
      if (!roomInfo?.id) {
        if (!targetIds?.length) throw new Error('대화 상대 정보가 없습니다.')
        fetchedRoomInfo = await createChatRoomAndCache({
          targetIds,
          type: chatType,
        })
      }
      if (!fetchedRoomInfo) throw new Error('채팅방 정보가 없습니다.')
      // step 4. 메세지 전송 및 캐시 반영
      const reformedMsg = setChatMessagePayload({
        roomInfo: fetchedRoomInfo,
        message,
        user,
      })
      if (!reformedMsg) throw new Error('메시지 생성에 실패했습니다.')
      sendMessageAndCache({
        message: reformedMsg,
        createdRoomId: fetchedRoomInfo.id,
      })
      if (type == 'text') setText('')
    } catch (e) {
      console.log(e)
      const message = e instanceof Error ? e.message : String(e)
      Alert.alert('안내', message)
    } finally {
      setLoading(false)
    }
  }

  return {text, setText, onSendMessage, loading, isDisabled}
}
