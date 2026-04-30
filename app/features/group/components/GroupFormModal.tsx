import {Group} from '@app/shared/types/group'
import CustomModal from '@app/shared/ui/modal/CustomModal'
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
    <CustomModal visible={open} onClose={onClose}>
      <GroupForm record={record} onClose={onClose} onRefresh={onRefresh} />
    </CustomModal>
  )
}

