// import pandy from '@assets/images/pandy_colorfull_visible.png'
import pandy from '@shared/assets/images/pandy_colorfull_visible.png'
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

interface propTypes {
  style?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ImageStyle>
  text?: string
}
export default function EmptyData({
  style,
  imageStyle,
  text = '데이터가 없습니다.',
}: propTypes) {
  return (
    <View style={[styles.wraper, style]}>
      <Image
        source={pandy}
        style={[styles.image, imageStyle]}
        resizeMode="contain"
      />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wraper: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf4ea',
    borderRadius: 16,
    flex: 1,
    width: '100%',
  },
  image: {width: 200, height: 133},
  text: {
    fontFamily: 'BMDOHYEON',
    textAlign: 'center',
  },
})
