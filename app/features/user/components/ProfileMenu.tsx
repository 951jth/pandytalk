import {CustomMenu} from '@app/shared/ui/menu/CustomMenu'
import ConfirmModal from '@app/shared/ui/modal/ConfirmModal' // ✅ 모달 이동
import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {useProfileMenu} from '../hooks/useProfileMenu' // ✅ 훅 복구

interface ProfileMenuProps {
  onReset: () => void
  style?: StyleProp<ViewStyle>
  anchorStyle?: StyleProp<ViewStyle>
}

/**
 * 유저 프로필 전용 자율형 드랍다운 메뉴 컴포넌트
 */
const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onReset,
  style,
  anchorStyle,
}) => {
  // ✅ 훅을 내부에서 직접 관리 (자율성 회복)
  const {
    menuItems,
    menuVisible,
    openMenu,
    closeMenu,
    withdrawalVisible,
    setWithdrawalVisible,
    onDelete,
  } = useProfileMenu(onReset)
  return (
    <>
      <CustomMenu
        visible={menuVisible}
        onOpen={openMenu}
        onClose={closeMenu}
        items={menuItems}
        anchorStyle={anchorStyle}
        style={style}
      />

      {/* ✅ 회원 탈퇴 확인 모달*/}
      <ConfirmModal
        visible={withdrawalVisible}
        title="회원탈퇴"
        message="정말 탈퇴하시겠습니까? 탈퇴 후에는 데이터를 복구할 수 없습니다."
        confirmText="탈퇴"
        cancelText="취소"
        onConfirm={onDelete}
        onCancel={() => setWithdrawalVisible(false)}
      />
    </>
  )
}

export default ProfileMenu
