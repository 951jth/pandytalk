import {User} from '@app/shared/types/auth'
import {ChatItemWithMemberInfo, ChatListItem} from '@app/shared/types/chat'
import {useEffect, useMemo, useRef, useState} from 'react'
import {getUsersByIds} from '../../../services/userService'

//가지고 온 채팅에 멤버정보를 패칭함.
export const useChatWithMembersInfo = (
  rawChats: ChatListItem[],
  user?: User | null,
  type?: ChatListItem['type'],
) => {
  if (!user || !type) return
  // 이미 가져온 멤버 id 캐시
  const fetchedMemberIdsRef = useRef<Set<string>>(new Set()) //이미 패칭한 멤버 조회들(이미 조회한 멤버는 패칭X)
  const [targetMembers, setTargetMembers] = useState<User[]>([]) //멤버들의 데이터를 세팅

  // 멤버 id 모으기 (중복제거)
  const memberIds = useMemo(() => {
    if (!rawChats.length) return []
    return Array.from(
      new Set(
        rawChats.flatMap(chat =>
          Array.isArray(chat.members) ? chat.members : [],
        ),
      ),
    ) as string[]
  }, [rawChats])

  // 멤버정보를 아이디 : 멤버정보로 매칭
  //Map 쓰기 좋은 경우:
  // 키가 string만이 아니라 객체/기타 타입일 때
  // 키-값 쌍을 자주 추가/삭제/순회해야 할 때
  // 컬렉션 의미를 명확히 드러내고 싶을 때
  // size, keys(), values() 같은 메서드를 자주 쓸 때

  //   ✅ Map (new Map())
  // 용도: 키-값 쌍을 위한 전용 컬렉션
  // 키:
  // 아무 타입이나 가능: string, number, 객체, 함수, 심볼 등 전부 가능
  // 객체를 키로 쓰면 참조(===) 기준
  // 메서드:
  // set(key, value)
  // get(key)
  // has(key)
  // delete(key)
  // clear()
  // size (길이)
  // 순회:
  // for...of map
  // map.forEach
  // map.keys(), map.values(), map.entries()
  // 프로토타입 체인 영향 없음, 딱 저장한 것만 들어있음
  const memberMap = useMemo(() => {
    const map = new Map<string, User>()
    targetMembers.forEach(u => {
      if (u.uid) map.set(u.uid, u)
    })
    return map
  }, [targetMembers])

  // 멤버 정보 fetch
  useEffect(() => {
    //그룹 채팅이면 멤버조회안함, 채팅방 내부에서 조회시킴 (코스트 높음)
    if (!memberIds.length || type !== 'dm') return

    const newIds = memberIds.filter(id => !fetchedMemberIdsRef.current.has(id))
    if (!newIds.length) return
    ;(async () => {
      try {
        const res = await getUsersByIds(newIds)

        res.forEach((u: User) => {
          if (u.uid) fetchedMemberIdsRef.current.add(u.uid)
        })

        setTargetMembers(prev => {
          const map = new Map<string, User>()
          prev.forEach((u: User) => {
            if (u.uid) map.set(u.uid, u)
          })
          res.forEach((u: User) => {
            if (u.uid) map.set(u.uid, u)
          })
          return Array.from(map.values())
        })
      } catch (e) {
        console.log('getUsersByIds error', e)
      }
    })()
  }, [memberIds])

  const chats = useMemo(() => {
    if (!user?.uid) return rawChats
    return rawChats.map(chat => {
      const targetId = chat.members?.find(mId => mId !== user.uid) ?? null
      const findMember = targetId ? memberMap.get(targetId) : undefined

      return {
        ...chat,
        name: chat?.name || findMember?.displayName, //채팅 제목은 상대유저의 닉네임으로 설정해서 필터링에 용이하도록
        targetId,
        findMember,
      }
    })
  }, [rawChats, user?.uid, memberMap])

  return chats as ChatItemWithMemberInfo[]
}
