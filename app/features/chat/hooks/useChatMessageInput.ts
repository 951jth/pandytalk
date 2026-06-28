import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {useCreateChatRoomMutation} from '@app/features/chat/hooks/useChatRoomCreateMutation'
import {setChatMessagePayload} from '@app/features/chat/utils/message'
import {fileService} from '@app/features/media/service/fileService'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useMemo, useState} from 'react'
import {Alert} from 'react-native'
import type {ImagePickerResponse} from 'react-native-image-picker'

export type InputMessageParams = {
  text: string
  type: ChatMessage['type']
  seq?: number
  imageUrl?: string
  imageUrls?: string[]
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
  const [selectedImage, setSelectedImage] =
    useState<ImagePickerResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const {data: user} = useAppSelector(state => state.user)
  const {mutate: sendMessageAndCache} = useChatMessageUpsertMutation(
    roomInfo?.id,
  )
  const {mutateAsync: createChatRoomAndCache} = useCreateChatRoomMutation()

  const isDisabled = useMemo(() => {
    if (!roomInfo) return false
    // DM인데 멤버가 1명 이하인 경우 (상대방 탈퇴 등)
    if (chatType === 'dm' && (roomInfo.members?.length ?? 0) < 2) {
      return true
    }
    return false
  }, [roomInfo, chatType])

  const onSendMessage = async (
    type: ChatMessage['type'],
    result?: ImagePickerResponse,
  ) => {
    // 이미지를 선택한 경우, 즉시 보내지 않고 상태만 저장 (텍스트와 같이 보내기 위해)
    if (type === 'image' && result) {
      setSelectedImage(result)
      return
    }

    if (isDisabled) {
      Alert.alert('안내', '대화가 불가능한 상태입니다.')
      return
    }
    try {
      const trimmedText = text.trim()

      if (type === 'text' && !trimmedText) return
      if (!user?.uid) throw new Error('유저정보 조회 실패')
      setLoading(true)
      // 전송 중 멘션 추천 방지 및 낙관적 UI를 위한 입력창 초기화
      if (type === 'text' || selectedImage) {
        setText('')
        setSelectedImage(null)
      }
      let fetchedRoomInfo = roomInfo
      //step 1. 기본 메세지 페이로드 생성
      const message: InputMessageParams = {
        text: text,
        type,
        imageUrl: '',
        imageUrls: [],
      }
      // step 2. 이미지 타입이거나 선택된 이미지가 있는 경우 업로드 Url 생성
      if (type === 'image' || selectedImage) {
        const imageResponse = result || selectedImage
        if (!imageResponse?.assets || imageResponse.assets.length === 0) {
          if (type === 'image') throw new Error('이미지가 없습니다.')
        } else {
          const uploadResults = await fileService.uploadImagesFromPicker(
            imageResponse,
            {
              rootName: 'chat_images',
              ext: 'jpg',
            },
          )
          if (uploadResults.length > 0) {
            message.imageUrls = uploadResults.map(r => r.downloadUrl)
            // 하위 호환성을 위해 첫 번째 이미지를 imageUrl에도 저장
            message.imageUrl = uploadResults[0].downloadUrl
            message.type = 'image'
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
      // step 4. 메세지 전송 및 캐시 반영 (여기서 정책에 위반되는 데이터 필터링)
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
      if (type === 'text' || selectedImage) {
        setText('')
        setSelectedImage(null) // 전송 후 이미지 비우기
      }
    } catch (e) {
      console.log(e)
      const message = e instanceof Error ? e.message : String(e)
      Alert.alert('안내', message)
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (uri: string) => {
    if (!selectedImage) return
    const nextAssets = selectedImage.assets?.filter(a => a.uri !== uri) || []
    if (nextAssets.length === 0) {
      setSelectedImage(null)
    } else {
      const nextResponse = {...selectedImage, assets: nextAssets}
      setSelectedImage(nextResponse)
    }
  }

  return {
    text,
    setText,
    onSendMessage,
    loading,
    isDisabled,
    selectedImage,
    removeImage,
    clearSelectedImage: () => setSelectedImage(null),
  }
}
