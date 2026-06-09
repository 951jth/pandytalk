import React, {useMemo, useRef} from 'react'

import {MENTION_CHUNKS} from '@app/shared/constants/ai'
import useKeyboardFocus from '@app/shared/hooks/useKeyboardFocus'
import MentionSuggestion, {
  type SuggestionItem,
} from '@shared/ui/common/MentionSuggestion'

type Props = {
  text: string
  setText: (text: string) => void
  disabled?: boolean
}

export default function ChatMentionSuggestion({
  text,
  setText,
  disabled,
}: Props) {
  const {isKeyboardVisible} = useKeyboardFocus()
  const isMentionBlock = useRef<boolean>(false)

  const isMentionSuggested = useMemo(() => {
    return (
      isKeyboardVisible &&
      !disabled &&
      !isMentionBlock.current &&
      (text.endsWith('@') || text.includes('@팬'))
    )
  }, [isKeyboardVisible, text, disabled])

  const mentionSuggestions = useMemo(() => {
    if (!isMentionSuggested) return []

    let items = MENTION_CHUNKS as unknown as SuggestionItem[]

    // @팬디 이후의 텍스트로 필터링
    if (text.includes('@팬디')) {
      const query = text.split('@팬디').pop()?.trim() || ''
      if (query) {
        items = items.filter(
          item => item.label.includes(query) || item.value.includes(query),
        )
      } else return []
    }

    if (items.length === 0) return []

    // 1. 고정 문구들(fixed: true) 추출
    const fixedItems = items.filter(item => item.fixed)
    // 2. 고정되지 않은 나머지 문구들 추출 및 랜덤 셔플
    const randomItems = items
      .filter(item => !item.fixed)
      .sort(() => 0.5 - Math.random())

    // 3. 필터링된 결과 노출
    return [...fixedItems, ...randomItems].slice(0, 4)
  }, [isMentionSuggested, text])

  const onMentionPress = (mentionValue: string) => {
    // 항목 선택 직후 500ms 동안 차단
    isMentionBlock.current = true
    setTimeout(() => {
      isMentionBlock.current = false
    }, 500)

    // 1. @팬디가 이미 있는 경우, 해당 부분을 전체 mentionValue로 교체
    if (text.includes('@팬디')) {
      const index = text.lastIndexOf('@팬디')
      const before = text.slice(0, index)
      setText(before + mentionValue + ' ')
      return
    }

    // 2. @로 끝나는 경우 (예: "안녕 @") -> 마지막 @를 지우고 선택 문구 삽입
    if (text.endsWith('@')) {
      setText(text.slice(0, -1) + mentionValue + ' ')
    }
    // 3. 이미 텍스트가 있는데 @팬 등으로 시작하는 중일 때 -> 마지막 단어를 교체
    else if (text.includes('@')) {
      const parts = text.split(' ')
      const lastPart = parts[parts.length - 1]
      if (lastPart.startsWith('@')) {
        parts[parts.length - 1] = mentionValue
        setText(parts.join(' ') + ' ')
      } else {
        setText(text ? text + ' ' + mentionValue + ' ' : mentionValue + ' ')
      }
    }
    // 4. 아무것도 없거나 일반 텍스트 뒤일 때 -> 뒤에 추가
    else {
      setText(text ? text + ' ' + mentionValue + ' ' : mentionValue + ' ')
    }
  }

  return (
    <MentionSuggestion
      isVisible={isMentionSuggested}
      suggestions={mentionSuggestions}
      onPress={onMentionPress}
    />
  )
}
