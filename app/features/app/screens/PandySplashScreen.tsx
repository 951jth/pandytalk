import COLORS from '@app/shared/constants/color'
import splash from '@shared/assets/images/pandy_colorfull_visible.png'
import React from 'react'
import {Image, StyleSheet, View} from 'react-native'

export default function PandySplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={splash} resizeMode="cover" style={styles.image} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  image: {
    // maxWidth: 300,
    width: 191,
    height: 340,
  },
})
