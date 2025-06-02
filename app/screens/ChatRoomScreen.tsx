import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, TextInput} from 'react-native-paper'
import AppBar from '../components/navigation/AppBar'
import UploadButton from '../components/upload/UploadButton'
import COLORS from '../constants/color'

export default function ChatRoomScreen() {
  const [rightActions, setRightActions] = useState([{icon: 'magnify'}])
  const [chats, setChats] = useState(dummy)
  return (
    <View style={styles.container}>
      <AppBar title="채팅방" rightActions={rightActions}></AppBar>
      <View style={styles.chatContents}></View>
      <View style={styles.inputContents}>
        <UploadButton />
        <TextInput
          style={styles.chatTextInput}
          mode="outlined"
          contentStyle={{
            paddingVertical: 0,
            paddingHorizontal: 12,
            textAlignVertical: 'center', // ✅ Android 중심 정렬
          }}
          outlineStyle={{
            borderRadius: 50,
            borderWidth: 1,
          }}
        />
        {/* <IconButton
          icon="send"
          style={[styles.send, {width: 30, height: 30}]}
          size={30}
          contentStyle={{width: 30, height: 30}}></IconButton> */}
        <IconButton
          icon="send"
          size={23} // 아이콘 크기
          // onPress={handleSend}
          style={styles.sendButton}
          contentStyle={styles.sendContent}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContents: {
    flex: 1,
    gap: 12,
    backgroundColor: COLORS.outerColor,
  },
  inputContents: {
    backgroundColor: COLORS.background,
    height: 60,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
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
    height: 40, // ✅ 높이 지정
    justifyContent: 'center', // iOS용
    paddingVertical: 0,
  },
  send: {
    padding: 0,
    margin: 0,
    // backgroundColor: COLORS.outerColor,
  },
  sendButton: {
    padding: 0,
    margin: 0,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendContent: {
    padding: 0,
    margin: 0,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

var dummy = [
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
