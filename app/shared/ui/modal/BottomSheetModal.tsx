import React from 'react'
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native'
import Modal from 'react-native-modal'
import COLORS from '@app/shared/constants/color'

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

export default function BottomSheetModal({
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
      backdropColor={COLORS.modalOverlay} // ✅ 하이엔드 차콜 오버레이
      backdropOpacity={1} // ✅ 투명도는 컬러 상수에서 직접 조절
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
    borderTopLeftRadius: 32, // ✅ 시그니처 32px 곡률
    borderTopRightRadius: 32, // ✅ 시그니처 32px 곡률
    minHeight: 200,
    paddingTop: 16,
    paddingHorizontal:16,
  },
})
