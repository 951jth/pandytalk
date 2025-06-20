import COLORS from '@constants/color'
import React, {type ReactNode} from 'react'
import {StyleSheet, useColorScheme} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import AppHeader from '../navigation/AppHeader'

type propsType = {
  children: ReactNode
}

export default function MainLayout({children}: propsType): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <AppHeader />
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
