import COLORS from '@constants/color'
import React, {type ReactNode} from 'react'
import {StyleSheet, useColorScheme, View} from 'react-native'
import AppBar from '../navigation/AppBar'

type propsType = {
  children: ReactNode
}

export default function MainLayout({children}: propsType): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <View style={styles.container}>
      <AppBar />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
