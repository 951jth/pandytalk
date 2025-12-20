import React, {useState} from 'react'
import {StyleSheet} from 'react-native'

import {userService} from '@app/features/user/service/userService'
import COLORS from '@app/shared/constants/color'
import {CustomButton} from '@app/shared/ui/button/CustomButton'
import ConfirmModal from '@app/shared/ui/modal/ConfirmModal'

type propTypes = {
  label?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export default function WithdrawalButton({
  label = '회원 탈퇴',
  onConfirm,
  onCancel,
}: propTypes) {
  const [visible, setVisible] = useState<boolean>(false)

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
        onConfirm={() => {
          // 탈퇴 로직
          setVisible(false)
          userService.deleteMyAccount()
        }}
        onCancel={() => setVisible(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  confirmContainer: {
    flex: 1,
    height: 500,
  },
  confirmText: {
    color: COLORS.error,
  },
})
