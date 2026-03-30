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

  const parts = text.split(linkRegex)
  const result: (string | React.JSX.Element)[] = []

  // 정규식 그룹이 4개이므로, 각 매칭 세트는 [일반텍스트, G1, G2, G3, G4] 총 5개 요소입니다.
  for (let i = 0; i < parts.length; i += 5) {
    // 1. 현재 섹션의 일반 텍스트 추가 (항상 추가)
    if (parts[i]) {
      result.push(parts[i])
    }

    // 2. 루프 끝이면 종료
    if (i + 1 >= parts.length) {
      break
    }

    // 3. 마크다운 링크 매칭됨 (Group 1)
    if (parts[i + 1]) {
      const markdown = parts[i + 1]
      const url = parts[i + 3]
      result.push(
        <Text
          key={`markdown-${i}`}
          style={{ textDecorationLine: 'underline', color: '#0A84FF' }}
          onPress={() => handleLinkPress(url)}
        >
          {markdown}
        </Text>,
      )
    }
    // 4. 일반 URL 매칭됨 (Group 4)
    else if (parts[i + 4]) {
      const urlText = parts[i + 4]
      // 문장부호(. , ! ? ) 등)가 URL 끝에 포함되어 있다면 분리 처리 (URL 클릭 정확도 향상)
      const cleanUrl = urlText.replace(/[.,!?)?]+$/, '')
      const trailing = urlText.substring(cleanUrl.length)

      result.push(
        <React.Fragment key={`url-${i}`}>
          <Text
            style={{ textDecorationLine: 'underline', color: '#0A84FF' }}
            onPress={() => handleLinkPress(cleanUrl)}
          >
            {cleanUrl}
          </Text>
          {trailing}
        </React.Fragment>,
      )
    }
  }
  return result
}
