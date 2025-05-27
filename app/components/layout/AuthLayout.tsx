import COLORS from '@constants/color'
import type {ReactNode} from 'react'
import React from 'react'
import {SafeAreaView, StyleSheet, useColorScheme} from 'react-native'
import AppBar from '../navigation/AppBar'
import AppBottom from '../navigation/AppBottom'

type propsType = {
  children: ReactNode
}

export default function AuthLayout({children}: propsType) {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <SafeAreaView style={styles.container}>
      <AppBar />
      <AppBottom />
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
