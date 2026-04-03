import React from 'react'
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {Text} from 'react-native-paper'

import pandy from '@shared/assets/images/pandy_colorfull_visible.png'
import COLORS from '@app/shared/constants/color'

interface propTypes {
  style?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ImageStyle>
  text?: string
  subText?: string // ✅ 부가 설명을 위한 프롭 추가
}

/**
 * 프리미엄 디자인의 공통 데이터 없음 컴포넌트
 */
export default function EmptyData({
  style,
  imageStyle,
  text = '데이터가 없습니다.',
  subText,
}: propTypes) {
  return (
    <View style={[styles.wraper, style]}>
      <View style={styles.imageContainer}>
        <Image
          source={pandy}
          style={[styles.image, imageStyle]}
          resizeMode="contain"
        />
      </View>
      <View style={styles.textGroup}>
        <Text style={styles.text}>{text}</Text>
        {subText && <Text style={styles.subText}>{subText}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wraper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.background, // ✅ 시스템 컬러 적용
  },
  imageContainer: {
    marginBottom: 20,
    opacity: 0.8, // ✅ 은은한 캐릭터 노출
  },
  image: {
    width: 160,
    height: 120,
  },
  textGroup: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  text: {
    fontFamily: 'BMDOHYEON',
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontFamily: 'BMDOHYEON', // 혹은 다른 서브 폰트가 있다면 변경 가능
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
})
