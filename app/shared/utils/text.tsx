import React from 'react'
import {Alert, Linking, Text} from 'react-native'

/**
 * 텍스트 내의 URL(http/https)을 추출하여 클릭 가능한 링크 텍스트로 렌더링하는 헬퍼 함수
 */
export const renderTextWithLinks = (text: string) => {
  if (!text) return null

  // HTTP/HTTPS URL을 잡아내는 정규식
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <Text
          key={index}
          style={{textDecorationLine: 'underline', color: '#0A84FF'}}
          onPress={async () => {
            try {
              const supported = await Linking.canOpenURL(part)
              if (supported) {
                await Linking.openURL(part)
              } else {
                Alert.alert('안내', '해당 링크를 열 수 없습니다.')
              }
            } catch (error) {
              Alert.alert('에러', '링크를 처리하는 중 문제가 발생했습니다.')
            }
          }}>
          {part}
        </Text>
      )
    }
    return <Text key={index}>{part}</Text>
  })
}
