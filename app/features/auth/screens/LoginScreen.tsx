import {useLoginScreen} from '@app/features/auth/hooks/useLoginScreen'
import COLORS from '@app/shared/constants/color'
import EditInput from '@app/shared/ui/input/EditInput'
import PasswordInput from '@app/shared/ui/input/PasswordInput'
import pandy from '@shared/assets/images/pandy_visible.png'
import React from 'react'
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Button, Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import KeyboardViewWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    errors,
    loading,
    onSubmit,
    moveJoinPage,
  } = useLoginScreen()

  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardViewWrapper useTouchable={true}>
        <LinearGradient
          colors={['#A1C4FD', '#C2E9FB']}
          style={styles.container}>
          <Image source={pandy} style={styles.image} resizeMode="none" />
          {/* <Text style={styles.title}>어서오세요!</Text> */}
          <View style={styles.card}>
            <EditInput
              type="outlined"
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력해주세요."
              keyboardType="email-address"
            />
            <PasswordInput
              type="outlined"
              value={password}
              onChangeText={setPassword}
            />
            {errors && <Text style={styles.errorText}>{errors}</Text>}
            <Button
              onTouchEnd={onSubmit}
              mode="contained"
              style={styles.submitBtn}
              loading={loading}>
              로그인
            </Button>
          </View>
          <View style={styles.addOnRow}>
            <View style={styles.line}></View>
            <TouchableOpacity
              style={styles.addGuestButton}
              onPress={moveJoinPage}>
              <Text style={styles.addGuestText}>회원 가입</Text>
            </TouchableOpacity>
            <View style={styles.line}></View>
          </View>
        </LinearGradient>
      </KeyboardViewWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    // backgroundColor: COLORS.primary,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.onPrimary,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1.5},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderRadius: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'BMDOHYEON',
    color: '#FFF',
  },
  submitBtn: {
    width: '100%',
    borderRadius: 8,
  },
  image: {
    width: 200,
    height: 200,
  },
  errorText: {
    color: 'red',
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
  },
  addOnRow: {
    marginTop: 20,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  addGuestButton: {
    padding: 8,
    margin: -8,
  },
  line: {
    backgroundColor: '#FFF',
    // position: 'absolute',
    // left: 0,
    // top: 5,
    // width: '100%',
    height: 2,
    flex: 1,
  },
  addGuestText: {fontFamily: 'BMDOHYEON', color: '#FFF', zIndex: 1},
})
