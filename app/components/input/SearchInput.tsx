import React from 'react'
import {StyleSheet, View} from 'react-native'
import {TextInput, TextInputProps} from 'react-native-paper'

export default function SearchInput(props: TextInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        placeholder="검색어를 입력하세요"
        left={<TextInput.Icon icon="magnify" />}
        style={styles.input}
        contentStyle={{padding: 0}}
        outlineStyle={{borderRadius: 50}}
        right={
          props?.value ? (
            <TextInput.Icon
              icon="close"
              onPress={() => props?.onChangeText?.('')}
              forceTextInputFocus={false}
            />
          ) : null
        }
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {padding: 12},
  input: {
    backgroundColor: 'white',
    height: 40,
    fontSize: 14,
  },
})
