import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'

interface Profile {
  boxSize?: number
  iconSize?: number
  boxStyle?: StyleProp<ViewStyle>
}

export default function DefaultProfile({
  boxSize = 150,
  iconSize = 120,
  boxStyle = {},
}: Profile): React.JSX.Element {
  return (
    // <View
    //   style={[
    //     styles.shadowWrapper,
    //     {width: boxSize, height: boxSize, borderRadius: boxSize / 2},
    //   ]}>
    <View
      style={[
        styles.frame,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: boxSize / 2,
        },
        boxStyle,
      ]}>
      <Icon source="account" size={iconSize} color={COLORS.primary} />
    </View>
    // </View>
  )
}

const styles = StyleSheet.create({
  shadowWrapper: {
    // ✅ 바깥 그림자용 래퍼
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8, // Android
    backgroundColor: 'transparent', // 그림자가 보이도록
    borderRadius: 25,
    overflow: 'hidden',

    // 중요: overflow visible (기본값)
  },
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', // ✅ 그림자 확인 가능하게 설정
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
})
