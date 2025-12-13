import React from 'react'
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native'
import Modal from 'react-native-modal'

type RNModalProps = React.ComponentProps<typeof Modal>

type Props = {
  visible: boolean
  onClose?: () => void
  children: React.ReactNode
  contentStyle?: StyleProp<ViewStyle>
  modalStyle?: StyleProp<ViewStyle>
  avoidKeyboard?: boolean // 기본 false로 컨트롤
} & Partial<
  Omit<
    RNModalProps,
    'isVisible' | 'onBackdropPress' | 'onBackButtonPress' | 'children' | 'style'
  >
>

export default function CustomModal({
  visible,
  onClose,
  children,
  contentStyle,
  modalStyle,
  avoidKeyboard = false,
  ...rest
}: Props) {
  return (
    <Modal
      isVisible={visible}
      style={[styles.modal, modalStyle]} // ✅ Modal 래퍼 전용
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      avoidKeyboard={avoidKeyboard} // ✅ 항상 true로 고정되지 않도록
      hideModalContentWhileAnimating // ✅ 콘텐츠 숨겨 플리커 완화
      backdropTransitionOutTiming={0} // ✅ 백드롭 아웃 플리커 방지
      useNativeDriver
      useNativeDriverForBackdrop
      {...rest}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modal: {justifyContent: 'flex-end', margin: 0},
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 200,
    padding: 16,
  },
})
