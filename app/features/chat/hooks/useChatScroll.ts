import {FlashList} from '@shopify/flash-list'
import {useCallback, useEffect, useRef, useState} from 'react'
import {NativeScrollEvent, NativeSyntheticEvent} from 'react-native'
import type {ChatMessageItemProps} from '../components/ChatMessageItem'

interface UseChatScrollProps {
  userId: string | null | undefined
  latestMessageId: string | undefined
  isMine: boolean
}

export const useChatScroll = ({
  userId: _userId,
  latestMessageId,
  isMine,
}: UseChatScrollProps) => {
  const flatListRef = useRef<FlashList<ChatMessageItemProps>>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const lastMessageIdRef = useRef<string | null>(null)

  const scrollToBottom = useCallback((animated = false) => {
    flatListRef.current?.scrollToOffset({offset: 0, animated})
  }, [])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {contentOffset} = event.nativeEvent
      // inverted 리스트이므로 contentOffset.y가 0에 가까울수록 최하단임
      const isBottom = contentOffset.y < 100
      if (isAtBottom !== isBottom) {
        setIsAtBottom(isBottom)
      }
    },
    [isAtBottom],
  )

  useEffect(() => {
    if (!latestMessageId) return

    const isNewMessage = latestMessageId !== lastMessageIdRef.current

    // 내가 보낸 메시지거나, 현재 바닥을 보고 있는 상태라면 자동으로 스크롤
    if (isNewMessage && (isMine || isAtBottom)) {
      if (isMine) {
        // 내가 보낸 메시지는 즉시 최하단으로 스냅
        scrollToBottom(true)
      } else {
        // 남이 보낸 메시지는 레이아웃 안정을 위해 프레임 대기 후 스크롤
        requestAnimationFrame(() => {
          scrollToBottom(true)
        })
      }
    }

    lastMessageIdRef.current = latestMessageId
  }, [latestMessageId, isMine, isAtBottom, scrollToBottom])

  return {
    flatListRef,
    isAtBottom,
    handleScroll,
    scrollToBottom,
  }
}
