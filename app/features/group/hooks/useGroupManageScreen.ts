import {useAllGroups} from '@app/features/group/hooks/useGroupQuery'
import {Group} from '@app/shared/types/group'
import {useAppSelector} from '@app/store/reduxHooks'
import {useState} from 'react'

type modalProps = {
  open: boolean
  record: Group | null
}

export const useGroupManageScreen = () => {
  const [groupModalProps, setGroupModalProps] = useState<modalProps>({
    open: false,
    record: null,
  })

  const {data: user, loading: isUserLoading} = useAppSelector(state => state.user)
  const {data: groups = [], isLoading: isQueryLoading, refetch} = useAllGroups()

  // 통합 로딩 상태
  const isLoading = isUserLoading || isQueryLoading || !user?.uid

  return {
    groups,
    isLoading,
    refetch,
    groupModalProps,
    setGroupModalProps,
  }
}
