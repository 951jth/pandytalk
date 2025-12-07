import React, {useState} from 'react'
import {StyleSheet} from 'react-native'
import {CustomButton} from '../../../components/button/CustomButton'
import ConfirmModal from '../../../components/modal/ConfirmModal'
import COLORS from '../../../constants/color'
import {deleteMyAccount} from '../../../services/authService'

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
      {/* <Modal visible={true}>
        <View style={styles.confirmContainer}>
          <Text>
            {` 정말 탈퇴하시겠습니까?\n회원탈퇴를 진행하면 계정 정보 및 채팅 기록을
            포함한 모든 데이터가 영구적으로 삭제되며, 삭제된 데이터는 복구할 수
            없습니다. \n\n※ 탈퇴 시 즉시 로그아웃되며, 동일한 계정으로 다시 가입할
            수 있습니다.`}
          </Text>
        </View>
      </Modal> */}
      <ConfirmModal
        visible={visible}
        title="회원탈퇴"
        message="정말 탈퇴하시겠습니까? 탈퇴 후에는 데이터를 복구할 수 없습니다."
        confirmText="탈퇴"
        cancelText="취소"
        onConfirm={() => {
          // 탈퇴 로직
          setVisible(false)
          deleteMyAccount()
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
