import React from 'react'
import Select, {type SelectProps} from '../../../shared/ui/select/Select'
import {useAllGroups} from '../hooks/useGroupQuery'

export default function GroupSelect(props: Omit<SelectProps, 'options'>) {
  const {data: groups = [], isLoading, refetch} = useAllGroups()
  console.log('groups', groups)
  const groupOptions = groups?.map(group => ({
    label: group?.name,
    value: group.id,
    key: group.id,
  }))
  return <Select {...props} options={groupOptions} />
}
