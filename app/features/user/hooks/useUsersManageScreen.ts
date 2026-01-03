import {useUsersInfinite} from '@app/features/user/hooks/useUsersInfinite'
import type {User} from '@app/shared/types/auth'
import {debounce} from 'lodash'
import {useEffect, useMemo, useState} from 'react'

type modalProps = {
  open: boolean | null | undefined
  record?: User | object | null
}

export const useUsersManageScreen = () => {
  const [input, setInput] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [modalProps, setModalProps] = useState<modalProps>({open: false})
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUsersInfinite(searchText)

  const users = (data?.pages.flatMap(page => page.users) as User[]) ?? []
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

  return {
    input,
    setInput,
    users,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    modalProps,
    setModalProps,
  }
}
