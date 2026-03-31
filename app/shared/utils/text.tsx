import React from 'react'
import { Alert, Linking, Text } from 'react-native'

/**
 * 텍스트 내의 URL(http/https) 또는 마크다운 형식의 링크([라벨](url))를 추출하여
 * 클릭 가능한 텍스트로 렌더링하는 헬퍼 함수
 */
export const renderTextWithLinks = (text: string) => {
  if (!text) {
    return null
  }

  // 1. 마크다운 링크 [라벨](url)과 일반 URL을 매칭하는 정규식
  // 캡처 그룹: 1-마크다운전체, 2-라벨, 3-마크다운URL, 4-일반URL
  const linkRegex =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s]+)/g

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('안내', '해당 링크를 열 수 없습니다.')
      }
    } catch (error) {
      Alert.alert('에러', '링크를 처리하는 중 문제가 발생했습니다.')
    }
  }

  const result: (string | React.JSX.Element)[] = []
  let lastIndex = 0

  // String.prototype.matchAll을 사용하여 모든 매칭 정보를 순회하며
  // 일반 텍스트와 링크 컴포넌트를 결과 배열에 교차로 삽입합니다.
  const matches = Array.from(text.matchAll(linkRegex))

  for (const match of matches) {
    const start = match.index!
    const end = start + match[0].length

    // 1. 현재 매칭 이전의 일반 텍스트 추가
    if (start > lastIndex) {
      result.push(text.substring(lastIndex, start))
    }

    // 2. 링크 처리
    if (match[1]) {
      // 마크다운 링크 [라벨](url) 매칭 (Group 1)
      const label = match[2] // Group 2
      const url = match[3] // Group 3
      result.push(
        <Text
          key={`markdown-${start}`}
          style={{ textDecorationLine: 'underline', color: '#0A84FF' }}
          onPress={() => handleLinkPress(url)}
        >
          {label}
        </Text>,
      )
    } else if (match[4]) {
      // 일반 URL 매칭 (Group 4)
      const urlText = match[4]
      // 문장부호(. , ! ? ) 등)가 URL 끝에 포함되어 있다면 분리 처리 (URL 클릭 정확도 향상)
      const cleanUrl = urlText.replace(/[.,!?)?]+$/, '')
      const trailing = urlText.substring(cleanUrl.length)

      result.push(
        <Text
          key={`url-${start}`}
          style={{ textDecorationLine: 'underline', color: '#0A84FF' }}
          onPress={() => handleLinkPress(cleanUrl)}
        >
          {cleanUrl}
        </Text>,
      )

      if (trailing) {
        result.push(trailing)
      }
    }

    lastIndex = end
  }

  // 3. 마지막 매칭 이후의 남은 텍스트 추가
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex))
  }

  return result
}
