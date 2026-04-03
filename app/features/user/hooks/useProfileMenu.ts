import auth from '@react-native-firebase/auth'
import {useQueryClient} from '@tanstack/react-query'
import {cloneDeep} from 'lodash' // ✅ 추가
import {useCallback, useMemo, useState} from 'react' // ✅ useMemo 추가
import {Alert} from 'react-native'
import {useAppSelector} from '../../../store/reduxHooks' // ✅ 추가

import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import COLORS from '@app/shared/constants/color' // ✅ 추가

/**
 * 프로필 메뉴의 상태와 액션을 관리하는 도메인 전용 훅
 * @param onReset 프로필 초기화 액션 (부모로부터 주입)
 */
export function useProfileMenu(onReset: () => void = () => {}) {
  const {data: user} = useAppSelector(state => state.user)
  const userInfo = useMemo(() => cloneDeep(user), [user])
  const [menuVisible, setMenuVisible] = useState(false)
  const queryClient = useQueryClient()

  const openMenu = () => setMenuVisible(true)
  const closeMenu = () => setMenuVisible(false)

  // 🔄 데이터 재동기화 (캐시 삭제 및 새로고침)
  const onClear = useCallback(() => {
    Alert.alert(
      '메세지 재동기화',
      '기기에 저장된 메시지/캐시를 초기화하고 서버에서 다시 불러옵니다.\n(서버 데이터는 삭제되지 않습니다)',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              await messageLocal.clearAllMessages()
              queryClient.clear()
              const allMessages = await messageLocal.getAllMessages()
              console.log('all messages: ', allMessages)
              Alert.alert('완료', '메시지를 초기화했습니다.')
            } catch (e: any) {
              Alert.alert('초기화 실패', e?.message ?? '초기화 실패!')
            }
          },
        },
      ],
    )
  }, [queryClient])

  // 🚪 로그아웃 로직
  const onLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: async () => {
          try {
            await auth().signOut()
          } catch (e) {
            console.error('Logout error:', e)
            Alert.alert('오류', '로그아웃 실패')
          }
        },
      },
    ])
  }

  // ✅ 메뉴 항목들을 훅 내부에서 동적으로 생산 (View Model 역할)
  const menuItems = useMemo(
    () => [
      {
        title: '프로필 초기화',
        icon: 'refresh',
        onPress: onReset,
      },
      {
        title: '메시지 재동기화',
        icon: 'sync',
        onPress: onClear,
      },
      {
        title: '로그아웃',
        icon: 'logout',
        color: COLORS.error,
        onPress: onLogout,
      },
      ...(userInfo?.authority !== 'ADMIN' && userInfo?.authority !== 'TEST'
        ? [
            {
              title: '회원 탈퇴',
              icon: 'account-remove-outline',
              onPress: () => {
                // Withdrawal logic...
              },
            },
          ]
        : []),
    ],
    [userInfo, onClear, onLogout, onReset],
  )

  return {
    userInfo,
    menuItems, // ✅ 완성된 리스트 제공
    menuVisible,
    openMenu,
    closeMenu,
    onClear,
    onLogout,
  }
}
