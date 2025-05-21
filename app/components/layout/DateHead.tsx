import dayjs from 'dayjs'
import {StatusBar, StyleSheet, Text, View} from 'react-native'
import COLORS from '../../constants/color'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

export default function DateHead(): React.JSX.Element {
  const date = dayjs()
  const {top} = useSafeAreaInsets()
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      <View style={{height: top}} />
      <View style={styles.container}>
        <Text style={styles.text}>{date.format('YYYY년 MM월 DD일 hh:mm')}</Text>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  text: {
    color: COLORS.text,
  },
  placeholder: {
    backgroundColor: COLORS.primary,
  },
})
