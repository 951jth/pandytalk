import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {userService} from '@app/features/user/service/userService'
import COLORS from '@app/shared/constants/color'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {MenuItem} from '@app/shared/ui/menu/CustomMenu'
import {useAppSelector} from '@app/store/reduxHooks'
import auth from '@react-native-firebase/auth'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'
import {cloneDeep} from 'lodash'
import {useCallback, useMemo, useState} from 'react'
import {Alert} from 'react-native'

/**
 * 프로필 메뉴의 상태와 액션을 관리하는 도메인 전용 훅
 * @param onReset 프로필 초기화 액션 (부모로부터 주입)
 */
export function useProfileMenu(onReset: () => void = () => {}) {
  type AppNav = NativeStackNavigationProp<AppRouteParamList>
  const navigation = useNavigation<AppNav>()
  const {data: user} = useAppSelector(state => state.user)
  const userInfo = useMemo(() => cloneDeep(user), [user])
  const [menuVisible, setMenuVisible] = useState(false)
  const [withdrawalVisible, setWithdrawalVisible] = useState(false) // ✅ 추가
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

  // 🗑️ 회원 탈퇴 로직 (실제 처리)
  const onDelete = useCallback(async () => {
    try {
      await userService.deleteMyAccount()
      setWithdrawalVisible(false) // 성공 시 모달 닫기
      Alert.alert('탈퇴 성공', '회원 탈퇴에 성공하였습니다.')
    } catch (e: any) {
      console.error('Withdrawal error:', e)
      Alert.alert(
        '초기화 실패',
        e?.message ?? '탈퇴 처리 중 문제가 발생했습니다.',
      )
    }
  }, [])

  // ✅ 메뉴 항목들을 훅 내부에서 동적으로 생산 (명시적 타입 부여)
  const menuItems: MenuItem[] = useMemo(
    () =>
      [
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
          onPress: () => {
            onLogout()
          }, // ✅ 동기 래퍼로 감싸서 타입 안정성 확보
        },
        {
          title: '실험실 (Harness)',
          icon: 'flask-outline',
          onPress: () => {
            navigation.navigate('harness' as any)
            closeMenu()
          },
          filtered: !__DEV__, // 개발 모드일 때만 표시
        },
        {
          title: '회원 탈퇴',
          icon: 'account-remove-outline',
          onPress: () => {
            setWithdrawalVisible(true) // ✅ 모달 열기 명령
          },
          filtered:
            userInfo?.authority == 'ADMIN' || userInfo?.authority == 'TEST',
        },
      ].filter(item => !item.filtered),
    [userInfo, onClear, onLogout, onReset],
  )

  return {
    userInfo,
    menuItems,
    menuVisible,
    withdrawalVisible,
    setWithdrawalVisible,
    openMenu,
    closeMenu,
    onClear,
    onLogout,
    onDelete,
  }
}
