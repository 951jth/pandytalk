import COLORS from '@app/shared/constants/color'
import {terms} from '@app/shared/constants/terms'
import {termType} from '@app/shared/types/auth'
import {AppButton} from '@app/shared/ui/button/AppButton'
import BottomSheetModal from '@app/shared/ui/modal/BottomSheetModal'
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'

type propTypes = {
  code: string | null
  onClose?: () => void
  onConfirm?: (term: termType) => void
}

export default function TermViewModal({code, onClose, onConfirm}: propTypes) {
  const visible = !!code
  const termContent = terms.find(term => term?.id === code) as termType

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.termTitle}>{termContent?.title}</Text>
        <Text style={styles.termContent}>{termContent?.content}</Text>
        <View style={styles.buttons}>
          <AppButton
            fullWidth={true}
            shape="normal"
            colorType="danger"
            onPress={onClose}>
            닫기
          </AppButton>
          <AppButton
            fullWidth={true}
            shape="normal"
            colorType="secondary"
            onPress={() => {
              if (termContent) onConfirm?.(termContent)
            }}>
            동의하기
          </AppButton>
        </View>
      </View>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  container: {gap: 24},
  termTitle: {
    fontFamily: 'BMDOHYEON',
    color: COLORS.text,
    textAlign: 'center',
    // justifyContent: 'center',
  },
  termContent: {
    fontFamily: 'BMDOHYEON',
    color: COLORS.text,
    fontSize: 11,
  },
  buttons: {
    flexDirection: 'row',
    gap: 4,
  },
})
