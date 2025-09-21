import React from 'react'
import {useAllGroups} from '../../hooks/queries/useGroupQuery'
import Select, {type SelectProps} from './Select'

export default function GroupSelect(props: Omit<SelectProps, 'options'>) {
  const {data: groups = [], isLoading, refetch} = useAllGroups()
  const groupOptions = groups?.map(group => ({
    label: group?.name,
    value: group?.uid,
  }))
  return <Select {...props} options={groupOptions} />
}
