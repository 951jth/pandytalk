import circle from '@assets/images/young_and_happy.png'

import {Image, StyleSheet, Text, TextInput, View} from 'react-native'
// import {TextInput} from 'react-native-paper'

export default function TestSection(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.text}>컴포넌트 테스트</Text>
      </View>
      <View>
        <Image source={circle} resizeMode="cover" style={styles.image} />
      </View>
      <View>
        <TextInput placeholder="텍스트를 입력해주세요." />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
  image: {
    width: 240,
    height: 179,
  },
})
