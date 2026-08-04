import {FlashList} from '@shopify/flash-list'
import React, {createContext, ReactNode, useContext} from 'react'
import {NativeScrollEvent, NativeSyntheticEvent} from 'react-native'

import type {ChatMessageItemProps} from '../components/ChatMessageItem'
import AnimatedAIGradient from '../components/AnimatedAIGradient'
import {useChatScroll} from '../hooks/useChatScroll'

interface ChatRoomUIState {
  isAtBottom: boolean
  isAIGenerating: boolean
  inputHeight: number
}

interface ChatRoomUIAction {
  flatListRef: ReturnType<typeof useChatScroll>['flatListRef']
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  scrollToBottom: (animated?: boolean) => void
  setIsAIGenerating: (value: boolean) => void
  setInputHeight: (value: number) => void
}

const ChatRoomUIStateContext = createContext<ChatRoomUIState | null>(null)
const ChatRoomUIActionContext = createContext<ChatRoomUIAction | null>(null)

import COLORS from '@app/shared/constants/color'
import {View, StyleSheet} from 'react-native'

export const ChatRoomUIProvider = ({children}: {children: ReactNode}) => {
  const [isAIGenerating, setIsAIGenerating] = React.useState(false)
  const [inputHeight, setInputHeight] = React.useState(0)
  const {flatListRef, isAtBottom, handleScroll, scrollToBottom} =
    useChatScroll()

  return (
    <ChatRoomUIActionContext.Provider
      value={{
        flatListRef,
        handleScroll,
        scrollToBottom,
        setIsAIGenerating,
        setInputHeight,
      }}>
      <ChatRoomUIStateContext.Provider
        value={{isAtBottom, isAIGenerating, inputHeight}}>
        <View style={{flex: 1, backgroundColor: COLORS.background}}>
          <AnimatedAIGradient />
          {children}
        </View>
      </ChatRoomUIStateContext.Provider>
    </ChatRoomUIActionContext.Provider>
  )
}

export const useChatRoomUIState = () => {
  const context = useContext(ChatRoomUIStateContext)
  if (!context) {
    throw new Error(
      'useChatRoomUIState must be used within a ChatRoomUIProvider',
    )
  }
  return context
}

export const useChatRoomUIAction = () => {
  const context = useContext(ChatRoomUIActionContext)
  if (!context) {
    throw new Error(
      'useChatRoomUIAction must be used within a ChatRoomUIProvider',
    )
  }
  return context
}
