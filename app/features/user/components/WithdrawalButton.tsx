import React, {useState} from 'react'
import {Alert} from 'react-native'

import {userService} from '@app/features/user/service/userService'
import {CustomButton} from '@app/shared/ui/button/CustomButton'
import ConfirmModal from '@app/shared/ui/modal/ConfirmModal'

import {useLogout} from '@app/shared/hooks/useLogout'
import {useAppSelector} from '@app/store/reduxHooks'

type propTypes = {
  label?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export default function WithdrawalButton({label = '회원 탈퇴'}: propTypes) {
  const {data: user} = useAppSelector(state => state.user)
  const [visible, setVisible] = useState<boolean>(false)
  const {logout} = useLogout()

  if (user?.authority === 'TEST') {
    return null
  }

  const onDelete = async () => {
    try {
      // 탈퇴 로직
      setVisible(false)
      await userService.deleteMyAccount()
      Alert.alert('탈퇴 성공', '회원 탈퇴에 성공하였습니다.')
      logout()
    } catch (e) {
      console.error('회원 탈퇴 중 오류:', e)
      Alert.alert('탈퇴 실패', '회원 탈퇴 처리 중 문제가 발생했습니다.')
    }
  }

  return (
    <>
      <CustomButton colorType="danger" onTouchEnd={() => setVisible(true)}>
        {label}
      </CustomButton>
      <ConfirmModal
        visible={visible}
        title="회원탈퇴"
        message="정말 탈퇴하시겠습니까? 탈퇴 후에는 데이터를 복구할 수 없습니다."
        confirmText="탈퇴"
        cancelText="취소"
        onConfirm={onDelete}
        onCancel={() => setVisible(false)}
      />
    </>
  )
}
