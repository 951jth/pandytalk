import useAddUserScreen from '@app/features/user/hooks/useAddUserScreen'
import {addUserItems} from '@app/features/user/screens/addUser.form'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import InputForm from '@app/shared/ui/form/InputForm'
import EditProfile, {
  type ProfileInputRef,
} from '@app/shared/ui/upload/EditProfile'
import React, {type RefObject} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import KeyboardUtilitiesWrapper from '../../../shared/ui/container/KeyboardUtilitiesWrapper'
import TermAgreementList from '../../auth/components/TermAgreementList'

const initialData = {
  email: '',
  password: '',
  displayName: '',
  note: '',
  intro: '',
}

const ProfileHeader = ({
  profileRef,
}: {
  profileRef: RefObject<ProfileInputRef>
}) => {
  return (
    <View style={styles.profileWrap}>
      <EditProfile
        edit={true}
        defaultUrl={null}
        boxSize={100}
        iconSize={75}
        ref={profileRef}
      />
      <Text style={styles.notiText}>
        {`관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.`}
      </Text>
    </View>
  )
}

export default function AddUserScreen() {
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
      <AppHeader title="회원 가입" />
      <KeyboardUtilitiesWrapper useTouchable={false}>
        <ScrollView contentContainerStyle={styles.inner}>
          <View style={styles.profileWrap}>
            <EditProfile
              edit={true}
              defaultUrl={null}
              boxSize={100}
              iconSize={75}
              ref={profileRef}
            />
            <Text style={styles.notiText}>
              {`관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.`}
            </Text>
          </View>
          <InputForm
            ref={formRef}
            items={addUserItems}
            buttonLabel="회원 가입"
            // topElement={<ProfileHeader profileRef={profileRef} />}
            // topElement={
            //   <View style={styles.profileWrap}>
            //     <EditProfile
            //       edit={true}
            //       defaultUrl={null}
            //       boxSize={100}
            //       iconSize={75}
            //       ref={profileRef}
            //     />
            //     <Text style={styles.notiText}>
            //       {`관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.`}
            //     </Text>
            //   </View>
            // }
            // style={styles.inputForm}
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
        </ScrollView>
      </KeyboardUtilitiesWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.outerColor,
  },
  inner: {
    padding: 16,
    backgroundColor: COLORS.background,
    // ✅ 그림자 효과 (iOS + Android 호환)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android 전용 그림자
  },
  innerContents: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 12,
  },
})
