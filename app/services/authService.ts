import {deleteUser} from '@react-native-firebase/auth'
import {Alert} from 'react-native'
import {auth} from '../shared/firebase/firestore'

export async function deleteMyAccount() {
  const user = auth.currentUser

  if (!user) {
    throw new Error('로그인된 사용자가 없습니다.')
  }

  try {
    await deleteUser(user)
    Alert.alert('탈퇴성공', '회원 탈퇴 되었습니다.')
    // 여기서부터는 계정이 Auth에서 삭제된 상태
    // 추가로 Firestore/Storage 데이터도 정리해주면 좋음
  } catch (err: any) {
    if (err.code === 'auth/requires-recent-login') {
      // 비밀번호 다시 입력시키거나, 소셜 로그인 다시 유도 필요
      // ex) 재로그인 후 다시 deleteMyAccount 호출
      console.log('재인증 필요')
    } else {
      console.error(err)
    }
  }
}
