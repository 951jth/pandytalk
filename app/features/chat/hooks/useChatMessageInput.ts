import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {useCreateChatRoomMutation} from '@app/features/chat/hooks/useChatRoomCreateMutation'
import {setChatMessagePayload} from '@app/features/chat/utils/message'
import {fileService} from '@app/features/media/service/fileService'
import {MENTION_CHUNKS} from '@app/shared/constants/ai'
import useKeyboardFocus from '@app/shared/hooks/useKeyboardFocus'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useMemo, useRef, useState} from 'react'
import {Alert} from 'react-native'
import type {ImagePickerResponse} from 'react-native-image-picker'
import type {SuggestionItem} from '../components/MentionSuggestion'

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
  const [selectedImage, setSelectedImage] = useState<ImagePickerResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const {data: user} = useAppSelector(state => state.user)
  const {mutate: sendMessageAndCache} = useChatMessageUpsertMutation(
    roomInfo?.id,
  )
  const {mutateAsync: createChatRoomAndCache} = useCreateChatRoomMutation()
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const {isKeyboardVisible} = useKeyboardFocus()
  const isMentionBlock = useRef<boolean>(false)
  // const isInitialVisit = useRef<boolean>(true)
  const isMentionSuggested =
    isKeyboardVisible &&
    isFocused &&
    !text.includes('@팬디') &&
    !isMentionBlock.current &&
    (text === '' || text.endsWith('@') || text.includes('@팬'))

  const mentionSuggestions = useMemo(() => {
    // 1. 고정 문구들(fixed: true) 추출
    const fixedItems = MENTION_CHUNKS.filter(
      (item: SuggestionItem) => item.fixed,
    )
    // 2. 고정되지 않은 나머지 문구들 추출 및 랜덤 셔플
    const randomItems = MENTION_CHUNKS.filter(
      (item: SuggestionItem) => !item.fixed,
    ).sort(() => 0.5 - Math.random())

    // 3. 고정 문구를 앞에 두고 나머지를 뒤에 붙여서 총 3개 노출
    return [...fixedItems, ...randomItems].slice(0, 4)
  }, [isMentionSuggested])

  const onMentionPress = (mentionValue: string) => {
    // isInitialVisit.current = false
    // 1. @로 끝나는 경우 (예: "안녕 @") -> 마지막 @를 지우고 선택 문구 삽입
    if (text.endsWith('@')) {
      setText(prev => prev.slice(0, -1) + mentionValue + ' ')
    }
    // 2. 이미 텍스트가 있는데 @팬 등으로 시작하는 중일 때 -> 마지막 단어를 교체
    else if (text.includes('@')) {
      const parts = text.split(' ')
      const lastPart = parts[parts.length - 1]
      if (lastPart.startsWith('@')) {
        parts[parts.length - 1] = mentionValue
        setText(parts.join(' ') + ' ')
      } else {
        setText(prev =>
          prev ? prev + ' ' + mentionValue + ' ' : mentionValue + ' ',
        )
      }
    }
    // 3. 아무것도 없거나 일반 텍스트 뒤일 때 -> 뒤에 추가
    else {
      setText(prev =>
        prev ? prev + ' ' + mentionValue + ' ' : mentionValue + ' ',
      )
    }
  }

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
      let fetchedRoomInfo = roomInfo
      //step 1. 기본 메세지 페이로드 생성
      let message: InputMessageParams = {
        text: text,
        type,
        imageUrl: '',
      }
      // step 2. 이미지 타입이거나 선택된 이미지가 있는 경우 업로드 Url 생성
      if (type === 'image' || selectedImage) {
        const imageResponse = result || selectedImage
        const image = imageResponse?.assets?.[0]
        if (!image?.uri) {
          if (type === 'image') throw new Error('이미지가 없습니다.')
        } else {
          const uploadProm = await fileService.uploadImageFromPicker(
            imageResponse!,
            {
              rootName: 'chat_images',
              ext: 'jpg',
            },
          )
          if (uploadProm) {
            message.imageUrl = uploadProm?.downloadUrl
            message.type = 'image' // 이미지가 포함되면 타입을 image로 변경
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
        isMentionBlock.current = true
        setText('')
        setSelectedImage(null) // 전송 후 이미지 비우기
        setTimeout(() => {
          isMentionBlock.current = false
        }, 500)
      }
      // isInitialVisit.current = false
    } catch (e) {
      console.log(e)
      const message = e instanceof Error ? e.message : String(e)
      Alert.alert('안내', message)
    } finally {
      setLoading(false)
    }
  }

  return {
    text,
    setText,
    onSendMessage,
    loading,
    isDisabled,
    isMentionSuggested,
    onMentionPress,
    setIsFocused,
    mentionSuggestions,
    selectedImage,
    clearSelectedImage: () => setSelectedImage(null),
  }
}
