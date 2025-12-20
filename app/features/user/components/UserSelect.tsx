import {debounce} from 'lodash'
import React, {useEffect, useMemo, useState} from 'react'
import type {SelectProps} from '../../../shared/ui/select/Select'
import Select from '../../../shared/ui/select/Select'
import {useUsersInfinite} from '../hooks/useUserQuery'

export default function UserSelect(props: Omit<SelectProps, 'options'>) {
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUsersInfinite(searchText)

  const users = data?.pages.flatMap(page => page.users) ?? []
  const options = users?.map(user => ({
    label: user?.displayName,
    value: user?.uid,
  }))
  const debouncedSetSearchText = useMemo(
    () =>
      debounce((text: string) => {
        setSearchText(text.toString())
      }, 300),
    [],
  )

  useEffect(() => {
    debouncedSetSearchText(input)
    // cleanup 함수로 debounce 취소
    return () => debouncedSetSearchText.cancel()
  }, [input])

  //   console.log('data', data)

  return (
    <Select
      {...props}
      options={options}
      autocomplete={true}
      onTextChange={setInput}
    />
  )
}
