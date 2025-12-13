import React from 'react'
import {Modal, StyleSheet, Text, View} from 'react-native'
import COLORS from '../../constants/color'
import {CustomButton} from '../button/CustomButton'

interface ConfirmModalProps {
  visible: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  /** 확인 버튼 눌렀을 때 */
  onConfirm: () => void
  /** 취소(또는 바깥 영역/뒤로가기) 눌렀을 때 */
  onCancel: () => void
}

/**
 * React Native 기본 Modal을 이용한 확인 모달
 */
export default function ConfirmModal({
  visible,
  title = '알림',
  message = '',
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel} // 안드로이드 뒤로가기
    >
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonRow}>
            <CustomButton
              colorType="danger"
              onTouchEnd={onCancel}
              fullWidth={true}>
              {cancelText}
            </CustomButton>
            <CustomButton onTouchEnd={onConfirm} fullWidth={true}>
              {confirmText}
            </CustomButton>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    maxWidth: 360,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'BMDOHYEON',
    color: COLORS.text,
  },
  message: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'BMDOHYEON',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: 8,
    // flex: 1,
  },
})
