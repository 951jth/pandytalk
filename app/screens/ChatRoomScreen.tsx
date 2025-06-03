import React, {useState} from 'react'
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import AppBar from '../components/navigation/AppBar'
import UploadButton from '../components/upload/UploadButton'
import COLORS from '../constants/color'

export default function ChatRoomScreen() {
  const [rightActions, setRightActions] = useState([{icon: 'magnify'}])
  const [chats, setChats] = useState(dummy)
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            <AppBar title="채팅방" rightActions={rightActions} />
            <View style={{flex: 1}}>
              <FlatList
                data={chats}
                keyExtractor={item => item.uid}
                renderItem={({item}) => <View></View>}
                contentContainerStyle={styles.chatList}
              />
            </View>
            <View
              style={[
                styles.inputContents,
                // {paddingBottom: insets.bottom > 0 ? insets.bottom : 8},
              ]}>
              <UploadButton />
              <TextInput
                style={styles.chatTextInput}
                mode="outlined"
                contentStyle={{
                  paddingVertical: 0,
                  paddingHorizontal: 12,
                  textAlignVertical: 'center',
                }}
                outlineStyle={{
                  borderRadius: 50,
                  borderWidth: 1,
                }}
              />
              <IconButton
                icon="send"
                size={20}
                style={styles.sendButton}
                iconColor={COLORS.onPrimary}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: COLORS.outerColor,
    // paddingBottom: 60,
  },
  chatList: {
    flex: 1,
    flexGrow: 1,
    // padding: 12,
  },
  inputContents: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderTopColor: '#d9d9d9',
    borderTopWidth: 0.3,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chatTextInput: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    paddingVertical: 0,
  },
  sendButton: {
    padding: 0,
    margin: 0,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
})

const dummy = [
  {
    uid: '1',
    nickname: '더미1',
    isGroup: false,
    createdAt: Date.now(),
    type: 'text',
    imageUrl: '',
    text: '테스트입니돠',
  },
]
