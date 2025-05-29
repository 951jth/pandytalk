import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {User} from '../types/firebase'

export default function ProfileScreen(): React.JSX.Element {
  const [formValues, setFormValues] = useState<User>()

  return <View style={styles.container}></View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
