import {useLoginScreen} from '@app/features/auth/hooks/useLoginScreen'
import COLORS from '@app/shared/constants/color'
import EditInput from '@app/shared/ui/input/EditInput'
import PasswordInput from '@app/shared/ui/input/PasswordInput'
import pandy from '@shared/assets/images/hello_Pandy.png'
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
    <SafeAreaView style={{flex: 1}} edges={['right', 'left', 'bottom']}>
      <KeyboardViewWrapper useTouchable={true}>
        {/* 몰입형 프리미엄 그라데이션 배경 */}
        <LinearGradient
          colors={['#FADCD0', COLORS.background]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.container}>
          {/* 환영 영역 */}
          <View style={styles.header}>
            <Image source={pandy} style={styles.image} resizeMode="contain" />
            <Text style={styles.welcomeTitle}>어서오세요!</Text>
            <Text style={styles.welcomeSubtitle}>
              레서판다와 함께하는 즐거운 대화
            </Text>
          </View>

          {/* 프리미엄 로그인 카드 */}
          <View style={styles.card}>
            <EditInput
              leftIcon="email-outline"
              type="outlined"
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력해주세요."
              keyboardType="email-address"
              outlineStyle={styles.inputOutline}
            />
            <PasswordInput
              leftIcon="lock-outline"
              type="outlined"
              value={password}
              onChangeText={setPassword}
              outlineStyle={styles.inputOutline}
            />

            {errors && <Text style={styles.errorText}>{errors}</Text>}

            <Button
              onPress={onSubmit}
              mode="contained"
              style={styles.submitBtn}
              contentStyle={styles.submitBtnContent}
              labelStyle={styles.submitBtnLabel}
              loading={loading}
              disabled={!!errors}>
              로그인하기
            </Button>
          </View>

          {/* 하단 보조 액션 */}
          <View style={styles.addOnRow}>
            <View style={styles.line}></View>
            <TouchableOpacity
              style={styles.addGuestButton}
              onPress={moveJoinPage}>
              <Text style={styles.addGuestText}>
                팬디톡이 처음이신가요?{' '}
                <Text style={styles.signUpHighlight}>회원가입</Text>
              </Text>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32, // 이미지가 커진 만큼 마진 소폭 조정
  },
  image: {
    width: 320, // 280 -> 320
    height: 210, // 180 -> 210
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  card: {
    width: '100%',
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    gap: 12,
    // 프리미엄 소프트 디퓨전 섀도우
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  inputOutline: {
    borderRadius: 14,
    borderColor: '#EFEFEF',
  },
  submitBtn: {
    width: '100%',
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: COLORS.primary,
  },
  submitBtnContent: {
    height: 54,
  },
  submitBtnLabel: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
  },
  errorText: {
    color: '#E74C3C',
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  addOnRow: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  addGuestButton: {
    padding: 8,
  },
  line: {
    backgroundColor: '#E0E0E0',
    height: 1,
    flex: 1,
  },
  addGuestText: {
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signUpHighlight: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
})
