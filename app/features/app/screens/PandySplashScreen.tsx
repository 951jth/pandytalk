import splash from '@assets/images/pandy_splash.png'
import React from 'react'
import {Image, StyleSheet, View} from 'react-native'
import COLORS from '../../../constants/color'

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
    backgroundColor: COLORS.primary,
  },
  image: {
    maxWidth: 300,
    maxHeight: 300,
  },
})
