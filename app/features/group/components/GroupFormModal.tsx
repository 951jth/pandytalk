import {Group} from '@app/shared/types/group'
import BottomSheetModal from '@app/shared/ui/modal/BottomSheetModal'
import React from 'react'
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
    <BottomSheetModal visible={open} onClose={onClose}>
      <GroupForm record={record} onClose={onClose} onRefresh={onRefresh} />
    </BottomSheetModal>
  )
}
