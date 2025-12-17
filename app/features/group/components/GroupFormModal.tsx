import {Group} from '@app/shared/types/group'
import CustomModal from '@app/shared/ui/modal/CustomModal'
import React from 'react'
import {StyleSheet} from 'react-native'
import GroupForm from './GroupForm'

type propTypes = {
  open: boolean
  onClose: () => void
  record?: Group | null
  onRefresh?: () => void
}

export default function GroupModalForm({
  open,
  onClose,
  record,
  onRefresh,
}: propTypes) {
  return (
    <CustomModal visible={open} onClose={onClose}>
      <GroupForm record={record} onClose={onClose} onRefresh={onRefresh} />
    </CustomModal>
  )
}

const styles = StyleSheet.create({
  // container: {
  //   height: 430,
  //   backgroundColor: '#FFF',
  // },
  // topRow: {
  //   flexDirection: 'column',
  //   alignContent: 'center',
  //   alignItems: 'center',
  //   marginBottom: 12,
  // },
  // title: {
  //   color: COLORS.primary,
  //   fontFamily: 'BMDOHYEON',
  //   fontWeight: 500,
  //   fontSize: 20,
  //   marginBottom: 12,
  // },
})
