import React, {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {useRecoilValue} from 'recoil'
import {userState} from '../store/userStore'
import {User} from '../types/firebase'

export default function ProfileScreen(): React.JSX.Element {
  const user = useRecoilValue(userState)
  const [formValues, setFormValues] = useState<User>()
  useEffect(() => {
    if (user) {
      // alert(JSON.stringify(userState))
      setFormValues(user)
    }
  }, [user])

  return <View style={styles.container}></View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
