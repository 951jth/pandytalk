import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import KeyboardUtilitiesWrapper from '../components/container/KeyboardUtilitiesWrapper'
import InputForm from '../components/form/InputForm'
import EditInput from '../components/input/EditInput'
import EditTextArea from '../components/input/EditTextarea'
import AppHeader from '../components/navigation/AppHeader'
import EditProfile from '../components/upload/EditProfile'
import COLORS from '../constants/color'
import type {FormItem} from '../types/form'

type requestForm = {
  email: string
  password: string
  displayName: string
  note: string
  intro: string
}

export default function AddGuestScreen() {
  const initialData = {
    email: '',
    password: '',
    displayName: '',
    note: '',
    intro: '',
  }
  const [previewUrl, setPreviewUrl] = useState<string | null>('')
  const items: FormItem[] = [
    {
      key: 'email',
      label: '이메일',
      required: true,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '이메일 형식이 올바르지 않습니다.',
        customFn: (v: string) => {
          if (!v) return '이메일을 입력하세요.'
          if (v !== v.trim()) return '앞뒤 공백을 제거해주세요.'
          return true
        },
      },
      render: (value, onChange) => (
        <EditInput
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      ),
    },
    {
      key: 'password',
      label: '비밀번호',
      required: true,
      validation: {
        pattern: /^.{8,32}$/, // 길이 8~32자
        message: '비밀번호는 8–32자여야 합니다.',
        customFn: (v: string) => {
          if (!v) return '비밀번호를 입력하세요.'
          if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v))
            return '영문과 숫자를 모두 포함하세요.'
          if (/\s/.test(v)) return '공백은 사용할 수 없습니다.'
          return true
        },
      },
      render: (value, onChange) => (
        <EditInput value={value} onChangeText={onChange} secureTextEntry />
      ),
    },
    {
      key: 'displayName',
      label: '닉네임',
      required: true,
      validation: {
        maxLength: 20,
        pattern: /^[A-Za-z0-9가-힣 _-]{2,20}$/,
        message: '닉네임은 2-20자, 한글/영문/숫자/공백/_/-만 허용됩니다.',
        customFn: (v: string) => {
          if (!v) return '닉네임을 입력하세요.'
          if (v.trim().length < 2)
            return '닉네임은 공백 제외 2자 이상이어야 합니다.'
          if (/^\s|\s$/.test(v)) return '앞/뒤 공백은 제거해주세요.'
          return true
        },
      },
      render: (value, onChange) => (
        <EditInput value={value} onChangeText={onChange} />
      ),
    },
    {
      key: 'note',
      label: '신청메모',
      required: true,
      validation: {
        maxLength: 200,
        message: '신청메모는 1-200자 입력해주세요.',
        customFn: (v: string) => {
          if (!v || v.trim().length === 0) return '신청메모를 입력하세요.'
          return true
        },
      },
      render: (value, onChange) => (
        <EditTextArea
          value={value}
          onChangeText={onChange}
          minRows={1}
          maxRows={6}
          lineHeight={22}
          maxLength={200}
        />
      ),
    },
    {
      key: 'intro',
      label: '소개',
      validation: {
        maxLength: 200,
        message: '소개는 최대 200자입니다.',
      },
      render: (value, onChange) => (
        <EditTextArea
          value={value}
          onChangeText={onChange}
          minRows={1}
          maxRows={6}
          maxLength={200}
        />
      ),
    },
  ]

  async function submitSignupRequest({
    email,
    password,
    displayName,
    note,
    intro,
  }: requestForm) {
    console.log(email, password, displayName, note, intro)

    try {
      // 1) Auth 계정 생성
      // const cred = await createUserWithEmailAndPassword(auth, email, password)
      // const user = cred.user
      // console.log(cred)
      // const profileData = {
      //   uid: user.uid,
      //   email: user.email,
      //   nickname: displayName ?? user.displayName ?? null, // 당신 스키마에 맞춰 nickname 채우기
      //   displayName: user.displayName ?? displayName ?? null,
      //   photoURL: user.photoURL ?? null,
      //   emailVerified: user.emailVerified,
      //   providerId: (user as any).providerId ?? null, // v9에선 "firebase" 등
      //   phoneNumber: user.phoneNumber,
      //   createdAt: user.metadata?.creationTime ?? null,
      //   lastLoginAt: user.metadata?.lastSignInTime ?? null,
      // } as User
      // // if (displayName) {
      // //   await updateProfile(cred.user, {displayName})
      // // }
      // const uid = cred.user.uid
      // // 2) guestApplications/{uid} 생성(없으면 생성, 있으면 메모/소개 갱신)
      // const appRef = doc(firestore, 'guestApplications', uid)
      // const appSnap = await getDoc(appRef)
      // const base = {
      //   uid,
      //   email,
      //   emailLower: email.toLowerCase(),
      //   displayName: displayName ?? cred.user.displayName ?? '',
      // }
      // if (appSnap.exists()) {
      //   // 재제출: note/intro/groupId + updatedAt만 갱신
      //   await updateDoc(appRef, {
      //     note: memo ?? '',
      //     intro: intro ?? '',
      //     groupId: groupId ?? null,
      //     updatedAt: serverTimestamp(),
      //   })
      // } else {
      //   await setDoc(appRef, {
      //     ...base,
      //     note: memo ?? '',
      //     intro: intro ?? '',
      //     groupId: groupId ?? null,
      //     status: 'pending',
      //     reviewerNote: null,
      //     approvedAt: null,
      //     approvedBy: null,
      //     rejectedAt: null,
      //     rejectedBy: null,
      //     createdAt: serverTimestamp(),
      //     updatedAt: serverTimestamp(),
      //   })
      // }
      // // 3) users/{uid} 얇은 문서(stub) 보장 (현재 정책: isGuest = true)
      // const userRef = doc(firestore, 'users', uid)
      // await setDoc(
      //   userRef,
      //   {
      //     uid,
      //     email,
      //     nickname: base.displayName,
      //     authority: 'USER',
      //     status: 'offline',
      //     photoURL: cred.user.photoURL ?? null,
      //     lastSeen: null, // RN 호환 유지
      //     isGuest: true, // 현재는 무조건 TRUE
      //     // approvedAt: 나중에 관리자 승인 시 채움
      //   },
      //   {merge: true},
      // )
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="게스트 신청" />
      <KeyboardUtilitiesWrapper>
        <View style={styles.inner}>
          <InputForm
            edit={true}
            editable={true}
            items={items}
            buttonLabel="게스트 신청"
            topElement={
              <View style={styles.profileWrap}>
                <EditProfile
                  edit={true}
                  previewUrl={previewUrl}
                  setPreviewUrl={setPreviewUrl}
                  boxSize={120}
                  iconSize={90}
                />
                <Text style={styles.notiText}>
                  {`관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.`}
                </Text>
              </View>
            }
            style={styles.inputForm}
            initialValues={initialData}
            onSubmit={submitSignupRequest}
          />
          {/* <TouchableOpacity onPress={deleteNonPrivilegedUsers}>
            <Text>유저 일괄 삭제</Text>
          </TouchableOpacity> */}
        </View>
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
    padding: 8,
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
