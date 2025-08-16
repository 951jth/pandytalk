import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import InputForm from '../components/description/InputForm'
import CustomInput from '../components/input/CustomInput'
import AppHeader from '../components/navigation/AppHeader'
import EditProfile from '../components/upload/EditProfile'
import COLORS from '../constants/color'

export default function AddGuestScreen() {
  // label: string
  // contents?: string
  // key?: string
  // fixed?: boolean
  const [previewUrl, setPreviewUrl] = useState<string | null>('')
  const items = [
    {key: 'nickname', label: '닉네임', contents: <CustomInput />},
    {key: 'email', label: 'email', contents: ''},
  ]

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="게스트 신청" />
      <View style={styles.inner}>
        <InputForm
          items={items}
          buttonLabel="게스트 신청하기"
          topElement={
            <View style={styles.profileWrap}>
              <EditProfile
                edit={true}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
              />
              <Text style={styles.notiText}>
                {`관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.`}
              </Text>
            </View>
          }
          style={styles.inputForm}
          initialData={{}}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.outerColor,
  },
  inner: {
    padding: 24,
    flex: 1,
    // backgroundColor: COLORS.background,
  },
  innerContents: {
    flex: 1,
    padding: 24,
    backgroundColor: COLORS.background,
  },
  inputForm: {
    borderRadius: 16,
    // // ✅ 그림자 효과 (iOS + Android 호환)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android 전용 그림자
  },
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  notiText: {
    color: COLORS.error,
    fontFamily: 'BMDOHYEON',
    textAlign: 'center',
    marginTop: 16,
  },
})
