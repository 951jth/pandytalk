import {userService} from '@app/features/user/service/userService'
import {User} from '@app/shared/types/auth'
import {ChatItemWithMemberInfo, ChatRoom} from '@app/shared/types/chat'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

type UserInfosById = Record<string, User>

export const useChatWithMembersInfo = (
  rawChats: ChatRoom[],
  type: ChatRoom['type'],
  uid?: string,
) => {
  const [userInfosById, setUserInfosById] = useState<UserInfosById>({})
  const fetchedUids = useRef<Set<string>>(new Set()) // "요청 처리 완료(요청했음)" 기준으로도 사용

  const enabled = !!uid && type === 'dm'

  const userIds = useMemo(() => {
    if (!enabled) return []
    const ids = rawChats
      .flatMap(c => c.members ?? [])
      .filter((id): id is string => !!id && id !== uid)

    return [...new Set(ids)]
  }, [rawChats, uid, enabled])

  const fetchMemberInfos = useCallback(async (newIds: string[]) => {
    if (newIds.length === 0) return

    // ✅ 요청 시작 시점에 mark (결과가 비어도 재요청 방지)
    newIds.forEach(id => fetchedUids.current.add(id))

    try {
      const results = await userService.getUsersByIds(newIds)
      if (!results?.length) return

      setUserInfosById(prev => {
        const next: UserInfosById = {...prev}
        for (const user of results) {
          next[user.uid] = user
        }
        return next
      })
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (!enabled) return
    const newIds = userIds.filter(id => !fetchedUids.current.has(id))
    fetchMemberInfos(newIds)
  }, [enabled, userIds, fetchMemberInfos])

  useEffect(() => {
    if (!enabled) {
      //유저, 타입 변경시 초기화 (로그아웃 하는 케이스)
      setUserInfosById({})
      fetchedUids.current = new Set()
    }
  }, [enabled, uid, type])

  const chatsWithMemberInfos = useMemo(() => {
    if (!enabled) return rawChats as ChatItemWithMemberInfo[]

    return rawChats.map(chat => {
      const targetId = chat.members?.find(mId => mId !== uid) ?? null
      const findMember = targetId ? (userInfosById[targetId] ?? null) : null

      return {
        ...chat,
        name: chat.name || findMember?.displayName,
        findMember,
      }
    }) as ChatItemWithMemberInfo[]
  }, [enabled, rawChats, userInfosById, uid])

  return chatsWithMemberInfos
}
