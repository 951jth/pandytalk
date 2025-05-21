import COLORS from '@constants/color'
import type {ReactNode} from 'react'
import React from 'react'
import {SafeAreaView, StyleSheet, useColorScheme, View} from 'react-native'
import AppBar from '../navigation/AppBar'

type propsType = {
  children: ReactNode
}

export default function AuthLayout({children}: propsType) {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <SafeAreaView style={styles.container}>
      <AppBar />
      <View style={styles.contents}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contents: {
    flex: 1,
  },
})
