import useAddUserScreen from '@app/features/user/hooks/useAddUserScreen'
import {addUserItems} from '@app/features/user/screens/addUser.form'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import InputForm from '@app/shared/ui/form/InputForm'
import EditProfile from '@app/shared/ui/upload/EditProfile'
import React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import TermAgreementList from '../../auth/components/TermAgreementList'

const initialData = {
  email: '',
  password: '',
  displayName: '',
  note: '',
  intro: '',
}

export default function UserJoinScreen() {
  const {
    formRef,
    profileRef,
    loading,
    checkedRecord,
    setCheckedRecord,
    btnDisable,
    handleAddGuest,
  } = useAddUserScreen()

  return (
    <SafeAreaView style={styles.container}>
      {/* 투명 배경 AppHeader로 배경색 노출 */}
      <AppHeader title="팬디톡 가입하기" style={styles.header} />
      
      <KeyboardUtilitiesWrapper useTouchable={false}>
        {/* 몰입형 프리미엄 그라데이션 배경 */}
        <LinearGradient
          colors={['#FADCD0', COLORS.background]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.gradientBg}>
          
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 프리미엄 웰컴 카드 */}
            <View style={styles.card}>
              <View style={styles.profileWrap}>
                <EditProfile
                  edit={true}
                  defaultUrl={null}
                  boxSize={100}
                  iconSize={75}
                  ref={profileRef}
                />
                <Text style={styles.notiText}>
                  {`나만의 특별한 프로필을 꾸며주세요.\n관리자 승인 후 게스트로 입장할 수 있습니다.`}
                </Text>
              </View>

              <InputForm
                ref={formRef}
                items={addUserItems}
                buttonLabel="팬디톡 시작하기"
                formData={initialData}
                onSubmit={handleAddGuest}
                loading={loading}
                btnDisable={btnDisable}
                bottomElement={
                  <TermAgreementList
                    checkedRecord={checkedRecord}
                    onChange={setCheckedRecord}
                  />
                }
                useBotton={true}
              />
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardUtilitiesWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FADCD0',
  },
  gradientBg: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    // 프리미엄 소프트 디퓨전 섀도우
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  profileWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  notiText: {
    color: '#E67E22', // 테라코타 포인트 컬러
    fontFamily: 'BMDOHYEON',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    lineHeight: 18,
  },
})
