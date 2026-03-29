import React from 'react'
import {Alert, Linking, Text} from 'react-native'

/**
 * 텍스트 내의 URL(http/https) 또는 마크다운 형식의 링크([라벨](url))를 추출하여
 * 클릭 가능한 텍스트로 렌더링하는 헬퍼 함수
 */
export const renderTextWithLinks = (text: string) => {
  if (!text) return null

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

  const parts = text.split(linkRegex)
  const result: (string | React.JSX.Element)[] = []

  let i = 0
  while (i < parts.length) {
    const part = parts[i]
    if (part === undefined) {
      i++
      continue
    }

    // 마크다운 링크 매칭됨 (parts[i+1]이 마크다운 전체 텍스트)
    if (i + 1 < parts.length && parts[i + 1] && parts[i + 1].startsWith('[')) {
      const label = parts[i + 2]
      const url = parts[i + 3]
      result.push(
        <Text
          key={i}
          style={{textDecorationLine: 'underline', color: '#0A84FF'}}
          onPress={() => handleLinkPress(url)}>
          {label}
        </Text>,
      )
      i += 4 // 그룹 3개(1,2,3) + 원본 텍스트 건너뜀
    }
    // 일반 URL 매칭됨 (parts[i+4]가 일반 URL 텍스트)
    else if (
      i + 4 < parts.length &&
      parts[i + 4] &&
      parts[i + 4].startsWith('http')
    ) {
      const urlText = parts[i + 4]
      // 문장부호(. , ! ? ) 등)가 URL 끝에 포함되어 있다면 분리 처리 (URL 클릭 정확도 향상)
      const cleanUrl = urlText.replace(/[.,!?)?]+$/, '')
      const trailing = urlText.substring(cleanUrl.length)

      result.push(
        <React.Fragment key={i}>
          <Text
            style={{textDecorationLine: 'underline', color: '#0A84FF'}}
            onPress={() => handleLinkPress(cleanUrl)}>
            {cleanUrl}
          </Text>
          {trailing}
        </React.Fragment>,
      )
      i += 5 // 그룹 4개(1,2,3,4) + 원본 텍스트 건너뜀
    } else {
      // 일반 텍스트
      if (part) result.push(part)
      i++
    }
  }

  return result
}
