import {FlashList} from '@shopify/flash-list'
import {useCallback, useRef, useState} from 'react'
import {NativeScrollEvent, NativeSyntheticEvent} from 'react-native'
import type {ChatMessageItemProps} from '../components/ChatMessageItem'

export const useChatScroll = () => {
  const flatListRef = useRef<FlashList<ChatMessageItemProps>>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

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

  return {
    flatListRef,
    isAtBottom,
    handleScroll,
    scrollToBottom,
  }
}
