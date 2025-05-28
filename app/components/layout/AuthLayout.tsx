import COLORS from '@constants/color'
import React from 'react'
import {StyleSheet, useColorScheme} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppBar from '../navigation/AppBar'
import AppBottom from '../navigation/AppBottom'

export default function AuthLayout() {
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
})
